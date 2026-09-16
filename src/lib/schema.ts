// Core data types for the mealemon schema.
// These are consumed by both the pipeline (lib/pipeline.ts) and the UI (store/).

export interface IngredientRegistryEntry {
  id: string
  name: string
  category: string
  unit_family: 'weight' | 'volume' | 'count'
  default_allergen_tags: string[]
}

export interface IngredientCandidate {
  ingredient_ref: string
  amount: number
  unit: string
  allergen_tags?: string[]
}

export interface IngredientSlot {
  id: string
  candidates: IngredientCandidate[]
}

export interface Step {
  id: string
  title: string
  content: string
  timer_seconds?: number
}

export interface Recipe {
  schema_version: number
  id: string
  title: string
  base_servings: number
  ingredients: IngredientSlot[]
  steps: Step[]
}

export interface ExclusionMode {
  mode: string
  tags: string[]
  applies_to: 'all' | string[]
}

export interface PlanSelection {
  recipe_id: string
  servings: number
  mode_overrides?: string[]
}

export interface CheckoffKey {
  ingredient_ref: string
  recipe_id?: string
}

export interface Plan {
  week_of: string
  selected: PlanSelection[]
  active_modes: string[]
  checked_off: CheckoffKey[]
}

export interface ResolvedCandidate {
  ingredient_ref: string
  amount: number
  unit: string
  allergen_tags: string[]
}

export interface ShoppingOccurrence {
  recipe_id: string
  amount: number
  unit: string
}

export interface ShoppingItem {
  ingredient_ref: string
  combinable: boolean
  display_mode: 'combined' | 'separate'
  combined: { amount: number; unit: string }
  occurrences: ShoppingOccurrence[]
}
