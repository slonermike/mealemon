import { useMemo } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { useRecipeStore, selectRecipeById } from '@/store/recipeSlice'
import { usePlanStore, selectServings, selectRecipeModes } from '@/store/planSlice'
import { resolveSlot, getIncompatibleSlots } from '@/lib/pipeline'
import { formatAmount } from '@/lib/units'
import { MealPlanWidget } from '@/components/ui/MealPlanWidget'
import type { Recipe } from '@/lib/schema'

function resolveStepContent(content: string, slotNameMap: Map<string, string>): React.ReactNode[] {
  const parts = content.split(/(\{[^}]+\})/)
  return parts.map((part, i) => {
    const match = part.match(/^\{([^}]+)\}$/)
    if (match) {
      const name = slotNameMap.get(match[1]) ?? match[1]
      return (
        <strong key={i} style={{ fontWeight: 600 }}>
          {name}
        </strong>
      )
    }
    return part
  })
}

function useResolvedIngredients(recipe: Recipe, scale: number) {
  const registry = useRecipeStore((s) => s.registry)
  const globalModes = usePlanStore((s) => s.active_modes)
  const selected = usePlanStore((s) => s.selected)

  return useMemo(() => {
    const sel = selected.find((s) => s.recipe_id === recipe.id)
    const activeModes = sel?.mode_overrides ?? globalModes

    return recipe.ingredients.map((slot) => {
      const resolved = resolveSlot(slot, activeModes, registry)
      if (!resolved) return { slot, resolved }
      return { slot, resolved: { ...resolved, amount: resolved.amount * scale } }
    })
  }, [recipe, registry, selected, globalModes, scale])
}

export function RecipeDetail() {
  const { recipeId } = useParams({ from: '/recipes/$recipeId' })

  const recipeSelector = useMemo(() => selectRecipeById(recipeId), [recipeId])
  const servingsSelector = useMemo(() => selectServings(recipeId), [recipeId])
  const recipeModesSelector = useMemo(() => selectRecipeModes(recipeId), [recipeId])

  const recipe = useRecipeStore(recipeSelector)
  const registry = useRecipeStore((s) => s.registry)
  const plannedServings = usePlanStore(servingsSelector)
  const globalModes = usePlanStore((s) => s.active_modes)
  const recipeModesOverride = usePlanStore(recipeModesSelector)

  const activeModes =
    recipeModesOverride !== null && recipeModesOverride !== undefined
      ? recipeModesOverride
      : globalModes

  const incompatible = useMemo(
    () => (recipe ? getIncompatibleSlots(recipe, activeModes, registry) : []),
    [recipe, activeModes, registry],
  )

  const defaultServings = usePlanStore((s) => s.default_servings)
  const baseServings = recipe?.base_servings ?? 1
  const displayServings = plannedServings ?? defaultServings
  const scale = displayServings / baseServings

  const resolvedSlots = useResolvedIngredients(
    recipe ?? {
      id: recipeId,
      title: '',
      base_servings: 0,
      ingredients: [],
      steps: [],
      schema_version: 1,
    },
    scale,
  )

  const slotNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const { slot, resolved } of resolvedSlots) {
      const ref = resolved?.ingredient_ref ?? slot.candidates[0]?.ingredient_ref
      if (ref) {
        const name = registry[ref]?.name ?? ref
        map.set(slot.id, name)
      }
    }
    return map
  }, [resolvedSlots, registry])

  if (!recipe) {
    return (
      <div style={containerStyle}>
        <Link to={'/'} style={backLinkStyle}>
          {'← Recipes'}
        </Link>
        <p style={{ padding: '24px 0', color: '#6b7280' }}>{'Recipe not found.'}</p>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <Link to={'/'} style={backLinkStyle}>
        {'← Recipes'}
      </Link>

      <div style={{ padding: '0 16px 24px' }}>
        <h1 style={titleStyle}>{recipe.title}</h1>
        <p style={metaStyle}>
          {displayServings}
          {displayServings !== baseServings && (
            <span style={{ color: '#9ca3af' }}>{` (base ${baseServings})`}</span>
          )}
          {' servings · '}
          {recipe.steps.length}
          {' steps'}
        </p>

        {incompatible.length > 0 && (
          <div style={incompatibleBannerStyle}>
            <span style={{ fontWeight: 600 }}>{'Cannot Substitute: '}</span>
            {incompatible.join(', ')}
          </div>
        )}

        <MealPlanWidget recipeId={recipeId} />

        <section style={sectionStyle}>
          <h2 style={sectionHeadingStyle}>{'Ingredients'}</h2>
          <ul style={ingredientListStyle}>
            {resolvedSlots.map(({ slot, resolved }) => {
              if (!resolved) {
                if (slot.omissible) return null
                const firstName = registry[slot.candidates[0]?.ingredient_ref]?.name ?? slot.id
                return (
                  <li key={slot.id} style={{ ...ingredientItemStyle, color: '#dc2626' }}>
                    <span style={{ ...ingredientAmountStyle, color: '#fca5a5' }}>{'—'}</span>
                    <span>
                      {firstName}
                      <span style={{ fontStyle: 'italic', color: '#f87171', marginLeft: 6 }}>
                        {'(no substitute)'}
                      </span>
                    </span>
                  </li>
                )
              }
              const name = registry[resolved.ingredient_ref]?.name ?? resolved.ingredient_ref
              const amt = formatAmount(resolved.amount)
              return (
                <li key={slot.id} style={ingredientItemStyle}>
                  <span style={ingredientAmountStyle}>
                    {amt}
                    {amt && ' '}
                    {resolved.unit !== 'count' ? resolved.unit : ''}
                  </span>
                  <span>{name}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionHeadingStyle}>{'Steps'}</h2>
          <ol style={stepListStyle}>
            {recipe.steps.map((step, i) => (
              <li key={step.id} style={stepItemStyle}>
                <div style={stepNumberStyle}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={stepTitleStyle}>{step.title}</div>
                  <p style={stepContentStyle}>{resolveStepContent(step.content, slotNameMap)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}

const incompatibleBannerStyle: React.CSSProperties = {
  marginBottom: 16,
  padding: '10px 14px',
  borderRadius: 8,
  background: '#fee2e2',
  border: '1px solid #fecaca',
  fontSize: 13,
  color: '#dc2626',
}

const containerStyle: React.CSSProperties = {
  maxWidth: 480,
  margin: '0 auto',
  paddingTop: 8,
}

const backLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '12px 16px',
  color: '#2563eb',
  textDecoration: 'none',
  fontSize: 15,
  fontWeight: 500,
}

const titleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  lineHeight: 1.3,
  marginBottom: 4,
}

const metaStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#6b7280',
  marginBottom: 20,
}

const sectionStyle: React.CSSProperties = {
  marginTop: 28,
}

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  marginBottom: 12,
  paddingBottom: 6,
  borderBottom: '1px solid #e5e7eb',
}

const ingredientListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
}

const ingredientItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  padding: '7px 0',
  borderBottom: '1px solid #f3f4f6',
  fontSize: 15,
}

const ingredientAmountStyle: React.CSSProperties = {
  minWidth: 64,
  color: '#6b7280',
  fontSize: 14,
  paddingTop: 1,
  flexShrink: 0,
}

const stepListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const stepItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: 14,
  alignItems: 'flex-start',
}

const stepNumberStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  background: '#2563eb',
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  marginTop: 1,
}

const stepTitleStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 15,
  marginBottom: 4,
}

const stepContentStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.6,
  color: '#374151',
  margin: 0,
}
