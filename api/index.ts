import * as crypto from 'crypto'
import express from 'express'
import { put, get, del } from '@vercel/blob'
import bcrypt from 'bcryptjs'
import type { GlobalSettings, Plan, PlanIndex } from '../src/lib/schema'

// --- auth helpers ---

const COOKIE_NAME = 'mealemon_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

function signingSecret() {
  const s = process.env.SESSION_SECRET
  if (!s) throw new Error('SESSION_SECRET not set')
  return s
}
function sign(v: string) {
  return crypto.createHmac('sha256', signingSecret()).update(v).digest('hex')
}
function makeToken() {
  const payload = `mealemon:${Date.now()}`
  return `${payload}.${sign(payload)}`
}
function verifyToken(token: string) {
  const d = token.lastIndexOf('.')
  if (d === -1) return false
  return crypto.timingSafeEqual(
    Buffer.from(token.slice(d + 1)),
    Buffer.from(sign(token.slice(0, d))),
  )
}
function isValidToken(token: string | undefined) {
  if (!token) return false
  try {
    return verifyToken(token)
  } catch {
    return false
  }
}
function getToken(req: express.Request): string | undefined {
  return (req.headers.cookie ?? '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1)
}

// --- blob helpers ---

const SCHEMA_VERSION = 1

async function readBlob<T>(path: string): Promise<T | null> {
  const blob = await get(path, { access: 'private', useCache: false })
  if (!blob?.stream) return null
  const chunks: Uint8Array[] = []
  for await (const chunk of blob.stream) chunks.push(chunk as Uint8Array)
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T
}
async function writeBlob(path: string, data: unknown) {
  await put(path, JSON.stringify(data), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}
async function readPlan(id: string): Promise<Plan | null> {
  const raw = await readBlob<Record<string, unknown>>(`plans/${id}.json`)
  return raw ? (raw as unknown as Plan) : null
}
async function writePlan(plan: Plan) {
  await writeBlob(`plans/${plan.id}.json`, { ...plan, schema_version: SCHEMA_VERSION })
}
async function deletePlanBlob(id: string) {
  const blob = await get(`plans/${id}.json`, { access: 'private', useCache: false })
  if (blob?.url) await del(blob.url)
}
async function readPlanIndex(): Promise<PlanIndex> {
  const raw = await readBlob<Record<string, unknown>>('plans/index.json')
  if (!raw || (raw.schema_version as number) < 1) {
    return { schema_version: SCHEMA_VERSION, plans: [] }
  }
  return raw as unknown as PlanIndex
}
async function writePlanIndex(index: PlanIndex) {
  await writeBlob('plans/index.json', { ...index, schema_version: SCHEMA_VERSION })
}
async function readSettings(): Promise<GlobalSettings> {
  const raw = await readBlob<Record<string, unknown>>('settings/global.json')
  if (!raw || (raw.schema_version as number) < 1) {
    return { schema_version: SCHEMA_VERSION, default_servings: 4, active_modes: [] }
  }
  return raw as unknown as GlobalSettings
}
async function writeSettings(settings: GlobalSettings) {
  await writeBlob('settings/global.json', { ...settings, schema_version: SCHEMA_VERSION })
}
function defaultPlanLabel() {
  return `Plan Created ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

// --- app ---

const app = express()
app.use(express.json())

// auth middleware
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!isValidToken(getToken(req))) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}

// auth routes
app.post('/api/auth/login', async (req, res) => {
  const { password } = req.body as { password?: string }
  if (!password) {
    res.status(400).json({ error: 'Missing password' })
    return
  }
  const hash = process.env.APP_PASSWORD_HASH
  if (!hash) {
    res.status(500).json({ error: 'Server misconfigured' })
    return
  }
  const valid = await bcrypt.compare(password, hash)
  if (!valid) {
    res.status(401).json({ error: 'Incorrect password' })
    return
  }
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${makeToken()}; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}; Path=/`,
  )
  res.json({ ok: true })
})

app.post('/api/auth/logout', (_req, res) => {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`,
  )
  res.json({ ok: true })
})

app.get('/api/auth/check', (req, res) => {
  if (isValidToken(getToken(req))) res.json({ ok: true })
  else res.status(401).json({ error: 'Unauthorized' })
})

// settings routes
app.get('/api/settings', requireAuth, async (_req, res) => {
  res.json(await readSettings())
})

app.post('/api/settings', requireAuth, async (req, res) => {
  const body = req.body as Partial<GlobalSettings>
  const existing = await readSettings()
  const updated: GlobalSettings = {
    ...existing,
    default_servings:
      typeof body.default_servings === 'number' ? body.default_servings : existing.default_servings,
    active_modes: Array.isArray(body.active_modes) ? body.active_modes : existing.active_modes,
  }
  await writeSettings(updated)
  res.json({ ok: true })
})

// plans routes
app.get('/api/plans', requireAuth, async (_req, res) => {
  res.json(await readPlanIndex())
})

app.post('/api/plans', requireAuth, async (_req, res) => {
  const now = new Date().toISOString()
  const plan: Plan = {
    id: crypto.randomUUID(),
    schema_version: 1,
    label: defaultPlanLabel(),
    created_at: now,
    status: 'planning',
    selected: [],
    checked_off: [],
  }
  const index = await readPlanIndex()
  index.plans.unshift({
    id: plan.id,
    label: plan.label,
    status: plan.status,
    created_at: plan.created_at,
    recipe_count: 0,
  })
  await Promise.all([writePlan(plan), writePlanIndex(index)])
  res.status(201).json(plan)
})

app.get('/api/plans/:id', requireAuth, async (req, res) => {
  const plan = await readPlan(req.params.id)
  if (!plan) {
    res.status(404).json({ error: 'Plan not found' })
    return
  }
  res.json(plan)
})

app.post('/api/plans/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const body = req.body as Partial<Plan>
  const existing = await readPlan(id)
  if (!existing) {
    res.status(404).json({ error: 'Plan not found' })
    return
  }
  const updated: Plan = {
    ...existing,
    selected: Array.isArray(body.selected) ? body.selected : existing.selected,
    checked_off: body.checked_off ?? existing.checked_off,
    label: body.label ?? existing.label,
    status: body.status ?? existing.status,
  }
  const index = await readPlanIndex()
  const idx = index.plans.findIndex((p) => p.id === id)
  if (idx !== -1) {
    index.plans[idx] = {
      ...index.plans[idx],
      label: updated.label,
      status: updated.status,
      recipe_count: updated.selected.length,
    }
  }
  await Promise.all([writePlan(updated), writePlanIndex(index)])
  res.json({ ok: true })
})

app.delete('/api/plans/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const index = await readPlanIndex()
  index.plans = index.plans.filter((p) => p.id !== id)
  await Promise.all([deletePlanBlob(id), writePlanIndex(index)])
  res.json({ ok: true })
})

app.patch('/api/plans/:id/checkoff', requireAuth, async (req, res) => {
  const { id } = req.params
  const { ingredient_ref, recipe_id, checked } = req.body as {
    ingredient_ref: string
    recipe_id: string
    checked: boolean
  }
  if (!ingredient_ref || typeof checked !== 'boolean') {
    res.status(400).json({ error: 'Missing ingredient_ref or checked' })
    return
  }
  const plan = await readPlan(id)
  if (!plan) {
    res.status(404).json({ error: 'Plan not found' })
    return
  }
  const match = (k: { ingredient_ref: string; recipe_id: string }) =>
    k.ingredient_ref === ingredient_ref && k.recipe_id === recipe_id
  const already = plan.checked_off.some(match)
  if (checked && !already) plan.checked_off = [...plan.checked_off, { ingredient_ref, recipe_id }]
  else if (!checked && already) plan.checked_off = plan.checked_off.filter((k) => !match(k))
  await writePlan(plan)
  res.json({ ok: true, checked_off: plan.checked_off })
})

export default app
