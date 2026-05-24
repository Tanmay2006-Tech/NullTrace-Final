# NullTrace — AI-Powered DevOps Observability Platform

> Instantly diagnose root causes, correlate logs with metrics, and resolve incidents with confidence. Like Grafana, Datadog, and an expert SRE fused into one.

---

## What is NullTrace?

NullTrace is a full-stack AI-powered DevOps observability platform built for modern engineering teams. It gives you a real-time war room view of your infrastructure — surfacing critical incidents, running AI root cause analysis, correlating logs with service metrics, and suggesting exact remediation commands — all in one dark, fast, purpose-built interface.

---

## Features

### Incident Management
- Real-time incident feed with severity levels (Critical, High, Medium, Low)
- AI-generated Root Cause Analysis (RCA) with confidence scores
- Suggested `kubectl` / shell remediation commands per incident
- Incident timeline tracking with status transitions
- Affected service correlation per incident

### System Dashboard
- Live system health score (0–100%)
- AI insight feed with anomaly summaries
- Service dependency heatmap
- Active incident summary widget
- Pod status overview

### Services
- Full microservice catalog with health status
- Per-service latency, error rate, and request throughput metrics
- Pod replica count and health tracking

### Metrics
- Time-series latency, error rate, and throughput charts
- Per-service breakdown
- Historical trend analysis

### Logs
- Searchable, filterable log stream across all services
- Log level filtering (DEBUG, INFO, WARN, ERROR)
- AI log analysis for pattern detection

### AI Assistant
- Chat interface backed by an AI inference engine
- Ask questions about your infrastructure in plain English
- Context-aware answers based on live service and incident data

### Sign-In
- Demo credentials pre-filled for instant access
- Credential validation with clear error messaging

---

## Demo Access

| Field    | Value                  |
|----------|------------------------|
| Email    | `demo@nulltrace.io`    |
| Password | `demo1234`             |

On the sign-in page, click the **Demo Account** banner to auto-fill credentials instantly.

---

## Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Frontend     | React 19, Vite, TypeScript, Tailwind CSS v4     |
| UI Components| shadcn/ui, Radix UI, Lucide Icons               |
| Data Fetching| TanStack React Query, Orval-generated hooks     |
| Routing      | Wouter                                          |
| Backend      | Express 5, Node.js 24, TypeScript               |
| Database     | PostgreSQL + Drizzle ORM                        |
| Validation   | Zod v4, drizzle-zod                             |
| API Contract | OpenAPI 3.0, Orval codegen                      |
| Build        | esbuild (server CJS), Vite (client)             |
| Monorepo     | pnpm workspaces                                 |

---

## Project Structure

```
/
├── artifacts/
│   ├── nulltrace/          # React+Vite frontend
│   │   ├── src/
│   │   │   ├── pages/      # 9 route pages
│   │   │   ├── components/ # Sidebar, Topbar, shared UI
│   │   │   └── lib/        # Utilities
│   │   └── public/         # Static assets (logo, favicon)
│   └── api-server/         # Express 5 backend
│       └── src/
│           ├── routes/     # REST API route handlers
│           ├── lib/        # DB client, logger, helpers
│           └── middlewares/ # Auth, error handling
├── lib/
│   ├── db/                 # Drizzle schema + migrations
│   ├── api-spec/           # OpenAPI specification
│   └── api-client-react/   # Orval-generated React Query hooks
└── scripts/                # Utility scripts
```

---

## API Endpoints

| Method   | Endpoint                      | Description                          |
|----------|-------------------------------|--------------------------------------|
| `GET`    | `/api/healthz`                | Health check                         |
| `GET`    | `/api/incidents`              | List all incidents                   |
| `POST`   | `/api/incidents`              | Create a new incident                |
| `GET`    | `/api/incidents/summary`      | Incident summary counts              |
| `GET`    | `/api/incidents/:id`          | Get single incident                  |
| `PATCH`  | `/api/incidents/:id`          | Update incident status               |
| `POST`   | `/api/incidents/:id/rca`      | Trigger AI root cause analysis       |
| `GET`    | `/api/incidents/:id/timeline` | Incident timeline events             |
| `GET`    | `/api/services`               | List all services with health        |
| `GET`    | `/api/metrics`                | Time-series metrics data             |
| `GET`    | `/api/metrics/health-score`   | Overall system health score          |
| `GET`    | `/api/logs`                   | Query logs with filtering            |
| `POST`   | `/api/logs/analyze`           | AI-powered log analysis              |
| `GET`    | `/api/pods`                   | Pod status across services           |
| `GET`    | `/api/heatmap`                | Service dependency heatmap data      |
| `GET`    | `/api/ai/insights`            | Latest AI-generated anomaly insights |
| `POST`   | `/api/ai/chat`                | AI assistant chat endpoint           |

---

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 9+
- PostgreSQL database

### Environment Variables

| Variable       | Description                    |
|----------------|--------------------------------|
| `DATABASE_URL`  | PostgreSQL connection string  |
| `SESSION_SECRET`| Session signing secret        |
| `PORT`          | Service port (set by Replit)  |

### Run Locally

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm --filter @workspace/db run push

# Start the API server (port 5000)
pnpm --filter @workspace/api-server run dev

# Start the frontend (separate terminal)
pnpm --filter @workspace/nulltrace run dev
```

### Codegen (after OpenAPI spec changes)

```bash
pnpm --filter @workspace/api-spec run codegen
```

### Typecheck

```bash
pnpm run typecheck
```

---

## Architecture Decisions

- **Contract-first API** — The OpenAPI spec in `lib/api-spec` is the single source of truth. All React Query hooks and Zod validation schemas are generated from it via Orval, keeping client and server perfectly in sync.
- **Drizzle ORM** — Chosen over Prisma for its lightweight footprint, TypeScript-native query builder, and direct SQL control where needed.
- **Wouter routing** — Minimal client-side router (~2kb) over React Router for a leaner bundle.
- **Tailwind v4** — Dark mode applied via `document.documentElement.classList.add("dark")` in JS rather than `@apply dark`, since `dark` is a variant not a utility class in v4.
- **Glassmorphism UI** — All cards use `glass-card` with backdrop blur and semi-transparent borders to reinforce the dark, futuristic war room aesthetic.

---

## Pages

| Route              | Page               | Description                              |
|--------------------|--------------------|------------------------------------------|
| `/`                | Landing            | Marketing page with feature overview     |
| `/signin`          | Sign In            | Demo-credential login                    |
| `/dashboard`       | Dashboard          | System overview, RCA panel, AI insights  |
| `/incidents`       | Incidents          | Full incident list with filters          |
| `/incidents/:id`   | Incident Detail    | Deep-dive view with timeline and RCA     |
| `/services`        | Services           | Microservice catalog and health status   |
| `/metrics`         | Metrics            | Time-series charts per service           |
| `/logs`            | Logs               | Live log stream with search and filters  |
| `/ai-chat`         | AI Assistant       | Plain-English infrastructure chat        |

---

## Design System

- **Color palette** — Neon blue (`#3b82f6`) and purple (`#8b5cf6`) accents on a deep dark background
- **Typography** — Inter font, tight tracking for headings, monospace for code/log output
- **Glow effects** — `neon-text-blue`, `neon-border-blue`, `neon-border-purple` utility classes
- **Blink animation** — `animate-blink` for live status indicators
- **Glass cards** — `glass-card` class with `backdrop-blur-md` and `bg-white/5` layering

---

## Contributing

1. Fork the repo and create a feature branch
2. Run `pnpm run typecheck` before committing
3. Follow the contract-first approach — update the OpenAPI spec before adding new routes, then run codegen
4. Keep route handlers thin — push business logic into `lib/` helpers

---

## License

MIT — free to use, modify, and deploy.

---

<p align="center">Built with React, Express, and PostgreSQL on Replit</p>
