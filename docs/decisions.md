# Decisions Log

Evaluated alternatives and the reasoning behind what was chosen or rejected. Recorded so we don't re-litigate settled questions.

---

## TypeScript version

**Decision:** Pin to `^5.9.3` (latest stable 5.x).

**Evaluated:** TypeScript 7.0.2 (latest at project start, Sept 2026).

**Rejected because:** `typescript-eslint` 8.x stable requires `typescript <6.1.0`. Only alpha builds of `typescript-eslint` support TS 7. Using alpha tooling in a greenfield project trades a minor version bump for ongoing instability.

**Revisit when:** `typescript-eslint` ships a stable release with TS 7 support.

---

## API server

**Decision:** Single Express app at `api/index.ts`, deployed as one Vercel Serverless Function. All `/api/*` traffic is routed to it via a `vercel.json` rewrite.

**Evaluated:**

- **Vercel Serverless Functions (file-per-route)** — originally chosen, but abandoned. Vercel bundles each `api/` file in complete isolation; any relative import to a shared helper outside that file fails at runtime with `ERR_MODULE_NOT_FOUND`. There is no reliable way to share code across per-file handlers without inlining everything (tried `api/_lib/`, `src/lib/` with `includeFiles` in `vercel.json` — both failed).
- **Hono** — evaluated briefly as a lightweight alternative; rejected because `hono/vercel` with `export const config = { runtime: 'nodejs' }` caused `vercel dev` to hang indefinitely with a 30s timeout (`HeadersTimeoutError` from undici on blob calls). Less battle-tested than Express.
- **Next.js** — app-router and server-component conventions are noise for a single-page tool.

**Chosen because:** Express is well-trodden, a single entry point sidesteps the bundling isolation problem entirely, and shared helpers are just regular module-level functions. The `vercel.json` rewrite `{ "source": "/api/(.*)", "destination": "/api/index" }` routes all traffic correctly in both `vercel dev` and production.

---

## UI framework

**Decision:** Vite + React, matching the SpaceLab reference codebase.

**Evaluated:** Next.js (see API server entry above — rejected for the same reasons).

**Chosen because:** Vite is fast, simple, and the patterns established in the frontend conventions (§12 of design-doc.md) were drawn directly from a Vite + React project.

---

## Project split

**Decision:** Single app repo + private content repo as a git submodule (`content/`).

**Evaluated:**

- **Engine / app monorepo** (two npm packages) — the split would have been about code organization, not IP. Adds workspace build orchestration with no real benefit.
- **Fully separate repos with npm package** — more tooling (publishing, versioning) than warranted before the engine API is stable.

**Chosen because:** the meaningful boundary is code vs. recipe data (IP concern), not pipeline logic vs. UI. All code lives in this repo; recipe JSON lives in the private `mealemon-content` repo and joins via submodule at build time. The app builds without the submodule against fixture data.

---

## Authentication

**Decision:** Recorded in the content repo (`content/decisions.md`) — contains security-sensitive details about the credential scheme.

---

## Plan data model

**Decision:** Named plans with a `planning` → `shopping` → `done` lifecycle, stored individually as private Vercel Blob files (`plans/<id>.json`) with a lightweight index at `plans/index.json`.

**Evaluated:**

- **Week-keyed single plan** (original design) — `plans/{weekId}` as the API surface. Abandoned because it doesn't handle "start a new plan at any time" or "finish shopping one plan while starting the next." The week boundary is arbitrary and creates edge cases.
- **Active plan + meal history** — a single active plan plus a rolling log of archived meals. Abandoned because it made edge cases harder (e.g. checking off items then modifying the plan mid-trip) and was harder to reason about than explicit lifecycle states.

**Chosen because:** explicit named plans with a lifecycle make the state machine clear. A plan starts in `planning` (shopping list is dimmed, you're still adding recipes), moves to `shopping` (list is live, you're in the store), and finishes as `done` (deletable). Multiple plans can coexist; only one is "active" (the most recently navigated to) at a time in the UI.

**How to apply:** see `src/lib/schema.ts` for `Plan`, `PlanSummary`, `PlanIndex` types. API endpoints are in `api/index.ts`. Frontend state is in `src/store/plansSlice.ts`.

---

## Checkoff sync strategy

**Decision:** Vercel Blob, last-write-wins.

**Evaluated:**

- **Upstash (Redis)** — more infrastructure than needed for occasional concurrent writes between two phones.
- **Vercel KV / Postgres** — both deprecated Dec 2024 in favor of Upstash and Neon respectively.
- **Optimistic concurrency / compare-and-swap** — not worth the machinery for a household of four where worst case is one checkbox toggle getting overwritten.

**Chosen because:** Blob storage is sufficient for the low-stakes, low-frequency read/write pattern. Last-write-wins on an occasional double-tap is an acceptable failure mode.
