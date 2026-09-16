import { useCallback, useMemo } from 'react'
import { buildShoppingList } from '@/lib/pipeline'
import type { ShoppingItem } from '@/lib/schema'
import { usePlanStore } from './planSlice'
import { useRecipeStore } from './recipeSlice'

export function useResolvedShoppingList(): ShoppingItem[] {
  const selected = usePlanStore((s) => s.selected)
  const activeModes = usePlanStore((s) => s.active_modes)

  const exclusionTags = useRecipeStore(
    useCallback(
      (_s) => {
        // TODO: resolve mode names → tags via registry of ExclusionMode definitions
        // For now active_modes are treated as raw tags
        return activeModes
      },
      [activeModes],
    ),
  )

  const recipes = useRecipeStore((s) => s.recipes)
  const registry = useRecipeStore((s) => s.registry)

  return useMemo(
    () => buildShoppingList({ selected }, recipes, registry, exclusionTags),
    [selected, recipes, registry, exclusionTags],
  )
}
