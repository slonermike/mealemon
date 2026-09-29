import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { usePlanStore } from '@/store/planSlice'
import { useSessionStore } from '@/store/sessionSlice'
import { useAuthStore } from '@/store/authSlice'
import type { ActivePlan } from '@/lib/schema'

const DEBOUNCE_MS = 1000
const API_URL = '/api/plans/active'

export function usePlanSync() {
  const plan = usePlanStore(
    useShallow((s) => ({
      selected: s.selected,
      active_modes: s.active_modes,
      checked_off: s.checked_off,
    })),
  )
  const loadPlan = usePlanStore((s) => s.loadPlan)
  const { setSyncing, setSynced, setSyncError } = useSessionStore()
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')
  const loadedRef = useRef(false)

  // Load plan from server on mount
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    fetch(API_URL)
      .then((res) => {
        if (res.status === 401) {
          setUnauthenticated()
          return null
        }
        if (!res.ok) throw new Error(`${res.status}`)
        return res.json() as Promise<ActivePlan>
      })
      .then((remote) => {
        if (remote) {
          loadPlan(remote)
          lastSavedRef.current = JSON.stringify(remote)
        }
      })
      .catch((err) => setSyncError(err))
  }, [loadPlan, setSyncError, setUnauthenticated])

  // Debounced save on any plan change
  useEffect(() => {
    const serialized = JSON.stringify(plan)
    if (serialized === lastSavedRef.current) return

    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    debounceTimer.current = setTimeout(() => {
      setSyncing()
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: serialized,
      })
        .then((res) => {
          if (res.status === 401) {
            setUnauthenticated()
            return
          }
          if (!res.ok) throw new Error(`${res.status}`)
          lastSavedRef.current = serialized
          setSynced()
        })
        .catch((err) => setSyncError(err))
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [plan, setSyncing, setSynced, setSyncError])
}
