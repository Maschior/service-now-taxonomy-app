# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Note: `AGENTS.md` (and its mirror at `.agents/AGENTS.md`) is the canonical, actively-maintained instructions file for this repo, written in Portuguese. This file summarizes the same ground for Claude Code; if the two ever diverge, treat `AGENTS.md` as the source of truth and update this file to match.

## Project Overview

Service Now Taxonomy App — a full-stack app for managing ServiceNow incident classification taxonomy. It guides support analysts in building standardized **Short Descriptions** and **Resolution Notes**, and records a history of ticket closures.

Taxonomy hierarchy: `Application (1) ──> Module (N) ──> Incident (M) ──> Action (M)`

- Generated Short Description: `Application:Module:Local Support:Incident:Action`
- Generated Resolution Notes: selected tags followed by free-text fields (`Motivo`, `Análise`, `Solução`).

## Commands

All commands are run from `server/` or `client/` respectively — there is no root-level package.json/script runner.

### Backend (`server/`)
```bash
npm run dev        # Express + ts-node/esm, requires a real MongoDB (see .env)
npm run dev:mock   # Express with an in-memory MongoDB (mongodb-memory-server), auto-seeds data — preferred for local dev
npm run build      # tsc compile to dist/
npm run start      # run compiled dist/server.js
npm run seed       # seed DB with example taxonomy data (node --loader ts-node/esm src/routes/seed.ts)
npm run test       # vitest run
```
Run a single backend test file: `npx vitest run src/tests/workspaceAndCascade.test.ts`

### Frontend (`client/`)
```bash
npm run dev        # Vite dev server (port 5173)
npm run build      # tsc && vite build
npm run lint       # eslint src --ext ts,tsx
npm run test       # vitest (watch mode)
```
Run a single frontend test file: `npx vitest run src/components/TabBar.test.tsx`

### Type-checking without emitting (useful since node_modules may only exist inside Docker)
```bash
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit
```

### Docker (full stack: client + server + MongoDB)
```bash
docker-compose up --build
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:5005 (configured via `PORT` env var, default in `.env.example` is 5000 — docker-compose overrides to 5005)

## Architecture

### Backend (`server/src`)
- Express + TypeScript compiled to **ES Modules**. Mongoose ODM over MongoDB.
- **Local imports must include the explicit `.js` extension** (e.g. `import { connectDB } from './utils/db.js'`), even though the source files are `.ts`. This is required by the ESM/Node loader config and omitting it is a runtime error, not just a lint warning.
- `server.ts` wires up routers under `/api/*`: `applications`, `modules`, `incidents`, `actions`, `tags`, `import` (CSV bulk import), `closures`, `auth`, `users`. A `/health` endpoint exists for liveness checks.
- `middleware/auth.ts` — `requireAuth` (JWT bearer token, sets `req.user = { id, role }`) and `requireAdmin` (checks `role === 'ADMIN'`).
- `middleware/workspace.ts` — `requireWorkspace` resolves the multi-tenant context (see Workspace model below) from the `x-workspace-id` header, attaching `currentWorkspaceId`, `globalWorkspaceId`, `accessibleWorkspaceIds` to the request.
- `middleware/validation.ts` — every route accepting a payload must register a validator here and chain `validateRequest` to produce consistent validation error responses.
- `USE_MEMORY_DB=true` (set by `npm run dev:mock`) spins up `mongodb-memory-server` and auto-runs `performSeed()` from `routes/seed.ts` on startup.

### Frontend (`client/src`)
- Vite + React + TypeScript. Routing via `react-router-dom` in `App.tsx`, with `ProtectedRoute`/`AdminRoute`/`PublicRoute` wrappers gated on `AuthContext`.
- State: Zustand store (`store/useTaxonomyStore.ts`) manages multi-tab taxonomy form state (`Tab[]`, each with its own `TaxonomyFormData`), persisted via `zustand/middleware persist`.
- Styling is hand-written Vanilla CSS (`index.css`, CSS variables for theming) plus Tailwind utility classes in JSX — there is no component library.
- API calls go through typed services (`services/api.ts`, `services/authApi.ts`) using Axios.
- Pages live in `pages/`; entity CRUD admin screens are the `components/Manage*.tsx` family (Applications, Modules, Incidents, Actions, Tags, Users), all rendered inside `ThreeColumnLayout`.

### Multi-tenancy: Workspaces & Global Inheritance
This is the most important cross-cutting design decision in the codebase — read `.agents/WORKSPACE_SDD.md` in full before touching auth, queries, or workspace-related frontend state. Summary of the non-negotiable rules:

1. **Explicit Global workspace**: there is a real `Workspace` document with `isGlobal: true` — it is never inferred from `null`/missing fields, to avoid malformed requests silently turning local items global.
2. **Tree = Global + Current workspace, always.** A user's visible taxonomy tree is the strict union of the Global tree and their current workspace's tree. Frontend slicers depend on this union always being complete and consistent.
3. **Cascading soft delete only.** Records are never hard-deleted; they get `isActive: false`. Deactivating a parent (e.g. an Application) must cascade `isActive: false` to all descendants (Modules → Incidents → Actions) via a Mongoose hook, or you get orphaned records in the UI.
4. **Uniqueness key is `(name, parentId)`**, and on create the backend must check for collisions across **both** the current workspace and Global — not just the current workspace.
5. **No local children of global... no wait — inverted**: a **Global** entity may only have a **Global** parent (prevents orphaning every other workspace if a global child's local parent gets deactivated). A **Local** entity can have either a Local or Global parent.
6. **Global items are read-only** outside of the Global workspace admin view — no per-workspace "hide global item" feature exists or should be added.
7. **Frontend localStorage cache key must include the workspace id** (e.g. `taxonomy-store-{workspaceId}`) to avoid state bleeding across workspaces when switching.

### Data model notes
- `Application ──> Module` is **1:N**, not N:M, even though module names repeat across applications (e.g. "Financeiro" exists under multiple apps). This is intentional: modeling it as many-to-many caused incident leakage between applications through a shared module. The fix is DB-level distinct module documents per application, **grouped by name in the frontend only** (`uniqueFilteredModuleNames`). When a module chip is clicked: if an application is already selected, resolve the module doc scoped to that application; if not, pick the first module with that name and auto-resolve its application; if the user then switches application while a module is selected, re-resolve the module id for the new application while preserving the selected module *name* if it exists there.
- Cascading selection (`autoSelectChain` helper) is **top-down** (Application → Module → Incident → Action filters availability) and **bottom-up highlighting** (selecting a lower-level item highlights its ancestors via `highlightedIncidentIds`/`highlightedModuleNames`/`highlightedAppIds`) — these are two distinct, separate mechanisms, don't conflate them.
- `Closure` model records ticket closures: `shortDescription`, `resolutionNotes`, optional refs to `applicationId`/`moduleId`/`incidentId`/`actionId`, a `tags` ref array, and free-text `motivo`/`analise`/`solucao`. Created via `POST /api/closures`, validated by `closureValidation` middleware.

## Conventions

- Do not commit automatically after finishing a task — only run `git commit` when the user explicitly asks for it.
- New backend routes that accept a payload must add a validator in `server/src/middleware/validation.ts` and chain `validateRequest`.