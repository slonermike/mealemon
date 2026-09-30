import { useEffect, useRef } from 'react'
import { usePlansStore } from '@/store/plansSlice'
import { useAuthStore } from '@/store/authSlice'
import type { PlanIndex, PlanSummary } from '@/lib/schema'

function resolveActivePlan(plans: PlanSummary[]): string | null {
  const active = plans.filter((p) => p.status !== 'done')
  if (active.length === 0) return null
  const latest = active[0].id
  const stored = localStorage.getItem('mealemon_active_plan')
  if (stored && stored !== latest && active.some((p) => p.id === stored)) return stored
  return latest
}

export function usePlansSync() {
  const loadPlanIndex = usePlansStore((s) => s.loadPlanIndex)
  const setActivePlan = usePlansStore((s) => s.setActivePlan)
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    fetch('/api/plans')
      .then((res) => {
        if (res.status === 401) {
          setUnauthenticated()
          return null
        }
        if (!res.ok) throw new Error(`${res.status}`)
        return res.json() as Promise<PlanIndex>
      })
      .then((data) => {
        if (!data) return
        loadPlanIndex(data.plans)
        const id = resolveActivePlan(data.plans)
        if (id) setActivePlan(id)
      })
      .catch(console.error)
  }, [loadPlanIndex, setActivePlan, setUnauthenticated])
}
