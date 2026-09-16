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
      if (!res.ok) throw new Error(`Failed to fetch recipes: ${res.status}`)
      const data = await res.json()
      set({
        recipes: data.recipes,
        registry: data.registry,
        version: data.version,
        loadState: 'loaded',
      })
    } catch (err) {
      set({ loadState: 'error', loadError: err })
    }
  },
}))

export const selectRecipeById = (id: string) => (s: RecipeState) => s.recipes[id]

export const selectAllRecipeIds = (s: RecipeState) => Object.keys(s.recipes)
