# Family Meal Planner — Technical Design Document

## 1. Background & Motivation

Mealime is shutting down (October 21, 2026). Suggested replacement apps don't meet the household's needs:
- Meal scalability (adjusting servings)
- A clean shopping-list interface
- Automated ingredient substitutions / exclusions for allergies
- A curated library of good, healthy recipes
- Step-by-step instructions that correlate directly with ingredients (Mealime's strength)

No evaluated third-party product (NumYum, Samsung Food, Peel, Swoodie, Eat This Much) matches this combination well enough to justify the subscription/complexity tradeoff. Rather than building a single-purpose household tool, the project is now split into a **generic, open-source substitution/allergen engine** and a **private consumer app + recipe data** built on top of it.

## 2. Project Split: Engine vs. Application

This is the central architectural decision and shapes everything below.

| | Engine | Application |
|---|---|---|
| **License** | Open source (MIT/Apache) | Private |
| **Contents** | Recipe/ingredient schema, substitution & shopping-list pipeline logic, JSON Schema validator, docs, a couple of hand-written example recipes | Next.js PWA, real recipe data, shared shopping-list infra |
| **Contains real recipe content?** | No | Yes |

**Why the split matters:** recipe content hand-keyed from Mealime (or any other source) is still that source's IP even after re-typing it into your own JSON format — re-formatting doesn't change ownership. The engine must never contain real recipe content, only the format they're expressed in and the code that operates on that format. Example recipes shipped with the engine for documentation purposes must be originals, not derived from any external source.

## 3. Scope & Philosophy

**Application-level philosophy (unchanged):** keep it dumb. Prefer static data and pure functions over services and runtime cleverness wherever the family's actual usage pattern allows it.

**Engine-level philosophy:** stay generic and unopinionated about anything that varies by household — allergen taxonomy, exclusion scope (household-wide vs. per-person), and unit systems must all be configurable, not hardcoded, since other adopters' needs won't match this household's exactly.

**Explicitly out of scope, at the application level:**
- A large aggregated recipe database or external recipe API (e.g., Spoonacular) — evaluated and rejected as overkill for a family-only tool
- User accounts / multi-tenant auth — sharing is handled via a shared link or simple file exchange
- In-app recipe content editing beyond the deferred v2 image-upload feature (see §10)

## 4. Functional Requirements (Application)

1. Browse a bundled set of family-curated recipes, sourced from a private recipe repo
2. Select recipes for the week and set desired servings per recipe
3. Toggle exclusion "modes" (e.g., dairy-free) that swap ingredients via pre-defined, recipe-scoped substitution rules
4. Automatically treat a recipe as incompatible with a mode if it contains an ingredient that mode would need to change but has no substitute defined
5. Generate a consolidated, de-duplicated shopping list from selected recipes, scaled to servings, resolved against active substitutions
6. View step-by-step instructions with ingredient amounts inlined/highlighted per step
7. Share meal selections and the shopping list between household members' devices
8. Fetch recipe data efficiently as a PWA — skip re-downloading when nothing has changed

## 5. Engine Data Model

### 5.0 Ingredient Registry

Ingredients are first-class entries, shared across all recipes, separate from a recipe's local usage of them. This solves two problems: it gives shopping-list aggregation a stable identity to key on instead of matching on name strings (which drift — "milk" vs. "whole milk" vs. "Milk" would otherwise produce separate lines), and it lets a shopping view group items by category (produce, dairy, seafood, pantry...).

```json
// ingredients.json — the registry
{
  "id": "shrimp",
  "name": "shrimp",
  "category": "seafood",
  "unit_family": "weight",
  "default_allergen_tags": ["shellfish"]
}
```

`default_allergen_tags` lets an intrinsic allergen (shrimp is always shellfish) be declared once, ever, in the registry — every recipe usage referencing that ingredient inherits the tag automatically rather than requiring per-recipe re-tagging.

**Important boundary:** the registry owns *identity and intrinsic properties* (name, category, unit family, default allergen tags). It deliberately does **not** own substitution suitability — the candidate list of workable ingredients (§5.1) stays attached to a recipe's usage of an ingredient slot, not the registry entry, preserving the earlier decision that "almond flour works here, not there" is a property of the dish, not the ingredient.

### 5.1 Ingredient (usage, within a recipe)

An ingredient "slot" in a recipe is a **priority-ordered list of workable candidates**, not a single ingredient with a map of mode-keyed alternates:

```json
{
  "id": "0001",
  "candidates": [
    { "ingredient_ref": "milk", "amount": 1, "unit": "cup", "allergen_tags": ["dairy"] },
    { "ingredient_ref": "almond-milk", "amount": 1, "unit": "cup", "allergen_tags": ["tree-nut"] },
    { "ingredient_ref": "oat-milk", "amount": 1, "unit": "cup", "allergen_tags": [] }
  ]
}
```

- `id` is the recipe-local identifier referenced by step templates (`{0001}`) — unchanged from before. Step text resolves against whichever candidate is ultimately selected, so wording never needs to change based on substitution.
- Each candidate has `ingredient_ref` (pointing at the shared registry, §5.0), `amount`, `unit`, and an optional `allergen_tags` array. If `allergen_tags` is omitted on a candidate, it's inherited from that ingredient's registry `default_allergen_tags`.
- **Order encodes preference**, not just possibility — the first candidate is the "default" (try milk), later entries are fallbacks in the order you'd actually want them tried (almond milk before oat milk, say).
- An ingredient with genuinely no substitute (shrimp in shrimp cocktail) is simply a **one-item candidate list** — there's no separate flag or "no alternates" case; the schema has one shape for every ingredient slot, whether it has zero, one, or several fallbacks.

**Resolution algorithm:** given the current set of active exclusion tags (household-permanent and situational modes are treated identically here — both are just "currently excluded tags"), walk a slot's `candidates` in order and return the first one whose `allergen_tags` don't intersect that set. If none survive, the recipe is incompatible with the current combination of active exclusions — this replaces the earlier per-mode "hard-stop inference," and now generalizes naturally to *multiple simultaneous* active exclusions (e.g. dairy-free **and** gluten-free at once), which a mode-keyed map couldn't express without a combinatorial key for every exclusion pairing.

This also collapses a distinction that no longer needs to exist in the resolution logic: whether an exclusion is "permanent" (gluten/shellfish/nightshades) or "situational" (dairy-free) no longer matters to *how* substitution is resolved — both are just members of the active-exclusion set. Ingestion-time curation still matters for deciding which recipes are worth including in the dataset at all, but the runtime mechanics are now one thing.

### 5.2 Step

```json
{
  "id": "s1",
  "title": "Sear",
  "content": "Melt {0004} in a skillet, then sear the {0001} 5-6 min per side.",
  "timer_seconds": 360
}
```

- `content` is a template string referencing ingredient IDs in `{id}` form, resolved at render time against the ingredient's current (possibly substituted, possibly scaled) amount and name.
- `timer_seconds` is optional; present whenever a step involves waiting/cooking/resting.

### 5.3 Recipe

```json
{
  "schema_version": 1,
  "id": "chicken-milk-skillet",
  "title": "Garlic Chicken Skillet",
  "base_servings": 4,
  "ingredients": [ /* Ingredient[] */ ],
  "steps": [ /* Step[] */ ]
}
```

- `schema_version` allows the public format to evolve without silently breaking existing private recipe data that targets an older version.
- The engine ships a **JSON Schema definition** for this format, so a private recipe repo's CI (or the app's build step) can validate recipe files before they reach the app, catching malformed data at authoring time rather than at render time.

### 5.4 Exclusion Scope (generalized)

The original design assumed household-wide exclusions because this family eats together. The engine generalizes this via an optional scoping field, defaulting to "everyone." A named "mode" is just a human-friendly label mapping to one or more tags that get added to the active-exclusion set consumed by candidate resolution (§6):

```json
{ "mode": "peanut-free", "tags": ["peanut"], "applies_to": "all" }
```

```json
{ "mode": "vegetarian", "tags": ["meat", "poultry", "seafood"], "applies_to": ["kid-2"] }
```

Households that don't need per-person scoping (this one included) simply never populate anything beyond the default and the field is invisible in practice. For this household, the three permanent exclusions (gluten, shellfish, nightshades) are just always-active modes with `applies_to: "all"` — no separate mechanism from a situational one like dairy-free.

### 5.5 Plan / Shopping State (application-level, private)

```json
{
  "week_of": "2026-09-07",
  "selected": [
    { "recipe_id": "chicken-milk-skillet", "servings": 6 }
  ],
  "active_modes": ["dairy-free"],
  "checked_off": ["almond milk", "garlic cloves"]
}
```

This structure is application-specific (private), not part of the engine's public contract.

## 6. Core Logic: Shopping List Pipeline (Engine)

Pure function, no hidden state:

```
(selectedRecipes, servingsPerRecipe, activeExclusionTags) → shoppingList
```

Pipeline stages, in order:

1. **Resolve each ingredient slot** — for every ingredient slot in a selected recipe, walk its `candidates` in priority order and select the first one whose `allergen_tags` don't intersect the current active exclusion set (permanent household exclusions and situational modes are treated identically as members of one active-exclusion set). If a slot has no surviving candidate, the recipe as a whole is incompatible with the current combination of active exclusions and should not have been selectable in the first place (surfaced at recipe-browsing time, not discovered here).
2. **Scale** — for each selected recipe, multiply each resolved candidate's `amount` by (`desiredServings / base_servings`).
3. **Normalize units** — convert to a shared unit within each ingredient's category (volume/weight/count) using a configurable conversion table (the engine should not assume imperial or metric — both should be supported, with the table itself swappable). Cross-category conversion (volume↔weight, e.g. cups of flour vs. grams of flour) requires ingredient density data and remains out of scope; recipes should stay internally consistent in one unit system.
4. **Aggregate** — group by (resolved `ingredient_ref` + normalized unit). Rather than collapsing straight to a sum, produce both a **combined total** and the **per-recipe occurrence list**, since the shopping view needs to be able to render either without re-deriving from the recipes:
   ```json
   {
     "ingredient_ref": "lemon",
     "combinable": true,
     "display_mode": "combined",
     "combined": { "amount": 1.5, "unit": "count" },
     "occurrences": [
       { "recipe_id": "lemon-chicken", "amount": 0.5, "unit": "count" },
       { "recipe_id": "lemon-bars", "amount": 1, "unit": "count" }
     ]
   }
   ```
   - `combinable` is computed, not authored: true only if every occurrence shares the same unit post-normalization. An ingredient appearing as "1 lb" in one recipe and "4 count" in another (e.g. pork chops) is `combinable: false` by construction — there's no valid sum, so `display_mode` is forced to `"separate"` and the UI shouldn't offer combining as an option.
   - `display_mode` is the user-facing per-ingredient toggle, editable only when `combinable` is true, defaulting to `"combined"`. It can still be overridden even when combining is mathematically valid — e.g. "half a lemon" and "a whole lemon" sum to 1.5 lemons, but shop very differently than one 1.5-lemon line.
5. **Round for display** — convert decimal quantities to human-friendly fractions for the rendered list only (internal math stays exact).

This pipeline is fully unit-testable with no UI dependency and no dependency on any specific recipe content — it operates purely on the schema, which is what makes it suitable to open source independent of any household's data.

## 7. Recipe Sourcing & Integration (Application, Private)

- **Source:** a private repository (or other private store) containing the household's actual recipe JSON, conforming to the engine's schema and validated against its JSON Schema.
- **Ingestion process:** recipes are hand-curated from the family's Mealime favorites (harvested before its shutdown) plus originals, re-keyed into the schema. Permanent household exclusions (gluten, shellfish, nightshades) are enforced by simply not including violating recipes, or reworking them with a permanent substitute, at this authoring step.
- **Integration into the app:** the private recipe repo is pulled in as a **git submodule** of the application repo. This was chosen over a private npm package or a build-time authenticated fetch because it requires the least new tooling, keeps recipe history in normal git, and only needs a deploy-time auth token for Vercel to clone the private submodule during build.
- **Format for the app itself:** submodule contents are consumed as (or built into) a single `recipes.json` file — see §8.

## 8. PWA Recipe Data Delivery

- Recipes are served as a **standalone static file** (`/recipes.json`), separate from the app's JS bundle, so app code updates don't force a recipe re-download and vice versa.
- A tiny **version manifest** (`/recipes-version.json`, e.g. `{ "version": 7 }`) is fetched on app load and compared against a version stored locally.
- The full `recipes.json` is only re-fetched if the version has changed; otherwise the app reads from local **IndexedDB**, making the data fully usable offline.
- At current scale (tens of hand-curated recipes), the whole file is expected to be under ~100–200KB, so a full refetch on version bump is cheap — the version check exists to skip unnecessary fetches on the common case, not because the payload is heavy. If the dataset grows substantially, the natural next step is per-recipe files plus an index of `{id, hash}` pairs for incremental sync — deferred until it's actually needed.

## 9. Sharing / Sync (Application)

Two different sync needs, handled differently:

| Data | Frequency | Sync need | Approach |
|---|---|---|---|
| Recipe selections, servings, active mode(s) | Low (weekly) | None real-time | Exchange as a small JSON blob (email, text, AirDrop) — both devices compute the identical shopping list locally since the pipeline is a pure function over shared, locally-cached recipe data |
| Shopping list check-off state | High (during the shopping trip) | Real-time-ish, so two shoppers don't double-buy | Single shared JSON blob per week in **Vercel Blob** (free on Hobby), fetched/written by both phones. No auth system — possession of the week's key/URL is sufficient. |

Vercel KV/Postgres were considered and ruled out — both were deprecated in Dec 2024 in favor of Upstash (Redis) and Neon (Postgres) respectively. Upstash was considered for the live shopping-list sync but judged to be more infrastructure than needed; Blob storage is sufficient given the low-stakes, low-frequency read/write pattern.

### 9.1 API Endpoints

Two mutation patterns, handled differently: a full plan write (infrequent) versus single-item checkoff toggles (frequent, needs to tolerate concurrent access from two phones without heavyweight concurrency control).

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/plans/{weekId}` | Create/replace a week's plan: selected recipes + servings + active modes. Upserts. |
| `GET` | `/api/plans/{weekId}` | Fetch the week's plan. The shopping list is **not stored** — it's computed fresh, server-side, by running the engine's pipeline (§6) against the stored selection/servings/modes, then merged with current check-off state. This guarantees the list is always consistent with the current pipeline logic rather than a cached snapshot that can drift if substitution rules are ever tweaked. |
| `PATCH` | `/api/plans/{weekId}` | Update the selection (add/remove a recipe, change servings, toggle a mode) — not the shopping list directly. |
| `PATCH` | `/api/plans/{weekId}/checkoff` | Toggle one shopping-list item's checked state. Body: `{ ingredient_ref, recipe_id?, checked }`. |

**Checkoff keying:** checkoff always tracks at **occurrence granularity** — `(ingredient_ref, recipe_id)` — regardless of the ingredient's current `display_mode`, so state survives a mid-trip switch between combined and separate views without needing to un-collapse anything. In **separate** display mode, each occurrence's checkbox maps directly to one `(ingredient_ref, recipe_id)` pair. In **combined** display mode, the UI shows a single checkbox per ingredient, but toggling it omits `recipe_id` from the request, meaning "apply to every occurrence of this `ingredient_ref` in this plan" — letting one endpoint serve both display modes without a schema fork. (Earlier drafts of this endpoint keyed on `ingredient_ref` alone, reasoning that post-normalization there's only one unit per ingredient; that's still true, but doesn't account for needing to check off *individual recipe occurrences* separately, which the combine/separate toggle requires.)

**Why checkoff is a separate, narrow endpoint rather than part of the general `PATCH`:** two people can genuinely hit this concurrently (both in the store at once), and it happens far more often than plan edits. A targeted `{ingredient_ref, checked}` mutation — rather than resubmitting the whole list — minimizes the blast radius of a lost race: worst case, one checkbox toggle gets overwritten, not the whole list. This isn't airtight (Blob writes aren't atomic compare-and-swap), but for a household of four, last-write-wins on an occasional double-tap is an acceptable failure mode, not one worth building optimistic-concurrency machinery for.

## 10. Deferred / v2+ Features

- **Recipe images via the web client.** Sketched but explicitly deferred: a small dynamic image-map blob (`{recipe_id: imageUrl}`) layered on top of the otherwise-static recipe data, populated via a simple upload page backed by Vercel Blob, merged with static recipe content at render time. Keeps the bulk of the dataset static while allowing this one piece to be edited without a redeploy.
- Recipe authoring UI (vs. hand-editing JSON / editing the private repo directly)
- Multi-week history / plan archive
- Ingredient density data for cross-category (volume↔weight) unit conversion
- **Advance-prep / make-ahead steps.** Motivation: cook time estimates often don't account for prep (chopping, marinating) that could be front-loaded earlier in the day, and some recipes (e.g., proofing dough) genuinely require advance lead time rather than just benefiting from it. A tree/DAG model of step dependencies was considered and **rejected for now** — it's the formally correct representation (a step like "assemble" can depend on two independent prior branches, like dough and filling, which is a DAG relationship, not a tree), but it breaks the linear-prose readability that makes the current `{ingredient_id}`-in-step-text model work, and mainly exists to support a critical-path scheduling calculation ("what do I need to start first to have dinner ready at 6") that's a meaningfully bigger feature than just flagging steps. A **phases** model (recipe → linear phases → linear steps, e.g. Dough / Filling / Assembly) was identified as a promising middle ground — mirrors how cookbooks already structure multi-part recipes, avoids merge-point/dependency semantics entirely, and would be a natural place to later hang `advance.eligible` / `advance.required` flags at the phase level. For v1, this is unneeded: sequencing and timing are communicated the normal cookbook way ("meanwhile, in a separate bowl...") within the existing flat, linear step list — no schema change.

## 11. Summary of Key Decisions

- **Public engine / private data split**, driven by the recognition that recipe content carries copyright even after reformatting — the schema and pipeline are open-sourceable; the recipes never are, unless independently authored.
- **Household-wide exclusions by default**, with an optional per-person `applies_to` scope added at the engine level so other adopters with mixed-allergy households aren't forced into this household's simplifying assumption.
- **Free-form `allergen_tags`**, not a hardcoded enum, so the engine doesn't presume any fixed taxonomy of allergens or dietary concerns.
- **Substitutions are a priority-ordered candidate list per ingredient slot**, not a mode-keyed map — each slot lists workable ingredients in preference order, and resolution picks the first candidate that survives the currently active exclusion set. This is recipe-and-slot-scoped, not global (the same ingredient can appear with different, or no, fallbacks across recipes), and naturally handles multiple simultaneous exclusions without needing a combinatorial key per exclusion pairing.
- **Ingredients are a first-class, shared registry**, separate from a recipe's local usage of them — gives shopping-list aggregation a stable identity to key on (avoiding name-string drift), enables shopping-view categorization (produce, dairy, seafood...), and lets intrinsic allergen tags (shrimp → shellfish) be declared once rather than per-recipe. The registry owns identity/intrinsic properties only; the candidate list stays with the recipe usage, not the registry.
- **Hard-stop incompatibility is inferred** from a candidate list where no entry survives the active exclusion set, rather than tracked via a separate boolean flag — and permanent vs. situational exclusions are treated identically at resolution time, both just members of one active-exclusion set.
- **Static, bundled/versioned recipe data** instead of an external recipe API or live database — avoids cost, complexity, and quota-tracking, while still supporting efficient PWA updates via a version-checked single file.
- **Shopping list generation as a pure function pipeline**, fully engine-side and testable independent of any recipe content.
- **Shopping list items carry both a combined total and per-recipe occurrences**, with a computed `combinable` flag (false when units genuinely can't sum, e.g. "1 lb" vs. "4 count" of the same ingredient across recipes) and a user-facing `display_mode` toggle (combined/separate) for the rest — since a valid sum isn't always the most useful shopping unit (e.g. lemon halves vs. a combined 1.5 lemons). Checkoff state tracks at per-recipe-occurrence granularity regardless of display mode, so it survives switching views mid-trip.
- **Git submodule integration** for pulling the private recipe repo into the (potentially public-adjacent) application repo, chosen for minimal new tooling.
