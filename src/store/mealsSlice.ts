import { create } from 'zustand'
import type { MealRecord } from '@/lib/schema'

interface MealsState {
  meals: MealRecord[]
  loadHistory: (meals: MealRecord[]) => void
  addRecord: (record: MealRecord) => void
}

export const useMealsStore = create<MealsState>()((set) => ({
  meals: [],

  loadHistory: (meals) => set({ meals }),

  addRecord: (record) => set((s) => ({ meals: [record, ...s.meals].slice(0, 100) })),
}))
