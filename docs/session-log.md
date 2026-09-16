# Session Log

Brief overviews of development sessions, newest first.

---

## 2026-09-16 — Polish and deploy fixes

- Added Liz Lemon hero image (circle crop) to login screen
- Added `/logout` route — hard-navigates to `/` after clearing the session cookie
- Fixed infinite render loop in `usePlanSync` (`useShallow` missing from selector)
- Fixed per-recipe exclusions not applying to shopping list (was always using global modes)
- Fixed Vite proxy for local dev (`/api` → `vercel dev` on port 3001)
- Resolved series of Vercel deployment blockers: lefthook in CI, function bundler import restrictions, git submodule SSH vs HTTPS, submodule credential injection via `GITHUB_TOKEN` PAT

---

## 2026-09-15 / 2026-09-16 — Shopping list, persistence, auth, live deploy

### What was built

- **Shopping list view** with Vercel Blob persistence (debounced auto-save, optimistic checkoff sync)
- **Category grouping** on the shopping list (Produce / Meat / Dairy / Pantry / etc.)
- **Bottom nav** (Recipes / Shopping tabs), plan sync hook, checkoff sync hook
- **Password auth** with HttpOnly session cookie (see content repo for security details)
- **Live deploy** to Vercel with auto-deploy on push to `main`

### Key bugs fixed

- `useShallow` missing from `usePlanSync` selector caused an infinite render loop (new object reference on every render)
- Shopping list always used global `active_modes` instead of per-recipe `mode_overrides` — excluded ingredients still appeared
- Vite proxy needed for local dev (`/api` → `localhost:3001`) since `vercel dev` and `vite dev` run on separate ports

### Deployment challenges

- **Lefthook** — `prepare` script crashed in Vercel's build environment (no git repo). Fixed with a guard: `git rev-parse --git-dir 2>/dev/null && lefthook install || true`
- **Vercel function bundler** — cannot resolve relative imports to sibling files outside a function's own directory (`api/_auth.ts`, `api/_blobStore.ts`). Must inline shared helpers into each handler. Affects all shared code in `api/`.
- **Git submodule** — Vercel's shallow clone doesn't fetch submodules. Worked around by adding a `scripts/vercel-build.sh` that configures git credentials and runs `git submodule update --init --recursive` before the build.
- **Submodule credentials** — Vercel can't use SSH submodule URLs. Switched to HTTPS and injected a fine-grained GitHub PAT (`GITHUB_TOKEN` env var, read-only Contents on `mealemon-content` only) via `git config --global url.insteadOf`.

### Decisions

- See `decisions.md` for auth design rationale (recorded in content repo)
- `vercel.json` `buildCommand` does not interpolate env vars — must use a shell script

---

## 2026-09-15 — Recipe list, detail view, meal planning, exclusions

### What was built

- **Recipe list** with TanStack Router, expand-in-place + `›` detail nav
- **Recipe detail view** with scaled ingredient list and numbered steps
- **Meal plan widget** — per-recipe servings stepper and allergen exclusion overrides
- **Global settings widget** — floating pill for default servings and exclusion modes
- **Volume unit coalescence** + unicode fraction formatting via `fraction.js`
- **Incompatibility detection** — red badge and "Cannot Substitute" when no valid candidate exists for active exclusions
- **"Contains: X, Y" warning** — amber badge when a recipe has allergens that are in the default exclusion list but overridden per-recipe

### Key bugs fixed

- Incompatibility check used `globalModes` instead of effective `activeModes` (override ?? global) — recipes showed as incompatible even when per-recipe override cleared the exclusion
- `toggleRecipe` used `base_servings` parameter instead of reading `default_servings` from store
- `clearRecipeModes` set `mode_overrides: []` (force empty) instead of `undefined` (inherit global) — renamed to `resetRecipeModes`
- Volume coalescence single-pass bug: 3 tsp → `0.5 fl oz` instead of `1 tbsp`. Fixed with two-pass: pass 1 finds largest whole-number unit, pass 2 finds largest clean-fraction unit (d ≤ 4)
