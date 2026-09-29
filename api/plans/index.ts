import * as crypto from 'crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isAuthenticated } from '../../src/lib/apiAuth'
import { readPlanIndex, writePlanIndex, writePlan, defaultPlanLabel } from '../../src/lib/planBlob'
import type { Plan } from '../../src/lib/schema'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (req.method === 'GET') {
    const index = await readPlanIndex()
    res.status(200).json(index)
    return
  }

  if (req.method === 'POST') {
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
    res.status(201).json(plan)
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
