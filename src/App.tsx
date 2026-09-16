import { useEffect } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { useAuthStore } from './store/authSlice'
import { LoginScreen } from './components/views/LoginScreen'

export function App() {
  const authState = useAuthStore((s) => s.state)
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated)
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated)

  useEffect(() => {
    fetch('/api/auth/check')
      .then((res) => {
        if (res.ok) setAuthenticated()
        else setUnauthenticated()
      })
      .catch(() => setUnauthenticated())
  }, [setAuthenticated, setUnauthenticated])

  if (authState === 'unknown') return null
  if (authState === 'unauthenticated') return <LoginScreen />
  return <RouterProvider router={router} />
}
