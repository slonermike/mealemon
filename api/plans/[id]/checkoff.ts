import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isAuthenticated } from '../../_lib/apiAuth'
import { readPlan, writePlan } from '../../_lib/planBlob'
import type { CheckoffKey } from '../../_lib/schema'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const id = String(req.query.id)
  const { ingredient_ref, recipe_id, checked } = req.body as CheckoffKey & { checked: boolean }
  if (!ingredient_ref || typeof checked !== 'boolean') {
    res.status(400).json({ error: 'Missing ingredient_ref or checked' })
    return
  }

  const plan = await readPlan(id)
  if (!plan) {
    res.status(404).json({ error: 'Plan not found', id })
    return
  }

  const match = (k: CheckoffKey) => k.ingredient_ref === ingredient_ref && k.recipe_id === recipe_id
  const already = plan.checked_off.some(match)

  if (checked && !already) {
    plan.checked_off = [...plan.checked_off, { ingredient_ref, recipe_id }]
  } else if (!checked && already) {
    plan.checked_off = plan.checked_off.filter((k) => !match(k))
  }

  await writePlan(plan)
  res.status(200).json({ ok: true, checked_off: plan.checked_off })
}
