import { useNavigate } from '@tanstack/react-router'
import { usePlansStore } from '@/store/plansSlice'
import { useAuthStore } from '@/store/authSlice'
import type { Plan, PlanSummary } from '@/lib/schema'

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

  return (
    <div style={containerStyle}>
      <div style={headerRowStyle}>
        <h2 style={headingStyle}>{'Plans'}</h2>
        <button style={newButtonStyle} onClick={handleNewPlan}>
          {'+ New Plan'}
        </button>
      </div>

      {!indexLoaded ? (
        <p style={emptyStyle}>{'Loading…'}</p>
      ) : planIndex.length === 0 ? (
        <p style={emptyStyle}>{'No plans yet. Create one to get started.'}</p>
      ) : (
        <>
          {active.length > 0 && (
            <section style={sectionStyle}>
              <div style={sectionLabelStyle}>{'Active'}</div>
              {active.map((p) => (
                <PlanRow key={p.id} summary={p} onOpen={() => handleOpen(p)} />
              ))}
            </section>
          )}
          {done.length > 0 && (
            <section style={{ ...sectionStyle, marginTop: 24 }}>
              <div style={sectionLabelStyle}>{'Done'}</div>
              {done.map((p) => (
                <PlanRow key={p.id} summary={p} onOpen={() => handleOpen(p)} dimmed={true} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function PlanRow({
  summary,
  onOpen,
  dimmed,
}: {
  summary: PlanSummary
  onOpen: () => void
  dimmed?: boolean
}) {
  const date = new Date(summary.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <button style={{ ...rowStyle, opacity: dimmed ? 0.55 : 1 }} onClick={onOpen}>
      <div style={rowMainStyle}>
        <span style={rowLabelStyle}>{summary.label}</span>
        <span style={rowMetaStyle}>
          {summary.recipe_count} {summary.recipe_count === 1 ? 'recipe' : 'recipes'}
          {' · '}
          {date}
        </span>
      </div>
      <span style={statusBadgeStyle(summary.status)}>{STATUS_LABEL[summary.status]}</span>
    </button>
  )
}

const STATUS_LABEL: Record<string, string> = {
  planning: 'Planning',
  shopping: 'Shopping',
  done: 'Done',
}

function statusBadgeStyle(status: string): React.CSSProperties {
  const colors: Record<string, { bg: string; color: string }> = {
    planning: { bg: '#dbeafe', color: '#1e40af' },
    shopping: { bg: '#d1fae5', color: '#065f46' },
    done: { bg: '#f3f4f6', color: '#6b7280' },
  }
  const c = colors[status] ?? colors.planning
  return {
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 10,
    background: c.bg,
    color: c.color,
    whiteSpace: 'nowrap',
  }
}

const containerStyle: React.CSSProperties = { padding: '16px 16px 0' }

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 20,
}

const headingStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, margin: 0 }

const newButtonStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  padding: '6px 14px',
  borderRadius: 8,
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  cursor: 'pointer',
}

const emptyStyle: React.CSSProperties = { color: '#6b7280', fontSize: 14 }

const sectionStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 }

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#6b7280',
  marginBottom: 4,
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: '#fff',
  cursor: 'pointer',
  width: '100%',
  textAlign: 'left',
}

const rowMainStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2 }

const rowLabelStyle: React.CSSProperties = { fontSize: 15, fontWeight: 500, color: '#111827' }

const rowMetaStyle: React.CSSProperties = { fontSize: 12, color: '#9ca3af' }
