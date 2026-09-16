import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { MealPlanWidget } from '@/components/ui/MealPlanWidget'
import { useRecipeStore, selectAllRecipeIds, selectRecipeById } from '@/store/recipeSlice'
import { usePlanStore, selectIsRecipeSelected } from '@/store/planSlice'

function RecipeListItem({ recipeId }: { recipeId: string }) {
  const [expanded, setExpanded] = useState(false)

  const recipeSelector = useMemo(() => selectRecipeById(recipeId), [recipeId])
  const isSelectedSelector = useMemo(() => selectIsRecipeSelected(recipeId), [recipeId])

  const recipe = useRecipeStore(recipeSelector)
  const isSelected = usePlanStore(isSelectedSelector)

  if (!recipe) return null

  return (
    <li style={itemStyle}>
      <div style={rowStyle}>
        <button
          type={'button'}
          style={titleButtonStyle}
          onClick={() => {
            /* TODO: navigate to detail */
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 16 }}>{recipe.title}</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
            {recipe.base_servings}
            {' servings · '}
            {recipe.steps.length}
            {' steps'}
            {isSelected && <span style={inPlanBadgeStyle}>{'In plan'}</span>}
          </div>
        </button>
        <button
          type={'button'}
          onClick={() => setExpanded((e) => !e)}
          style={chevronButtonStyle}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          <span
            style={{
              display: 'inline-block',
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          >
            {'▾'}
          </span>
        </button>
      </div>
      {expanded && (
        <div style={expandedPanelStyle}>
          <MealPlanWidget recipeId={recipeId} baseServings={recipe.base_servings} />
        </div>
      )}
    </li>
  )
}

export function RecipeList() {
  const ids = useRecipeStore(useShallow(selectAllRecipeIds))
  const loadState = useRecipeStore((s) => s.loadState)

  if (loadState === 'idle' || loadState === 'loading') {
    return <p style={{ padding: 24 }}>{'Loading recipes…'}</p>
  }
  if (loadState === 'error') return <p style={{ padding: 24 }}>{'Failed to load recipes.'}</p>

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 0' }}>
      <h1 style={{ padding: '0 16px', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
        {'Recipes'}
      </h1>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {ids.map((id) => (
          <RecipeListItem key={id} recipeId={id} />
        ))}
      </ul>
    </div>
  )
}

const itemStyle: React.CSSProperties = {
  borderBottom: '1px solid #e5e7eb',
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  gap: 8,
}

const titleButtonStyle: React.CSSProperties = {
  flex: 1,
  background: 'none',
  border: 'none',
  padding: 0,
  textAlign: 'left',
  cursor: 'pointer',
}

const chevronButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 20,
  color: '#6b7280',
  cursor: 'pointer',
  padding: '4px 8px',
  flexShrink: 0,
}

const expandedPanelStyle: React.CSSProperties = {
  padding: '0 16px 16px',
  borderTop: '1px solid #f3f4f6',
  background: '#fafafa',
}

const inPlanBadgeStyle: React.CSSProperties = {
  marginLeft: 8,
  padding: '1px 6px',
  borderRadius: 4,
  background: '#dbeafe',
  color: '#1d4ed8',
  fontSize: 12,
  fontWeight: 600,
}
