import { useNavigate } from '@tanstack/react-router'
import { useShallow } from 'zustand/react/shallow'
import { usePlansStore } from '@/store/plansSlice'
import { useAuthStore } from '@/store/authSlice'
import { PlanCard } from '@/components/ui/PlanCard'
import { TabHeader } from '@/components/ui/TabHeader'
import { BasketIcon, CheckIcon, ChevronIcon, PencilIcon, PlusIcon } from '@/components/ui/icons'
import { badgeBase, color, sectionLabelStyle, tab } from '@/theme'
import type { Plan, PlanStatus, PlanSummary } from '@/lib/schema'

export function PlansView() {
  const planIndex = usePlansStore(useShallow((s) => s.planIndex))
  const plans = usePlansStore(useShallow((s) => s.plans))
  const indexLoaded = usePlansStore((s) => s.indexLoaded)
  const createPlan = usePlansStore((s) => s.createPlan)
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated)
  const navigate = useNavigate()

  const active = planIndex.filter((p) => p.status !== 'done')
  const done = planIndex.filter((p) => p.status === 'done')

  async function handleNewPlan() {
    const res = await fetch('/api/plans', { method: 'POST' })
    if (res.status === 401) {
      setUnauthenticated()
      return
    }
    if (!res.ok) return
    const plan = (await res.json()) as Plan
    createPlan(plan)
  }

  return (
    <>
      <TabHeader
        tab={'plans'}
        eyebrow={'Meal plans'}
        title={'Plans'}
        action={
          <button style={newButtonStyle} onClick={handleNewPlan}>
            <PlusIcon size={18} />
            {'New plan'}
          </button>
        }
      />
      <main style={containerStyle}>
        {!indexLoaded ? (
          <p style={emptyStyle}>{'Loading…'}</p>
        ) : planIndex.length === 0 ? (
          <p style={emptyStyle}>{'No plans yet. Create one to get started.'}</p>
        ) : (
          <>
            {active.length > 0 && (
              <section style={sectionStyle}>
                <h2 style={{ ...sectionLabelStyle, color: tab.plans.accent }}>{'In progress'}</h2>
                {active.map((summary) => {
                  const plan = plans[summary.id]
                  return plan ? (
                    <PlanCard key={summary.id} plan={plan} collapsible={true} />
                  ) : (
                    <PlanCardSkeleton key={summary.id} summary={summary} />
                  )
                })}
              </section>
            )}
            {done.length > 0 && (
              <section style={{ ...sectionStyle, marginTop: 24 }}>
                <h2 style={{ ...sectionLabelStyle, color: color.muted }}>{'Done'}</h2>
                <ul style={doneListStyle}>
                  {done.map((p, i) => (
                    <li key={p.id} style={i === 0 ? undefined : doneItemStyle}>
                      <DoneRow
                        summary={p}
                        onOpen={() =>
                          void navigate({ to: '/plans/$planId', params: { planId: p.id } })
                        }
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </>
  )
}

function PlanCardSkeleton({ summary }: { summary: PlanSummary }) {
  const setActivePlan = usePlansStore((s) => s.setActivePlan)
  return (
    <div style={skeletonStyle}>
      <button type={'button'} style={skeletonButtonStyle} onClick={() => setActivePlan(summary.id)}>
        <span style={skeletonLabelStyle}>{summary.label}</span>
        <StatusBadge status={summary.status} />
      </button>
    </div>
  )
}

function DoneRow({ summary, onOpen }: { summary: PlanSummary; onOpen: () => void }) {
  const date = new Date(summary.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const recipes = `${summary.recipe_count} ${summary.recipe_count === 1 ? 'recipe' : 'recipes'}`

  return (
    <button style={doneRowStyle} onClick={onOpen}>
      <span style={doneMainStyle}>
        <span style={doneLabelStyle}>{summary.label}</span>
        <span style={doneMetaStyle}>
          {recipes}
          {' · '}
          {date}
        </span>
      </span>
      <span style={doneRightStyle}>
        <StatusBadge status={summary.status} />
        <ChevronIcon size={18} />
      </span>
    </button>
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

const containerStyle: React.CSSProperties = {
  maxWidth: 480,
  margin: '0 auto',
  padding: '20px 16px 32px',
}

const newButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  minHeight: 44,
  padding: '0 16px 0 12px',
  borderRadius: 22,
  border: 'none',
  background: tab.plans.accent,
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
}

const emptyStyle: React.CSSProperties = { color: color.muted, fontSize: 16 }

const sectionStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 }

const doneListStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  background: color.surface,
  border: `1px solid ${color.line}`,
  borderRadius: 16,
  overflow: 'hidden',
}

const doneItemStyle: React.CSSProperties = { borderTop: `1px solid ${color.lineSoft}` }

const doneRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  width: '100%',
  padding: '12px 16px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
  color: color.ink,
  fontFamily: 'inherit',
  minHeight: 44,
  boxSizing: 'border-box',
}

const doneMainStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 3 }
const doneLabelStyle: React.CSSProperties = { fontSize: 16, fontWeight: 500 }
const doneMetaStyle: React.CSSProperties = { fontSize: 13, color: color.muted }
const doneRightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  color: color.muted,
  flexShrink: 0,
}

const skeletonStyle: React.CSSProperties = {
  borderRadius: 16,
  border: `1px solid ${color.line}`,
  background: color.surface,
  overflow: 'hidden',
}

const skeletonButtonStyle: React.CSSProperties = {
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

const skeletonLabelStyle: React.CSSProperties = { fontSize: 18, fontWeight: 600 }

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
