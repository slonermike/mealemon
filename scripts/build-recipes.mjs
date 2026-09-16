import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const contentDir = join(process.cwd(), 'content')
const outFile = join(process.cwd(), 'public', 'recipes.json')
const versionFile = join(process.cwd(), 'public', 'recipes-version.json')

if (!existsSync(contentDir) || !existsSync(join(contentDir, 'ingredients.json'))) {
  console.log('content/ submodule not present — skipping recipes build')
  process.exit(0)
}

if (!existsSync(join(process.cwd(), 'public'))) {
  mkdirSync(join(process.cwd(), 'public'))
}

const { registry } = JSON.parse(readFileSync(join(contentDir, 'ingredients.json'), 'utf8'))

const recipesDir = join(contentDir, 'recipes')
const recipes = {}
for (const file of readdirSync(recipesDir).filter((f) => f.endsWith('.json'))) {
  const recipe = JSON.parse(readFileSync(join(recipesDir, file), 'utf8'))
  recipes[recipe.id] = recipe
}

const version = Date.now()
writeFileSync(outFile, JSON.stringify({ version, registry, recipes }, null, 2))
writeFileSync(versionFile, JSON.stringify({ version }))

console.log(`Built recipes.json: ${Object.keys(recipes).length} recipes, version ${version}`)
