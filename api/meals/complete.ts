import * as crypto from 'crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isAuthenticated } from '../_auth'
import { readActivePlan, writeActivePlan } from '../plans/active'
import type { MealRecord } from '../../src/lib/schema'
import { readMealHistory, writeMealHistory } from './history'

const MAX_HISTORY = 100

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { recipe_id } = req.body as { recipe_id?: string }
  if (!recipe_id) {
    res.status(400).json({ error: 'Missing recipe_id' })
    return
  }

  const [plan, history] = await Promise.all([readActivePlan(), readMealHistory()])

  const selection = plan.selected.find((s) => s.recipe_id === recipe_id)
  if (!selection) {
    res.status(404).json({ error: 'Recipe not in active plan' })
    return
  }

  const record: MealRecord = {
    id: crypto.randomUUID(),
    recipe_id: selection.recipe_id,
    servings: selection.servings,
    mode_overrides: selection.mode_overrides,
    active_modes: plan.active_modes,
    checked_off: plan.checked_off.filter((k) => k.recipe_id === recipe_id),
    shopped: selection.shopped,
    completed_at: new Date().toISOString(),
  }

  plan.selected = plan.selected.filter((s) => s.recipe_id !== recipe_id)
  plan.checked_off = plan.checked_off.filter((k) => k.recipe_id !== recipe_id)

  history.meals = [record, ...history.meals].slice(0, MAX_HISTORY)

  await Promise.all([writeActivePlan(plan), writeMealHistory(history)])

  res.status(200).json({ ok: true, record })
}
