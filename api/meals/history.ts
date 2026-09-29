import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put, get } from '@vercel/blob'
import { isAuthenticated } from '../_auth'
import type { MealHistory } from '../../src/lib/schema'

const BLOB_PATH = 'meals/history.json'
const CURRENT_VERSION = 1

function migrate(raw: Record<string, unknown>): MealHistory {
  const version = typeof raw.schema_version === 'number' ? raw.schema_version : 0
  // v0 → v1: no prior format exists; return empty history
  if (version < 1) {
    return { schema_version: 1, meals: [] }
  }
  return raw as unknown as MealHistory
}

export async function readMealHistory(): Promise<MealHistory> {
  const blob = await get(BLOB_PATH, { access: 'private', useCache: false })
  if (!blob || !blob.stream) {
    return { schema_version: CURRENT_VERSION, meals: [] }
  }
  const chunks: Uint8Array[] = []
  for await (const chunk of blob.stream) chunks.push(chunk as Uint8Array)
  const raw = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>
  return migrate(raw)
}

export async function writeMealHistory(history: MealHistory): Promise<void> {
  await put(BLOB_PATH, JSON.stringify({ ...history, schema_version: CURRENT_VERSION }), {
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
    const history = await readMealHistory()
    res.status(200).json(history)
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
