import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put, get } from '@vercel/blob'
import { isAuthenticated } from '../_auth'
import type { ActivePlan } from '../../src/lib/schema'

const BLOB_PATH = 'plans/active.json'
const CURRENT_VERSION = 1

function migrate(raw: Record<string, unknown>): ActivePlan {
  const version = typeof raw.schema_version === 'number' ? raw.schema_version : 0
  // v0 → v1: no prior format exists; return empty plan
  if (version < 1) {
    return { schema_version: 1, selected: [], active_modes: [], checked_off: [] }
  }
  return raw as unknown as ActivePlan
}

export async function readActivePlan(): Promise<ActivePlan> {
  const blob = await get(BLOB_PATH, { access: 'private', useCache: false })
  if (!blob || !blob.stream) {
    return { schema_version: CURRENT_VERSION, selected: [], active_modes: [], checked_off: [] }
  }
  const chunks: Uint8Array[] = []
  for await (const chunk of blob.stream) chunks.push(chunk as Uint8Array)
  const raw = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>
  return migrate(raw)
}

export async function writeActivePlan(plan: ActivePlan): Promise<void> {
  await put(BLOB_PATH, JSON.stringify({ ...plan, schema_version: CURRENT_VERSION }), {
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

  if (req.method === 'GET') {
    const plan = await readActivePlan()
    res.status(200).json(plan)
    return
  }

  if (req.method === 'POST') {
    const body = req.body as Partial<ActivePlan>
    if (!body || !Array.isArray(body.selected)) {
      res.status(400).json({ error: 'Invalid plan body' })
      return
    }
    const plan: ActivePlan = {
      schema_version: CURRENT_VERSION,
      selected: body.selected,
      active_modes: body.active_modes ?? [],
      checked_off: body.checked_off ?? [],
    }
    await writeActivePlan(plan)
    res.status(200).json({ ok: true })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
