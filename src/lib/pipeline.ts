import type {
  IngredientRegistryEntry,
  IngredientSlot,
  Plan,
  Recipe,
  ResolvedCandidate,
  ShoppingItem,
} from './schema'
import { isVolumeUnit, toTsp, coalesceVolume } from './units'

export function getIncompatibleSlots(
  recipe: Recipe,
  activeExclusionTags: string[],
  registry: Record<string, IngredientRegistryEntry>,
): string[] {
  return recipe.ingredients
    .filter((slot) => !slot.omissible && resolveSlot(slot, activeExclusionTags, registry) === null)
    .map((slot) => {
      const ref = slot.candidates[0]?.ingredient_ref
      return registry[ref]?.name ?? ref ?? slot.id
    })
}

export function resolveSlot(
  slot: IngredientSlot,
  activeExclusionTags: string[],
  registry: Record<string, IngredientRegistryEntry>,
): ResolvedCandidate | null {
  for (const candidate of slot.candidates) {
    const registryTags = registry[candidate.ingredient_ref]?.default_allergen_tags ?? []
    const effectiveTags = candidate.allergen_tags ?? registryTags
    const excluded = effectiveTags.some((tag) => activeExclusionTags.includes(tag))
    if (!excluded) {
      return {
        ingredient_ref: candidate.ingredient_ref,
        amount: candidate.amount,
        unit: candidate.unit,
        allergen_tags: effectiveTags,
      }
    }
  }
  return null
}

export function buildShoppingList(
  plan: Pick<Plan, 'selected'>,
  recipes: Record<string, Recipe>,
  registry: Record<string, IngredientRegistryEntry>,
  activeExclusionTags: string[],
): ShoppingItem[] {
  type OccurrenceMap = Map<string, { recipe_id: string; amount: number; unit: string }[]>
  const occurrencesByRef: OccurrenceMap = new Map()

  for (const { recipe_id, servings } of plan.selected) {
    const recipe = recipes[recipe_id]
    if (!recipe) continue
    const scale = servings / recipe.base_servings

    for (const slot of recipe.ingredients) {
      const resolved = resolveSlot(slot, activeExclusionTags, registry)
      // Unresolved omissible slots are silently skipped.
      // Unresolved non-omissible slots mark the recipe incompatible (caller should
      // have excluded it at browse time, but we skip gracefully here too).
      if (!resolved) continue

      const existing = occurrencesByRef.get(resolved.ingredient_ref) ?? []
      existing.push({
        recipe_id,
        amount: resolved.amount * scale,
        unit: resolved.unit,
      })
      occurrencesByRef.set(resolved.ingredient_ref, existing)
    }
  }

  const items: ShoppingItem[] = []

  for (const [ingredient_ref, occurrences] of occurrencesByRef) {
    // If all occurrences are volume units, normalize everything to tsp and
    // coalesce up to the largest clean unit before combining.
    const allVolume = occurrences.every((o) => isVolumeUnit(o.unit))
    if (allVolume) {
      const totalTsp = occurrences.reduce((sum, o) => sum + (toTsp(o.amount, o.unit) ?? 0), 0)
      const { amount, unit } = coalesceVolume(totalTsp)
      items.push({
        ingredient_ref,
        combinable: true,
        display_mode: 'combined',
        combined: { amount, unit },
        occurrences,
      })
      continue
    }

    const units = new Set(occurrences.map((o) => o.unit))
    const combinable = units.size === 1
    const combined = combinable
      ? {
          amount: occurrences.reduce((sum, o) => sum + o.amount, 0),
          unit: occurrences[0].unit,
        }
      : { amount: 0, unit: '' }

    items.push({
      ingredient_ref,
      combinable,
      display_mode: combinable ? 'combined' : 'separate',
      combined,
      occurrences,
    })
  }

  return items
}
