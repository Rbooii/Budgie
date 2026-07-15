# Budgie

A personal budgeting app — track balance accounts, budgets, and transactions
across bank, wallet, cash, credit, and investment accounts.

## Stack

| Concern        | Choice                                                       |
| -------------- | ------------------------------------------------------------ |
| Runtime / pm   | Bun                                                          |
| Web frontend   | Next.js 16 (App Router, `src/`) + React 19                   |
| Backend API    | Hono mounted as a catch-all Route Handler (`src/app/api/[[...route]]/`) — REST, not Server Actions |
| ORM            | Prisma 7 (+ `@prisma/adapter-pg` driver adapter)             |
| Database       | PostgreSQL                                                   |
| Validation      | Zod via `@hono/zod-validator` (auto-generated from Prisma)    |
| Auth           | better-auth (email/password + Google + GitHub)               |
| Styling         | Tailwind CSS v4                                              |
| Lint / types    | ESLint 9 + `eslint-config-next`; `tsc --noEmit`              |

All backend logic lives in `src/server/` (routes → controllers → services →
Prisma). The frontend talks to it via the typed RPC client `api` from
`src/lib/api-client.ts` (`hc<App>` from `hono/client`), end-to-end type-safe.

## Getting started

```bash
bun install                 # install (trusted scripts auto-run)
cp .env.example .env       # then fill in DATABASE_URL, BETTER_AUTH_SECRET, OAuth keys
bun run db:dev             # push schema to DB + generate Prisma client & Zod
bun run dev                 # http://localhost:3000
```

## Common commands

```bash
bun run dev                 # next dev
bun run build               # prisma generate && next build
bun run lint                # eslint
bun run typecheck           # tsc --noEmit
bun run db:generate         # regenerate Prisma client + Zod schemas
bun run db:migrate          # prisma migrate dev (create + apply migration)
bun run db:push             # push schema without migration history
bun run db:studio           # prisma studio GUI
bun run db:dev              # prisma db push && prisma generate  (quick local loop)
```

## Environment

`.env` (gitignored):
- `DATABASE_URL` — Postgres connection string.
- `BETTER_AUTH_URL` — public app URL (default `http://localhost:3000`).
- `BETTER_AUTH_SECRET` — JWT/session signing key (`openssl rand -base64 32`).
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth (optional).
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — GitHub OAuth (optional).
- `NEXT_PUBLIC_APP_URL` — read by `api-client.ts` during SSR for the absolute
  `/api` base URL (defaults to `http://localhost:3000`).

## Using the API client (`api`)

Import and call — routes and body shapes are fully typed against the Hono
`App` type exported from `src/server/index.ts`:

```ts
import { api } from "@/lib/api-client";

// Client component — cookies auto-attached
const res = await api["balance-accounts"].$post({
  json: { name: "BCA", balance: 0, currency: "IDR", type: "bank" },
});
if (!res.ok) {
  const body = JSON.parse(await res.text());
  throw new Error(body?.error ?? "Request failed");
}
```

```ts
// Server Component / Server Action — MUST forward cookies manually,
// or the session cookie won't be sent and the call will 401:
import { headers } from "next/headers";
const res = await api["balance-accounts"].$get(
  {},
  { headers: Object.fromEntries(await headers()) },
);
```

> `ReadonlyHeaders` is not `Record<string, string>` — that's why
> `Object.fromEntries(await headers())` is needed (not a bare `await headers()`).

ForSSR reads, prefer importing `prisma` directly (no HTTP hop, no cookie
forwarding). Use `api` for client-triggered mutations.

## Architecture

Full reference: [`ARCHITECTURE.md`](./ARCHITECTURE.md) — sections, layer
contracts, the type-safety chain, RPC client usage (§6.5), mounting Hono
inside Next.js (§7), adding a new resource (§13), and gotchas (§14).

AI agent rules + build commands: [`AGENTS.md`](./AGENTS.md).