import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  usePlansStore,
  selectIsRecipeSelected,
  selectServings,
  selectRecipeModes,
} from '@/store/plansSlice'
import { useSettingsStore } from '@/store/settingsSlice'
import { useRecipeStore, selectRecipeAllergenTags } from '@/store/recipeSlice'
import { AlertIcon, PlusIcon } from '@/components/ui/icons'
import { color, status, tab } from '@/theme'
import { ModeToggleList } from './ModeToggleList'
import { ServingsStepper } from './ServingsStepper'

interface Props {
  recipeId: string
}

export function MealPlanWidget({ recipeId }: Props) {
  const activePlanId = usePlansStore((s) => s.activePlanId)
  const globalModes = useSettingsStore(useShallow((s) => s.active_modes))
  const defaultServings = useSettingsStore((s) => s.default_servings)
  const toggleRecipe = usePlansStore((s) => s.toggleRecipe)
  const setServings = usePlansStore((s) => s.setServings)
  const toggleRecipeMode = usePlansStore((s) => s.toggleRecipeMode)
  const resetRecipeModes = usePlansStore((s) => s.resetRecipeModes)

  const isSelectedSelector = useMemo(() => selectIsRecipeSelected(recipeId), [recipeId])
  const servingsSelector = useMemo(() => selectServings(recipeId), [recipeId])
  const recipeModesSelector = useMemo(() => selectRecipeModes(recipeId), [recipeId])
  const allergenTagsSelector = useMemo(() => selectRecipeAllergenTags(recipeId), [recipeId])

  const isSelected = usePlansStore(isSelectedSelector)
  const servings = usePlansStore(servingsSelector)
  const recipeModesOverride = usePlansStore(recipeModesSelector)
  const recipeTags = useRecipeStore(useShallow(allergenTagsSelector))

  const hasOverride = recipeModesOverride !== null && recipeModesOverride !== undefined
  const activeModes = hasOverride ? recipeModesOverride! : globalModes

  // Tags present in this recipe that the household normally excludes but are now allowed
  const allowedAllergens = useMemo(
    () => globalModes.filter((tag) => !activeModes.includes(tag) && recipeTags.includes(tag)),
    [globalModes, activeModes, recipeTags],
  )

  if (!activePlanId) {
    return <p style={noPlanStyle}>{'Open or create a plan to add recipes.'}</p>
  }

  if (!isSelected) {
    return (
      <button
        type={'button'}
        onClick={() => toggleRecipe(recipeId, defaultServings)}
        style={addButtonStyle}
      >
        <PlusIcon size={18} />
        {'Add to plan'}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {allowedAllergens.length > 0 && (
        <div style={allergenWarningStyle}>
          <AlertIcon size={16} />
          <span>
            <span style={{ fontWeight: 600 }}>{'Contains: '}</span>
            {allowedAllergens.join(', ')}
          </span>
        </div>
      )}
      <ServingsStepper servings={servings!} onChange={(s) => setServings(recipeId, s)} />
      {recipeTags.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: color.muted, marginBottom: 8 }}>
            {'Exclusions'}
          </div>
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
      <button
        type={'button'}
        onClick={() => toggleRecipe(recipeId, defaultServings)}
        style={removeButtonStyle}
      >
        {'Remove from plan'}
      </button>
    </div>
  )
}

const noPlanStyle: React.CSSProperties = {
  fontSize: 14,
  color: color.muted,
  margin: 0,
}

const addButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  minHeight: 48,
  borderRadius: 12,
  border: 'none',
  background: tab.recipes.accent,
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
  width: '100%',
}

const removeButtonStyle: React.CSSProperties = {
  minHeight: 44,
  padding: '0 16px',
  borderRadius: 12,
  border: `1px solid ${tab.recipes.edge}`,
  background: color.surface,
  color: color.ink,
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  alignSelf: 'flex-start',
}

const allergenWarningStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  padding: '10px 12px',
  borderRadius: 10,
  background: status.warn.bg,
  fontSize: 14,
  color: status.warn.fg,
}
