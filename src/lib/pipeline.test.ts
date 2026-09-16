import { describe, it, expect } from 'vitest'
import { resolveSlot, buildShoppingList } from './pipeline'
import type { IngredientRegistryEntry, IngredientSlot, Recipe } from './schema'

const registry: Record<string, IngredientRegistryEntry> = {
  milk: {
    id: 'milk',
    name: 'milk',
    category: 'dairy',
    unit_family: 'volume',
    default_allergen_tags: ['dairy'],
  },
  'almond-milk': {
    id: 'almond-milk',
    name: 'almond milk',
    category: 'dairy-alt',
    unit_family: 'volume',
    default_allergen_tags: ['tree-nut'],
  },
  'oat-milk': {
    id: 'oat-milk',
    name: 'oat milk',
    category: 'dairy-alt',
    unit_family: 'volume',
    default_allergen_tags: [],
  },
  lemon: {
    id: 'lemon',
    name: 'lemon',
    category: 'produce',
    unit_family: 'count',
    default_allergen_tags: [],
  },
}

describe('resolveSlot', () => {
  const slot: IngredientSlot = {
    id: '0001',
    candidates: [
      { ingredient_ref: 'milk', amount: 1, unit: 'cup' },
      { ingredient_ref: 'almond-milk', amount: 1, unit: 'cup' },
      { ingredient_ref: 'oat-milk', amount: 1, unit: 'cup' },
    ],
  }

  it('returns first candidate when no exclusions', () => {
    const result = resolveSlot(slot, [], registry)
    expect(result?.ingredient_ref).toBe('milk')
  })

  it('skips dairy candidate when dairy excluded', () => {
    const result = resolveSlot(slot, ['dairy'], registry)
    expect(result?.ingredient_ref).toBe('almond-milk')
  })

  it('skips to third candidate when dairy and tree-nut excluded', () => {
    const result = resolveSlot(slot, ['dairy', 'tree-nut'], registry)
    expect(result?.ingredient_ref).toBe('oat-milk')
  })

  it('returns null when all candidates excluded', () => {
    const slotNoFallback: IngredientSlot = {
      id: '0002',
      candidates: [
        { ingredient_ref: 'milk', amount: 1, unit: 'cup' },
        { ingredient_ref: 'almond-milk', amount: 1, unit: 'cup' },
      ],
    }
    const result = resolveSlot(slotNoFallback, ['dairy', 'tree-nut'], registry)
    expect(result).toBeNull()
  })
})

describe('buildShoppingList', () => {
  const recipe: Recipe = {
    schema_version: 1,
    id: 'lemon-chicken',
    title: 'Lemon Chicken',
    base_servings: 2,
    ingredients: [
      { id: '0001', candidates: [{ ingredient_ref: 'lemon', amount: 1, unit: 'count' }] },
    ],
    steps: [],
  }

  it('scales ingredient amounts by servings ratio', () => {
    const items = buildShoppingList(
      { selected: [{ recipe_id: 'lemon-chicken', servings: 4 }] },
      { 'lemon-chicken': recipe },
      registry,
      [],
    )
    expect(items[0].combined.amount).toBe(2)
  })

  it('combines same ingredient across recipes', () => {
    const recipe2: Recipe = {
      ...recipe,
      id: 'lemon-bars',
      ingredients: [
        { id: '0001', candidates: [{ ingredient_ref: 'lemon', amount: 1, unit: 'count' }] },
      ],
    }
    const items = buildShoppingList(
      {
        selected: [
          { recipe_id: 'lemon-chicken', servings: 2 },
          { recipe_id: 'lemon-bars', servings: 2 },
        ],
      },
      { 'lemon-chicken': recipe, 'lemon-bars': recipe2 },
      registry,
      [],
    )
    expect(items).toHaveLength(1)
    expect(items[0].combined.amount).toBe(2)
    expect(items[0].occurrences).toHaveLength(2)
  })

  it('marks item non-combinable when units differ across recipes', () => {
    const recipe2: Recipe = {
      ...recipe,
      id: 'lemon-zest',
      ingredients: [
        { id: '0001', candidates: [{ ingredient_ref: 'lemon', amount: 1, unit: 'tbsp' }] },
      ],
    }
    const items = buildShoppingList(
      {
        selected: [
          { recipe_id: 'lemon-chicken', servings: 2 },
          { recipe_id: 'lemon-zest', servings: 2 },
        ],
      },
      { 'lemon-chicken': recipe, 'lemon-zest': recipe2 },
      registry,
      [],
    )
    expect(items[0].combinable).toBe(false)
    expect(items[0].display_mode).toBe('separate')
  })
})
