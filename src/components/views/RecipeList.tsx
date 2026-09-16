import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Link } from '@tanstack/react-router'
import { MealPlanWidget } from '@/components/ui/MealPlanWidget'
import { GlobalSettingsWidget } from '@/components/ui/GlobalSettingsWidget'
import {
  useRecipeStore,
  selectAllRecipeIds,
  selectRecipeById,
  selectRecipeAllergenTags,
} from '@/store/recipeSlice'
import {
  usePlanStore,
  selectIsRecipeSelected,
  selectServings,
  selectRecipeModes,
} from '@/store/planSlice'
import { getIncompatibleSlots } from '@/lib/pipeline'

function RecipeListItem({ recipeId }: { recipeId: string }) {
  const [expanded, setExpanded] = useState(false)

  const recipeSelector = useMemo(() => selectRecipeById(recipeId), [recipeId])
  const isSelectedSelector = useMemo(() => selectIsRecipeSelected(recipeId), [recipeId])
  const servingsSelector = useMemo(() => selectServings(recipeId), [recipeId])
  const recipeModesSelector = useMemo(() => selectRecipeModes(recipeId), [recipeId])
  const allergenTagsSelector = useMemo(() => selectRecipeAllergenTags(recipeId), [recipeId])

  const recipe = useRecipeStore(recipeSelector)
  const registry = useRecipeStore((s) => s.registry)
  const recipeTags = useRecipeStore(useShallow(allergenTagsSelector))
  const isSelected = usePlanStore(isSelectedSelector)
  const servings = usePlanStore(servingsSelector)
  const recipeModesOverride = usePlanStore(recipeModesSelector)
  const globalModes = usePlanStore((s) => s.active_modes)

  const hasOverride = recipeModesOverride !== null && recipeModesOverride !== undefined
  const activeModes = hasOverride ? recipeModesOverride! : globalModes

  const incompatible = useMemo(() => {
    if (!recipe) return []
    return getIncompatibleSlots(recipe, activeModes, registry)
  }, [recipe, activeModes, registry])

  const allowedAllergens = useMemo(
    () => globalModes.filter((tag) => !activeModes.includes(tag) && recipeTags.includes(tag)),
    [globalModes, activeModes, recipeTags],
  )

  if (!recipe) return null

  const isIncompatible = incompatible.length > 0
  const planLine = isSelected
    ? `in plan: ${servings ?? recipe.base_servings} servings${activeModes.length > 0 ? `; excl: ${activeModes.join(', ')}` : ''}`
    : null

  const itemBg = isIncompatible ? itemIncompatibleStyle : isSelected ? itemSelectedStyle : itemStyle

  return (
    <li style={itemBg}>
      <button
        type={'button'}
        onClick={() => setExpanded((e) => !e)}
        style={{ ...rowStyle, ...rowButtonStyle }}
        aria-expanded={expanded}
      >
        <div style={titleBlockStyle}>
          <div style={titleRowStyle}>
            <span style={{ fontWeight: 600, fontSize: 16 }}>{recipe.title}</span>
            {isIncompatible && <span style={incompatibleBadgeStyle}>{'Cannot Substitute'}</span>}
            {!isIncompatible && allowedAllergens.length > 0 && (
              <span style={allergenBadgeStyle}>{`Contains: ${allowedAllergens.join(', ')}`}</span>
            )}
          </div>
          {planLine && <div style={planLineStyle}>{planLine}</div>}
        </div>
        <Link
          to={'/recipes/$recipeId'}
          params={{ recipeId }}
          style={detailLinkStyle}
          aria-label={`View ${recipe.title}`}
          onClick={(e) => e.stopPropagation()}
        >
          {'›'}
        </Link>
      </button>
      {expanded && (
        <div
          style={
            isIncompatible
              ? expandedIncompatiblePanelStyle
              : isSelected
                ? expandedSelectedPanelStyle
                : expandedPanelStyle
          }
        >
          {isIncompatible && (
            <div style={incompatibleListStyle}>
              <span style={incompatibleListLabelStyle}>{'No substitute found: '}</span>
              {incompatible.join(', ')}
            </div>
          )}
          <MealPlanWidget recipeId={recipeId} />
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
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 0 100px' }}>
      <h1 style={{ padding: '0 16px', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
        {'Recipes'}
      </h1>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {ids.map((id) => (
          <RecipeListItem key={id} recipeId={id} />
        ))}
      </ul>
      <GlobalSettingsWidget />
    </div>
  )
}

const itemStyle: React.CSSProperties = {
  borderBottom: '1px solid #e5e7eb',
}

const itemSelectedStyle: React.CSSProperties = {
  background: '#eff6ff',
  borderBottom: '1px solid #bfdbfe',
}

const itemIncompatibleStyle: React.CSSProperties = {
  background: '#fef2f2',
  borderBottom: '1px solid #fecaca',
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  gap: 8,
}

const rowButtonStyle: React.CSSProperties = {
  width: '100%',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
}

const titleBlockStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
}

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
}

const detailLinkStyle: React.CSSProperties = {
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: 6,
  border: '1px solid #e5e7eb',
  background: '#fff',
  color: '#6b7280',
  fontSize: 20,
  textDecoration: 'none',
  lineHeight: 1,
}

const planLineStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 500,
  color: '#1d4ed8',
}

const allergenBadgeStyle: React.CSSProperties = {
  padding: '1px 6px',
  borderRadius: 4,
  background: '#fef3c7',
  color: '#92400e',
  fontSize: 11,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

const incompatibleBadgeStyle: React.CSSProperties = {
  padding: '1px 6px',
  borderRadius: 4,
  background: '#fee2e2',
  color: '#dc2626',
  fontSize: 11,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

const expandedPanelStyle: React.CSSProperties = {
  padding: '0 16px 16px',
  borderTop: '1px solid #f3f4f6',
  background: '#fafafa',
}

const expandedSelectedPanelStyle: React.CSSProperties = {
  padding: '0 16px 16px',
  borderTop: '1px solid #bfdbfe',
  background: '#dbeafe',
}

const expandedIncompatiblePanelStyle: React.CSSProperties = {
  padding: '0 16px 16px',
  borderTop: '1px solid #fecaca',
  background: '#fee2e2',
}

const incompatibleListStyle: React.CSSProperties = {
  padding: '10px 0 8px',
  fontSize: 13,
  color: '#dc2626',
}

const incompatibleListLabelStyle: React.CSSProperties = {
  fontWeight: 600,
}
