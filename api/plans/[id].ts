import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isAuthenticated } from '../_lib/apiAuth'
import {
  readPlan,
  writePlan,
  deletePlanBlob,
  readPlanIndex,
  writePlanIndex,
} from '../_lib/planBlob'
import type { Plan } from '../_lib/schema'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const id = String(req.query.id)

  if (req.method === 'GET') {
    const plan = await readPlan(id)
    if (!plan) {
      res.status(404).json({ error: 'Plan not found', id })
      return
    }
    res.status(200).json(plan)
    return
  }

  if (req.method === 'POST') {
    const body = req.body as Partial<Plan>
    if (!body) {
      res.status(400).json({ error: 'Invalid plan body' })
      return
    }

    const existing = await readPlan(id)
    if (!existing) {
      res.status(404).json({ error: 'Plan not found', id })
      return
    }

    const updated: Plan = {
      ...existing,
      selected: Array.isArray(body.selected) ? body.selected : existing.selected,
      active_modes: body.active_modes ?? existing.active_modes,
      checked_off: body.checked_off ?? existing.checked_off,
      label: body.label ?? existing.label,
      status: body.status ?? existing.status,
    }

    const index = await readPlanIndex()
    const summaryIdx = index.plans.findIndex((p) => p.id === id)
    if (summaryIdx !== -1) {
      index.plans[summaryIdx] = {
        ...index.plans[summaryIdx],
        label: updated.label,
        status: updated.status,
        recipe_count: updated.selected.length,
      }
    }

    await Promise.all([writePlan(updated), writePlanIndex(index)])
    res.status(200).json({ ok: true })
    return
  }

  if (req.method === 'DELETE') {
    const index = await readPlanIndex()
    index.plans = index.plans.filter((p) => p.id !== id)
    await Promise.all([deletePlanBlob(id), writePlanIndex(index)])
    res.status(200).json({ ok: true })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
