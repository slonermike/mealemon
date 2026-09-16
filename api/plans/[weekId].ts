import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put, get } from '@vercel/blob'
import type { Plan } from '../../src/lib/schema'

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
  const { weekId } = req.query as { weekId: string }

  if (req.method === 'GET') {
    const plan = await readPlan(weekId)
    if (!plan) {
      res.status(404).json({ error: 'No plan found', weekId })
      return
    }
    res.status(200).json(plan)
    return
  }

  if (req.method === 'POST') {
    const plan = req.body as Plan
    if (!plan || !plan.week_of) {
      res.status(400).json({ error: 'Invalid plan body' })
      return
    }
    await writePlan(weekId, plan)
    res.status(200).json({ ok: true })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
