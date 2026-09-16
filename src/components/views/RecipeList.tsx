import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useRecipeStore, selectAllRecipeIds, selectRecipeById } from '@/store/recipeSlice'

function RecipeListItem({ recipeId }: { recipeId: string }) {
  const selector = useMemo(() => selectRecipeById(recipeId), [recipeId])
  const recipe = useRecipeStore(selector)
  if (!recipe) return null
  return (
    <li style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
      <strong>{recipe.title}</strong>
      <span style={{ marginLeft: 12, color: '#666', fontSize: 14 }}>
        {recipe.base_servings}
        {' servings · '}
        {recipe.steps.length} {'steps'}
      </span>
    </li>
  )
}

export function RecipeList() {
  const ids = useRecipeStore(useShallow(selectAllRecipeIds))
  const loadState = useRecipeStore((s) => s.loadState)

  if (loadState === 'idle' || loadState === 'loading') return <p>{'Loading recipes…'}</p>
  if (loadState === 'error') return <p>{'Failed to load recipes.'}</p>

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <h1>{'Recipes'}</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {ids.map((id) => (
          <RecipeListItem key={id} recipeId={id} />
        ))}
      </ul>
    </div>
  )
}
