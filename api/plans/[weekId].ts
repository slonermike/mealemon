import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put, head } from '@vercel/blob'
import type { Plan } from '../../src/lib/schema'

function blobKey(weekId: string) {
  return `plans/${weekId}.json`
}

async function readPlan(weekId: string): Promise<Plan | null> {
  const key = blobKey(weekId)
  try {
    const meta = await head(key)
    const res = await fetch(meta.downloadUrl)
    if (!res.ok) return null
    return (await res.json()) as Plan
  } catch {
    return null
  }
}

async function writePlan(weekId: string, plan: Plan): Promise<void> {
  await put(blobKey(weekId), JSON.stringify(plan), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
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
