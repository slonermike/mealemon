# Import Recipe

Encode one or more recipes from any source (PDF, pasted text, URL excerpt, etc.) into the mealemon JSON schema. For a single recipe, ask one consolidated round of questions then write. For a batch, process all recipes first, collect all ambiguities across the batch into one round of questions, then write everything.

## Household exclusions (always active)

- **gluten** — pasta, bread, flour, soy sauce, wheat-based thickeners, malt vinegar
- **nightshade** — tomatoes, peppers (all types), potatoes, potato starch, paprika, cayenne, chili powder, Worcestershire sauce, hot sauce, ketchup, many spice blends
- **shellfish** — shrimp, crab, lobster, scallops, clams, oysters

---

## Step 1 — Process all recipes

For each recipe, do all of the following internally without pausing:

### 1a. Extract

- Title, servings, ingredient list (name, amount, unit), steps verbatim.
- Note: if servings are a range (e.g. "serves 2–4"), flag for the review round.

### 1b. Encode ingredients

For every ingredient, make a judgment call using the rules below. Only flag for human review when genuinely uncertain (see "What to flag" section).

**Allergen tagging — the "could contain" rule:**
If an ingredient _could plausibly_ contain a household contaminant, tag it and add a restricted-variant candidate. Do not require certainty — err on the side of caution.

High-risk categories to check every time:

- Spice blends → nightshade risk (paprika/cayenne). Ask: does a nightshade-free version exist as a real product or simple swap? If yes (Italian seasoning, taco seasoning, Cajun seasoning, curry powder), add a `-nightshade-free` variant. If nightshade is definitional to the blend and no meaningful substitute exists (Old Bay, chili powder, paprika, cayenne, harissa, berbere), encode as a single candidate with the nightshade tag only.
- Processed/cured meats (sausage, salami, pepperoni, hot dogs, deli meat, bacon) → nightshade risk; add `-nightshade-free` variant
- Broths and stocks → nightshade + gluten risk; use `chicken-broth` + `chicken-broth-safe` or `vegetable-broth` + `vegetable-broth-safe` pattern
- Sauces and condiments (soy sauce, teriyaki, hoisin, Worcestershire, BBQ sauce) → gluten or nightshade risk; add appropriate variant
- Flavored or smoked cheeses → nightshade risk (paprika); add `-nightshade-free` variant if applicable
- Pre-marinated proteins → unknown; flag for review

**Three candidate patterns:**

1. **Substitute** — different ingredient serves the same role:
   - Gluten: `rotini-pasta` `["gluten"]` → `rotini-pasta-gf` `["nightshade"]` → `rotini-pasta-chickpea` `[]`
   - Processed meat: `pork-sausage` `["nightshade"]` → `bratwurst-nightshade-free` `[]`

2. **Restrict-variant** — same ingredient, labeled-safe version:
   - Spice blend: `italian-seasoning` `["nightshade"]` → `italian-seasoning-nightshade-free` `[]`
   - Broth: `chicken-broth` `["nightshade", "gluten"]` → `chicken-broth-safe` `[]`
   - ID pattern: `{base-id}-nightshade-free`, `{base-id}-gluten-free`, `{base-id}-safe` (use `-safe` when multiple risks apply)

3. **Omit** — ingredient can be left out entirely:
   - Set `omissible: true` on the slot
   - Use for garnishes, optional toppings, pure flavor accents (herb sprinkles, optional nuts, citrus squeeze)
   - Do NOT use for proteins, starches, primary vegetables, or sauce bases

**Preference substitutions:**

- Add preference tag to base candidate (e.g. `["tree-nut", "walnut"]`), preferred alternative as next candidate

**Registry entries:**

- Check `content/ingredients.json` for existing IDs before creating new ones
- New entries: use kebab-case IDs, assign `category` (produce / meat / dairy / dairy-alt / pantry / frozen / bakery), `unit_family` (weight / volume / count), and `default_allergen_tags`
- Restricted variants always have `default_allergen_tags: []`

### 1c. Encode steps

- Assign slot IDs starting at `0001`
- Replace all ingredient mentions with slot references (`{0001}`, etc.)
- Preserve original wording; do not paraphrase
- Add `timer_seconds` for any step with a stated or implied time; use midpoint of a range
- Note any unclear instructions for the review round

### 1d. Compatibility check (internal)

A slot with only nightshade-tagged candidates is **not** an incompatibility — nightshade is a per-person exclusion and the recipe is still valid for family members without that restriction. Tag the slot correctly and move on.

Only flag for review if a slot has **no surviving candidate for everyone** regardless of any exclusion mode — meaning the ingredient itself is problematic with no fallback (e.g. a required shellfish ingredient with no substitute, or a structural ingredient that cannot be sourced in any form). Do not silently mark such a slot omissible; ask what to do.

---

## Step 2 — Consolidated review round

After processing all recipes, use AskUserQuestion to ask about all genuine ambiguities in a single call — one question per ambiguity, up to 4 questions per call. If there are more than 4, ask in batches. Wait for all responses before writing any files.

**Flag for review:**

- Ambiguous servings (range given, no obvious default)
- Unclear step instructions where you cannot make a confident interpretation
- Pre-marinated proteins or novel processed ingredients where allergen content is unknown
- Any slot with no surviving candidate after exclusions — ask what to do, don't decide unilaterally
- New ingredient IDs you're uncertain how to categorize
- Anything that surprised you — unexpected allergen risk, unusual ingredient, structural oddity

**Do not flag:**

- Standard fresh produce, dairy, pantry staples with no allergen risk
- Known allergen patterns already in the rules above (spice blends, broths, processed meats)
- Minor wording clarifications you can resolve confidently
- Whether to add tree-nut tags (always add them; it's not a household exclusion but correct tagging costs nothing)

**How to phrase questions:**

- Use a short `header` (≤12 chars) identifying the recipe + ingredient, e.g. "Brit Bkfst" or "Tomato slot"
- Provide 2–4 concrete options covering the most likely choices
- Keep option labels short; use the description field for consequences
- "Other" is always available automatically for freeform answers — don't add it as an explicit option

---

## Step 3 — Write files

After the review round is resolved (or immediately if there was nothing to flag):

### 3a. New registry entries

Add all new ingredient IDs to `content/ingredients.json` in alphabetical order within the registry object.

### 3b. Recipe files

Write each recipe to `content/recipes/{recipe-id}.json`:

```json
{
  "schema_version": 1,
  "id": "recipe-id",
  "title": "Full Recipe Title",
  "base_servings": 4,
  "ingredients": [
    {
      "id": "0001",
      "candidates": [
        {
          "ingredient_ref": "base-ingredient",
          "amount": 1,
          "unit": "tsp",
          "allergen_tags": ["nightshade"]
        },
        { "ingredient_ref": "base-ingredient-nightshade-free", "amount": 1, "unit": "tsp" }
      ]
    },
    {
      "id": "0002",
      "omissible": true,
      "candidates": [
        {
          "ingredient_ref": "optional-topping",
          "amount": 0.25,
          "unit": "cup",
          "allergen_tags": ["tree-nut"]
        }
      ]
    }
  ],
  "steps": [
    {
      "id": "s1",
      "title": "Step title",
      "content": "Instructions with {0001} and {0002} slot references.",
      "timer_seconds": 300
    }
  ]
}
```

Omit `allergen_tags` on a candidate when the registry default is already correct. Omit `timer_seconds` when no time is stated or implied.

### 3c. Final compatibility report

After writing all files, confirm:

- Every slot in every recipe has at least one candidate surviving household exclusions
- All `ingredient_ref` values exist in `content/ingredients.json`

Report as a brief summary: recipes written, new registry entries added, any remaining caveats.
