# Mealemon

A family meal planning app: browse curated recipes, scale servings, apply allergen/diet exclusions with automatic ingredient substitution, and generate a consolidated shopping list — as a replacement for Mealime.

The full technical design — background, architecture, data model, and key decisions — lives in [`docs/design-doc.md`](docs/design-doc.md). Read that first for context on any change in this repo.

## Project Shape

Per the design doc, this project is split into two concerns:

- **Engine** — the recipe/ingredient schema, substitution and shopping-list pipeline logic, and a JSON Schema validator. Generic, unopinionated, open source (MIT).
- **Application** — the actual PWA (TypeScript + React + Zustand), plus real household recipe data (kept private, since recipe content carries copyright even after reformatting).

This repo currently holds project setup only; the split above will be reflected in the repo/package structure as implementation begins.

## Status

Early setup. No application code yet — dev philosophies and conventions will be established before implementation starts.

## License

MIT — see [LICENSE](LICENSE). Note: this covers the engine (schema/pipeline code). Recipe content, once added, is not covered by this license.
