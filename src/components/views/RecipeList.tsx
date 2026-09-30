import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Link } from '@tanstack/react-router'
import { MealPlanWidget } from '@/components/ui/MealPlanWidget'
import { DefaultsSheet } from '@/components/ui/DefaultsSheet'
import { TabHeader } from '@/components/ui/TabHeader'
import { AlertIcon, BlockedIcon, CheckIcon, ChevronIcon, SlidersIcon } from '@/components/ui/icons'
import { badgeBase, color, status, tab } from '@/theme'
import {
  useRecipeStore,
  selectAllRecipeIds,
  selectRecipeById,
  selectRecipeAllergenTags,
} from '@/store/recipeSlice'
import {
  usePlansStore,
  selectIsRecipeSelected,
  selectServings,
  selectRecipeModes,
  selectActivePlan,
} from '@/store/plansSlice'
import { getIncompatibleSlots } from '@/lib/pipeline'

export function RecipeListItem({ recipeId }: { recipeId: string }) {
  const [expanded, setExpanded] = useState(false)

  const recipeSelector = useMemo(() => selectRecipeById(recipeId), [recipeId])
  const isSelectedSelector = useMemo(() => selectIsRecipeSelected(recipeId), [recipeId])
  const servingsSelector = useMemo(() => selectServings(recipeId), [recipeId])
  const recipeModesSelector = useMemo(() => selectRecipeModes(recipeId), [recipeId])
  const allergenTagsSelector = useMemo(() => selectRecipeAllergenTags(recipeId), [recipeId])

  const recipe = useRecipeStore(recipeSelector)
  const registry = useRecipeStore((s) => s.registry)
  const recipeTags = useRecipeStore(useShallow(allergenTagsSelector))
  const isSelected = usePlansStore(isSelectedSelector)
  const servings = usePlansStore(servingsSelector)
  const recipeModesOverride = usePlansStore(recipeModesSelector)
  const globalModes = usePlansStore(useShallow((s) => selectActivePlan(s)?.active_modes ?? []))

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
  const relevantModes = activeModes.filter((mode) => recipeTags.includes(mode))
  const cardStyle = isIncompatible
    ? cardIncompatibleStyle
    : isSelected
      ? cardSelectedStyle
      : cardStyleBase

  return (
    <li style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <button
          type={'button'}
          onClick={() => setExpanded((e) => !e)}
          style={rowButtonStyle}
          aria-expanded={expanded}
        >
          <span style={{ fontWeight: 600, fontSize: 17 }}>{recipe.title}</span>
          <span style={badgeRowStyle}>
            {isSelected && (
              <span style={inPlanBadgeStyle}>
                <CheckIcon size={14} />
                {`In plan · ${servings ?? recipe.base_servings} servings`}
              </span>
            )}
            {isSelected &&
              relevantModes.map((mode) => (
                <span key={mode} style={exclusionBadgeStyle}>
                  <BlockedIcon size={14} />
                  <span style={srOnlyStyle}>{'Excluding: '}</span>
                  {`No ${mode}`}
                </span>
              ))}
            {isIncompatible && (
              <span style={incompatibleBadgeStyle}>
                <BlockedIcon size={14} />
                {`Can’t substitute: ${incompatible.join(', ')}`}
              </span>
            )}
            {!isIncompatible && allowedAllergens.length > 0 && (
              <span style={allergenBadgeStyle}>
                <AlertIcon size={14} />
                {`Contains: ${allowedAllergens.join(', ')}`}
              </span>
            )}
          </span>
        </button>
        <Link
          to={'/recipes/$recipeId'}
          params={{ recipeId }}
          style={isSelected ? { ...detailLinkStyle, color: tab.recipes.accent } : detailLinkStyle}
          aria-label={`View ${recipe.title}`}
        >
          <ChevronIcon size={20} />
        </Link>
      </div>
      {expanded && (
        <div style={isSelected ? expandedSelectedPanelStyle : expandedPanelStyle}>
          <MealPlanWidget recipeId={recipeId} />
        </div>
      )}
    </li>
  )
}

export function RecipeList() {
  const ids = useRecipeStore(useShallow(selectAllRecipeIds))
  const loadState = useRecipeStore((s) => s.loadState)
  const [defaultsOpen, setDefaultsOpen] = useState(false)
  const activePlanLabel = usePlansStore((s) =>
    s.activePlanId ? s.planIndex.find((p) => p.id === s.activePlanId)?.label : undefined,
  )
  const defaultServings = usePlansStore((s) => s.default_servings)
  const globalModes = usePlansStore(useShallow((s) => selectActivePlan(s)?.active_modes ?? []))

  const summary = [
    activePlanLabel ? `Adding to ${activePlanLabel}` : 'No plan open',
    `${defaultServings} servings`,
    globalModes.length > 0 ? `no ${globalModes.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      <TabHeader
        tab={'recipes'}
        eyebrow={'Cookbook'}
        title={'Recipes'}
        action={
          <button
            type={'button'}
            onClick={() => setDefaultsOpen(true)}
            aria-label={'Plan defaults'}
            aria-haspopup={'dialog'}
            style={settingsButtonStyle}
          >
            <SlidersIcon size={20} />
          </button>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: tab.recipes.dark }}>{summary}</p>
      </TabHeader>
      <main style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 24px' }}>
        {loadState === 'idle' || loadState === 'loading' ? (
          <p style={messageStyle}>{'Loading recipes…'}</p>
        ) : loadState === 'error' ? (
          <p style={messageStyle}>{'Failed to load recipes.'}</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {ids.map((id) => (
              <RecipeListItem key={id} recipeId={id} />
            ))}
          </ul>
        )}
      </main>
      <DefaultsSheet open={defaultsOpen} onOpenChange={setDefaultsOpen} />
    </>
  )
}

const messageStyle: React.CSSProperties = { color: color.muted, fontSize: 16 }

const srOnlyStyle: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
}

const settingsButtonStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  flexShrink: 0,
  borderRadius: 22,
  border: `1px solid ${tab.recipes.edge}`,
  background: color.surface,
  color: tab.recipes.accent,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
}

const cardStyleBase: React.CSSProperties = {
  background: color.surface,
  border: `1px solid ${color.line}`,
  borderRadius: 16,
  marginBottom: 10,
  overflow: 'hidden',
}

const cardSelectedStyle: React.CSSProperties = {
  ...cardStyleBase,
  border: `2px solid ${tab.recipes.accent}`,
}

const cardIncompatibleStyle: React.CSSProperties = {
  ...cardStyleBase,
  border: `1px dashed ${status.danger.edge}`,
}

const rowButtonStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 6,
  padding: '14px 8px 14px 16px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
  color: color.ink,
  position: 'relative',
}

const badgeRowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 6 }

const detailLinkStyle: React.CSSProperties = {
  flexShrink: 0,
  width: 48,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderLeft: `1px solid ${color.lineSoft}`,
  color: color.muted,
  textDecoration: 'none',
}

const inPlanBadgeStyle: React.CSSProperties = {
  ...badgeBase,
  borderRadius: 999,
  background: tab.recipes.accent,
  color: '#FFFFFF',
}

const exclusionBadgeStyle: React.CSSProperties = {
  ...badgeBase,
  padding: '2px 10px 2px 8px',
  borderRadius: 999,
  background: color.surface,
  border: `1.5px solid ${color.muted}`,
  color: color.ink,
}

const allergenBadgeStyle: React.CSSProperties = {
  ...badgeBase,
  borderRadius: 6,
  background: status.warn.bg,
  color: status.warn.fg,
}

const incompatibleBadgeStyle: React.CSSProperties = {
  ...badgeBase,
  borderRadius: 6,
  background: status.danger.bg,
  color: status.danger.fg,
  textAlign: 'left',
}

const expandedPanelStyle: React.CSSProperties = {
  padding: '12px 16px 16px',
  borderTop: `1px solid ${color.lineSoft}`,
  background: color.ground,
}

const expandedSelectedPanelStyle: React.CSSProperties = {
  padding: '12px 16px 16px',
  borderTop: `1px solid ${tab.recipes.edge}`,
  background: tab.recipes.panel,
}
