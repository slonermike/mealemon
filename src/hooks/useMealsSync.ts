import { useEffect, useRef } from 'react'
import { useMealsStore } from '@/store/mealsSlice'
import { useAuthStore } from '@/store/authSlice'
import type { MealHistory } from '@/lib/schema'

export function useMealsSync() {
  const loadHistory = useMealsStore((s) => s.loadHistory)
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    fetch('/api/meals/history')
      .then((res) => {
        if (res.status === 401) {
          setUnauthenticated()
          return null
        }
        if (!res.ok) throw new Error(`${res.status}`)
        return res.json() as Promise<MealHistory>
      })
      .then((data) => {
        if (data) loadHistory(data.meals)
      })
      .catch(console.error)
  }, [loadHistory, setUnauthenticated])
}
