# UI design

Visual and accessibility rules for the app. Values live in [`src/theme.ts`](../src/theme.ts) — import from there, never hard-code a hex.

## Identity

Warm off-white ground, ink text, **Fraunces** for tab titles and plan names, **Figtree** for everything else. Each tab owns one accent and a pale tint for its header band; the bottom nav repeats it, so you can tell where you are without reading.

| Tab      | Accent               | Meaning                 |
| -------- | -------------------- | ----------------------- |
| Recipes  | Olive `#3E6A27`      | Browse, add to plan     |
| Shopping | Harbor `#1D5C8C`     | In the store            |
| Plans    | Terracotta `#A34A1B` | Organise, review, start |

Shared building blocks: `TabHeader` (tinted band with eyebrow, title, right-hand action), `icons.tsx` (inline stroke SVG, no emoji), `ServingsStepper`, `ModeToggleList` (exclusion chips), `DefaultsSheet` (plan defaults bottom sheet).

## Rules

- **Status is never color alone.** Every status has an icon _and_ a word, plus a distinct fill, outline or shape. Selected chips = solid fill + check; unselected = outline + plus.
- **Contrast:** text >= 4.5:1 (3:1 at 24px+). Muted text is `#5B574D` (6.7:1 on the ground) — do not go lighter for anything a user needs to read, including checked-off items and captions.
- **Targets:** every control is >= 44px; shopping rows are 48px.
- **Real controls:** `<button>`, `<a>`/`Link`, `<input type="checkbox">` with a label. Never nest a link inside a button — the recipe row's expand button and "open recipe" link are siblings.
- **Focus:** a 3px ink outline on every focusable element (set globally in `index.html`).
- **Announce changes:** the shopping progress bar is a `progressbar`, save status and the defaults summary are `status` regions, the active nav item has `aria-current="page"`.
- **Dialogs** use Radix (`@radix-ui/react-dialog`) for focus trapping and Escape; the rest of the page is inert while one is open.
- Form inputs are 16px so iOS doesn't zoom.

## Scope semantics shown in the UI

- Default servings are global (all plans). Exclusions are per plan — the defaults sheet says "Only for <plan name>".
- A recipe card shows a "No <tag>" badge only for exclusions that are relevant to that recipe.

## Not built (in the original design exploration)

Recipe search, and plan-card extras (servings total, cart progress). Add them when the data exists.
