<div align="center">

# Budgie

### A full-stack budgeting app & AI-agentic development testbed

Track balance accounts, budgets, and transactions across bank, wallet, cash,
credit, and investment accounts — with automatic balance reconciliation,
interactive charts, and PDF exports.

[Figma Link](https://www.figma.com/design/SG1k9PApOBrkP6fTuesuGG/Budgie?node-id=1-3&t=TdDVP7rD0L28zh6h-1)

Built as a testbed for **structured AI-agentic development**:
`ARCHITECTURE.md` / `AGENTS.md`-driven workflows, multi-agent collaboration,
CI/CD, and fast feature shipping with rigorous type-safety and testing.

[![License: MIT](https://img.shields.io/badge/License-MIT-00C610?style=flat-square)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Hono](https://img.shields.io/badge/Hono-4-FF6B35?style=flat-square)](https://hono.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Bun](https://img.shields.io/badge/Bun-1.3-000000?style=flat-square&logo=bun&logoColor=white)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-17%20passing-00C610?style=flat-square)](./src/components/account-card.test.tsx)

---

**Project completion: 75%**

`████████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░` 75%

</div>

---

## Why Budgie?

Budgie isn't just another budgeting app. It's a **living blueprint** for how
AI agents and humans can collaboratively build production-grade software. Every
architectural decision is documented, every layer has a hard contract, and every
contribution — human or AI — follows the same structured workflow.

| What | How |
| --- | --- |
| Structured AI development | `AGENTS.md` pins build commands, conventions, and stack rules that every agent reads before writing code |
| Architecture as code | `ARCHITECTURE.md` is a copy-ready blueprint — sections, layer contracts, type-safety chain, gotchas |
| UI/UX as code | `UI_DESIGN.md` pins the entire visual language — color tokens, radius system, motion rules, canonical patterns |
| End-to-end type safety | Prisma schema -> generated Zod -> Hono validation -> typed controllers -> typed RPC client. No `any` in the validated path. |
| Testable by design | 3-layer backend (router -> controller -> service) where services are pure TS — unit-testable without an HTTP server |

## Features

### Done

- **Authentication** — Email/password + Google OAuth + GitHub OAuth via better-auth
- **Dashboard** — Net worth hero with per-character balance reveal animation, account cards grid, cashflow donut chart (pure SVG), 12-month asset growth bar chart with hover tooltips, privacy-first balance masking
- **Balance Accounts** — Full CRUD (bank, digital wallet, cash, credit, investment) with edit dialog and **delete confirm dialog**
- **Transactions** — 3-step add wizard (type -> details -> review), searchable grouped list by date, bottom-sheet detail view, create & delete with automatic balance reconciliation inside a Prisma `$transaction`
- **Automatic balance reconciliation** — Income/expense/transfer auto-updates account balances; delete reverses the effect; insufficient-balance guard prevents negative balances
- **PDF Export** — Client-side PDF generation (all / filtered / date range) via jsPDF + autoTable
- **Premade categories** — Per-type category lists (income/expense/transfer) — users pick from curated lists, no free-text chaos
- **Responsive design** — Mobile-first with fixed bottom nav; desktop reveals a persistent sidebar. Calm minimal fintech aesthetic.
- **Testing** — Vitest + jsdom + Testing Library (17 tests: component + service layer)

### In Progress

- **Budgets UI** — Backend CRUD is live (`/api/budgets`); frontend page is a placeholder
- **Chat** — AI-powered financial assistant (placeholder page)

### Planned

- **CI/CD pipeline** — Automated lint, typecheck, test, build on push
- **Multi-agent orchestration** — Scripts/workflows for parallel agent collaboration
- **Transaction editing** — Intentionally deferred (requires bidirectional re-balancing)

## Tech Stack

| Concern | Choice | Version |
| --- | --- | --- |
| Runtime / package manager | Bun | 1.3.x |
| Web framework | Next.js (App Router, `src/`) | 16.2.9 |
| UI | React | 19.2.x |
| Backend API | Hono (catch-all Route Handler — REST, **not** Server Actions) | 4.12.x |
| ORM | Prisma (+ `@prisma/adapter-pg` driver adapter) | 7.8.x |
| Database | PostgreSQL | — |
| Validation | Zod via `@hono/zod-validator` (auto-generated from Prisma) | 4.4.x |
| Auth | better-auth (email/password + Google + GitHub) | 1.6.x |
| Styling | Tailwind CSS v4 | 4.3.x |
| Testing | Vitest + jsdom + @testing-library/react | 4.x |
| PDF | jsPDF + jsPDF-AutoTable | 4.x / 5.x |
| Lint | ESLint 9 + eslint-config-next | 9.x |

## Quick Start

```bash
# 1. Install dependencies (trusted scripts auto-run)
bun install

# 2. Set up environment variables
cp .env.example .env
# Fill in: DATABASE_URL, DIRECT_URL (prod), BETTER_AUTH_SECRET, OAuth keys (optional)
# Local dev: DATABASE_URL and DIRECT_URL can be the same local Postgres.

# 3. Push schema to DB + generate Prisma client & Zod schemas
bun run db:dev

# 4. Run the dev server
bun run dev
# → http://localhost:3000
```

## Commands

```bash
bun run dev          # start dev server
bun run build        # prisma migrate deploy && prisma generate && next build
bun run lint         # eslint
bun run typecheck    # tsc --noEmit
bun run test         # vitest run (one-shot)
bun run test:watch   # vitest (watch mode)
bun run db:generate  # regenerate Prisma client + Zod schemas
bun run db:migrate   # prisma migrate dev (create + apply migration)
bun run db:push      # push schema without migration history
bun run db:studio    # prisma studio GUI
bun run db:dev       # prisma db push && prisma generate (quick local loop)
```

## Architecture

Budgie separates concerns across two runtimes that share one process:

```
Next.js App Router (RSC / SSR)          Hono REST API (catch-all Route Handler)
        │                                          │
        ▼                                          ▼
  src/app/**                               src/server/**
  - pages (RSC)                             - routes/      (HTTP wiring + zValidator)
  - components/                             - controllers/  (I/O + type mapping)
  - lib/api-client.ts                       - services/     (pure logic + Prisma)
       │                                    - schemas/      (Zod: .pick + .extend)
       │                                    - middleware/    (requireAuth)
       │                                          │
       └───────── typed RPC (hc<App>) ───────────►│
                                                    │
                                                    ▼
                                              Prisma + PostgreSQL
                                          (via @prisma/adapter-pg)
```

**The 3-layer backend contract:**

```
Router  ->  Controller  ->  Service  ->  Prisma
(HTTP)     (I/O + types)   (logic)      (DB)
```

| Layer | Imports Hono? | Imports Prisma? | Knows HTTP? | Knows DB? | userId scoping? |
| --- | :---: | :---: | :---: | :---: | :---: |
| Router | yes | no | yes | no | auth gate only |
| Controller | yes (types) | no | yes | no | reads `c.get("user")` |
| Service | no | yes | no | yes | filters every query |

**Type-safety chain (no `any` in the validated path):**

```
prisma/schema.prisma
   │  generator client  ->  src/generated/prisma        (Prisma types)
   │  generator zod     ->  src/server/schemas/generated (Zod schemas)
   ▼
src/server/schemas/<resource>.ts   (.pick public fields + .extend overrides)
   ▼
routes/<resource>.ts               zValidator("json", CreateSchema)
   ▼
controllers/<resource>.ts          ValidatedContext<T> -> c.req.valid("json"): T
   ▼
services/<resource>.ts             createResource(userId, input: CreateT)
   ▼
src/lib/api-client.ts              hc<App>(baseURL) -> api.resource.$post({ json })
```

### Deep dives

| Document | What it covers |
| --- | --- |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Full architecture reference — request lifecycle, layer contracts, type-safety chain, RPC client usage (SSR gotchas), mounting Hono in Next.js, Prisma 7 + driver adapter, Zod auto-generation, adding a new resource (8-step checklist), gotchas & breaking-change notes |
| [`AGENTS.md`](./AGENTS.md) | AI agent rules — build commands, stack conventions, resource specs, backend/frontend patterns, formatting helpers, UI checklist pointer |
| [`UI_DESIGN.md`](./UI_DESIGN.md) | UI/UX design reference — design philosophy, color tokens, component library, type scale, radius system, layout patterns, motion rules, accessibility, new-UI checklist |

## Project Structure

```
budgie/
├─ src/
│  ├─ app/                        # Next.js App Router
│  │  ├─ dashboard/               # main dashboard (RSC, charts, accounts)
│  │  ├─ transactions/            # list + 3-step add wizard
│  │  ├─ budget/                  # placeholder (backend ready)
│  │  ├─ chat/                    # placeholder
│  │  ├─ sign-in/                 # auth screen
│  │  └─ api/
│  │     ├─ [[...route]]/         # catch-all -> Hono
│  │     └─ auth/[...all]/        # better-auth handler
│  ├─ components/                 # React UI (17 components)
│  ├─ lib/                        # auth, prisma, api-client, format, categories
│  └─ server/                     # ALL backend logic
│     ├─ routes/                  # Layer 1: HTTP wiring
│     ├─ controllers/             # Layer 2: I/O + type mapping
│     ├─ services/                # Layer 3: pure logic + Prisma
│     ├─ schemas/                 # Zod (.pick + .extend on generated)
│     └─ middleware/auth.ts       # requireAuth + AppEnv
├─ prisma/schema.prisma           # datasource + 2 generators (client, zod)
├─ ARCHITECTURE.md                # architecture reference
├─ AGENTS.md                      # AI agent rules
├─ UI_DESIGN.md                   # UI/UX design reference
└─ vitest.config.ts               # test config (jsdom + Testing Library)
```

## Testing

```bash
bun run test          # 17 tests, 2 suites (one-shot)
bun run test:watch    # watch mode for development
```

| Suite | Scope | Cases |
| --- | --- | --- |
| `src/components/account-card.test.tsx` | Component — confirm dialog flow, delete safety, error paths, Escape-during-loading guard | 9 |
| `src/server/services/balance-accounts.test.ts` | Service — ownership scoping, cross-user delete prevention, CRUD contracts | 8 |

Tests are fully deterministic — no real database, no HTTP server, no auth
cookies. All Prisma calls and API clients are mocked at the module level.

## Environment Variables

`.env` (gitignored — copy from `.env.example`):

| Variable | Required | Description |
| --- | :---: | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string (pooled on Neon, used at runtime) |
| `DIRECT_URL` | yes (prod) | Direct PostgreSQL connection string (non-pooled, used by `prisma migrate deploy` at build time). Local dev may equal `DATABASE_URL`. |
| `BETTER_AUTH_URL` | yes | Public app URL (default `http://localhost:3000`) |
| `BETTER_AUTH_SECRET` | yes | Session signing key — generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | no | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | no | Google OAuth |
| `GITHUB_CLIENT_ID` | no | GitHub OAuth |
| `GITHUB_CLIENT_SECRET` | no | GitHub OAuth |
| `NEXT_PUBLIC_APP_URL` | no | SSR base URL for RPC client (defaults to `http://localhost:3000`) |

## Deployment

The `build` script (`prisma migrate deploy && prisma generate && next build`)
automatically applies pending migrations to the production database on every
deploy — no manual migration step needed.

### Vercel + Neon setup

1. **Create a Neon project** → copy both connection strings:
   - **Pooled** (`-pooler` hostname) → `DATABASE_URL` (runtime, serverless)
   - **Direct** (non-`-pooler` hostname) → `DIRECT_URL` (build-time migrations)
2. **Set environment variables** in Vercel → Project Settings → Environment
   Variables (Production):

   | Variable | Value |
   | -------- | ----- |
   | `DATABASE_URL` | Neon pooled connection string |
   | `DIRECT_URL` | Neon direct connection string (non-pooled) |
   | `BETTER_AUTH_URL` | `https://<your-app>.vercel.app` |
   | `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
   | `NEXT_PUBLIC_APP_URL` | Same as `BETTER_AUTH_URL` |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth credentials (optional) |
   | `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth credentials (optional) |

3. **Push to `main`** → Vercel runs `bun run build`:
   - `prisma migrate deploy` applies pending migrations via `DIRECT_URL`
   - `prisma generate` regenerates the client
   - `next build` compiles the app
4. **Serverless functions** use `DATABASE_URL` (pooled) at runtime.

> **Why two URLs?** `prisma migrate deploy` needs a direct connection (PgBouncer
> pooled connections reject DDL). Serverless functions benefit from pooling
> (fewer connections under load). On Neon, the `-pooler` hostname is PgBouncer;
> the direct hostname bypasses it.

New migrations are created locally with `bun run db:migrate --name <name>`,
committed to `prisma/migrations/`, and applied automatically on the next deploy.

## Contributing

This project is designed for **AI-agent-assisted development**. Before writing
any code — human or AI — read these three documents:

1. **[`AGENTS.md`](./AGENTS.md)** — build commands, stack conventions, layer rules
2. **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** — full architecture reference, gotchas
3. **[`UI_DESIGN.md`](./UI_DESIGN.md)** — visual language, component patterns, UI checklist

### Workflow

```
Read AGENTS.md + ARCHITECTURE.md + UI_DESIGN.md
        │
        ▼
   Plan the change
   (understand layer contracts, type-safety chain, UI patterns)
        │
        ▼
   Implement
   (follow conventions, no `any`, no `rounded-md/lg/xl`, reuse tints)
        │
        ▼
   Verify
   bun run lint && bun run typecheck && bun run test
```

### Adding a new resource

Follow the 8-step checklist in [`ARCHITECTURE.md` §13](./ARCHITECTURE.md):
Prisma model -> generate -> app schema (`.pick` + `.extend`) -> service ->
controller -> router -> mount -> verify.

## License

[MIT](./LICENSE) (c) 2026 Arco Zakwan Putra

---

<div align="center">

Built with Next.js, Hono, Prisma, and a lot of structured AI agent collaboration.

</div>
