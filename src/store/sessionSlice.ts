import { create } from 'zustand'

interface SessionState {
  syncState: 'idle' | 'syncing' | 'error'
  lastSyncedAt: string | null
  syncError?: unknown
  setSyncing: () => void
  setSynced: () => void
  setSyncError: (err: unknown) => void
}

export const useSessionStore = create<SessionState>()((set) => ({
  syncState: 'idle',
  lastSyncedAt: null,

  setSyncing: () => set({ syncState: 'syncing', syncError: undefined }),
  setSynced: () => set({ syncState: 'idle', lastSyncedAt: new Date().toISOString() }),
  setSyncError: (err) => set({ syncState: 'error', syncError: err }),
}))
