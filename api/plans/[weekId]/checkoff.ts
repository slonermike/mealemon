import * as crypto from 'crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put, get } from '@vercel/blob'
import type { CheckoffKey, Plan } from '../../../src/lib/schema'

const COOKIE_NAME = 'mealemon_session'

function signingSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET env var is not set')
  return secret
}

function sign(value: string): string {
  return crypto.createHmac('sha256', signingSecret()).update(value).digest('hex')
}

function verifyToken(token: string): boolean {
  const lastDot = token.lastIndexOf('.')
  if (lastDot === -1) return false
  const payload = token.slice(0, lastDot)
  const sig = token.slice(lastDot + 1)
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(sign(payload)))
}

function isAuthenticated(req: VercelRequest): boolean {
  const cookieHeader = req.headers.cookie ?? ''
  const token = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1)
  if (!token) return false
  try {
    return verifyToken(token)
  } catch {
    return false
  }
}

function blobPathname(weekId: string) {
  return `plans/${weekId}.json`
}

async function readPlan(weekId: string): Promise<Plan | null> {
  const blob = await get(blobPathname(weekId), { access: 'private', useCache: false })
  if (!blob || blob.statusCode === 304 || !blob.stream) return null
  const chunks: Uint8Array[] = []
  for await (const chunk of blob.stream) chunks.push(chunk as Uint8Array)
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Plan
}

async function writePlan(weekId: string, plan: Plan): Promise<void> {
  await put(blobPathname(weekId), JSON.stringify(plan), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { weekId } = req.query as { weekId: string }

  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { ingredient_ref, recipe_id, checked } = req.body as CheckoffKey & { checked: boolean }
  if (!ingredient_ref || typeof checked !== 'boolean') {
    res.status(400).json({ error: 'Missing ingredient_ref or checked' })
    return
  }

  const plan = await readPlan(weekId)
  if (!plan) {
    res.status(404).json({ error: 'No plan found', weekId })
    return
  }

  const match = (k: CheckoffKey) => k.ingredient_ref === ingredient_ref && k.recipe_id === recipe_id

  const already = plan.checked_off.some(match)
  if (checked && !already) {
    plan.checked_off = [...plan.checked_off, { ingredient_ref, recipe_id }]
  } else if (!checked && already) {
    plan.checked_off = plan.checked_off.filter((k) => !match(k))
  }

  await writePlan(weekId, plan)
  res.status(200).json({ ok: true, checked_off: plan.checked_off })
}
