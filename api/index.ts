import * as crypto from 'crypto'
import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { put, get, del } from '@vercel/blob'
import bcrypt from 'bcryptjs'
import type { Plan, PlanIndex } from '../src/lib/schema'

export const config = { runtime: 'nodejs' }

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
  if (!raw || (raw.schema_version as number) < 1)
    return { schema_version: SCHEMA_VERSION, plans: [] }
  return raw as unknown as PlanIndex
}
async function writePlanIndex(index: PlanIndex) {
  await writeBlob('plans/index.json', { ...index, schema_version: SCHEMA_VERSION })
}
function defaultPlanLabel() {
  return `Plan Created ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

// --- app ---

const app = new Hono().basePath('/api')

// auth middleware for protected routes
const authMiddleware = async (
  c: Parameters<Parameters<typeof app.use>[1]>[0],
  next: () => Promise<void>,
) => {
  const token = getCookie(c, COOKIE_NAME)
  if (!isValidToken(token)) return c.json({ error: 'Unauthorized' }, 401)
  await next()
}

// auth routes
app.post('/auth/login', async (c) => {
  const { password } = await c.req.json<{ password?: string }>()
  if (!password) return c.json({ error: 'Missing password' }, 400)
  const hash = process.env.APP_PASSWORD_HASH
  if (!hash) return c.json({ error: 'Server misconfigured' }, 500)
  const valid = await bcrypt.compare(password, hash)
  if (!valid) return c.json({ error: 'Incorrect password' }, 401)
  setCookie(c, COOKIE_NAME, makeToken(), {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
  return c.json({ ok: true })
})

app.post('/auth/logout', (c) => {
  deleteCookie(c, COOKIE_NAME, { path: '/' })
  return c.json({ ok: true })
})

app.get('/auth/check', (c) => {
  const token = getCookie(c, COOKIE_NAME)
  if (isValidToken(token)) return c.json({ ok: true })
  return c.json({ error: 'Unauthorized' }, 401)
})

// plans routes (all protected)
app.use('/plans/*', authMiddleware)
app.use('/plans', authMiddleware)

app.get('/plans', async (c) => {
  return c.json(await readPlanIndex())
})

app.post('/plans', async (c) => {
  const now = new Date().toISOString()
  const plan: Plan = {
    id: crypto.randomUUID(),
    schema_version: 1,
    label: defaultPlanLabel(),
    created_at: now,
    status: 'planning',
    selected: [],
    active_modes: [],
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
  return c.json(plan, 201)
})

app.get('/plans/:id', async (c) => {
  const plan = await readPlan(c.req.param('id'))
  if (!plan) return c.json({ error: 'Plan not found' }, 404)
  return c.json(plan)
})

app.post('/plans/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<Partial<Plan>>()
  const existing = await readPlan(id)
  if (!existing) return c.json({ error: 'Plan not found' }, 404)
  const updated: Plan = {
    ...existing,
    selected: Array.isArray(body.selected) ? body.selected : existing.selected,
    active_modes: body.active_modes ?? existing.active_modes,
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
  return c.json({ ok: true })
})

app.delete('/plans/:id', async (c) => {
  const id = c.req.param('id')
  const index = await readPlanIndex()
  index.plans = index.plans.filter((p) => p.id !== id)
  await Promise.all([deletePlanBlob(id), writePlanIndex(index)])
  return c.json({ ok: true })
})

app.patch('/plans/:id/checkoff', async (c) => {
  const id = c.req.param('id')
  const { ingredient_ref, recipe_id, checked } = await c.req.json<{
    ingredient_ref: string
    recipe_id: string
    checked: boolean
  }>()
  if (!ingredient_ref || typeof checked !== 'boolean')
    return c.json({ error: 'Missing ingredient_ref or checked' }, 400)
  const plan = await readPlan(id)
  if (!plan) return c.json({ error: 'Plan not found' }, 404)
  const match = (k: { ingredient_ref: string; recipe_id: string }) =>
    k.ingredient_ref === ingredient_ref && k.recipe_id === recipe_id
  const already = plan.checked_off.some(match)
  if (checked && !already) plan.checked_off = [...plan.checked_off, { ingredient_ref, recipe_id }]
  else if (!checked && already) plan.checked_off = plan.checked_off.filter((k) => !match(k))
  await writePlan(plan)
  return c.json({ ok: true, checked_off: plan.checked_off })
})

export default handle(app)
