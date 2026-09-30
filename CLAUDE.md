# Mealemon — Claude Guidance

## What this is

A family meal planning PWA replacing Mealime (shutting down Oct 2026). Vite + React frontend, Express API on Vercel, recipe data in a private git submodule. See `docs/design-doc.md` for full architecture and `docs/decisions.md` for why things are the way they are. For anything visual, read `docs/DESIGN.md` and use tokens from `src/theme.ts`.

## Stack

- **Frontend:** Vite + React + TypeScript, TanStack Router, Zustand
- **API:** Single Express app at `api/index.ts`, deployed as a Vercel Serverless Function
- **Storage:** Vercel Blob (private) for plan data
- **Recipes:** Static JSON built from `content/` submodule at build time

## Key architectural facts

**API is one file.** All routes live in `api/index.ts`. Do not create per-file handlers in `api/` — Vercel bundles each file in isolation, making shared imports fail at runtime with `ERR_MODULE_NOT_FOUND`. The `vercel.json` rewrite routes all `/api/*` traffic to `api/index.ts`.

**Recipes are gitignored build output.** `public/recipes.json` is built by `node scripts/build-recipes.mjs` from the `content/` submodule. Run this manually after pulling submodule changes. Production builds run it automatically via `npm run build`.

**Plans have a lifecycle.** `planning` → `shopping` → `done`. The shopping list is dimmed/non-interactive during `planning`. "Start Shopping" is on the shopping list, not the plan detail. Delete is only available on `done` plans.

**Zustand selectors returning arrays/objects must use `useShallow`.** Any `?? []` fallback or object-returning selector creates a new reference every render, causing infinite loops. Always wrap with `useShallow` from `zustand/react/shallow`.

**Local dev:** run `vercel dev`. Requires `.env` (not `.env.local`) — after `vercel env pull`, run `cp .env.local .env`.

## UI conventions

- Styles are inline `React.CSSProperties`; colors and type come from `src/theme.ts` — no hard-coded hex values in components.
- Meet the accessibility rules in `docs/DESIGN.md` (contrast, 44px targets, icon + text for status, real form controls).
- Checks: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run format:check`. `npm ci` may fail because the lockfile is out of sync; `npm install --no-package-lock` works locally.

## File layout

```
api/index.ts          — all API routes (Express)
src/lib/schema.ts     — shared TypeScript types
src/theme.ts          — design tokens (colors, fonts, sizes)
src/lib/pipeline.ts   — shopping list pipeline (pure function)
src/store/
  plansSlice.ts       — named plans state + selectors
  recipeSlice.ts      — recipe cache
  sessionSlice.ts     — API sync state
  shoppingSelectors.ts — cross-store derived hook
src/hooks/
  usePlanSync.ts      — loads + saves active plan
  usePlansSync.ts     — loads plan index on mount
src/components/
  views/              — one component per nav destination
  ui/                 — reusable primitives (TabHeader, DefaultsSheet, icons, ...)
docs/
  design-doc.md       — full architecture spec
  DESIGN.md           — UI design rules and accessibility requirements
  decisions.md        — evaluated alternatives and rationale
  session-log.md      — per-session changelogs
```

## Before adding a new API route

Add it to `api/index.ts` alongside the existing routes. Auth is `requireAuth` middleware — pass it as a second argument to any protected route: `app.get('/api/foo', requireAuth, async (req, res) => { ... })`.

## Before adding a new Zustand selector

If it returns an array or object, wrap it with `useShallow`. If it needs data from two stores, write a custom hook in `src/store/shoppingSelectors.ts` or a new file under `src/hooks/`.

## Deployment

Push to `main` — Vercel auto-deploys. Do not use `vercel --prod` CLI; the build uses `git submodule update` which requires the git-integrated build (not CLI upload).
