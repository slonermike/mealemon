import { usePlanStore, selectHasUnshopped } from '@/store/planSlice'
import { useMealsStore } from '@/store/mealsSlice'
import { useRecipeStore } from '@/store/recipeSlice'
import { useMealsSync } from '@/hooks/useMealsSync'
import { useAuthStore } from '@/store/authSlice'
import type { MealRecord, PlanSelection } from '@/lib/schema'

export function MealsView() {
  useMealsSync()

  const selected = usePlanStore((s) => s.selected)
  const markAllShopped = usePlanStore((s) => s.markAllShopped)
  const completeMealLocal = usePlanStore((s) => s.completeMeal)
  const hasUnshopped = usePlanStore(selectHasUnshopped)
  const addRecord = useMealsStore((s) => s.addRecord)
  const meals = useMealsStore((s) => s.meals)
  const recipes = useRecipeStore((s) => s.recipes)
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated)

  function recipeName(recipe_id: string) {
    return recipes[recipe_id]?.title ?? recipe_id
  }

  async function handleComplete(sel: PlanSelection) {
    const res = await fetch('/api/meals/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipe_id: sel.recipe_id }),
    })
    if (res.status === 401) {
      setUnauthenticated()
      return
    }
    if (!res.ok) return
    const { record } = (await res.json()) as { record: MealRecord }
    completeMealLocal(sel.recipe_id)
    addRecord(record)
  }

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>{'Meals'}</h2>

      {selected.length === 0 ? (
        <p style={emptyStyle}>{'No active meals. Add recipes from the Recipes tab.'}</p>
      ) : (
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span style={sectionLabelStyle}>{'Active'}</span>
            {hasUnshopped && (
              <button style={shopButtonStyle} onClick={markAllShopped}>
                {'Mark all shopped'}
              </button>
            )}
          </div>
          {selected.map((sel) => (
            <ActiveMealRow
              key={sel.recipe_id}
              sel={sel}
              name={recipeName(sel.recipe_id)}
              onComplete={() => handleComplete(sel)}
            />
          ))}
        </section>
      )}

      {meals.length > 0 && (
        <section style={{ ...sectionStyle, marginTop: 32 }}>
          <div style={sectionHeaderStyle}>
            <span style={sectionLabelStyle}>{'History'}</span>
          </div>
          {meals.map((meal) => (
            <HistoryMealRow key={meal.id} meal={meal} name={recipeName(meal.recipe_id)} />
          ))}
        </section>
      )}
    </div>
  )
}

function ActiveMealRow({
  sel,
  name,
  onComplete,
}: {
  sel: PlanSelection
  name: string
  onComplete: () => void
}) {
  return (
    <div style={rowStyle}>
      <div style={rowMainStyle}>
        <span style={rowNameStyle}>{name}</span>
        <span style={sel.shopped ? shoppedBadgeStyle : unshoppedBadgeStyle}>
          {sel.shopped ? 'Shopped' : 'Not shopped'}
        </span>
      </div>
      <button style={completeButtonStyle} onClick={onComplete}>
        {'Complete'}
      </button>
    </div>
  )
}

function HistoryMealRow({ meal, name }: { meal: MealRecord; name: string }) {
  const date = new Date(meal.completed_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return (
    <div style={{ ...rowStyle, opacity: 0.6 }}>
      <div style={rowMainStyle}>
        <span style={rowNameStyle}>{name}</span>
        <span style={historyDateStyle}>{date}</span>
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  padding: '16px 16px 0',
}

const headingStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  margin: '0 0 20px',
}

const emptyStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: 14,
}

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 4,
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#6b7280',
}

const shopButtonStyle: React.CSSProperties = {
  fontSize: 13,
  padding: '4px 10px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  background: '#f9fafb',
  cursor: 'pointer',
  color: '#374151',
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  background: '#fff',
}

const rowMainStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}

const rowNameStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 500,
}

const unshoppedBadgeStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#92400e',
  background: '#fef3c7',
  borderRadius: 4,
  padding: '1px 6px',
  width: 'fit-content',
}

const shoppedBadgeStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#065f46',
  background: '#d1fae5',
  borderRadius: 4,
  padding: '1px 6px',
  width: 'fit-content',
}

const historyDateStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#9ca3af',
}

const completeButtonStyle: React.CSSProperties = {
  fontSize: 13,
  padding: '5px 12px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  background: '#f9fafb',
  cursor: 'pointer',
  color: '#374151',
  whiteSpace: 'nowrap',
}
