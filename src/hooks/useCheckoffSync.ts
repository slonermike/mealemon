import { usePlanStore } from '@/store/planSlice'
import type { CheckoffKey } from '@/lib/schema'

export function useCheckoffSync() {
  const weekId = usePlanStore((s) => s.week_of)
  const toggleCheckoff = usePlanStore((s) => s.toggleCheckoff)
  const checkedOff = usePlanStore((s) => s.checked_off)

  function toggle(key: CheckoffKey) {
    const match = (k: CheckoffKey) =>
      k.ingredient_ref === key.ingredient_ref && k.recipe_id === key.recipe_id
    const currentlyChecked = checkedOff.some(match)
    const nextChecked = !currentlyChecked

    // Optimistic local update
    toggleCheckoff(key)

    // Fire-and-forget server sync
    fetch(`/api/plans/${weekId}/checkoff`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...key, checked: nextChecked }),
    }).catch(() => {
      // Revert on failure
      toggleCheckoff(key)
    })
  }

  return { toggle }
}
