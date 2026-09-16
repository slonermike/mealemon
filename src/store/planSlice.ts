import { create } from 'zustand'
import type { CheckoffKey, Plan, PlanSelection } from '@/lib/schema'

interface PlanState extends Plan {
  default_servings: number
  setServings: (recipe_id: string, servings: number) => void
  setDefaultServings: (servings: number) => void
  toggleRecipe: (recipe_id: string, base_servings: number) => void
  toggleMode: (mode: string) => void
  toggleRecipeMode: (recipe_id: string, mode: string, globalModes: string[]) => void
  clearRecipeModes: (recipe_id: string) => void
  toggleCheckoff: (key: CheckoffKey) => void
  loadPlan: (plan: Plan) => void
}

const currentWeekOf = () => {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay() + 1) // Monday
  return d.toISOString().slice(0, 10)
}

export const usePlanStore = create<PlanState>()((set, get) => ({
  week_of: currentWeekOf(),
  selected: [],
  active_modes: [],
  checked_off: [],
  default_servings: 4,

  toggleRecipe: (recipe_id, base_servings) => {
    const { selected } = get()
    const exists = selected.some((s) => s.recipe_id === recipe_id)
    set({
      selected: exists
        ? selected.filter((s) => s.recipe_id !== recipe_id)
        : [...selected, { recipe_id, servings: base_servings }],
    })
  },

  setServings: (recipe_id, servings) => {
    set((s) => ({
      selected: s.selected.map((sel) => (sel.recipe_id === recipe_id ? { ...sel, servings } : sel)),
    }))
  },

  setDefaultServings: (default_servings) => set({ default_servings }),

  toggleMode: (mode) => {
    const { active_modes } = get()
    set({
      active_modes: active_modes.includes(mode)
        ? active_modes.filter((m) => m !== mode)
        : [...active_modes, mode],
    })
  },

  toggleRecipeMode: (recipe_id, mode, globalModes) => {
    set((s) => ({
      selected: s.selected.map((sel) => {
        if (sel.recipe_id !== recipe_id) return sel
        const current = sel.mode_overrides ?? globalModes
        const next = current.includes(mode) ? current.filter((m) => m !== mode) : [...current, mode]
        return { ...sel, mode_overrides: next }
      }),
    }))
  },

  clearRecipeModes: (recipe_id) => {
    set((s) => ({
      selected: s.selected.map((sel) =>
        sel.recipe_id === recipe_id ? { ...sel, mode_overrides: [] } : sel,
      ),
    }))
  },

  toggleCheckoff: (key) => {
    const { checked_off } = get()
    const match = (k: CheckoffKey) =>
      k.ingredient_ref === key.ingredient_ref && k.recipe_id === key.recipe_id
    const exists = checked_off.some(match)
    set({ checked_off: exists ? checked_off.filter((k) => !match(k)) : [...checked_off, key] })
  },

  loadPlan: (plan) => set(plan),
}))

export const selectIsRecipeSelected = (recipe_id: string) => (s: PlanState) =>
  s.selected.some((sel: PlanSelection) => sel.recipe_id === recipe_id)

export const selectServings = (recipe_id: string) => (s: PlanState) =>
  s.selected.find((sel: PlanSelection) => sel.recipe_id === recipe_id)?.servings ?? null

export const selectRecipeModes = (recipe_id: string) => (s: PlanState) =>
  s.selected.find((sel: PlanSelection) => sel.recipe_id === recipe_id)?.mode_overrides ?? null

export const selectIsCheckedOff = (key: CheckoffKey) => (s: PlanState) =>
  s.checked_off.some(
    (k: CheckoffKey) => k.ingredient_ref === key.ingredient_ref && k.recipe_id === key.recipe_id,
  )
