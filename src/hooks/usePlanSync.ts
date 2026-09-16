import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { usePlanStore } from '@/store/planSlice'
import { useSessionStore } from '@/store/sessionSlice'
import type { Plan } from '@/lib/schema'

const DEBOUNCE_MS = 1000

function planApiUrl(weekId: string) {
  return `/api/plans/${weekId}`
}

export function usePlanSync() {
  const plan = usePlanStore(
    useShallow((s) => ({
      week_of: s.week_of,
      selected: s.selected,
      active_modes: s.active_modes,
      checked_off: s.checked_off,
    })),
  )
  const loadPlan = usePlanStore((s) => s.loadPlan)
  const { setSyncing, setSynced, setSyncError } = useSessionStore()

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')
  const loadedRef = useRef(false)

  // Load plan from server on mount
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    const weekId = plan.week_of
    fetch(planApiUrl(weekId))
      .then((res) => {
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save on any plan change
  useEffect(() => {
    const serialized = JSON.stringify(plan)
    if (serialized === lastSavedRef.current) return

    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    debounceTimer.current = setTimeout(() => {
      setSyncing()
      fetch(planApiUrl(plan.week_of), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: serialized,
      })
        .then((res) => {
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
