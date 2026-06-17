# CV Analyser

A tool for hiring teams to upload or paste a CV, get an instant diagnostic report (score, strengths, gaps, recommendations), and view analysis history with aggregate stats.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/cv-analyser run dev` — run the frontend (port 18721)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + multer (PDF upload) + unpdf (PDF text extraction)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React 19 + Vite + Wouter + TanStack Query + Recharts + shadcn/ui + Tailwind v4
- Fonts: Plus Jakarta Sans + JetBrains Mono
- Theme: Deep purple primary (250 80% 60%), dot-grid background

## Where things live

- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema/analyses.ts` — analyses table schema (jsonb arrays)
- `artifacts/api-server/src/lib/cv-analyser.ts` — rule-based CV scoring engine
- `artifacts/api-server/src/routes/analyses.ts` — analyses CRUD + upload + stats routes
- `artifacts/cv-analyser/src/pages/` — home (upload/paste), results (score report), history (table + stats)
- `artifacts/cv-analyser/src/index.css` — full theme (colors, fonts, dot-grid background)

## Architecture decisions

- PDF upload is handled separately via `POST /api/analyses/upload` (multipart, multer) — NOT in the OpenAPI spec. Server extracts text with `unpdf`, returns `{ fileName, text }`. Client then posts to `POST /api/analyses` (JSON) to trigger the analysis.
- CV analysis is purely rule-based (keyword matching, regex, section-header detection) — no LLM. Fast, zero cost, deterministic.
- Arrays (strengths, gaps, recommendations, skillsFound) stored as `jsonb` in PostgreSQL via Drizzle's `$type<string[]>()`.
- OpenAPI body schemas use entity-shaped names (`AnalysisInput`) to avoid TS2308 collision with Orval's auto-derived `CreateAnalysisBody` Zod schema.

## Product

- **Home:** Upload a PDF (drag-and-drop or file picker) or paste CV text; one-click analysis
- **Results:** Radial score gauge (0–100), executive summary, detected skills, strengths, gaps, and numbered recommendations
- **History:** Sortable table of past analyses with score badges; aggregate stats (total, average score, top skills, score distribution); per-row delete with confirmation dialog

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `unpdf` package: use `^1.6.2` (version `^0.14.0` does not exist on the registry).
- After any OpenAPI spec change, always re-run `pnpm --filter @workspace/api-spec run codegen` before touching routes or frontend hooks.
- The upload endpoint (`/api/analyses/upload`) is intentionally excluded from the OpenAPI spec — adding it would require multipart schema definitions that complicate codegen.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
