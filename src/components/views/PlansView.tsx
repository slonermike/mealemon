import { useNavigate } from '@tanstack/react-router'
import { usePlansStore } from '@/store/plansSlice'
import { useAuthStore } from '@/store/authSlice'
import type { Plan, PlanStatus, PlanSummary } from '@/lib/schema'
import { TabHeader } from '@/components/ui/TabHeader'
import { BasketIcon, CheckIcon, ChevronIcon, PencilIcon, PlusIcon } from '@/components/ui/icons'
import { badgeBase, color, font, sectionLabelStyle, tab } from '@/theme'

export function PlansView() {
  const planIndex = usePlansStore((s) => s.planIndex)
  const indexLoaded = usePlansStore((s) => s.indexLoaded)
  const createPlan = usePlansStore((s) => s.createPlan)
  const setActivePlan = usePlansStore((s) => s.setActivePlan)
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
    void navigate({ to: '/plans/$planId', params: { planId: plan.id } })
  }

  function handleOpen(summary: PlanSummary) {
    setActivePlan(summary.id)
    void navigate({ to: '/plans/$planId', params: { planId: summary.id } })
  }

  const shopping = active.filter((p) => p.status === 'shopping')
  const planning = active.filter((p) => p.status !== 'shopping')

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
                <h2 style={sectionLabelStyle_(tab.plans.accent)}>{'In progress'}</h2>
                {shopping.map((p) => (
                  <PlanRow key={p.id} summary={p} onOpen={() => handleOpen(p)} featured={true} />
                ))}
                {planning.map((p) => (
                  <PlanRow key={p.id} summary={p} onOpen={() => handleOpen(p)} />
                ))}
              </section>
            )}
            {done.length > 0 && (
              <section style={{ ...sectionStyle, marginTop: 24 }}>
                <h2 style={sectionLabelStyle_(color.muted)}>{'Done'}</h2>
                <ul style={doneListStyle}>
                  {done.map((p, i) => (
                    <li key={p.id} style={i === 0 ? undefined : doneItemStyle}>
                      <PlanRow summary={p} onOpen={() => handleOpen(p)} compact={true} />
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

function PlanRow({
  summary,
  onOpen,
  featured,
  compact,
}: {
  summary: PlanSummary
  onOpen: () => void
  featured?: boolean
  compact?: boolean
}) {
  const date = new Date(summary.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const recipes = `${summary.recipe_count} ${summary.recipe_count === 1 ? 'recipe' : 'recipes'}`

  const style = compact ? compactRowStyle : featured ? featuredRowStyle : rowStyle

  return (
    <button style={style} onClick={onOpen}>
      <span style={rowMainStyle}>
        <span style={featured ? featuredLabelStyle : compact ? compactLabelStyle : rowLabelStyle}>
          {summary.label}
        </span>
        <span style={rowMetaStyle}>
          {recipes}
          {' · '}
          {date}
        </span>
        {featured && (
          <span style={continueStyle}>
            {'Continue shopping'}
            <ChevronIcon size={18} />
          </span>
        )}
      </span>
      <StatusBadge status={summary.status} />
    </button>
  )
}

const STATUS_LABEL: Record<PlanStatus, string> = {
  planning: 'Planning',
  shopping: 'Shopping',
  done: 'Done',
}

// Every status has an icon, a word and a distinct fill/outline — never color alone.
function StatusBadge({ status }: { status: PlanStatus }) {
  const label = STATUS_LABEL[status]
  if (status === 'planning') {
    return (
      <span style={{ ...badgeBase, ...planningBadgeStyle }}>
        <PencilIcon size={14} />
        {label}
      </span>
    )
  }
  if (status === 'shopping') {
    return (
      <span style={{ ...badgeBase, ...shoppingBadgeStyle }}>
        <BasketIcon size={14} />
        {label}
      </span>
    )
  }
  return (
    <span style={{ ...badgeBase, ...doneBadgeStyle }}>
      <CheckIcon size={14} />
      {label}
    </span>
  )
}

function sectionLabelStyle_(c: string): React.CSSProperties {
  return { ...sectionLabelStyle, color: c }
}

const planningBadgeStyle: React.CSSProperties = {
  borderRadius: 999,
  background: color.surface,
  border: `1.5px solid ${tab.plans.accent}`,
  padding: '2px 10px 2px 8px',
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

const rowBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  width: '100%',
  minHeight: 44,
  boxSizing: 'border-box',
  cursor: 'pointer',
  textAlign: 'left',
  color: color.ink,
  fontFamily: 'inherit',
}

const rowStyle: React.CSSProperties = {
  ...rowBase,
  alignItems: 'center',
  padding: '14px 16px',
  borderRadius: 16,
  border: `1px solid ${color.line}`,
  background: color.surface,
}

const featuredRowStyle: React.CSSProperties = {
  ...rowBase,
  padding: 18,
  borderRadius: 18,
  border: `2px solid ${tab.plans.accent}`,
  background: color.surface,
}

const compactRowStyle: React.CSSProperties = {
  ...rowBase,
  alignItems: 'center',
  padding: '12px 16px',
  border: 'none',
  background: 'none',
}

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

const rowMainStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 }

const rowLabelStyle: React.CSSProperties = { fontSize: 17, fontWeight: 600 }

const featuredLabelStyle: React.CSSProperties = {
  fontFamily: font.display,
  fontSize: 22,
  fontWeight: 600,
}

const compactLabelStyle: React.CSSProperties = { fontSize: 16, fontWeight: 500 }

const rowMetaStyle: React.CSSProperties = { fontSize: 14, color: color.muted }

const continueStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  marginTop: 10,
  fontSize: 15,
  fontWeight: 600,
  color: tab.plans.accent,
}
