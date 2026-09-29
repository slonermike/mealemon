import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { usePlansStore, selectActivePlan } from '@/store/plansSlice'
import { useSessionStore } from '@/store/sessionSlice'
import { useAuthStore } from '@/store/authSlice'
import type { Plan } from '@/lib/schema'

const DEBOUNCE_MS = 1000

export function usePlanSync() {
  const activePlanId = usePlansStore((s) => s.activePlanId)
  const activePlan = usePlansStore(useShallow(selectActivePlan))
  const loadPlan = usePlansStore((s) => s.loadPlan)
  const { setSyncing, setSynced, setSyncError } = useSessionStore()
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')
  const loadedPlanIdRef = useRef<string | null>(null)

  // Load plan from server when activePlanId changes and we don't have it yet
  useEffect(() => {
    if (!activePlanId) return
    if (loadedPlanIdRef.current === activePlanId) return
    loadedPlanIdRef.current = activePlanId

    fetch(`/api/plans/${activePlanId}`)
      .then((res) => {
        if (res.status === 401) {
          setUnauthenticated()
          return null
        }
        if (res.status === 404) return null
        if (!res.ok) throw new Error(`${res.status}`)
        return res.json() as Promise<Plan>
      })
      .then((remote) => {
        if (remote) {
          loadPlan(remote)
          lastSavedRef.current = JSON.stringify(remote)
        }
      })
      .catch((err) => setSyncError(err))
  }, [activePlanId, loadPlan, setSyncError, setUnauthenticated])

  // Debounced save when active plan data changes
  useEffect(() => {
    if (!activePlanId || !activePlan) return
    const serialized = JSON.stringify(activePlan)
    if (serialized === lastSavedRef.current) return

    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    debounceTimer.current = setTimeout(() => {
      setSyncing()
      fetch(`/api/plans/${activePlanId}`, {
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
  }, [activePlanId, activePlan, setSyncing, setSynced, setSyncError, setUnauthenticated])
}
