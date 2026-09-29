import { create } from 'zustand'
import type { CheckoffKey, Plan, PlanSelection, PlanSummary } from '@/lib/schema'

interface PlansState {
  plans: Record<string, Plan>
  planIndex: PlanSummary[]
  activePlanId: string | null
  default_servings: number
  indexLoaded: boolean

  // Index / navigation
  loadPlanIndex: (summaries: PlanSummary[]) => void
  setActivePlan: (id: string) => void
  createPlan: (plan: Plan) => void
  deletePlan: (id: string) => void

  // Single plan load
  loadPlan: (plan: Plan) => void

  // Active plan mutations
  toggleRecipe: (recipe_id: string) => void
  setServings: (recipe_id: string, servings: number) => void
  setDefaultServings: (servings: number) => void
  toggleMode: (mode: string) => void
  toggleRecipeMode: (recipe_id: string, mode: string, globalModes: string[]) => void
  resetRecipeModes: (recipe_id: string) => void
  toggleCheckoff: (key: CheckoffKey) => void
  setPlanStatus: (id: string, status: Plan['status']) => void
  setPlanLabel: (id: string, label: string) => void
}

function updateActive(
  state: PlansState,
  updater: (plan: Plan) => Partial<Plan>,
): Partial<PlansState> {
  const { activePlanId, plans } = state
  if (!activePlanId || !plans[activePlanId]) return {}
  const updated = { ...plans[activePlanId], ...updater(plans[activePlanId]) }
  return { plans: { ...plans, [activePlanId]: updated } }
}

export const usePlansStore = create<PlansState>()((set) => ({
  plans: {},
  planIndex: [],
  activePlanId: null,
  default_servings: 4,
  indexLoaded: false,

  loadPlanIndex: (summaries) => set({ planIndex: summaries, indexLoaded: true }),

  setActivePlan: (id) => set({ activePlanId: id }),

  createPlan: (plan) =>
    set((s) => ({
      plans: { ...s.plans, [plan.id]: plan },
      planIndex: [
        {
          id: plan.id,
          label: plan.label,
          status: plan.status,
          created_at: plan.created_at,
          recipe_count: 0,
        },
        ...s.planIndex,
      ],
      activePlanId: plan.id,
    })),

  deletePlan: (id) =>
    set((s) => ({
      plans: Object.fromEntries(Object.entries(s.plans).filter(([k]) => k !== id)),
      planIndex: s.planIndex.filter((p) => p.id !== id),
      activePlanId: s.activePlanId === id ? null : s.activePlanId,
    })),

  loadPlan: (plan) => set((s) => ({ plans: { ...s.plans, [plan.id]: plan } })),

  toggleRecipe: (recipe_id) =>
    set((s) => {
      const plan = s.activePlanId ? s.plans[s.activePlanId] : null
      if (!plan) return {}
      const exists = plan.selected.some((sel) => sel.recipe_id === recipe_id)
      return updateActive(s, (p) => ({
        selected: exists
          ? p.selected.filter((sel) => sel.recipe_id !== recipe_id)
          : [...p.selected, { recipe_id, servings: s.default_servings, shopped: false }],
      }))
    }),

  setServings: (recipe_id, servings) =>
    set((s) =>
      updateActive(s, (p) => ({
        selected: p.selected.map((sel) =>
          sel.recipe_id === recipe_id ? { ...sel, servings } : sel,
        ),
      })),
    ),

  setDefaultServings: (default_servings) => set({ default_servings }),

  toggleMode: (mode) =>
    set((s) =>
      updateActive(s, (p) => ({
        active_modes: p.active_modes.includes(mode)
          ? p.active_modes.filter((m) => m !== mode)
          : [...p.active_modes, mode],
      })),
    ),

  toggleRecipeMode: (recipe_id, mode, globalModes) =>
    set((s) =>
      updateActive(s, (p) => ({
        selected: p.selected.map((sel) => {
          if (sel.recipe_id !== recipe_id) return sel
          const current = sel.mode_overrides ?? globalModes
          const next = current.includes(mode)
            ? current.filter((m) => m !== mode)
            : [...current, mode]
          return { ...sel, mode_overrides: next }
        }),
      })),
    ),

  resetRecipeModes: (recipe_id) =>
    set((s) =>
      updateActive(s, (p) => ({
        selected: p.selected.map((sel) =>
          sel.recipe_id === recipe_id ? { ...sel, mode_overrides: undefined } : sel,
        ),
      })),
    ),

  toggleCheckoff: (key) =>
    set((s) =>
      updateActive(s, (p) => {
        const match = (k: CheckoffKey) =>
          k.ingredient_ref === key.ingredient_ref && k.recipe_id === key.recipe_id
        const exists = p.checked_off.some(match)
        return {
          checked_off: exists ? p.checked_off.filter((k) => !match(k)) : [...p.checked_off, key],
        }
      }),
    ),

  setPlanStatus: (id, status) =>
    set((s) => {
      const plan = s.plans[id]
      if (!plan) return {}
      return {
        plans: { ...s.plans, [id]: { ...plan, status } },
        planIndex: s.planIndex.map((p) => (p.id === id ? { ...p, status } : p)),
      }
    }),

  setPlanLabel: (id, label) =>
    set((s) => {
      const plan = s.plans[id]
      if (!plan) return {}
      return {
        plans: { ...s.plans, [id]: { ...plan, label } },
        planIndex: s.planIndex.map((p) => (p.id === id ? { ...p, label } : p)),
      }
    }),
}))

export const selectActivePlan = (s: PlansState) =>
  s.activePlanId ? (s.plans[s.activePlanId] ?? null) : null

export const selectIsRecipeSelected = (recipe_id: string) => (s: PlansState) =>
  selectActivePlan(s)?.selected.some((sel: PlanSelection) => sel.recipe_id === recipe_id) ?? false

export const selectServings = (recipe_id: string) => (s: PlansState) =>
  selectActivePlan(s)?.selected.find((sel: PlanSelection) => sel.recipe_id === recipe_id)
    ?.servings ?? null

export const selectRecipeModes = (recipe_id: string) => (s: PlansState) =>
  selectActivePlan(s)?.selected.find((sel: PlanSelection) => sel.recipe_id === recipe_id)
    ?.mode_overrides ?? null

export const selectIsCheckedOff = (key: CheckoffKey) => (s: PlansState) =>
  selectActivePlan(s)?.checked_off.some(
    (k: CheckoffKey) => k.ingredient_ref === key.ingredient_ref && k.recipe_id === key.recipe_id,
  ) ?? false
