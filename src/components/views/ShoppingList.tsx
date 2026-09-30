import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { usePlansStore, selectIsCheckedOff, selectActivePlan } from '@/store/plansSlice'
import { useRecipeStore } from '@/store/recipeSlice'
import { useResolvedShoppingList, type ShoppingGroup } from '@/store/shoppingSelectors'
import { useSessionStore } from '@/store/sessionSlice'
import { useAuthStore } from '@/store/authSlice'
import { formatAmount } from '@/lib/units'
import type { CheckoffKey, ShoppingItem } from '@/lib/schema'
import { TabHeader } from '@/components/ui/TabHeader'
import { CheckIcon, CloudCheckIcon } from '@/components/ui/icons'
import { color, status, tab } from '@/theme'

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
      <label style={rowLabelStyle}>
        <input
          type={'checkbox'}
          checked={checked}
          onChange={() => toggle(combinedKey)}
          style={checkboxInputStyle}
        />
        <span aria-hidden={true} style={checkboxStyle(checked)}>
          {checked && <CheckIcon size={14} />}
        </span>
        <span style={checked ? { ...nameStyle, ...nameCheckedStyle } : nameStyle}>{name}</span>
        <span style={amountStyle}>
          {amt}
          {amt && unit ? ` ${unit}` : unit}
        </span>
      </label>
    </li>
  )
}

function ShoppingSection({ group }: { group: ShoppingGroup }) {
  return (
    <section>
      <h2 style={sectionHeaderStyle}>{group.label}</h2>
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

  const checkedOff = usePlansStore(useShallow((s) => selectActivePlan(s)?.checked_off ?? []))
  const planLabel = usePlansStore((s) =>
    s.activePlanId ? s.planIndex.find((p) => p.id === s.activePlanId)?.label : undefined,
  )

  if (selected.length === 0) {
    return (
      <>
        <TabHeader tab={'shopping'} eyebrow={planLabel ?? 'Shopping list'} title={'Shopping'} />
        <main style={containerStyle}>
          <p style={{ padding: '24px 16px', color: color.muted, fontSize: 16 }}>
            {'No recipes in your plan yet. Add some from the Recipes tab.'}
          </p>
        </main>
      </>
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

  const allItems = groups.flatMap((g) => g.items)
  const total = allItems.length
  const done = allItems.filter((item) =>
    checkedOff.some((k) => k.ingredient_ref === item.ingredient_ref && k.recipe_id === undefined),
  ).length
  const left = total - done

  return (
    <>
      <TabHeader
        tab={'shopping'}
        eyebrow={planLabel ?? 'Shopping list'}
        title={'Shopping'}
        action={
          syncLabel ? (
            <span
              role={'status'}
              style={
                syncState === 'error'
                  ? { ...syncLabelStyle, color: status.danger.fg }
                  : syncLabelStyle
              }
            >
              <CloudCheckIcon size={16} />
              {syncLabel}
            </span>
          ) : undefined
        }
      >
        {(compact) =>
          total > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {!compact && (
                <div style={progressTextStyle}>
                  <span>
                    <strong style={{ color: color.ink }}>{`${done} of ${total}`}</strong>
                    {' in cart'}
                  </span>
                  <span>{left === 0 ? 'All done' : `${left} to go`}</span>
                </div>
              )}
              <div
                role={'progressbar'}
                aria-label={'Items in cart'}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={done}
                aria-valuetext={`${done} of ${total} in cart`}
                style={trackStyle}
              >
                <div
                  style={{
                    height: '100%',
                    background: tab.shopping.accent,
                    width: `${(done / total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )
        }
      </TabHeader>
      <main style={containerStyle}>
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
      </main>
    </>
  )
}

const containerStyle: React.CSSProperties = {
  maxWidth: 480,
  margin: '0 auto',
  padding: '8px 16px 32px',
}

const syncLabelStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 13,
  fontWeight: 500,
  color: '#2E4A60',
  paddingBottom: 6,
}

const progressTextStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 14,
  color: '#2E4A60',
}

const trackStyle: React.CSSProperties = {
  height: 8,
  borderRadius: 4,
  background: color.surface,
  border: `1px solid ${tab.shopping.edge}`,
  overflow: 'hidden',
}

const planningBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  margin: '8px 0',
  padding: '10px 14px',
  borderRadius: 14,
  background: tab.shopping.tint,
  border: `1px solid ${tab.shopping.edge}`,
}

const bannerTextStyle: React.CSSProperties = {
  fontSize: 15,
  color: tab.shopping.dark,
}

const startShoppingButtonStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  minHeight: 44,
  padding: '0 16px',
  borderRadius: 12,
  border: 'none',
  background: tab.shopping.accent,
  color: '#FFFFFF',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const sectionHeaderStyle: React.CSSProperties = {
  margin: 0,
  padding: '14px 4px 6px',
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: tab.shopping.accent,
}

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  background: color.surface,
  border: `1px solid ${color.line}`,
  borderRadius: 14,
  overflow: 'hidden',
}

const rowStyle: React.CSSProperties = {
  borderBottom: `1px solid ${color.lineSoft}`,
}

const rowCheckedStyle: React.CSSProperties = {
  background: tab.shopping.panel,
}

const rowLabelStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minHeight: 48,
  padding: '0 14px',
  cursor: 'pointer',
}

// Real checkbox stays in the tab order and accessibility tree; the box beside it is decoration.
const checkboxInputStyle: React.CSSProperties = {
  position: 'absolute',
  left: 14,
  width: 24,
  height: 24,
  margin: 0,
  opacity: 0,
  cursor: 'pointer',
}

const nameStyle: React.CSSProperties = {
  flex: 1,
  fontSize: 16,
  fontWeight: 500,
  color: color.ink,
}

const nameCheckedStyle: React.CSSProperties = {
  fontWeight: 400,
  color: color.muted,
  textDecoration: 'line-through',
  textDecorationThickness: 1.5,
}

const amountStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  color: color.muted,
  whiteSpace: 'nowrap',
}

function checkboxStyle(checked: boolean): React.CSSProperties {
  return {
    width: 24,
    height: 24,
    borderRadius: 7,
    border: `2px solid ${checked ? tab.shopping.accent : color.control}`,
    background: checked ? tab.shopping.accent : color.surface,
    color: '#FFFFFF',
    flexShrink: 0,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}
