import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { usePlansStore } from '@/store/plansSlice'
import { useAuthStore } from '@/store/authSlice'
import { RecipeListItem } from '@/components/views/RecipeList'
import { BasketIcon, CheckIcon, ChevronIcon, PencilIcon } from '@/components/ui/icons'
import { badgeBase, color, font, sectionLabelStyle, tab } from '@/theme'
import type { Plan, PlanStatus } from '@/lib/schema'

interface Props {
  plan: Plan
  collapsible?: boolean
}

export function PlanCard({ plan, collapsible = false }: Props) {
  const [expanded, setExpanded] = useState(!collapsible)
  const setPlanStatus = usePlansStore((s) => s.setPlanStatus)
  const deletePlan = usePlansStore((s) => s.deletePlan)
  const setActivePlan = usePlansStore((s) => s.setActivePlan)
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated)
  const navigate = useNavigate()

  const isActive = plan.status !== 'done'

  async function handleMarkDone() {
    setPlanStatus(plan.id, 'done')
    await fetch(`/api/plans/${plan.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...plan, status: 'done' }),
    }).catch(() => {})
  }

  async function handleDelete() {
    const res = await fetch(`/api/plans/${plan.id}`, { method: 'DELETE' })
    if (res.status === 401) {
      setUnauthenticated()
      return
    }
    if (!res.ok) return
    deletePlan(plan.id)
    void navigate({ to: '/plans' })
  }

  function handleHeaderClick() {
    if (!collapsible) return
    if (!expanded) setActivePlan(plan.id)
    setExpanded((e) => !e)
  }

  const cardStyle = isActive
    ? expanded
      ? expandedCardStyle
      : collapsedCardStyle
    : archivedCardStyle

  return (
    <div style={cardStyle}>
      <button
        type={'button'}
        style={headerButtonStyle}
        onClick={handleHeaderClick}
        aria-expanded={collapsible ? expanded : undefined}
      >
        <div style={headerMainStyle}>
          <span style={labelStyle}>{plan.label}</span>
          <span style={metaStyle}>
            {`${plan.selected.length} ${plan.selected.length === 1 ? 'recipe' : 'recipes'}`}
          </span>
        </div>
        <div style={headerRightStyle}>
          <StatusBadge status={plan.status} />
          {collapsible && (
            <span
              style={{ ...chevronStyle, transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              <ChevronIcon size={18} />
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div style={bodyStyle}>
          <div style={actionsRowStyle}>
            {plan.status === 'shopping' && (
              <button style={primaryButtonStyle} onClick={handleMarkDone}>
                <CheckIcon size={16} />
                {'Mark done'}
              </button>
            )}
            {isActive && (
              <button style={shoppingLinkStyle} onClick={() => void navigate({ to: '/shopping' })}>
                <BasketIcon size={16} />
                {'Shopping list'}
              </button>
            )}
            {plan.status === 'done' && (
              <button style={deleteButtonStyle} onClick={handleDelete}>
                {'Delete plan'}
              </button>
            )}
          </div>

          <section>
            <h3 style={sectionHeadStyle}>
              {'Recipes'}
              <span style={countStyle}>{` (${plan.selected.length})`}</span>
            </h3>
            {plan.selected.length === 0 ? (
              <p style={emptyStyle}>{'No recipes yet. Add some from the Recipes tab.'}</p>
            ) : (
              <ul style={recipeListStyle}>
                {plan.selected.map((sel) => (
                  <RecipeListItem key={sel.recipe_id} recipeId={sel.recipe_id} />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: PlanStatus }) {
  if (status === 'planning') {
    return (
      <span style={{ ...badgeBase, ...planningBadgeStyle }}>
        <PencilIcon size={14} />
        {'Planning'}
      </span>
    )
  }
  if (status === 'shopping') {
    return (
      <span style={{ ...badgeBase, ...shoppingBadgeStyle }}>
        <BasketIcon size={14} />
        {'Shopping'}
      </span>
    )
  }
  return (
    <span style={{ ...badgeBase, ...doneBadgeStyle }}>
      <CheckIcon size={14} />
      {'Done'}
    </span>
  )
}

const cardBase: React.CSSProperties = {
  borderRadius: 16,
  overflow: 'hidden',
  background: color.surface,
}

const collapsedCardStyle: React.CSSProperties = {
  ...cardBase,
  border: `1px solid ${color.line}`,
}

const expandedCardStyle: React.CSSProperties = {
  ...cardBase,
  border: `2px solid ${tab.plans.accent}`,
}

const archivedCardStyle: React.CSSProperties = {
  ...cardBase,
  border: `1px solid ${color.line}`,
}

const headerButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  width: '100%',
  padding: '14px 16px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
  color: color.ink,
  fontFamily: 'inherit',
  minHeight: 44,
  boxSizing: 'border-box',
}

const headerMainStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  minWidth: 0,
}

const headerRightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexShrink: 0,
}

const labelStyle: React.CSSProperties = {
  fontFamily: font.display,
  fontSize: 18,
  fontWeight: 600,
  lineHeight: 1.2,
}

const metaStyle: React.CSSProperties = {
  fontSize: 13,
  color: color.muted,
}

const chevronStyle: React.CSSProperties = {
  color: color.muted,
  display: 'flex',
  transition: 'transform 0.15s ease',
}

const bodyStyle: React.CSSProperties = {
  padding: '0 16px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const actionsRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
}

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 14,
  fontWeight: 600,
  padding: '8px 16px',
  borderRadius: 10,
  border: 'none',
  background: tab.plans.accent,
  color: '#FFFFFF',
  cursor: 'pointer',
  minHeight: 44,
}

const shoppingLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 14,
  fontWeight: 600,
  padding: '8px 16px',
  borderRadius: 10,
  border: `1px solid ${tab.plans.edge}`,
  background: tab.plans.panel,
  color: tab.plans.accent,
  cursor: 'pointer',
  minHeight: 44,
}

const deleteButtonStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#B42318',
  background: 'none',
  border: `1px solid #D9A39C`,
  borderRadius: 10,
  padding: '8px 14px',
  cursor: 'pointer',
  minHeight: 44,
}

const sectionHeadStyle: React.CSSProperties = {
  ...sectionLabelStyle,
  marginBottom: 8,
}

const countStyle: React.CSSProperties = { fontWeight: 400, textTransform: 'none' }

const emptyStyle: React.CSSProperties = { color: color.muted, fontSize: 14, margin: 0 }

const recipeListStyle: React.CSSProperties = { listStyle: 'none', padding: 0, margin: 0 }

const planningBadgeStyle: React.CSSProperties = {
  borderRadius: 999,
  background: color.surface,
  border: `1.5px solid ${tab.plans.accent}`,
  color: tab.plans.accent,
  whiteSpace: 'nowrap',
}

const shoppingBadgeStyle: React.CSSProperties = {
  borderRadius: 999,
  background: tab.shopping.accent,
  color: '#FFFFFF',
  whiteSpace: 'nowrap',
}

const doneBadgeStyle: React.CSSProperties = {
  color: color.muted,
  whiteSpace: 'nowrap',
}
