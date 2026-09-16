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

**Decision:** Vercel Serverless Functions (plain TypeScript files in `api/`).

**Evaluated:**

- **Next.js** — app-router and server-component conventions are noise for a single-page tool with 4 API endpoints.
- **Express** — requires a persistent server; adds ops burden (VPS, container, or a paid hosting tier).

**Chosen because:** Vercel Functions are zero-ops, scale to zero, free on Hobby tier, and the 4-endpoint API surface fits the file-per-route convention without ceremony. Vercel Blob integration (used for checkoff sync) is first-class on the same platform.

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

## Checkoff sync strategy

**Decision:** Vercel Blob, last-write-wins.

**Evaluated:**

- **Upstash (Redis)** — more infrastructure than needed for occasional concurrent writes between two phones.
- **Vercel KV / Postgres** — both deprecated Dec 2024 in favor of Upstash and Neon respectively.
- **Optimistic concurrency / compare-and-swap** — not worth the machinery for a household of four where worst case is one checkbox toggle getting overwritten.

**Chosen because:** Blob storage is sufficient for the low-stakes, low-frequency read/write pattern. Last-write-wins on an occasional double-tap is an acceptable failure mode.
