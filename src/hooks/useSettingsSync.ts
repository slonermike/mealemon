import { useEffect, useRef } from 'react'
import { useSettingsStore } from '@/store/settingsSlice'
import { useAuthStore } from '@/store/authSlice'
import type { GlobalSettings } from '@/lib/schema'

const DEBOUNCE_MS = 1000
const SCHEMA_VERSION = 1

export function useSettingsSync() {
  const { default_servings, active_modes, settingsLoaded, loadSettings } = useSettingsStore()
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => {
        if (res.status === 401) {
          setUnauthenticated()
          return null
        }
        if (!res.ok) throw new Error(`${res.status}`)
        return res.json() as Promise<GlobalSettings>
      })
      .then((data) => {
        if (data) {
          loadSettings(data)
          lastSavedRef.current = JSON.stringify(data)
        } else {
          loadSettings({ schema_version: SCHEMA_VERSION, default_servings: 4, active_modes: [] })
        }
      })
      .catch(console.error)
  }, [loadSettings, setUnauthenticated])

  useEffect(() => {
    if (!settingsLoaded) return
    const payload: GlobalSettings = {
      schema_version: SCHEMA_VERSION,
      default_servings,
      active_modes,
    }
    const serialized = JSON.stringify(payload)
    if (serialized === lastSavedRef.current) return

    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      fetch('/api/settings', {
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
        })
        .catch(console.error)
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [default_servings, active_modes, settingsLoaded, setUnauthenticated])
}
