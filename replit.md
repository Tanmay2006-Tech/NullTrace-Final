<<<<<<< HEAD
# NullTrace

AI-powered DevOps platform and SRE Incident Root Cause Analyzer — monitor infrastructure in real time, detect failures with AI, and get plain-English root cause explanations.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/nulltrace run dev` — run the React frontend (port 23099, proxied at `/`)
=======
# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
>>>>>>> 1de22a6 (Initial commit)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
<<<<<<< HEAD
- Optional env: `OPENAI_API_KEY` — enables real GPT-4o-mini AI analysis (falls back to mock responses if absent)
=======
>>>>>>> 1de22a6 (Initial commit)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
<<<<<<< HEAD
- Frontend: React + Vite + shadcn/ui + framer-motion + recharts
=======
>>>>>>> 1de22a6 (Initial commit)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
<<<<<<< HEAD
- AI: OpenAI GPT-4o-mini (with graceful mock fallback)

## Where things live

- `artifacts/nulltrace/` — React+Vite frontend, dark cockpit theme (Space Grotesk + JetBrains Mono)
- `artifacts/api-server/` — Express API server
- `artifacts/api-server/src/routes/` — incidents, logs, services, metrics, ai route handlers
- `lib/db/src/schema/` — Drizzle ORM schema (incidents, logs, services, timeline_events)
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not edit)

## Architecture decisions

- Contract-first API: OpenAPI spec drives all type generation. Run `codegen` after any spec change.
- AI routes gracefully degrade: if `OPENAI_API_KEY` is absent, realistic mock responses are returned so the app works fully in demo mode.
- Metrics are generated dynamically (time-series math) — no DB storage needed for ephemeral monitoring data.
- Live logs use polling (3s interval) via the generated `useGetLiveLogs` hook — no WebSocket complexity.
- All pages use Orval-generated hooks from `@workspace/api-client-react` — no manual fetch/axios calls.

## Product

- **Landing page** — hero with animated gradient, cockpit-style terminal preview, feature cards, CTA
- **Dashboard** — severity summary cards, active incidents list, service health panel, CPU/memory/error charts, live log terminal
- **Incidents** — searchable/filterable incident table with severity and status badges
- **Incident Detail** — AI root cause analysis, plain-English explanation, confidence score, affected services, suggested fixes, kubectl commands, timeline reconstruction, log viewer
- **AI Chat Console** — ChatGPT-like SRE assistant with suggested prompts, session tracking, related incident links
- **Metrics** — CPU, memory, latency, error rate, request volume charts + pod/container health table + service status grid

## User preferences

- Dark mode only (no light mode toggle)
- Space Grotesk font for UI, JetBrains Mono for code/logs/terminals
- Neon blue (#3b82f6) and purple (#8b5cf6) accent palette on near-black backgrounds

## Gotchas

- `@import url(...)` for Google Fonts MUST be the very first line of `index.css` (before `@import "tailwindcss"`)
- `useQueryClient` must be imported from `@tanstack/react-query`, not from `@workspace/api-client-react`
- API routes handle their full `/api/...` base path (the proxy does NOT rewrite paths)
- Run `pnpm --filter @workspace/db run push` after any schema change to `lib/db/src/schema/`
- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change
=======

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._
>>>>>>> 1de22a6 (Initial commit)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
