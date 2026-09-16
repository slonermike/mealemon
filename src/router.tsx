import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { RootLayout } from '@/components/RootLayout'
import { RecipeList } from '@/components/views/RecipeList'
import { RecipeDetail } from '@/components/views/RecipeDetail'
import { ShoppingList } from '@/components/views/ShoppingList'

export const rootRoute = createRootRoute({ component: RootLayout })

export const recipesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: RecipeList,
})

export const recipeDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/recipes/$recipeId',
  component: RecipeDetail,
})

export const shoppingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/shopping',
  component: ShoppingList,
})

const routeTree = rootRoute.addChildren([recipesRoute, recipeDetailRoute, shoppingRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
