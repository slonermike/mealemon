import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { usePlansStore, selectIsCheckedOff } from '@/store/plansSlice'
import { useRecipeStore } from '@/store/recipeSlice'
import { useResolvedShoppingList, type ShoppingGroup } from '@/store/shoppingSelectors'
import { useSessionStore } from '@/store/sessionSlice'
import { useAuthStore } from '@/store/authSlice'
import { formatAmount } from '@/lib/units'
import type { CheckoffKey, ShoppingItem } from '@/lib/schema'

function ShoppingRow({ item }: { item: ShoppingItem }) {
  const registry = useRecipeStore((s) => s.registry)
  const activePlanId = usePlansStore((s) => s.activePlanId)
  const toggleCheckoff = usePlansStore((s) => s.toggleCheckoff)

  const combinedKey: CheckoffKey = { ingredient_ref: item.ingredient_ref }
  const isCheckedSelector = useMemo(() => selectIsCheckedOff(combinedKey), [item.ingredient_ref]) // eslint-disable-line react-hooks/exhaustive-deps
  const checked = usePlansStore(isCheckedSelector)

  function toggle(key: CheckoffKey) {
    toggleCheckoff(key)
    if (!activePlanId) return
    fetch(`/api/plans/${activePlanId}/checkoff`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...key, checked: !checked }),
    }).catch(() => toggleCheckoff(key))
  }

  const name = registry[item.ingredient_ref]?.name ?? item.ingredient_ref
  const amt = formatAmount(item.combined.amount)
  const unit = item.combined.unit !== 'count' ? item.combined.unit : ''

  return (
    <li style={checked ? { ...rowStyle, ...rowCheckedStyle } : rowStyle}>
      <button
        type={'button'}
        onClick={() => toggle(combinedKey)}
        style={checkboxStyle(checked)}
        aria-label={checked ? `Uncheck ${name}` : `Check ${name}`}
      >
        {checked && <span style={checkmarkStyle}>{'✓'}</span>}
      </button>
      <span style={amountStyle}>
        {amt}
        {amt && unit ? ` ${unit}` : unit}
      </span>
      <span style={checked ? { ...nameStyle, ...nameCheckedStyle } : nameStyle}>{name}</span>
    </li>
  )
}

function ShoppingSection({ group }: { group: ShoppingGroup }) {
  return (
    <section>
      <div style={sectionHeaderStyle}>{group.label}</div>
      <ul style={listStyle}>
        {group.items.map((item) => (
          <ShoppingRow key={item.ingredient_ref} item={item} />
        ))}
      </ul>
    </section>
  )
}

export function ShoppingList() {
  const groups = useResolvedShoppingList()
  const activePlanId = usePlansStore((s) => s.activePlanId)
  const planStatus = usePlansStore((s) =>
    s.activePlanId ? s.plans[s.activePlanId]?.status : undefined,
  )
  const selected = usePlansStore(
    useShallow((s) => (s.activePlanId ? (s.plans[s.activePlanId]?.selected ?? []) : [])),
  )
  const setPlanStatus = usePlansStore((s) => s.setPlanStatus)
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated)
  const syncState = useSessionStore((s) => s.syncState)
  const lastSyncedAt = useSessionStore((s) => s.lastSyncedAt)

  async function handleStartShopping() {
    if (!activePlanId) return
    setPlanStatus(activePlanId, 'shopping')
    const res = await fetch(`/api/plans/${activePlanId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'shopping' }),
    })
    if (res.status === 401) setUnauthenticated()
  }

  if (selected.length === 0) {
    return (
      <div style={containerStyle}>
        <h1 style={headingStyle}>{'Shopping List'}</h1>
        <p style={{ padding: '24px 16px', color: '#6b7280' }}>
          {'No recipes in your plan yet. Add some from the Recipes tab.'}
        </p>
      </div>
    )
  }

  const syncLabel =
    syncState === 'syncing'
      ? 'Saving…'
      : syncState === 'error'
        ? 'Save failed'
        : lastSyncedAt
          ? `Saved ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : null

  const isPlanning = planStatus === 'planning'

  return (
    <div style={containerStyle}>
      <div style={headerRowStyle}>
        <h1 style={headingStyle}>{'Shopping List'}</h1>
        {syncLabel && (
          <span
            style={syncState === 'error' ? { ...syncLabelStyle, color: '#dc2626' } : syncLabelStyle}
          >
            {syncLabel}
          </span>
        )}
      </div>
      {isPlanning && (
        <div style={planningBannerStyle}>
          <span style={bannerTextStyle}>{'Not in shopping mode yet.'}</span>
          <button style={startShoppingButtonStyle} onClick={handleStartShopping}>
            {'Start Shopping'}
          </button>
        </div>
      )}
      <div style={isPlanning ? { opacity: 0.4, pointerEvents: 'none' } : undefined}>
        {groups.map((group) => (
          <ShoppingSection key={group.category} group={group} />
        ))}
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  maxWidth: 480,
  margin: '0 auto',
  paddingBottom: 32,
}

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  padding: '16px 16px 8px',
}

const headingStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
}

const syncLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#9ca3af',
}

const planningBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  margin: '0 16px 8px',
  padding: '10px 14px',
  borderRadius: 10,
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
}

const bannerTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#1e40af',
}

const startShoppingButtonStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  padding: '6px 14px',
  borderRadius: 8,
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const sectionHeaderStyle: React.CSSProperties = {
  padding: '8px 16px 4px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#6b7280',
  background: '#f9fafb',
  borderBottom: '1px solid #f3f4f6',
}

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  gap: 12,
  borderBottom: '1px solid #f3f4f6',
}

const rowCheckedStyle: React.CSSProperties = {
  background: '#f9fafb',
}

const nameStyle: React.CSSProperties = {
  flex: 1,
  fontSize: 15,
}

const nameCheckedStyle: React.CSSProperties = {
  color: '#9ca3af',
  textDecoration: 'line-through',
}

const amountStyle: React.CSSProperties = {
  minWidth: 56,
  fontSize: 14,
  color: '#6b7280',
  textAlign: 'right',
  flexShrink: 0,
}

function checkboxStyle(checked: boolean): React.CSSProperties {
  return {
    width: 24,
    height: 24,
    borderRadius: 6,
    border: `2px solid ${checked ? '#2563eb' : '#d1d5db'}`,
    background: checked ? '#2563eb' : '#fff',
    flexShrink: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  }
}

const checkmarkStyle: React.CSSProperties = {
  color: '#fff',
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1,
}
