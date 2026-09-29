import { useEffect, useRef } from 'react'
import { usePlansStore } from '@/store/plansSlice'
import { useAuthStore } from '@/store/authSlice'
import type { PlanIndex } from '@/lib/schema'

export function usePlansSync() {
  const loadPlanIndex = usePlansStore((s) => s.loadPlanIndex)
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
        if (data) loadPlanIndex(data.plans)
      })
      .catch(console.error)
  }, [loadPlanIndex, setUnauthenticated])
}
