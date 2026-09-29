# Mealemon

Read [`docs/design-doc.md`](docs/design-doc.md) before any change. For anything visual, read [`docs/DESIGN.md`](docs/DESIGN.md) and use tokens from `src/theme.ts`.

## Commands

- `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run format:check`
- `npm ci` may fail because the lockfile is out of sync; `npm install --no-package-lock` works locally.

## UI conventions

- Styles are inline `React.CSSProperties`, colors/type from `src/theme.ts`; no hard-coded hex values in components.
- Meet the accessibility rules in `docs/DESIGN.md` (contrast, 44px targets, icon + text for status, real form controls).
