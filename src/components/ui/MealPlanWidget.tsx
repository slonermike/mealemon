import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  usePlanStore,
  selectIsRecipeSelected,
  selectServings,
  selectRecipeModes,
} from '@/store/planSlice'
import { useRecipeStore, selectRecipeAllergenTags } from '@/store/recipeSlice'
import { ModeToggleList } from './ModeToggleList'
import { ServingsStepper } from './ServingsStepper'

interface Props {
  recipeId: string
  baseServings: number
}

export function MealPlanWidget({ recipeId, baseServings }: Props) {
  const globalModes = usePlanStore((s) => s.active_modes)
  const toggleRecipe = usePlanStore((s) => s.toggleRecipe)
  const setServings = usePlanStore((s) => s.setServings)
  const toggleRecipeMode = usePlanStore((s) => s.toggleRecipeMode)
  const clearRecipeModes = usePlanStore((s) => s.clearRecipeModes)

  const isSelectedSelector = useMemo(() => selectIsRecipeSelected(recipeId), [recipeId])
  const servingsSelector = useMemo(() => selectServings(recipeId), [recipeId])
  const recipeModesSelector = useMemo(() => selectRecipeModes(recipeId), [recipeId])
  const allergenTagsSelector = useMemo(() => selectRecipeAllergenTags(recipeId), [recipeId])

  const isSelected = usePlanStore(isSelectedSelector)
  const servings = usePlanStore(servingsSelector)
  const recipeModesOverride = usePlanStore(recipeModesSelector)
  const recipeTags = useRecipeStore(useShallow(allergenTagsSelector))

  // Per-recipe modes: if overrides exist use them, otherwise inherit global
  const activeModes = recipeModesOverride ?? globalModes

  if (!isSelected) {
    return (
      <button
        type={'button'}
        onClick={() => toggleRecipe(recipeId, baseServings)}
        style={addButtonStyle}
      >
        {'Add to plan'}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ServingsStepper
        servings={servings ?? baseServings}
        onChange={(s) => setServings(recipeId, s)}
      />
      {recipeTags.length > 0 && (
        <div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>{'Exclusions'}</div>
          <ModeToggleList
            allTags={recipeTags}
            activeTags={activeModes}
            onToggle={(tag) => toggleRecipeMode(recipeId, tag, globalModes)}
            onClear={() => clearRecipeModes(recipeId)}
          />
        </div>
      )}
      <button
        type={'button'}
        onClick={() => toggleRecipe(recipeId, baseServings)}
        style={removeButtonStyle}
      >
        {'Remove from plan'}
      </button>
    </div>
  )
}

const addButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 8,
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  width: '100%',
}

const removeButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid #f87171',
  background: '#fff',
  color: '#dc2626',
  fontSize: 14,
  cursor: 'pointer',
  alignSelf: 'flex-start',
}
