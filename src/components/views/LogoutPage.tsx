import { useEffect } from 'react'
import { useAuthStore } from '@/store/authSlice'

export function LogoutPage() {
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated)
  useEffect(() => {
    void fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      window.location.replace('/')
    })
  }, [setUnauthenticated])
  return null
}
