import { create } from 'zustand'

type AuthState = 'unknown' | 'authenticated' | 'unauthenticated'

interface AuthStore {
  state: AuthState
  setAuthenticated: () => void
  setUnauthenticated: () => void
}

export const useAuthStore = create<AuthStore>()((set) => ({
  state: 'unknown',
  setAuthenticated: () => set({ state: 'authenticated' }),
  setUnauthenticated: () => set({ state: 'unauthenticated' }),
}))
