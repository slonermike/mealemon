import { useEffect } from 'react'
import { Outlet, Link, useRouterState } from '@tanstack/react-router'
import { useRecipeStore } from '@/store/recipeSlice'
import { usePlanSync } from '@/hooks/usePlanSync'
import { usePlansSync } from '@/hooks/usePlansSync'
import { BasketIcon, BookIcon, CalendarIcon } from '@/components/ui/icons'
import { NAV_HEIGHT, color, tab, type TabKey } from '@/theme'

interface NavItem {
  key: TabKey
  to: '/' | '/shopping' | '/plans'
  label: string
  active: boolean
  icon: React.ReactNode
}

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const items: NavItem[] = [
    {
      key: 'recipes',
      to: '/',
      label: 'Recipes',
      active: pathname === '/' || pathname.startsWith('/recipes/'),
      icon: <BookIcon size={22} />,
    },
    {
      key: 'shopping',
      to: '/shopping',
      label: 'Shopping',
      active: pathname === '/shopping',
      icon: <BasketIcon size={22} />,
    },
    {
      key: 'plans',
      to: '/plans',
      label: 'Plans',
      active: pathname === '/plans' || pathname.startsWith('/plans/'),
      icon: <CalendarIcon size={22} />,
    },
  ]

  return (
    <nav aria-label={'Main'} style={navStyle}>
      <div style={navInnerStyle}>
        {items.map((item) => (
          <Link
            key={item.key}
            to={item.to}
            aria-current={item.active ? 'page' : undefined}
            style={tabStyle(item.key, item.active)}
          >
            <span style={pillStyle(item.key, item.active)}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

export function RootLayout() {
  const load = useRecipeStore((s) => s.load)
  useEffect(() => {
    void load()
  }, [load])

  usePlansSync()
  usePlanSync()

  return (
    <div style={{ paddingBottom: NAV_HEIGHT }}>
      <Outlet />
      <BottomNav />
    </div>
  )
}

function tabStyle(key: TabKey, active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    color: active ? tab[key].accent : color.muted,
  }
}

function pillStyle(key: TabKey, active: boolean): React.CSSProperties {
  return {
    width: 60,
    height: 32,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: active ? tab[key].tint : 'transparent',
  }
}

const navStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  height: NAV_HEIGHT,
  boxSizing: 'border-box',
  background: color.surface,
  borderTop: `1px solid ${color.line}`,
  padding: '6px 8px 10px',
  zIndex: 50,
}

const navInnerStyle: React.CSSProperties = {
  maxWidth: 480,
  height: '100%',
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
}
