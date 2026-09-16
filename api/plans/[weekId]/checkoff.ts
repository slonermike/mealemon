import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put, head } from '@vercel/blob'
import type { CheckoffKey, Plan } from '../../../src/lib/schema'

function blobKey(weekId: string) {
  return `plans/${weekId}.json`
}

async function readPlan(weekId: string): Promise<Plan | null> {
  try {
    const meta = await head(blobKey(weekId))
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
