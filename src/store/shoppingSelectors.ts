import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { buildShoppingList } from '@/lib/pipeline'
import type { ShoppingItem } from '@/lib/schema'
import { usePlansStore, selectActivePlan } from './plansSlice'
import { useRecipeStore } from './recipeSlice'
import { useSettingsStore } from './settingsSlice'

export interface ShoppingGroup {
  category: string
  label: string
  items: ShoppingItem[]
}

const CATEGORY_ORDER: { key: string; label: string }[] = [
  { key: 'produce', label: 'Produce' },
  { key: 'meat', label: 'Meat & Seafood' },
  { key: 'dairy', label: 'Dairy' },
  { key: 'dairy-alt', label: 'Dairy Alternatives' },
  { key: 'frozen', label: 'Frozen' },
  { key: 'pantry', label: 'Pantry' },
  { key: 'other', label: 'Other' },
]

export function useResolvedShoppingList(): ShoppingGroup[] {
  const selected = usePlansStore(useShallow((s) => selectActivePlan(s)?.selected ?? []))
  const activeModes = useSettingsStore(useShallow((s) => s.active_modes))

  const recipes = useRecipeStore((s) => s.recipes)
  const registry = useRecipeStore((s) => s.registry)

  return useMemo(() => {
    const unshopped = selected.filter((s) => !s.shopped)
    const items = buildShoppingList({ selected: unshopped }, recipes, registry, activeModes)

    const byCategory = new Map<string, ShoppingItem[]>()
    for (const item of items) {
      const cat = registry[item.ingredient_ref]?.category ?? 'other'
      const bucket = byCategory.get(cat) ?? []
      bucket.push(item)
      byCategory.set(cat, bucket)
    }

    const groups: ShoppingGroup[] = []
    for (const { key, label } of CATEGORY_ORDER) {
      const bucket = byCategory.get(key)
      if (bucket && bucket.length > 0) {
        groups.push({ category: key, label, items: bucket })
        byCategory.delete(key)
      }
    }
    for (const [cat, bucket] of byCategory) {
      groups.push({ category: cat, label: cat, items: bucket })
    }

    return groups
  }, [selected, recipes, registry, activeModes])
}
