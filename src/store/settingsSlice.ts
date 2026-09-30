import { create } from 'zustand'
import type { GlobalSettings } from '@/lib/schema'

interface SettingsState {
  default_servings: number
  active_modes: string[]
  settingsLoaded: boolean

  loadSettings: (settings: GlobalSettings) => void
  setDefaultServings: (servings: number) => void
  toggleMode: (mode: string) => void
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  default_servings: 4,
  active_modes: [],
  settingsLoaded: false,

  loadSettings: ({ default_servings, active_modes }) =>
    set({ default_servings, active_modes, settingsLoaded: true }),

  setDefaultServings: (default_servings) => set({ default_servings }),

  toggleMode: (mode) =>
    set((s) => ({
      active_modes: s.active_modes.includes(mode)
        ? s.active_modes.filter((m) => m !== mode)
        : [...s.active_modes, mode],
    })),
}))
