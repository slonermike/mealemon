import { useEffect } from 'react'
import { RecipeList } from '@/components/views/RecipeList'
import { useRecipeStore } from '@/store/recipeSlice'

export default function App() {
  const load = useRecipeStore((s) => s.load)
  useEffect(() => {
    void load()
  }, [load])
  return <RecipeList />
}
