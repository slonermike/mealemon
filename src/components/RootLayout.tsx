import { useEffect } from 'react'
import { Outlet } from '@tanstack/react-router'
import { useRecipeStore } from '@/store/recipeSlice'

export function RootLayout() {
  const load = useRecipeStore((s) => s.load)
  useEffect(() => {
    void load()
  }, [load])
  return <Outlet />
}
