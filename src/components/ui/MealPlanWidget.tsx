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
}

export function MealPlanWidget({ recipeId }: Props) {
  const globalModes = usePlanStore((s) => s.active_modes)
  const toggleRecipe = usePlanStore((s) => s.toggleRecipe)
  const setServings = usePlanStore((s) => s.setServings)
  const toggleRecipeMode = usePlanStore((s) => s.toggleRecipeMode)
  const resetRecipeModes = usePlanStore((s) => s.resetRecipeModes)

  const isSelectedSelector = useMemo(() => selectIsRecipeSelected(recipeId), [recipeId])
  const servingsSelector = useMemo(() => selectServings(recipeId), [recipeId])
  const recipeModesSelector = useMemo(() => selectRecipeModes(recipeId), [recipeId])
  const allergenTagsSelector = useMemo(() => selectRecipeAllergenTags(recipeId), [recipeId])

  const isSelected = usePlanStore(isSelectedSelector)
  const servings = usePlanStore(servingsSelector)
  const recipeModesOverride = usePlanStore(recipeModesSelector)
  const recipeTags = useRecipeStore(useShallow(allergenTagsSelector))

  const hasOverride = recipeModesOverride !== null && recipeModesOverride !== undefined
  const activeModes = hasOverride ? recipeModesOverride! : globalModes

  // Tags present in this recipe that the household normally excludes but are now allowed
  const allowedAllergens = useMemo(
    () => globalModes.filter((tag) => !activeModes.includes(tag) && recipeTags.includes(tag)),
    [globalModes, activeModes, recipeTags],
  )

  if (!isSelected) {
    return (
      <button type={'button'} onClick={() => toggleRecipe(recipeId)} style={addButtonStyle}>
        {'Add to plan'}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {allowedAllergens.length > 0 && (
        <div style={allergenWarningStyle}>
          <span style={{ fontWeight: 600 }}>{'Contains: '}</span>
          {allowedAllergens.join(', ')}
        </div>
      )}
      <ServingsStepper servings={servings!} onChange={(s) => setServings(recipeId, s)} />
      {recipeTags.length > 0 && (
        <div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>{'Exclusions'}</div>
          <ModeToggleList
            allTags={recipeTags}
            activeTags={activeModes}
            onToggle={(tag) => toggleRecipeMode(recipeId, tag, globalModes)}
            onClear={() => resetRecipeModes(recipeId)}
            clearLabel={'defaults'}
            clearActive={!hasOverride}
          />
        </div>
      )}
      <button type={'button'} onClick={() => toggleRecipe(recipeId)} style={removeButtonStyle}>
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

const allergenWarningStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 6,
  background: '#fef3c7',
  border: '1px solid #fcd34d',
  fontSize: 13,
  color: '#92400e',
}
