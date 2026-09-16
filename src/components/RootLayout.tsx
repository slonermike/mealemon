import { useEffect } from 'react'
import { Outlet, Link, useRouterState } from '@tanstack/react-router'
import { useRecipeStore } from '@/store/recipeSlice'
import { usePlanSync } from '@/hooks/usePlanSync'

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const atRecipes = pathname === '/' || pathname.startsWith('/recipes/')
  const atShopping = pathname === '/shopping'

  return (
    <nav style={navStyle}>
      <Link to={'/'} style={tabStyle(atRecipes)}>
        {'Recipes'}
      </Link>
      <Link to={'/shopping'} style={tabStyle(atShopping)}>
        {'Shopping'}
      </Link>
    </nav>
  )
}

export function RootLayout() {
  const load = useRecipeStore((s) => s.load)
  useEffect(() => {
    void load()
  }, [load])

  usePlanSync()

  return (
    <div style={{ paddingBottom: 56 }}>
      <Outlet />
      <BottomNav />
    </div>
  )
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: active ? 700 : 400,
    color: active ? '#2563eb' : '#6b7280',
    borderTop: active ? '2px solid #2563eb' : '2px solid transparent',
  }
}

const navStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  height: 56,
  background: '#fff',
  borderTop: '1px solid #e5e7eb',
  display: 'flex',
  zIndex: 50,
}
