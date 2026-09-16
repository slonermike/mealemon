import { create } from 'zustand'
import type { IngredientRegistryEntry, Recipe } from '@/lib/schema'

interface RecipeState {
  recipes: Record<string, Recipe>
  registry: Record<string, IngredientRegistryEntry>
  version: number | null
  loadState: 'idle' | 'loading' | 'loaded' | 'error'
  loadError?: unknown
  load: () => Promise<void>
}

export const useRecipeStore = create<RecipeState>()((set, get) => ({
  recipes: {},
  registry: {},
  version: null,
  loadState: 'idle',

  load: async () => {
    if (get().loadState === 'loading' || get().loadState === 'loaded') return
    set({ loadState: 'loading' })
    try {
      // TODO: check IndexedDB version against /recipes-version.json, fetch if stale
      const res = await fetch('/recipes.json')
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      set({
        recipes: data.recipes,
        registry: data.registry,
        version: data.version,
        loadState: 'loaded',
      })
    } catch {
      // Fall back to bundled fixtures in dev when public/recipes.json doesn't exist
      const fixtures = (await import('@/fixtures/recipes.json')) as unknown as {
        version: number
        recipes: Record<string, Recipe>
        registry: Record<string, IngredientRegistryEntry>
      }
      set({
        recipes: fixtures.recipes,
        registry: fixtures.registry,
        version: fixtures.version,
        loadState: 'loaded',
      })
    }
  },
}))

export const selectRecipeById = (id: string) => (s: RecipeState) => s.recipes[id]

export const selectAllRecipeIds = (s: RecipeState) => Object.keys(s.recipes)

export const selectAllAllergenTags = (s: RecipeState): string[] =>
  [...new Set(Object.values(s.registry).flatMap((e) => e.default_allergen_tags))].sort()

export const selectRecipeAllergenTags =
  (recipeId: string) =>
  (s: RecipeState): string[] => {
    const recipe = s.recipes[recipeId]
    if (!recipe) return []
    const tags = new Set<string>()
    for (const slot of recipe.ingredients) {
      for (const candidate of slot.candidates) {
        const registryTags = s.registry[candidate.ingredient_ref]?.default_allergen_tags ?? []
        const effectiveTags = candidate.allergen_tags ?? registryTags
        for (const tag of effectiveTags) tags.add(tag)
      }
    }
    return [...tags].sort()
  }
