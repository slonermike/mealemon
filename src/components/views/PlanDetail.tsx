import { useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { usePlansStore, selectActivePlan } from '@/store/plansSlice'
import { useRecipeStore } from '@/store/recipeSlice'
import { useAuthStore } from '@/store/authSlice'
import type { Plan, PlanStatus } from '@/lib/schema'

export function PlanDetail() {
  const { planId } = useParams({ from: '/plans/$planId' })
  const setActivePlan = usePlansStore((s) => s.setActivePlan)
  const activePlan = usePlansStore(selectActivePlan)
  const setPlanStatus = usePlansStore((s) => s.setPlanStatus)
  const toggleRecipe = usePlansStore((s) => s.toggleRecipe)
  const deletePlan = usePlansStore((s) => s.deletePlan)
  const recipes = useRecipeStore((s) => s.recipes)
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated)
  const navigate = useNavigate()

  useEffect(() => {
    setActivePlan(planId)
  }, [planId, setActivePlan])

  const plan = activePlan?.id === planId ? activePlan : null

  if (!plan) {
    return (
      <div style={containerStyle}>
        <p style={emptyStyle}>{'Loading…'}</p>
      </div>
    )
  }

  async function handleMarkDone() {
    setPlanStatus(plan!.id, 'done')
    const updated: Plan = { ...plan!, status: 'done' }
    await fetch(`/api/plans/${plan!.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(() => {})
  }

  async function handleDelete() {
    const res = await fetch(`/api/plans/${plan!.id}`, { method: 'DELETE' })
    if (res.status === 401) {
      setUnauthenticated()
      return
    }
    if (!res.ok) return
    deletePlan(plan!.id)
    void navigate({ to: '/plans' })
  }

  return (
    <div style={containerStyle}>
      <button style={backLinkStyle} onClick={() => void navigate({ to: '/plans' })}>
        {'← Plans'}
      </button>

      <div style={headerRowStyle}>
        <h2 style={headingStyle}>{plan.label}</h2>
        <span style={statusBadgeStyle(plan.status)}>{plan.status}</span>
      </div>

      <div style={actionsRowStyle}>
        {plan.status === 'shopping' && (
          <button style={primaryButtonStyle} onClick={() => handleMarkDone()}>
            {'Mark Done'}
          </button>
        )}
        {(plan.status === 'planning' || plan.status === 'shopping') && (
          <button style={shoppingLinkStyle} onClick={() => void navigate({ to: '/shopping' })}>
            {'Shopping List →'}
          </button>
        )}
      </div>

      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>
          {'Recipes'}{' '}
          <span style={countStyle}>
            {'('}
            {plan.selected.length}
            {')'}
          </span>
        </div>
        {plan.selected.length === 0 ? (
          <p style={emptyStyle}>{'No recipes yet. Add some from the Recipes tab.'}</p>
        ) : (
          plan.selected.map((sel) => {
            const recipe = recipes[sel.recipe_id]
            const name = recipe?.title ?? sel.recipe_id
            return (
              <div key={sel.recipe_id} style={recipeRowStyle}>
                <div style={recipeInfoStyle}>
                  <span style={recipeNameStyle}>{name}</span>
                  <span style={recipeMetaStyle}>
                    {sel.servings} {sel.servings === 1 ? 'serving' : 'servings'}
                    {sel.shopped ? ' · shopped' : ''}
                  </span>
                </div>
                {plan.status !== 'done' && (
                  <button
                    style={removeButtonStyle}
                    onClick={() => toggleRecipe(sel.recipe_id)}
                    aria-label={`Remove ${name}`}
                  >
                    {'✕'}
                  </button>
                )}
              </div>
            )
          })
        )}
      </section>

      {plan.status === 'done' && (
        <button style={deleteButtonStyle} onClick={handleDelete}>
          {'Delete plan'}
        </button>
      )}
    </div>
  )
}

function statusBadgeStyle(status: PlanStatus): React.CSSProperties {
  const colors: Record<PlanStatus, { bg: string; color: string }> = {
    planning: { bg: '#dbeafe', color: '#1e40af' },
    shopping: { bg: '#d1fae5', color: '#065f46' },
    done: { bg: '#f3f4f6', color: '#6b7280' },
  }
  const c = colors[status]
  return {
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 10,
    background: c.bg,
    color: c.color,
    textTransform: 'capitalize',
  }
}

const containerStyle: React.CSSProperties = { padding: '16px 16px 32px' }

const backLinkStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontSize: 14,
  color: '#2563eb',
  cursor: 'pointer',
  marginBottom: 16,
  display: 'block',
}

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
}

const headingStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, margin: 0 }

const actionsRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 24,
}

const primaryButtonStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  padding: '7px 16px',
  borderRadius: 8,
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  cursor: 'pointer',
}

const shoppingLinkStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#2563eb',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
}

const sectionStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 }

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#6b7280',
  marginBottom: 4,
}

const countStyle: React.CSSProperties = { fontWeight: 400, textTransform: 'none' }

const emptyStyle: React.CSSProperties = { color: '#6b7280', fontSize: 14, margin: 0 }

const recipeRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  background: '#fff',
}

const recipeInfoStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2 }

const recipeNameStyle: React.CSSProperties = { fontSize: 15, fontWeight: 500 }

const recipeMetaStyle: React.CSSProperties = { fontSize: 12, color: '#9ca3af' }

const removeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 16,
  color: '#9ca3af',
  cursor: 'pointer',
  padding: '4px 6px',
}

const deleteButtonStyle: React.CSSProperties = {
  marginTop: 32,
  fontSize: 13,
  color: '#dc2626',
  background: 'none',
  border: '1px solid #fca5a5',
  borderRadius: 8,
  padding: '6px 14px',
  cursor: 'pointer',
}
