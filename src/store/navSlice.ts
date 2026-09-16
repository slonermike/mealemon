import { create } from 'zustand'

export type ActiveView = 'recipes' | 'plan' | 'shopping' | 'recipe-detail'

interface NavState {
  activeView: ActiveView
  focusedRecipeId: string | null
  setActiveView: (view: ActiveView) => void
  setFocusedRecipe: (id: string | null) => void
}

export const useNavStore = create<NavState>()((set) => ({
  activeView: 'recipes',
  focusedRecipeId: null,
  setActiveView: (activeView) => set({ activeView }),
  setFocusedRecipe: (focusedRecipeId) => set({ focusedRecipeId }),
}))
