# Budgie — Architecture Reference

A precise, copy-ready blueprint of this codebase's architecture. Written so that
another engineer (human or AI) can analyze, reproduce, or extend the exact same
structure. Every file path and snippet below reflects the real source.

---

## 1. Philosophy

Budgie is a **full-stack TypeScript monorepo-style app** that deliberately
separates concerns across two runtimes that share one process:

- **Frontend / SSR**: Next.js 16 App Router (React Server Components).
- **Backend / REST API**: Hono, mounted inside Next.js as a **catch-all Route
  Handler** — NOT Next.js Server Actions. The API is plain HTTP/REST.

The backend follows a strict **3-layer architecture**:

```
Router  →  Controller  →  Service  →  Prisma
 (HTTP)    (I/O + types)  (logic)     (DB)
```

Each layer has a hard contract (see §5). Type safety is **end-to-end and
generated**: Prisma schema → generated Zod schemas → Hono validation → typed
controllers/services → typed RPC client for the frontend.

---

## 2. Tech Stack (pinned versions)

| Concern            | Choice                                  | Version    |
| ------------------ | --------------------------------------- | ---------- |
| Runtime / pm       | Bun                                     | 1.3.x      |
| Web framework      | Next.js (App Router, `src/` dir)        | 16.2.9     |
| UI                  | React                                   | 19.2.x     |
| API framework      | Hono                                    | 4.12.x     |
| API↔Next glue      | `hono/vercel` `handle()`                | (in hono)  |
| ORM                | Prisma                                  | 7.8.x      |
| DB driver adapter  | `@prisma/adapter-pg` + `pg`             | 7.8.x / 8  |
| Database           | PostgreSQL                              | —          |
| Validation         | Zod                                     | 4.4.x      |
| API↔Hono validator | `@hono/zod-validator`                   | 0.8.x      |
| Zod-from-Prisma    | `prisma-zod-generator`                  | 2.1.x      |
| Auth                | better-auth (email/password + Google + GitHub) | 1.6.x |
| Styling            | Tailwind CSS v4                         | 4.3.x      |
| PDF generation     | `jspdf` + `jspdf-autotable`             | 4.x / 5.x |
| Smooth scroll      | `lenis` (landing page only)         | 1.3.x     |
| Lint               | ESLint 9 + `eslint-config-next`         | 9.x       |

> **Note on Prisma 7:** Prisma 7 removed the built-in query engine. A **Driver
> Adapter is mandatory** for direct DB access. We use `@prisma/adapter-pg`
> (Postgres). There is no `@prisma/engines` Rust binary needed at runtime.

---

## 3. Repository Structure

```
budgie/
├─ .env                              # DATABASE_URL + DIRECT_URL + BETTER_AUTH_* + OAuth secrets (gitignored)
├─ .gitignore
├─ AGENTS.md                         # AI agent rules + build commands
├─ CLAUDE.md                         # re-exports @AGENTS.md
├─ ARCHITECTURE.md                   # this file
├─ eslint.config.mjs                 # flat config; ignores generated code
├─ next.config.ts
├─ package.json                      # scripts + trustedDependencies
├─ postcss.config.mjs
├─ prisma.config.ts                  # Prisma 7 config (datasource URL = DIRECT_URL ?? DATABASE_URL)
├─ tsconfig.json                     # path alias @/* → ./src/*
├─ prisma/
│  └─ schema.prisma                  # datasource + 2 generators (client, zod)
├─ public/                           # static assets
└─ src/
   ├─ app/                           # Next.js App Router
   │  ├─ layout.tsx                  # root layout (bg-white body)
   │  ├─ page.tsx                    # PUBLIC landing page (RSC) — <LandingPage/>, SEO metadata + JSON-LD — see §21
   │  ├─ globals.css                 # color-scheme: light, html bg-white, keyframes
   │  ├─ budget/                      # budget page (RSC, force-dynamic) — see §19
   │  ├─ chat/                       # chat page
   │  ├─ dashboard/                  # main dashboard (RSC, force-dynamic)
   │  ├─ profile/                    # profile & Plus membership page (RSC) — see §20
   │  ├─ transactions/               # transactions page + add sub-route
   │  │  ├─ page.tsx                 # list (RSC, fetch via api.transactions.$get)
   │  │  └─ add/
   │  │     └─ page.tsx              # 3-step add wizard (RSC fetches accounts)
   │  ├─ sign-in/                     # sign-in page
   │  └─ api/
   │     └─ [[...route]]/
   │        └─ route.ts              # catch-all Route Handler → Hono (strips /api prefix)
    ├─ components/                     # React UI (see §16 transactions, §18 dashboard, §19 budgets, §21 landing)
    │  ├─ account-card.tsx           # add-account-dialog, sidebar, …
    │  ├─ add-transaction-wizard.tsx # 3-step flow (type → details → review), CategorySelect
    │  ├─ transaction-item.tsx       # minimalist list row (tap → detail sheet)
    │  ├─ transactions-view.tsx      # search + list + date grouping + delete
     │  ├─ transaction-detail-sheet.tsx # bottom sheet with full info + confirm Dialog before delete
     │  ├─ cashflow-card.tsx          # donut chart (income/expense), title prop, radius 64
     │  ├─ asset-growth-card.tsx      # Apple-style bar chart (12-month asset trajectory), "use client" hover tooltip
     │  ├─ account-tab.tsx           # async RSC: fetches api.user.$get (plus status) → renders <AccountTabView> (sync presentational, testable)
     │  ├─ upgradePlusButton.tsx      # "use client" — !plus → opens <PlusPaymentWizard>; plus=true → PATCH api.user downgrade
     │  ├─ plus-payment-wizard.tsx   # "use client" — 3-step QRIS checkout Dialog (package → QR → success), polls api.plus.status
     │  ├─ budget-summary-cards.tsx   # Monthly + Daily budget summary cards (progress + remaining/over caption)
    │  ├─ spending-streams-chart.tsx # "use client" horizontal bar chart — per-category expense this month + budget marker ticks
    │  ├─ budgets-list.tsx           # §7.2 rounded list rows + empty state; exports BudgetRow type; owns BudgetDetailSheet state
    │  ├─ add-budget-dialog.tsx      # 3-step wizard in Dialog (period → category+amount → review)
    │  ├─ budget-detail-sheet.tsx    # bottom sheet (mobile) / centered (desktop) + confirm Dialog before delete
    │  ├─ subscription-list.tsx      # §7.2 rounded list rows + empty state; exports SubscriptionRow type; owns SubscriptionDetailSheet state
    │  ├─ add-subscription-dialog.tsx # single Dialog form (name, category, cycle, start, amount)
    │  ├─ subscription-detail-sheet.tsx # bottom sheet + confirm Dialog before delete
    │  ├─ quick-insight-empty-state.tsx # "use client" empty state when user has no transactions
    │  ├─ page-shell.tsx            # shared authenticated shell (Sidebar + max-w-screen-2xl content wrapper)
    │  └─ download-pdf-dialog.tsx   # jsPDF export (all / filtered / date range)
    ├─ lib/
    │  ├─ auth.ts                     # better-auth server instance (prismaAdapter)
    │  ├─ auth-client.ts              # better-auth client
    │  ├─ prisma.ts                   # PrismaClient singleton (PrismaPg adapter)
    │  ├─ api-client.ts               # hono/client RPC, typed against App (SSR-aware baseURL)
    │  ├─ font-size.ts                # helper
    │  ├─ categories.ts               # premade per-type category lists (income/expense/transfer)
    │  ├─ category-icon.tsx           # categoryIcon(category, className) → ReactElement (lucide icon per category)
    │  ├─ budget.ts                   # periodLabel / periodStartDate / nextBillingDate / startOfToday / startOfMonth
    │  └─ format.ts                   # formatRupiah / formatBalanceInput / formatDate / formatTime / formatDateTimeLocalValue
   ├─ server/                        # ALL backend logic lives here
   │  ├─ index.ts                    # Hono app (NO basePath), mounts routers; exports type App
    │  ├─ routes/                     # Layer 1: routers
    │  │  ├─ budgets.ts
    │  │  ├─ subscriptions.ts
    │  │  ├─ balance-accounts.ts
    │  │  ├─ transactions.ts
    │  │  ├─ user.ts                  # /api/user — get/patch the authenticated user's plus flag
    │  │  └─ plus.ts                  # /api/plus — checkout, status, simulate-payment (authed) + webhook (public)
    │  ├─ controllers/                # Layer 2: controllers
    │  │  ├─ budgets.ts
    │  │  ├─ subscriptions.ts
    │  │  ├─ balance-accounts.ts
    │  │  ├─ transactions.ts
    │  │  ├─ user.ts
    │  │  └─ plus.ts
    │  ├─ services/                   # Layer 3: services
    │  │  ├─ budgets.ts
    │  │  ├─ subscriptions.ts
    │  │  ├─ balance-accounts.ts
    │  │  ├─ transactions.ts          # $transaction balance auto-update (see §17)
    │  │  ├─ user.ts                  # getPlusStatus / updatePlusStatus — findUnique (User IS the user, no findFirst ownership)
    │  │  └─ plus.ts                  # createCheckout / getStatus / simulatePaymentForOrder / handleWebhook (orchestrates midtrans.ts + PlusOrder + User)
    │  ├─ middleware/
    │  │  └─ auth.ts                  # requireAuth + AppEnv (Variables: user, session)
    │  └─ schemas/
     │  ├─ budget.ts                # app-level Zod (.pick + .extend on generated), z.enum(EXPENSE_CATEGORIES)
     │  ├─ subscription.ts          # .pick { name, amount, currency, category, periodDays, startDate, active } + .extend overrides
     │  ├─ balance-account.ts
     │  ├─ transaction.ts           # z.enum type + z.enum(ALL_CATEGORIES) + .refine() transfer + per-type category validation
     │  ├─ user.ts                  # UpdateUserSchema = .pick({ plus: true }).extend({ plus: z.boolean() })
     │  ├─ plus.ts                  # WebhookNotificationSchema (Midtrans notification shape) + CheckoutResponse/StatusResponse interfaces
    │  └─ generated/               # ⚠ generated by prisma-zod-generator (gitignored)
   └─ generated/
      └─ prisma/                     # ⚠ generated Prisma client (gitignored)
```

**Generated & gitignored** (never edit, never commit):
- `src/generated/prisma/` — Prisma Client output.
- `src/server/schemas/generated/` — Zod schemas derived from Prisma models.

Both are produced by `bun run db:generate` / `prisma generate`.

---

## 4. Request Lifecycle

```
HTTP request
   │
   ▼
Next.js App Router  →  src/app/api/[[...route]]/route.ts
   (catch-all; strips "/api" prefix, then exports GET/POST/.../OPTIONS = handle(app))
   │  Note: /api/auth/* is a SEPARATE handler → better-auth (src/app/api/auth/[...all])
   │
   ▼
Hono app  (src/server/index.ts)          NO basePath — the route handler strips "/api"
   │  - global logger()
   │  - app.notFound / app.onError
   │
   ▼
Router    (src/server/routes/budgets.ts)       e.g. POST /budgets
   │  - .use("*", requireAuth) ← resolves session cookie → c.set("user","session")
   │  - zValidator("json", CreateBudgetSchema) ← validates body, 400 on fail
   │  - delegates to controller.create
   │
   ▼
Controller (src/server/controllers/budgets.ts)
   │  - c.get("user") → userId (ownership scoping)
   │  - c.req.valid("json")  (typed via ValidatedContext<T>)
   │  - parse path params, map errors to HTTP status
   │  - calls service.createBudget(userId, body)
   │
   ▼
Service   (src/server/services/budgets.ts)
   │  - pure TS, no Hono imports, no c/Response
   │  - prisma.budget.create({ data: { ...input, userId } })
   │
   ▼
Prisma (src/lib/prisma.ts singleton)  →  Postgres via @prisma/adapter-pg
   │
   ▼
Response flows back: service data → controller c.json(...) → Hono → Next → client
```

The frontend can consume the API two ways:
- **Server Components** may import `prisma` directly for reads (see
  `dashboard/page.tsx`), bypassing the HTTP layer entirely. This is preferred
  for SSR reads — no cookie-forwarding needed.
- **Client/Server code** may use the typed RPC client `api` from
  `src/lib/api-client.ts` (`hc<App>(baseURL)`). The `baseURL` is
  environment-aware: `/api` in the browser, `NEXT_PUBLIC_APP_URL + "/api"` on
  the server. It gives end-to-end typed `api.budgets.$get()` /
  `api.budgets.$post({ json: ... })`. See §6.5 for full usage patterns,
  including the SSR cookie-forwarding gotcha.

---

## 5. The 3-Layer Backend — Contracts & Rules

### Auth cross-cutting concern (`src/server/middleware/auth.ts`)
Before the layers, there is one shared middleware. Every protected router
mounts `requireAuth` via `.use("*", requireAuth)`. It calls better-auth's
`auth.api.getSession({ headers: c.req.raw.headers })` against the **raw**
incoming request (so the session cookie is present), returns `401` if absent,
and on success stores `user` + `session` on the Hono context. The environment
type that declares those variables is `AppEnv`:

```ts
// src/server/middleware/auth.ts
export type AppEnv = {
  Variables: {
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session;
  };
};

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
};
```

All routers and the root app are parameterized as `Hono<AppEnv>`, so
`c.get("user")` is typed. Controllers therefore receive the authenticated user
and **scope every query by `userId`** — no resource is ever read or written
without ownership checks (see service layer).

### Layer 1 — Router (`src/server/routes/<resource>.ts`)
- A `new Hono<AppEnv>()` sub-app, **chained** (`.use(...).get(...).post(...)`)
  so Hono infers route types for the RPC client. **Chaining must start with
  `.use("*", requireAuth)`** — keep it as the first link so types flow.
- **Only** wires: auth middleware + HTTP method + path + `zValidator` +
  controller reference.
- **Must not** import Prisma, `@/lib/prisma`, or services directly.
- **Must not** contain business logic or conditional branches beyond routing.
- The `.patch`/`.delete` handlers may wrap the controller in an arrow
  (`(c) => controller.update(c)`) — this is intentional so Hono keeps the
  validated-context type inference intact (a bare `controller.update` reference
  can widen the context type and break `$patch` typing on the RPC client).

```ts
// src/server/routes/budgets.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as controller from "@/server/controllers/budgets";
import { CreateBudgetSchema, UpdateBudgetSchema } from "@/server/schemas/budget";
import type { AppEnv } from "@/server/middleware/auth";
import { requireAuth } from "@/server/middleware/auth";

export const budgets = new Hono<AppEnv>()
  .use("*", requireAuth)
  .get("/", controller.list)
  .get("/:id", controller.getOne)
  .post("/", zValidator("json", CreateBudgetSchema), controller.create)
  .patch("/:id", zValidator("json", UpdateBudgetSchema), (c) => controller.update(c))
  .delete("/:id", controller.remove);
```

Routers are registered in `src/server/index.ts`:
```ts
app.route("/budgets", budgets);
app.route("/balance-accounts", balanceAccounts);
```

### Layer 2 — Controller (`src/server/controllers/<resource>.ts`)
- Imports Hono `Context` types **and** service functions. Does **not** import
  Prisma.
- Responsibilities: read `c.get("user")` for the authenticated user, read
  path/query params, call `c.req.valid(...)`, invoke the service (passing
  `user.id` for ownership scoping), map results/errors to HTTP responses
  (`c.json`, `c.body`, status codes).
- For routes with body validation, type the context as
  `ValidatedContext<T>` (see §6) so `c.req.valid("json")` is typed — no `any`.
  Non-validated handlers use `Context<AppEnv>`.

```ts
// src/server/controllers/budgets.ts
import type { Context } from "hono";
import { createBudget, ... } from "@/server/services/budgets";
import type { CreateBudget, UpdateBudget } from "@/server/schemas/budget";
import type { AppEnv } from "@/server/middleware/auth";

type ValidatedContext<T> = Context<AppEnv, string, { out: { json: T } }>;

export async function list(c: Context<AppEnv>) {
  const user = c.get("user");
  const items = await listBudgets(user.id);     // scoped by userId
  return c.json(items);
}

export async function create(c: ValidatedContext<CreateBudget>) {
  const user = c.get("user");
  const body = c.req.valid("json");             // typed as CreateBudget
  const created = await createBudget(user.id, body);
  return c.json(created, 201);
}
```

### Layer 3 — Service (`src/server/services/<resource>.ts`)
- **Pure TypeScript modules.** No Hono import, no `Context`, no `Request`/`Response`.
- Accepts plain TS arguments. The first argument is **always `userId: string`**
  for user-owned resources — every Prisma `where` must filter by `{ userId }`,
  and updates/deletes must first `findFirst({ where: { id, userId } })` to
  assert ownership (throw `Error("Not found")` if not owned; the controller
  maps that to 404).
- The **only** layer allowed to import `@/lib/prisma`.
- Unit-testable without spinning an HTTP server.

```ts
// src/server/services/budgets.ts
import { prisma } from "@/lib/prisma";
import type { CreateBudget, UpdateBudget } from "@/server/schemas/budget";

export async function listBudgets(userId: string) {
  return prisma.budget.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function createBudget(userId: string, input: CreateBudget) {
  return prisma.budget.create({ data: { ...input, userId } });
}
```

**Layer rule summary**

| Layer        | Imports Hono? | Imports Prisma? | Knows HTTP? | Knows DB? | Has `userId` scoping? |
| ------------ | :-----------: | :--------------: | :---------: | :-------: | :--------------------: |
| Router       | yes (Hono)    | no               | yes         | no        | no (gates auth only)   |
| Controller   | yes (types)   | no               | yes         | no        | yes (reads `c.get("user")`) |
| Service      | no            | yes              | no          | yes       | yes (filters every query)  |

---

## 6. Type-Safety Chain (the whole point)

```
prisma/schema.prisma
   │  generator client  →  src/generated/prisma       (Prisma types)
   │  generator zod     →  src/server/schemas/generated (Zod schemas)
   ▼
src/server/schemas/budget.ts
   │  CreateBudgetSchema  = BudgetCreateInputObjectZodSchema            (from generated)
   │  UpdateBudgetSchema  = BudgetUncheckedUpdateInputObjectZodSchema   (from generated)
   │  type CreateBudget = z.infer<typeof CreateBudgetSchema>
   ▼
routes/budgets.ts  →  zValidator("json", CreateBudgetSchema)            (runtime + type)
   ▼
controllers/budgets.ts  →  ValidatedContext<CreateBudget>
   │  c.req.valid("json") : CreateBudget                                 (no cast!)
   ▼
services/budgets.ts  →  createBudget(input: CreateBudget)               (typed DTO)
   ▼
prisma.budget.create({ data: input })                                   (Prisma-typed)
   ▼
src/lib/api-client.ts  →  hc<App>(baseURL)                             (RPC client)
   │  baseURL = SSR ? NEXT_PUBLIC_APP_URL+"/api" : "/api"
   │  api.budgets.$post({ json: {...} })  ← body typed as CreateBudget
   ▼
src/server/index.ts  exports `type App = typeof app`                    (single source of truth)
```

Key points:
- **`App` type** is exported from `src/server/index.ts` (`export type App = typeof app`).
  The RPC client, all controllers, and the route handler are typed against it.
- **No `any`, no casts** in the validated path. `ValidatedContext<T>` threads
  the Zod output type into `c.req.valid("json")` via Hono's `Context<I>`
  third generic (`I['out']['json']`).
- **Generated Zod schemas** reflect Prisma constraints (types, nullability,
  defaults). App-level rules (e.g. password min length) are added by
  **composing/extending** in `schemas/<resource>.ts`, never by hand-rewriting
  the whole schema.

### The `ValidatedContext` trick (why it exists)
Hono's `c.req.valid(target)` is typed as
`valid<T extends keyof I & keyof ValidationTargets>(t: T): I['out'][T]`.
A plain `Context` has `I = {}`, so `keyof I` collapses to `never` and
`c.req.valid("json")` won't even compile. By declaring
`Context<Env, string, { out: { json: T } }>`, the `"json"` key becomes valid
and the return type becomes `T`. This is the minimum typing needed to keep
controllers as standalone functions (instead of inline handlers) without `any`.

---

## 6.5 Using the Typed RPC Client (`api`)

`src/lib/api-client.ts` is the **single entry point** for the frontend to talk to
the backend over HTTP, with end-to-end type safety:

```ts
// src/lib/api-client.ts
import { hc } from "hono/client";
import type { App } from "@/server";

const baseURL =
  typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000") + "/api"
    : "/api";

export const api = hc<App>(baseURL);
```

- **Why two baseURLs?** In the browser, `/api` is a relative URL resolved
  against the current page (same origin, cookies ride along automatically).
  During SSR there is no origin, so it needs an absolute URL
  (`NEXT_PUBLIC_APP_URL`/`api`). Without it, server-side `api.*` calls would
  hit `localhost:<random>` and fail.
- **`App` is `typeof app`** exported from `src/server/index.ts`. Every route
  mounted with `app.route("/x", x)` automatically appears on `api.x` with
  typed `$get`/`$post`/`$patch`/`$delete` methods. No extra wiring.

### Method reference

All methods return a standard `Response` (the body is **not** auto-parsed;
call `await res.json()` / `await res.text()` yourself). Check `res.ok` or
`res.status` first.

| Operation | Call | Typed args |
| --------- | ---- | ---------- |
| List | `api.balanceAccounts.$get()` | none |
| Get one | `api.balanceAccounts[":id"].$get({ param: { id } })` | `param.id: string` |
| Create | `api.balanceAccounts.$post({ json: {...} })` | `json: CreateBalanceAccount` (Zod-validated) |
| Update | `api.balanceAccounts[":id"].$patch({ param: { id }, json: {...} })` | `param.id` + `json: UpdateBalanceAccount` |
| Delete | `api.balanceAccounts[":id"].$delete({ param: { id } })` | `param.id` (204 null body) |
| Query | `api.x.$get({ query: { ... } })` | `query` typed by `zValidator("query", …)` on the route |

> **Bracket access is mandatory** for two cases:
> 1. **Resource names with hyphens** — `api["balance-accounts"]` (JS identifiers
>    can't contain `-`).
> 2. **Path params** — Hono exposes `:id` routes under the literal key `":id"`,
>    so it's `api["balance-accounts"][":id"]`, not `api.balanceAccounts.id`.
>
> `api.budgets` works with dot access because `budgets` is a valid identifier.

Hono's RPC client also exposes a helper to extract the response type without
calling: `InferResponseType<typeof api.budgets.$get>`.

### Reading the response

```ts
const res = await api["balance-accounts"].$get();
if (res.ok) {
  const data = await res.json();      // typed as the controller's return shape
} else if (res.status === 401) {
  // not authenticated
} else {
  const body = await res.text();
}
```

### Client component pattern (this codebase's convention)

Used in `src/components/add-account-dialog.tsx` and `account-card.tsx`. In
client components the browser session cookie is sent automatically — no
forwarding needed.

```tsx
"use client";
const res = await api["balance-accounts"].$post({
  json: { name, balance: 12000, currency: "IDR", type: "bank" },
});
if (!res.ok) {
  let msg = "Failed to create account";
  try { const body = JSON.parse(await res.text()); if (body?.error) msg = body.error; } catch {}
  throw new Error(msg);
}
router.refresh();   // re-render RSC tree
```

### Server Component pattern — the cookie-forwarding gotcha

`hc` uses `fetch`, which does **not** attach the incoming request's cookies
when running on the server. An `api` call inside a Server Component will
therefore hit `requireAuth` and return **401**, because the session cookie is
missing. You must forward the headers yourself:

```ts
// app/some-page/page.tsx
import { headers } from "next/headers";
import { api } from "@/lib/api-client";

const res = await api["balance-accounts"].$get(
  {},                                   // first arg = typed request shape (empty for a bare GET)
  { headers: await headers() },         // second arg = fetch init; cookies forwarded
);
```

This is why `dashboard/page.tsx` reads accounts via `prisma` directly instead
of `api` — for SSR reads, skipping the HTTP hop is simpler and avoids the
forwarding dance. Use `api` in Server Components only when you specifically
need to exercise the route (auth, validation, side effects). For mutations
triggered from the client, `api` via a `"use client"` component is the norm.

### Error / status shape

Controllers in this repo respond with:
- `200` + JSON body (the resource) on success,
- `201` + JSON body on create,
- `204` + empty body on delete,
- `400` `{ error: string }` on invalid id / validation fail (zValidator returns 400),
- `401` `{ error: "Unauthorized" }` from `requireAuth`,
- `404` `{ error: "Not found" }`,
- `500` `{ error: "Internal Server Error" }` from `app.onError`.

---

## 7. Mounting Hono inside Next.js

### The catch-all Route Handler
`src/app/api/[[...route]]/route.ts` (optional catch-all = `[[...route]]`, so
`/api` itself also resolves). Because the Hono app is mounted **without** a
`basePath`, the handler must strip the `/api` segment before forwarding to
`handle(app)`:

```ts
import { handle } from "hono/vercel";
import { app } from "@/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripApiPrefix =
  (handler: (req: Request) => Response | Promise<Response>) =>
  (req: Request) => {
    const url = new URL(req.url);
    url.pathname = url.pathname.replace(/^\/api/, "") || "/";
    return handler(new Request(url, req));
  };

const honoHandler = stripApiPrefix(handle(app));

export const GET = honoHandler;
export const POST = honoHandler;
export const PUT = honoHandler;
export const PATCH = honoHandler;
export const DELETE = honoHandler;
export const OPTIONS = honoHandler;
```

- Why strip instead of `basePath`? `handle(app)` receives the raw Next.js
  request whose URL still includes `/api`. `stripApiPrefix` rewrites the path
  to what Hono's routes expect (e.g. `/budgets`), so the rest of the app stays
  `basePath`-free and tests/controllers see plain paths.
- Every HTTP method is exported to the same handler so Hono's own router decides.
- `handle(app)` from `hono/vercel` returns a Next.js Route Handler function.
- `runtime = "nodejs"` is required (the default edge runtime cannot run the pg
  driver / Prisma adapter).
- `dynamic = "force-dynamic"` prevents Next from trying to statically
  prerender API responses.
- **Separate handler:** `/api/auth/*` is served by `src/app/api/auth/[...all]/route.ts`
  (better-auth's own handler), NOT by Hono. Keep any new API routes outside
  `/api/auth/` so they don't collide.

### The Hono app
`src/server/index.ts`:
```ts
import { Hono } from "hono";
import { logger } from "hono/logger";
import { budgets } from "@/server/routes/budgets";
import { subscriptions } from "@/server/routes/subscriptions";
import { balanceAccounts } from "@/server/routes/balance-accounts";
import { transactions } from "@/server/routes/transactions";
import { user } from "@/server/routes/user";
import { plus, plusWebhook } from "@/server/routes/plus";
import type { AppEnv } from "@/server/middleware/auth";

export const app = new Hono<AppEnv>()           // NO basePath — handler strips /api
  .use(logger())
  .get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }))
  .route("/user", user)
  .route("/plus", plus)                         // authed: checkout, status, simulate-payment
  .route("/plus/webhook", plusWebhook)          // PUBLIC: no requireAuth (Midtrans → server)
  .route("/budgets", budgets)
  .route("/subscriptions", subscriptions)
  .route("/balance-accounts", balanceAccounts)
  .route("/transactions", transactions)
  .notFound((c) => c.json({ error: "Not found" }, 404))
  .onError((err, c) => {
    console.error(err);
    return c.json({ error: "Internal Server Error" }, 500);
  });

export type App = typeof app;
```

- No `basePath` — the route handler strips `/api` instead (see above).
- Chained (`.use().get().route()...`) so `typeof app` exposes per-route types
  to `hono/client`. The mounted sub-apps (`budgets`, `subscriptions`,
  `balanceAccounts`) are themselves chained and typed against `AppEnv`.
- Global `logger`, `notFound`, `onError` live here (cross-cutting concerns).
- `export type App = typeof app` is the single source of truth consumed by
  `src/lib/api-client.ts` and (implicitly) by `hono/vercel`'s `handle`.

---

## 8. Prisma 7 + Driver Adapter + better-auth Models

### Schema (`prisma/schema.prisma`)
The schema contains **two groups of models**: better-auth's auth models
(`User`, `Session`, `Account`, `Verification`) and the domain models
(`Budget`, `Subscription`, `BalanceAccount`, `Transaction`). Every user-owned domain model has
a `userId` field + `User` relation so ownership can be enforced in the service
layer.

```prisma
generator client {
  provider = "prisma-client"          // Prisma 7 new generator
  output   = "../src/generated/prisma"
}

generator zod {
  provider = "prisma-zod-generator"
  output   = "../src/server/schemas/generated"
}

datasource db {
  provider = "postgresql"
}                                      // NOTE: no `url` field here (see prisma.config.ts)

// ── better-auth models (required by better-auth's prismaAdapter) ──
model User {
  id            String    @id
  name          String
  email         String
  emailVerified Boolean   @default(false)
  image         String?
  plus          Boolean   @default(false)    // Budgie Plus membership flag (migration 20260719121457)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions        Session[]
  accounts        Account[]
  balanceAccounts BalanceAccount[]
  transactions    Transaction[]
  budgets         Budget[]
  subscriptions   Subscription[]

  @@unique([email])
  @@map("user")
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([token])
  @@index([userId])
  @@map("session")
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([userId])
  @@map("account")
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([identifier])
  @@map("verification")
}

// ── Domain models ──
model Budget {
  id         String   @id @default(cuid())
  category   Category
  amount     Float
  currency   String   @default("IDR")
  userId     String
  periodDays Int
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([userId, category])   // one budget per (user, category)
  @@index([userId])
  @@map("budget")
}

model Subscription {
  id         String   @id @default(cuid())
  name       String
  amount     Float
  currency   String   @default("IDR")
  category   Category
  periodDays Int
  startDate  DateTime @default(now())
  active     Boolean  @default(true)
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([userId, name])   // one subscription per (user, name)
  @@index([userId])
  @@map("subscription")
}

model PlusOrder {
  id        String    @id @default(cuid())
  orderId   String    @unique               // Midtrans order id (BUDGIE-PLUS-…)
  userId    String
  amount    Float                            // price paid (first-month or regular)
  status    String    @default("pending")   // pending | settlement | expire | …
  paidAt    DateTime?                        // set when status → settlement
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("plus_order")
}

model BalanceAccount {
  id        String   @id @default(cuid())
  name      String
  balance   Float    @default(0)
  currency  String   @default("IDR")
  type      String
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactionsFrom Transaction[] @relation("TransactionFromAccount")
  transactionsTo   Transaction[] @relation("TransactionToAccount")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@map("balance_account")
}

model Transaction {
  id                String   @id @default(cuid())
  name              String
  amount            Float
  type              String   // "income" | "expense" | "transfer"
  category          Category
  date              DateTime
  adminFee          Float    @default(0)
  balanceAccountId   String?
  toBalanceAccountId String?
  userId            String
  user              User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  balanceAccount    BalanceAccount? @relation("TransactionFromAccount", fields: [balanceAccountId], references: [id], onDelete: SetNull)
  toBalanceAccount  BalanceAccount? @relation("TransactionToAccount", fields: [toBalanceAccountId], references: [id], onDelete: SetNull)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([userId])
  @@index([date])
  @@index([type])
  @@map("transaction")
}
```

- **`datasource` has no `url`** in Prisma 7 — the URL moved to `prisma.config.ts`.
- **`@@map`** on the auth models matches better-auth's expected table names
  (`user`, `session`, `account`, `verification`). `BalanceAccount` is mapped to
  `balance_account`, `Transaction` to `transaction`.
- **`userId` relations + `onDelete: Cascade`** ensure that deleting a user
  cleans up their budgets, accounts, sessions, transactions, etc. — and that
  the service layer can enforce ownership per-request.
- **`Transaction` uses `onDelete: SetNull` on its `BalanceAccount` FKs.**
  Deleting a `BalanceAccount` nulls the FK columns but **preserves the
  transaction row** (history survives). The UI shows "Deleted account".
- **`Transaction.balanceAccountId` / `toBalanceAccountId` are optional**
  (`String?`) precisely because of `SetNull` — services must handle null
  account lookups gracefully (the include returns `null`).

### Config (`prisma.config.ts`)
```ts
import "dotenv/config";                         // loads .env for the CLI
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"] },
});
```
- **`DIRECT_URL`** is a **direct (non-pooled)** connection used by `prisma migrate
  deploy` at build time. Migrations need a session that supports DDL, which
  PgBouncer-pooled connections reject. On Neon: use the direct hostname.
- **`DATABASE_URL`** is a **pooled** connection used at runtime by
  `src/lib/prisma.ts` (serverless functions benefit from pooling). On Neon: use
  the `-pooler` hostname.
- The `?? process.env["DATABASE_URL"]` fallback lets local dev set only
  `DATABASE_URL` (both may point to the same local Postgres).

### Client singleton (`src/lib/prisma.ts`)
```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const adapter = new PrismaPg(url);            // Prisma 7 driver adapter
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- `PrismaPg` accepts `pg.Pool | pg.PoolConfig | string`. Passing the connection
  string is the common case.
- The `globalThis` cache prevents exhausting DB connections during Next.js dev
  hot-reload (which would otherwise instantiate a new client per reload).

---

## 9. Zod Auto-Generation

`prisma-zod-generator` reads the Prisma schema and emits, per model, a family
of Zod schemas under `src/server/schemas/generated/schemas/objects/`:

| Generated export                            | Meaning                                  |
| ------------------------------------------- | ---------------------------------------- |
| `BudgetCreateInputObjectZodSchema`          | create input (respects defaults/optional)|
| `BudgetUncheckedCreateInputObjectZodSchema`  | create incl. PK/foreign-key fields       |
| `BudgetUncheckedUpdateInputObjectZodSchema`  | update (all fields optional)             |
| `BudgetResultSchema` / `BudgetModelSchema`  | full row shape                           |

The app **does not import these directly at call sites**. Instead,
`src/server/schemas/<resource>.ts` is the only place that touches the generated
schemas. It narrows the huge Prisma-generated shape down to the **API contract**
by `.pick()`-ing just the fields the client is allowed to send, and `.extend()`-ing
to override constraints (e.g. force all update fields to be required). The same
pattern is used for `Budget`, `Subscription`, and `BalanceAccount`:

```ts
// src/server/schemas/budget.ts
import { z } from "zod";
import {
  BudgetUncheckedCreateInputObjectZodSchema,
  BudgetUncheckedUpdateInputObjectZodSchema,
} from "@/server/schemas/generated/schemas/objects";
import { EXPENSE_CATEGORIES } from "@/lib/categories";

export const CreateBudgetSchema = BudgetUncheckedCreateInputObjectZodSchema.pick({
  category: true,
  amount: true,
  periodDays: true,
}).extend({
  category: z.enum(EXPENSE_CATEGORIES),   // tighter than generated (Category enum)
  amount: z.number().positive(),
  periodDays: z.number().int().positive(),  // 1=daily, 7=weekly, 30=monthly, or any N
});

export const UpdateBudgetSchema = BudgetUncheckedUpdateInputObjectZodSchema.pick({
  category: true,
  amount: true,
  periodDays: true,
}).extend({
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.number().positive(),
  periodDays: z.number().int().positive(),
});

export type CreateBudget = z.infer<typeof CreateBudgetSchema>;
export type UpdateBudget = z.infer<typeof UpdateBudgetSchema>;
```

```ts
// src/server/schemas/subscription.ts — same shape, adds name + startDate + active
import { z } from "zod";
import {
  SubscriptionUncheckedCreateInputObjectZodSchema,
  SubscriptionUncheckedUpdateInputObjectZodSchema,
} from "@/server/schemas/generated/schemas/objects";
import { EXPENSE_CATEGORIES } from "@/lib/categories";

export const CreateSubscriptionSchema =
  SubscriptionUncheckedCreateInputObjectZodSchema.pick({
    name: true, amount: true, currency: true,
    category: true, periodDays: true, startDate: true, active: true,
  }).extend({
    name: z.string().min(1),
    amount: z.number().positive(),
    currency: z.string().default("IDR"),
    category: z.enum(EXPENSE_CATEGORIES),
    periodDays: z.number().int().positive(),  // 7=weekly, 30=monthly, 365=yearly
    startDate: z.coerce.date(),               // accept ISO string from JS
    active: z.boolean().default(true),
  });

export const UpdateSubscriptionSchema =
  SubscriptionUncheckedUpdateInputObjectZodSchema.pick({
    name: true, amount: true, currency: true,
    category: true, periodDays: true, startDate: true, active: true,
  }).extend({
    name: z.string().min(1),
    amount: z.number().positive(),
    currency: z.string(),
    category: z.enum(EXPENSE_CATEGORIES),
    periodDays: z.number().int().positive(),
    startDate: z.coerce.date(),
    active: z.boolean(),
  });

export type CreateSubscription = z.infer<typeof CreateSubscriptionSchema>;
export type UpdateSubscription = z.infer<typeof UpdateSubscriptionSchema>;
```

Why `.pick`? The unchecked input schema includes `userId` (a foreign key) — the
client must **not** be allowed to set another user's id. By picking only the
public fields, `userId` is excluded from the API contract; the controller
injects `userId` from the authenticated session (`c.get("user").id`) before
calling the service (see §5). The same reason applies to `BalanceAccount` and
`Subscription`.

Why `.extend` on the update schema? `*UncheckedUpdateInputObjectZodSchema`
marks every field optional (Prisma update semantics). The app overrides that to
make the public fields **required** on PATCH, so a client can't accidentally
null them out.

To add a new app-level rule (e.g. password min length), extend the picked
schema the same way:
```ts
export const CreateUserSchema = UserUncheckedCreateInputObjectZodSchema
  .pick({ email: true, name: true, password: true })
  .extend({ password: z.string().min(8) });
```

### `Transaction` — the `.refine()` + `$transaction` resource (see §17)

`Transaction` is the first resource that uses `.extend()` to **add fields not
present in the generated schema** (the generated `TransactionUnchecked*`
respects Prisma types but the app narrows `type` to a Zod enum and coerces
`date`). It also adds a cross-field `.refine()`:

```ts
// src/server/schemas/transaction.ts
export const CreateTransactionSchema =
  TransactionUncheckedCreateInputObjectZodSchema.pick({
    name: true, amount: true, type: true, category: true,
    date: true, adminFee: true,
    balanceAccountId: true, toBalanceAccountId: true,
  }).extend({
    name: z.string().min(1),
    amount: z.number(),
    type: z.enum(["income", "expense", "transfer"]),   // tighter than generated
    category: z.enum(ALL_CATEGORIES),                   // premade list from src/lib/categories.ts
    date: z.coerce.date(),                            // accept ISO string from JS
    adminFee: z.number().min(0).default(0),
    balanceAccountId: z.string().min(1),
    toBalanceAccountId: z.string().nullable().optional(),
  }).refine(
    (v) =>
      v.type !== "transfer" ||
      (!!v.toBalanceAccountId &&
        !!v.balanceAccountId &&
        v.toBalanceAccountId !== v.balanceAccountId),
    { message: "Transfer requires distinct source and destination accounts" },
  ).refine(
    (v) => CATEGORIES_BY_TYPE[v.type].includes(v.category),
    { message: "Invalid category for this transaction type" },
  );
export type CreateTransaction = z.infer<typeof CreateTransactionSchema>;
```

- **No `UpdateTransactionSchema` exists.** Editing transactions is intentionally
  not supported (mutating past transactions would require re-balancing accounts
  in both directions — out of scope for now). Only `Create` + `Delete` (which
  reverses the balance effect, see §17).
- **`.refine()`** is a runtime-only check (not reflected in the TS type). It
  runs after `.parse()` inside `zValidator`, returning 400 with the message
  if the transfer invariant fails.
- **`z.coerce.date()`** lets the API accept `"2026-07-14T10:30:00.000Z"` (a JS
  Date instance would also pass). The service stores a Prisma `DateTime`.
- **`z.enum(ALL_CATEGORIES)`** restricts `category` to a premade list defined
  in `src/lib/categories.ts` — users cannot type custom categories. The second
  `.refine()` validates that the category belongs to the selected transaction
  type's list (e.g. "Salary" with type "expense" → 400). Per-type lists:
  income (Salary, Bonus, Freelance, …), expense (Food & Drink, Rent,
  Entertainment, …), transfer (Account Transfer, Savings, …).
- **`Budget` schema** (`src/server/schemas/budget.ts`) also uses
  `z.enum(EXPENSE_CATEGORIES)` from the shared `categories.ts` constant —
  budgets are expense-oriented.

---

## 10. Configuration Files

### `package.json` (scripts)
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma migrate deploy && prisma generate && next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:dev": "prisma db push && prisma generate"
  }
}
```
- `build` runs `prisma migrate deploy` first (non-interactive — applies pending
  migrations from `prisma/migrations/` to the prod DB via `DIRECT_URL`), then
  `prisma generate` so CI/deploys always have fresh clients, then `next build`.
  On Vercel, this runs in the build sandbox, so `DIRECT_URL` must be reachable
  from there (set it in Project Settings → Environment Variables).
- `db:dev` is the quick local loop: push schema changes to the DB and regenerate
  the client + Zod in one go (no migration history, ideal for rapid dev).

### `package.json` (lifecycle trust)
```json
{
  "ignoreScripts": ["sharp", "unrs-resolver"],
  "trustedDependencies": [
    "@prisma/engines", "core-js", "prisma", "prisma-zod-generator", "sharp", "unrs-resolver"
  ]
}
```
- Bun blocks postinstall scripts by default. Listing packages in
  `trustedDependencies` lets their scripts run automatically at install, so
  `bun pm untrusted` reports **0 untrusted** — nothing blocked on the machine.

### `tsconfig.json`
- Path alias `@/* → ./src/*` is used everywhere (`@/lib/prisma`,
  `@/server`, `@/generated/prisma/client`).

### `eslint.config.mjs`
- Flat config; extends `eslint-config-next` (core-web-vitals + TS).
- `globalIgnores` excludes generated code so lint never flags generated files:
  `src/generated/**`, `src/server/schemas/generated/**`.

### `.gitignore` (project-specific additions)
```
.env*                              # secrets
/src/generated/prisma              # generated client
/src/server/schemas/generated      # generated zod
*.tsbuildinfo
```

### `next.config.ts`
- Currently minimal. Add `images`, `headers`, etc. here as needed.

---

## 11. Environment

`.env` (gitignored):
```
# Prisma
# DATABASE_URL = pooled connection, used at runtime by src/lib/prisma.ts (serverless).
# DIRECT_URL   = direct connection, used by `prisma migrate deploy` at build time.
# On Neon: use the "-pooler" hostname for DATABASE_URL, the direct hostname for DIRECT_URL.
# Local dev: both can point to the same local Postgres.
DATABASE_URL="postgresql://user:password@localhost:5432/budgie?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/budgie?schema=public"

# better-auth
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="..."

# OAuth (optional — leave blank to disable)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# RPC client SSR base URL (optional — defaults to http://localhost:3000)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```
- `DATABASE_URL` (pooled) is read at runtime by `src/lib/prisma.ts`.
  `DIRECT_URL` (direct) is read by `prisma.config.ts` for `prisma migrate deploy`
  at build time. `prisma.config.ts` loads them via `import "dotenv/config"`.
  At runtime, Next.js loads `.env` automatically (App Router reads env vars).
- `BETTER_AUTH_URL` must match the public URL the app is served on (used by
  better-auth for cookie domain + callbacks).
- `BETTER_AUTH_SECRET` is the JWT/session signing key — generate with
  `openssl rand -base64 32`.
- `NEXT_PUBLIC_APP_URL` is read by `src/lib/api-client.ts` during SSR to build
  the absolute `/api` base URL (since there is no origin on the server).

---

## 12. Commands

```bash
bun install                 # install (trusted scripts auto-run)
bun run dev                 # next dev  (http://localhost:3000)
bun run build               # prisma migrate deploy && prisma generate && next build
bun run lint                # eslint
bun run typecheck           # tsc --noEmit
bun run test                # vitest run — 899 tests / 80 suites (one-shot)
bun run test:watch          # vitest watch mode
bun run db:generate         # regenerate Prisma client + Zod schemas
bun run db:migrate          # prisma migrate dev (create + apply)
bun run db:push             # push schema without migration history
bun run db:studio           # prisma studio GUI
bun pm untrusted            # should report 0 untrusted
```

Smoke test once running:
```bash
curl localhost:3000/api/health
# List/create budgets — these require a valid better-auth session cookie,
# so a bare curl will return 401. Test via the browser after signing in,
# or attach the session cookie manually:
curl localhost:3000/api/budgets -b 'better-auth.session_token=<token>'
```

---

## 12.4 Testing

**899 tests / 80 suites** (`bun run test`, Vitest + jsdom + @testing-library).
Fully deterministic — no database, no HTTP server: Prisma is mocked via
`vi.hoisted` module mocks, the typed RPC client (`@/lib/api-client`) is mocked
per component suite, and `next/navigation` (`useRouter`/`usePathname`) is
stubbed. See `README.md` → Testing for the full suite table.

Coverage layers:
- **Services** (`src/server/services/*.test.ts`) — every resource's full CRUD
  (budgets, balance-accounts, subscriptions, plus, user, transactions incl.
  balance math + insufficient-balance guards for create **and** delete, and
  exact-empties-allowed boundary).
- **Controllers** (`src/server/controllers/*.test.ts`) — status mapping
  (400/404/409/204), ownership via `c.get("user").id`, error rethrow.
- **Schemas** (`src/server/schemas/*.test.ts`) — defaults, every premade
  category, non-positive/non-integer/NaN rejection, no-defaults-on-update.
- **Lib** (`src/lib/*.test.ts`) — pure TS: formatting, categories, dashboard
  math, budget helpers (`nextBillingDate` boundaries, month/leap crossings),
  midtrans mock (auto-expire at 15 min, webhook parsing), category icons.
- **Components** (`src/components/*.test.tsx`) — dialogs/wizards/lists/sheets
  incl. budget & subscription feature sets and the Plus QRIS wizard's status
  polling (settlement/expire/cancel via fake timers).
- **Landing** (`src/components/landing/*.test.tsx`) — `IntersectionObserver` /
  reduced-motion / rAF / scroll behavior for `auto-video`, `animated-counter`,
  `scroll-progress`, `reveal`, `hero-preview`; the CSS-var interaction
  primitives (`spotlight`, `tilt`, `magnetic`, `hero-headline` — vars/classes,
  not computed styles); content suites for the static sections;
  `mock-data.ts` integrity checks.

Browser-API stubs live in `src/test-utils/browser-mocks.ts`
(`stubIntersectionObserver`, `stubMatchMedia`, `stubRequestAnimationFrame`,
`setWindowScrollY`, `setViewport`) — see `AGENTS.md` → Testing conventions.

**Not tested by design:** async RSC pages (`app/*/page.tsx`) and the async
`LandingPage` wrapper — jsdom can't await async server components; they only
compose already-tested sync components (same rule as `AccountTab`/`AccountTabView`).

---

## 12.5 Deployment (Vercel + Neon)

The `build` script is `prisma migrate deploy && prisma generate && next build`,
so **every deploy automatically applies pending migrations** to the production
database before building the app. No manual migration step is needed.

### Environment variables to set in Vercel

| Variable | Where | Value |
| -------- | ----- | ----- |
| `DATABASE_URL` | Production ( + Preview if needed) | Neon **pooled** connection string (`-pooler` hostname, port `6543`). Used at runtime by `src/lib/prisma.ts` in serverless functions. |
| `DIRECT_URL` | Production ( + Preview if needed) | Neon **direct** connection string (non-`-pooler` hostname, port `5432`). Used by `prisma migrate deploy` during the Vercel build. **PgBouncer-pooled connections reject DDL**, so `DIRECT_URL` must bypass the pooler. |
| `BETTER_AUTH_URL` | Production | The Vercel app URL (`https://<your-app>.vercel.app`). |
| `BETTER_AUTH_SECRET` | Production | `openssl rand -base64 32` — same value across envs. |
| `NEXT_PUBLIC_APP_URL` | Production | Same as `BETTER_AUTH_URL` (used by `api-client.ts` for SSR `api` calls). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Production | OAuth credentials (redirect URI must include the Vercel URL). |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Production | OAuth credentials. |

### How a deploy runs

```
git push → Vercel build sandbox
   │
   ▼
prisma migrate deploy      ← reads DIRECT_URL, applies pending migrations
   │                          (creates the DB if it doesn't exist)
   ▼
prisma generate            ← regenerates client + Zod into src/generated/
   │
   ▼
next build                 ← compiles the app
   │
   ▼
deploy → serverless functions use DATABASE_URL (pooled) at runtime
```

### Notes & gotchas

- **No `vercel.json` needed.** Vercel auto-detects Next.js and runs `bun run
  build` (or `npm run build`). The build script handles everything.
- **Neon branched DBs:** if you use Neon's database branching for Preview
  deployments, set `DIRECT_URL` and `DATABASE_URL` per-environment in Vercel
  (Preview gets the branch's connection strings).
- **`migrate deploy` is idempotent** — if there are no pending migrations, it
  prints "No pending migrations to apply." and the build continues. It will not
  reset or drop data.
- **Never run `prisma migrate dev` in production.** It's interactive and can
  reset the database. Use `migrate deploy` (already in `build`) or run
  `db:migrate` locally, commit the new migration file, then push — the next
  deploy applies it automatically.
- **Migration files are committed to git** (`prisma/migrations/`). The build
  applies whatever is in that directory. Create new migrations locally with
  `bun run db:migrate --name <name>`, commit, and push.

---

## 13. How to Add a New Resource (e.g. another model alongside `Transaction`)

> `Transaction` (already implemented) is the canonical reference for a resource
> that uses `.refine()` cross-field validation and a Prisma `$transaction` to
> update related rows atomically. Follow the same 8-step checklist below for
> any *new* resource, then see §17 for the Transaction-specific balance-update
> pattern if your resource also mutates siblings on create/delete.

1. **Prisma model**: add `model Transaction { ... userId String; user User @relation(...) }`
   to `prisma/schema.prisma`. Every user-owned resource **must** have a `userId`
   field + `User` relation so ownership scoping works (see §5 service layer).
2. **Generate**: `bun run db:dev` (or `bun run db:migrate --name add_transaction`)
   — regenerates Prisma client + Zod. New `TransactionCreateInputObjectZodSchema`
   etc. appear.
3. **App schema**: create `src/server/schemas/transaction.ts` exporting
   `CreateTransactionSchema` / `UpdateTransactionSchema` by `.pick()`-ing the
   public fields (exclude `userId`!) and `.extend()`-ing overrides, plus
   `type Create*` / `type Update*` aliases (see §9 for the pattern).
4. **Service**: `src/server/services/transaction.ts` — pure functions importing
   `prisma` and the DTO types. **First arg is always `userId: string`**; every
   Prisma query filters by `{ userId }`; update/delete do an ownership
   `findFirst({ where: { id, userId } })` before mutating.
5. **Controller**: `src/server/controllers/transaction.ts` — import service +
   schema types; `c.get("user")` for `userId`; use `ValidatedContext<T>` for
   validated handlers; map service `Error("Not found")` to 404.
6. **Router**: `src/server/routes/transaction.ts` — `new Hono<AppEnv>()`
   `.use("*", requireAuth).get().post()...` with `zValidator` (chained, see §5).
7. **Mount**: in `src/server/index.ts`, add `.route("/transactions", transactions)`.
   **Chained** with the existing `.route()` calls so `typeof app` stays inferred.
8. **Verify**: `bun run lint && bun run typecheck && bun run build`.

The typed RPC client (`api.transactions.$get()`) becomes available
automatically once the router is mounted, because `App = typeof app`. For
Server Component reads, prefer `prisma` directly (no cookie-forwarding needed);
use `api` for client-triggered mutations. **In Server Components that use
`api` for reads, always `await res.json()` then `Array.isArray(data)` guard
before treating it as `T[]`** — a 401/500 response is an `{ error }` object, and
a bare `as T[]` cast will crash the page (this happened during development of
the transactions page; the guard is now baked in).

---

## 14. Gotchas & Breaking-Change Notes

- **Prisma 7 needs a Driver Adapter.** `new PrismaClient()` with no adapter is a
  type error (the options union requires `adapter` or `accelerateUrl`). Use
  `@prisma/adapter-pg` for Postgres; swap to `@prisma/adapter-better-sqlite3`,
  `@prisma/adapter-libsql`, etc. for other DBs.
- **`datasource` block has no `url`.** The URL lives in `prisma.config.ts`
  (`datasource.url = DIRECT_URL ?? DATABASE_URL`). Don't add `url = env("...")` to
  the schema. `DIRECT_URL` (direct, non-pooled) is used by `prisma migrate deploy`
  at build time; `DATABASE_URL` (pooled) is used at runtime by `src/lib/prisma.ts`.
  On Neon: `-pooler` hostname for `DATABASE_URL`, direct hostname for `DIRECT_URL`.
- **`build` runs `prisma migrate deploy`.** This is non-interactive and applies
  pending migrations from `prisma/migrations/` to the prod DB. On Vercel, the
  build sandbox must reach the DB via `DIRECT_URL` — set it in Project Settings →
  Environment Variables. Do NOT use `prisma migrate dev` in CI/build (it's
  interactive and will error with `MigrateDevEnvNonInteractiveError`).
- **Next.js 16 Route Handlers**: `context.params` is a **Promise** (`await params`).
  The catch-all `[[...route]]` handler ignores params and lets Hono route, so
  this rarely matters — but if you add a typed dynamic Route Handler elsewhere,
  await `params`.
- **Pages that read the DB must be dynamic.** A Server Component that calls
  Prisma at request time must set `export const dynamic = "force-dynamic"`, or
  `next build` will try to prerender it and fail (no DB at build time).
- **Generated code is gitignored.** After cloning, always run `bun run db:generate`
  (or `bun run build`) before `bun run typecheck`/`bun run dev`, or imports from
  `@/generated/prisma/client` and `@/server/schemas/generated/...` will not
  resolve.
- **Do not use Server Actions for backend logic.** All mutation/query goes
  through Hono REST routes. Server Components may read via `prisma` directly for
  SSR, but writes go through the API.
- **`hono/vercel` `handle()` requires `runtime = "nodejs"`.** Don't set edge.
- **Keep routers chained** (`.use().get().post().patch()`), not separate
  `app.get(...)` statements — chaining is what lets `typeof app` expose
  per-route types to `hono/client`. Start the chain with `.use("*", requireAuth)`.
- **No `basePath` on the Hono app.** The catch-all Route Handler
  (`src/app/api/[[...route]]/route.ts`) strips `/api` via `stripApiPrefix`
  before forwarding to `handle(app)`. Don't add `.basePath("/api")` to the app
  — it would double-prefix and break routes.
- **`/api/auth/*` is a separate Route Handler** at `src/app/api/auth/[...all]/`
  owned by better-auth, NOT Hono. Don't add an `auth` route to the Hono app,
  and don't put any other handler under `/api/auth/`.
- **`api` in Server Components needs cookie forwarding.** `hc` uses `fetch`,
  which on the server does NOT auto-attach the incoming session cookie — bare
  `api.x.$get()` will 401. Forward with `{ headers: Object.fromEntries(await headers()) }`
  as the second arg (see §6.5). In Client Components cookies ride along
  automatically. For SSR reads, prefer `prisma` directly.
- **Never cast `await res.json()` to `T[]` without `Array.isArray` guard.** A
  non-OK response body is `{ error: string }` — an object, not an array. The
  bare cast compiles (TS trusts you) but throws `items.filter is not a
  function` at render time. Pattern used in `transactions/page.tsx`:
  ```ts
  const res = await api.transactions.$get({}, { headers: Object.fromEntries(await headers()) });
  if (res.status === 401) redirect("/sign-in");
  let transactions: TransactionRow[] = [];
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[transactions] API error", res.status, body);
  } else {
    const data = await res.json();
    transactions = Array.isArray(data) ? (data as TransactionRow[]) : [];
  }
  ```
  Pages must **always** show a graceful fallback branch when `!res.ok`. Client
  components (`TransactionsView`) additionally guard the prop with
  `Array.isArray(transactions)` + `useMemo` so a malformed prop never reaches
  `.filter()` (see `transactions-view.tsx`).
- **`ReadonlyHeaders` is not `Record<string, string>`.** `next/headers`'s
  `headers()` returns `ReadonlyHeaders`, but `hc`'s `init.headers` expects
  `Record<string, string>`. Convert with `Object.fromEntries(await headers())`,
  not a bare `await headers()`.
- **Every user-owned resource must scope by `userId`.** The controller reads
  `c.get("user").id`, the service filters every Prisma query by `{ userId }`,
  and the app schema `.pick()`s away `userId` so the client can't forge it.
  Skipping any of these is a privilege-escalation bug.
- **better-auth `prismaAdapter` needs `provider: "postgresql"`.** It's set in
  `src/lib/auth.ts`. If you switch DBs, change both Prisma and the adapter.

---

## 15. Reproducing This Architecture From Scratch

1. `bunx create-next-app@latest . --ts --app --src-dir --tailwind --eslint --use-bun`
2. `bun add hono @hono/zod-validator zod` and `bun add @prisma/client @prisma/adapter-pg pg`
   and `bun add -D prisma @types/pg prisma-zod-generator dotenv @types/bun`
3. `bun add better-auth` — auth layer (email/password + OAuth). See `src/lib/auth.ts`.
4. `bunx prisma init --datasource-provider postgresql` → edit `prisma/schema.prisma`
   (add both generators, set `output` paths) and `prisma.config.ts`. Add the
   `User`/`Session`/`Account`/`Verification` models (better-auth requires these)
   plus your domain models with `userId` relations.
5. Add the `generator zod` block; define your models; `bun run db:migrate --name init`.
6. Create `src/lib/prisma.ts` (singleton + `PrismaPg`).
7. Create `src/lib/auth.ts` (better-auth instance using `prismaAdapter`) and
   `src/app/api/auth/[...all]/route.ts` (better-auth's own handler — NOT Hono).
8. Create `src/server/middleware/auth.ts` (`AppEnv` + `requireAuth`).
9. Create `src/server/{index.ts, routes, controllers, services, schemas}` per §5.
   Start each router chain with `.use("*", requireAuth)`.
10. Create `src/app/api/[[...route]]/route.ts` per §7 (with `stripApiPrefix`).
11. Create `src/lib/api-client.ts` — `hc<App>(baseURL)` with SSR-aware baseURL
    (see §6.5), NOT a bare `hc<App>("/api")`.
12. Update `package.json` scripts + `trustedDependencies` per §10.
13. Add generated paths to `.gitignore` and `eslint.config.mjs` ignores.
14. `bun run lint && bun run typecheck && bun run build`.

You now have an identical, fully type-safe, authenticated, REST-based, 3-layer
Next.js + Hono + Prisma + better-auth stack on Bun.

---

## 16. Transactions UI (frontend)

The transactions feature is the richest UI in the app and lives across these
components (all `"use client"` unless noted):

| File | Role |
| ---- | ---- |
| `src/app/transactions/page.tsx` (RSC) | Auth gate + fetch via `api.transactions.$get` (cookie-forwarded) + `Array.isArray` guard → renders `<TransactionsView>`. Shows a graceful error branch if `!res.ok`. |
| `src/app/transactions/add/page.tsx` (RSC) | Auth gate + fetch balance accounts (cookie-forwarded) → renders `<AddTransactionWizard>`. **No sidebar** — immersive centered flow. |
| `src/components/transactions-view.tsx` | Search bar (client-side filter, debounced via `useMemo`) + Add button → `/transactions/add` + Download PDF button + **date-grouped list** (`Today` / `Yesterday` / `14 Jul 2026` headers). Owns `selected` state → opens detail sheet. Two empty states: "no transactions yet" (with CTA) and "no results" (minimalist). |
| `src/components/transaction-item.tsx` | Minimalist row (Cash App / Wise style): 36px tinted icon (income green / expense soft-red / transfer orange) + name + `bank • category` subtitle + colored amount + time. Whole row is a `<button>` → opens detail sheet. Hairline divider, hover `bg-[#FAFAFA]`. No borders, no badges, no per-row delete. |
| `src/components/transaction-detail-sheet.tsx` | Bottom sheet (mobile) / centered dialog (desktop) opened by tapping a row. Shows type chip + hero amount (colored) + detail rows (Bank / Category / Date / Time) + **Delete trigger** button (full-width `bg-[#FFBABA]`). The trigger does NOT delete directly — it opens a confirm `Dialog` (rendered as a **sibling** of the sheet scrim via a `<>` fragment, so scrim clicks don't bubble to the sheet's `onClose`). Confirm dialog: "Delete transaction?" + names the txn + amount + "cannot be undone" + `softred` Delete (`api.transactions[":id"].$delete`, `loading`-gated `onOpenChange`) + `outline` Cancel. On success → `setConfirmOpen(false)` + sheet `onClose()` + `router.refresh()`. |
| `src/components/add-transaction-wizard.tsx` | 3-step wizard. **Top bar**: back chevron (left) + `1 of 3` (right). **Slim 2px progress track** (replaces chunky numbered stepper). **Step 1**: type cards (income/expense/transfer) — selecting a type resets the category. **Transfer card is disabled when `accounts.length < 2`** (desc swaps to "Add another account to transfer"). **Step 2**: hero amount at top (add-account style: currency prefix + `dynamicFontSize` + `formatBalanceInput`) + hairline-divided field list (bank, dest, name, **CategorySelect** (native `<select>` filtered by type from `src/lib/categories.ts`), admin fee, date). **Step 3**: hero amount + review rows + Confirm and Add. **Insufficient balance pre-check**: before the API call, the wizard checks `source.balance` client-side (expense: `amount > balance`, transfer: `amount + fee > balance`) and shows "Insufficient balance" instantly. **Single full-width CTA per step**. **No sidebar, no card chrome** — flush with background. **No-accounts guard**: the RSC `add/page.tsx` renders a §7.5 empty state (`Wallet` icon + `AddAccountDialog` inline) instead of the wizard when `accounts.length === 0`; on account creation `router.refresh()` swaps in the wizard automatically. |
| `src/components/download-pdf-dialog.tsx` | Dialog with 3 scope options (All / Filtered by search / Date range). Generates PDF client-side via `jspdf` + `jspdf-autotable` (table of transactions + income/expense/transfer summary). Downloads `transactions.pdf`. |

### Color tokens (transactions)
| Type | Icon bg | Text |
| ---- | ------- | ---- |
| income (soft green) | `bg-[#A0FFA8]/30` | `text-[#1F9B29]` |
| expense (soft red) | `bg-[#FFBABA]/40` | `text-[#D8000C]` |
| transfer (soft orange) | `bg-[#FFD9A0]/40` | `text-[#B25B00]` |

These mirror the existing `soft` / `softred` Button variants (§0 design system).
The orange variant is new and transaction-specific.

### Formatting helpers (`src/lib/format.ts`)
- `formatRupiah(n)` → `"Rp 1.234.567,00"` (id-ID grouping, comma→dot).
- `formatBalanceInput(raw)` → strips non-digits, groups with `id-ID`, keeps leading `-`.
- `formatDate(d)` → `"14 Jul 2026"` (en-GB short).
- `formatTime(d)` → `"2:30 pm"` (en-US hour12, lowercased).
- `formatDateTimeLocalValue(date)` → `"2026-07-14T14:30"` (for `<input type="datetime-local">` default value).

---

## 17. The `$transaction` Balance-Update Pattern (Transaction service)

`Transaction` is the only resource whose **create** and **delete** mutate a
**sibling** model (`BalanceAccount.balance`) atomically. This is done inside a
Prisma `$transaction` callback so the balance can never drift from the
transaction history.

### `createTransaction(userId, input)` — `src/server/services/transactions.ts`

```ts
return prisma.$transaction(async (tx) => {
  // 1. Verify the source account is owned by this user (anti privilege escalation).
  const source = await tx.balanceAccount.findFirst({
    where: { id: input.balanceAccountId, userId },
  });
  if (!source) throw new Error("Account not found");

  // 2. For transfers, verify destination is owned + ≠ source.
  let dest = null;
  if (input.type === "transfer") {
    if (!input.toBalanceAccountId) throw new Error("Destination account required");
    dest = await tx.balanceAccount.findFirst({
      where: { id: input.toBalanceAccountId, userId },
    });
    if (!dest) throw new Error("Destination account not found");
  }

  // 3. Create the transaction row (with include so the response carries account names).
  const txn = await tx.transaction.create({ data: { ... }, include: { balanceAccount: ..., toBalanceAccount: ... } });

  // 4. Mutate the balance(s) based on type — all inside the same tx.
  if (input.type === "income")      tx.balanceAccount.update({ where: { id: input.balanceAccountId },    data: { balance: { increment: input.amount } } });
  if (input.type === "expense")     tx.balanceAccount.update({ where: { id: input.balanceAccountId },    data: { balance: { decrement: input.amount } } });
  if (input.type === "transfer" && dest) {
    tx.balanceAccount.update({ where: { id: input.balanceAccountId },       data: { balance: { decrement: input.amount + input.adminFee } } }); // source loses amount + fee
    tx.balanceAccount.update({ where: { id: input.toBalanceAccountId! },    data: { balance: { increment: input.amount } } });                 // dest gains amount (fee stays with source)
  }

  return txn;
});
```

### `deleteTransaction(userId, id)` — reverses the balance effect

Before deleting, the service looks up the existing transaction (ownership
check), then **applies the inverse balance mutation** inside a `$transaction`,
then deletes the row:

| type | create effect | delete effect (reverse) |
| ---- | ------------- | ----------------------- |
| income | source `+amount` | source `-amount` |
| expense | source `-amount` | source `+amount` |
| transfer | source `-(amount+adminFee)`, dest `+amount` | source `+(amount+adminFee)`, dest `-amount` |

### Why this lives in the service (not the controller)

The balance mutation is **business logic**, not HTTP I/O — it belongs in the
service layer per §5. The controller just calls
`createTransaction(user.id, body)` / `deleteTransaction(user.id, id)` and maps
`Error("…not found")` to 404. The service is the **only** layer that touches
`prisma.$transaction`, and it's still pure TS (no `Context`, no `Request`) so
it remains unit-testable without HTTP.

### Gotcha: `SetNull` means the account may be gone

`Transaction.balanceAccountId` / `toBalanceAccountId` use `onDelete: SetNull`.
A transaction can outlive its account — the `include` returns `balanceAccount:
null`. The UI handles this by showing "Deleted account" in the row subtitle and
detail sheet. The **delete** path must therefore guard `if (txn.balanceAccountId)`
before attempting the reverse update (a null FK means there's nothing to
reverse — the account was already deleted, taking its balance with it).

### Balance guard — no negative balances (see §17)

Both `createTransaction` and `deleteTransaction` guard against pushing a
`BalanceAccount.balance` below 0:

- **Create**: `expense` and `transfer` check `source.balance − (amount [+ adminFee]) < 0`
  → `throw new Error("Insufficient balance")` → controller maps to 400.
- **Delete**: `income` (source decremented) and `transfer` (dest decremented)
  fetch the current account balance first and check if the reverse would go
  negative. Expense refunds and transfer source refunds always increase, so
  no guard needed.
- **Controller error mapping**: `remove` now distinguishes "not found" → 404
  from other errors → 400 (was a bare `catch → 404` that masked "Insufficient
  balance"). `create` uses `.toLowerCase().includes("not found")` for
  consistency.

---

## 18. Dashboard UI (frontend)

The dashboard (`src/app/dashboard/page.tsx`, RSC, `force-dynamic`) is the main
authenticated landing page. It fetches data via a mix of `prisma` direct reads
(SSR, no cookie forwarding) and the typed RPC client (`api["balance-accounts"].$get`
with cookie forwarding).

### Data flow

1. **Accounts + net worth**: `api["balance-accounts"].$get` (cookie-forwarded) →
   `accounts[]`, `netWorth = sum(account.balance)`.
2. **Current month cashflow**: three `prisma.transaction.aggregate` calls
   (income `_sum.amount`, expense `_sum.amount`, transfer `_sum.adminFee`) →
   `monthIncome`, `monthExpense` (expense + fees), `monthLabel`.
3. **Asset growth trajectory**: `prisma.transaction.findMany` for this year
   (`select: type, amount, adminFee, date, balanceAccountId, toBalanceAccountId`)
   → JS computation: `monthlyNet[12]` (income `+amount`, expense `−amount`,
   transfer `−adminFee`), `startingAssets = netWorth − yearNetEffect`,
   cumulative asset value per month → `growthData[]`.
4. **Net worth delta**: per-account net effect for current month
   (`accountNetThisMonth`), `lastMonthEndNetWorth = sum(a.balance −
   accountNetThisMonth[a.id])` for **all** accounts (back-dated transactions on
   a new account reconstruct a last-month baseline). `deltaPct` = percentage
   change (null when base ≤ 0 → display absolute instead).
5. **Active months**: `activeMonths[12]` — `true` if that month had ≥1
   transaction this year (computed from `yearTxns`). Passed to
   `AssetGrowthCard` to distinguish "no activity" (grey placeholder bars) from
   "active flat" (brown Stable bars).

### Layout

```
<AccountTab />
<BalanceSection value={netWorth} deltaPct={...} deltaAbsolute={...} />
[Details] [Add Account]

<h1>Your Accounts</h1>
grid (1 col mobile / 2 sm / 3 lg) → <AccountCard> per account
(empty message when accounts.length === 0)

<h1>Quick Insight</h1>
if yearTxns.length > 0:
  grid (1 col mobile / 2 md) → <CashflowCard> + <AssetGrowthCard>
else:
  <QuickInsightEmptyState>  (Sparkles icon + "No insight yet" + Add transaction CTA)
```

### Components

| File | Role |
| ---- | ---- |
| `src/components/balance-section.tsx` | Net worth hero. Shows "Your Net Worth" + eye-toggle + masked balance. Delta line: `deltaPct` as `+X.X% From last Month` (green/red by sign), or `+Rp … this month` (absolute, when last month's base was 0). `tabular-nums` on all numbers. |
| `src/components/cashflow-card.tsx` | Donut chart (pure SVG, no library). `title` prop (default "Today's Cashflow"). Two arcs (income green gradient, expense red gradient) with 20° gap, `radius=64`, rendered `w-56 h-56`. Center: `+/- N mil` (color by sign) + rupiah. Breakdown rows: `bg-[#F2F2F2] rounded-[20px]` tiles. |
| `src/components/asset-growth-card.tsx` | Apple-style bar chart (pure SVG). **`"use client"`** (hover state). 12 slots (Jan–Dec), `barW=16px`, gap ≈8px. Recorded months: growth-colored bars (green up / orange flat / red down vs previous month); no-activity months (`activeMonths[m]===false`) → grey `#E5E5E5` placeholder bars (~12px min). `rx` capped at `renderedH/2` (no oval short bars). **Hover tooltip**: HTML overlay (month+year + `formatRupiah`), tap toggles on mobile. Future months: no bar, faint label. YTD pill. Legend (Growth/Stable/Decline). Empty state: no bars + "No transactions yet" caption. |
| `src/components/quick-insight-empty-state.tsx` | `"use client"`. §7.5 "Nothing exists yet" empty state shown when the user has no transactions. `Sparkles` icon + "No insight yet" + helper desc + `success` "Add transaction" CTA → `/transactions/add`. |
| `src/components/sidebar.tsx` | Desktop: `md:sticky md:top-0 self-start` — pins to viewport top while content scrolls (stays in flex flow, no layout break). Mobile: fixed bottom tab bar (unchanged). |

---

## 19. Budgets UI (frontend)

The budgets feature (`src/app/budget/page.tsx`, RSC, `force-dynamic`) covers
**monthly + daily budget summary cards**, a **spending streams bar chart**
(per-category expense this month with budget markers), a **budgets list** with
a 3-step **add-budget wizard**, and a **subscriptions list** with an
**add-subscription dialog**. Each list row opens a bottom-sheet detail with a
confirm-dialog-gated delete.

### Data flow (RSC)

1. **Budgets + subscriptions**: direct `prisma.budget.findMany` /
   `prisma.subscription.findMany` (SSR reads — no cookie forwarding needed, per
   §6.5's "prefer `prisma` for SSR reads" guidance).
2. **Current-month expenses per category**: `prisma.transaction.findMany`
   (`where: { userId, type: "expense", date: { gte: startOfMonth() } }`,
   `select: { category, amount }`) → JS group-by-category sums →
   `monthExpenseByCategory`. Fed to both `SpendingStreamsChart` (as `data`)
   and the summary cards.
3. **Per-budget spent-in-period**: `Promise.all` over budgets, each running
   `prisma.transaction.aggregate` for its `category` with
   `date: { gte: periodStartDate(b.periodDays) }` → `spentByBudgetCategory`.
   This is what the budget list rows + summary cards use for progress.
4. **Derived figures**:
   - `monthlyBudgets = budgets.filter(b => b.periodDays === 30)` →
     `monthlyTotal`/`monthlySpent` for the Monthly summary card.
   - `dailyBudgets = budgets.filter(b => b.periodDays === 1)` →
     `dailyTotal`/`dailySpent` for the Daily summary card.
   - `usedCategories = budgets.map(b => b.category)` → passed to
     `AddBudgetDialog` so the category select hides already-budgeted categories
     (the unique `(userId, category)` constraint means duplicates would 409).

### Layout

```
<PageShell>
  <AccountTab userName={...} />
  <h1 "Budgets" />

  <BudgetSummaryCards monthly={...} daily={...} />   // grid 1 col mobile / 2 sm

  <SpendingStreamsChart data={streamsData} budgets={streamsBudgets} monthLabel={...} />

  <section "Your Budgets">
    header row: h2 + <AddBudgetDialog usedCategories={...} />
    <BudgetsList budgets spentByCategory addTrigger={<AddBudgetDialog .../>} />
  </section>

  <section "Subscriptions">
    header row: h2 + <AddSubscriptionDialog />
    <SubscriptionList subscriptions addTrigger={<AddSubscriptionDialog />} />
  </section>
</PageShell>
```

### Components

| File | Role |
| ---- | ---- |
| `src/components/budget-summary-cards.tsx` | RSC-presentational. Two `rounded-[35px]` cards in a `grid grid-cols-1 sm:grid-cols-2 gap-3`. Each card: label + month/date caption + hero `formatRupiah(total)` (`text-2xl font-bold tracking-tight tabular-nums`) + "remaining"/"over budget" caption + progress track (`h-2 bg-black/[0.06]` with green `#00C610` fill under budget / red `#D8000C` fill over, `rounded-full`, `transition-all duration-300`). Empty state when `total === 0`: "No monthly/daily budget yet" + helper text. |
| `src/components/spending-streams-chart.tsx` | **`"use client"`** (hover state). Pure-HTML horizontal bar chart — one row per expense category with spend this month, sorted desc. Each row: 24-char category label + `h-3 bg-black/[0.04] rounded-full` track + `#FFBABA` (under) / `#D8000C` (over) fill + right-aligned `formatRupiah(spent)`. Budget limit marked with a vertical `w-0.5 h-4 bg-black/40` tick at the category's budget `amount` position (if a budget exists). Hover/tap tooltip (`bg-white rounded-[20px] shadow border px-3 py-2`): category + spent + budget + remaining/over. Legend (Spent / Over budget / Budget limit). Empty state: `TrendingUp` icon + "No spending this month yet". Container `rounded-[35px] border border-black/10 shadow p-6`. |
| `src/components/budgets-list.tsx` | **`"use client"`**. §7.2 rounded list rows (`rounded-2xl px-3.5 py-3.5 hover:bg-[#FAFAFA] active:scale-[0.98]`). Each row: 40px round tinted icon (expense red `bg-[#FFBABA]/40 text-[#D8000C]`, icon from `categoryIcon(b.category, "w-5 h-5")`) + category label + period pill (`periodLabel(b.periodDays)`) + mini progress bar + amount (`formatRupiah(b.amount)`) + "spent" caption + chevron (`hidden sm:block`). Tap → `BudgetDetailSheet`. Exports `BudgetRow` type. Empty state (§7.5) with `Wallet` icon + `success` CTA (the `addTrigger` prop renders the `AddBudgetDialog` inline). |
| `src/components/add-budget-dialog.tsx` | **`"use client"`**. 3-step wizard inside `Dialog` (model on `AddTransactionWizard`'s step pattern but compact). **Step 1**: period cards (Daily=1 / Weekly=7 / Monthly=30 / Custom → days input) — active card uses `border-[#A0FFA8] bg-[#A0FFA8]/15` ring + trailing `<Check>`. **Step 2**: category `<select>` (only `EXPENSE_CATEGORIES` not in `usedCategories`) + hero amount (`dynamicFontSize` + `formatBalanceInput`, currency prefix `IDR`). **Step 3**: review rows (Category / Period / Limit) + "Confirm and Add" → `api.budgets.$post({ json: { category, amount, periodDays } })`. Slim 2px progress track (`bg-[#00C610]` fill, `transition-all duration-300 ease-out`, width = `(step/3)*100%`). 409 "Budget for this category already exists" rendered as error pill. On success → close dialog + `router.refresh()`. Trigger is `success`/`md` Button. |
| `src/components/budget-detail-sheet.tsx` | **`"use client"`**. Bottom sheet (mobile `rounded-t-[28px]` + drag handle) / centered (desktop `sm:rounded-[28px]`). Sections: category pill (`bg-[#FFBABA] text-[#D8000C]` + `categoryIcon`) + `✕` close → hero "Budget limit" + `formatRupiah(amount)` + spent caption + progress bar (green/red by over) → inset detail card (`rounded-[20px] bg-[#FAFAFA] divide-y divide-black/[0.04]`) with DetailRows (Period / Limit / Spent / Remaining) → full-width delete trigger (`h-11 rounded-[35px] bg-[#FFBABA] text-[#D8000C]`) → confirm `Dialog` (sibling fragment, `softred` Delete + `outline` Cancel, `loading`-gated `onOpenChange`) → `api.budgets[":id"].$delete` → `router.refresh()`. `sheetIn` animation (12px slide-up + fade, 200ms). |
| `src/components/subscription-list.tsx` | **`"use client"`**. Same §7.2 row pattern as `budgets-list`. Each row: 40px round icon (transfer orange `bg-[#FFD9A0]/40 text-[#B25B00]`, since subscriptions are recurring outflows) + name + `categoryLabel(category) · periodLabel(periodDays)` subtitle + "Next {date}" caption (via `nextBillingDate`) + amount + "Inactive" tag when `!active` + chevron. Tap → `SubscriptionDetailSheet`. Exports `SubscriptionRow` type. Empty state with `Repeat` icon + `success` CTA. |
| `src/components/add-subscription-dialog.tsx` | **`"use client"`**. Single `Dialog` form (not a wizard — subscriptions are simpler than budgets). Fields: name (`AuthInput`), category `<select>` (`EXPENSE_CATEGORIES`), billing cycle `<select>` (Weekly=7 / Monthly=30 / Yearly=365), start date (`<input type="date">`), hero amount (`dynamicFontSize` + `formatBalanceInput`). Submit → `api.subscriptions.$post({ json: { name, amount, category, periodDays, startDate, active: true } })`. 409 "Subscription with this name already exists" → error pill. On success → `router.refresh()`. Trigger is `success`/`md` Button. |
| `src/components/subscription-detail-sheet.tsx` | **`"use client"`**. Same sheet shape as `budget-detail-sheet`. "Subscription" pill (`bg-[#FFD9A0] text-[#B25B00]` + `Repeat` icon). DetailRows: Name / Category / Amount / Period / Started / Next billing (computed via `nextBillingDate`) / Status (Active/Inactive). Delete → confirm `Dialog` → `api.subscriptions[":id"].$delete`. |
| `src/lib/budget.ts` | Pure helpers: `periodLabel(days)` (1→"Daily", 7→"Weekly", 30→"Monthly", 365→"Yearly", else "Every N days"), `periodStartDate(days)` (subtracts days from now, midnight), `nextBillingDate(startDate, days)` = `start + ceil((now-start)/days)*days`, `startOfToday`, `startOfMonth`. Shared by the budget page, both detail sheets, both lists, and the add dialogs. |
| `src/lib/category-icon.tsx` | `categoryIcon(category, className)` returns a **`ReactElement`** (a lucide icon per `Category` — e.g. `FoodAndDrink→UtensilsCrossed`, `Rent→Home`, `Entertainment→Film`, `Healthcare→HeartPulse`). **Must return an element, not a component type/class** — returning a component type triggers `react-hooks/static-components` lint errors. Call sites: `budget-detail-sheet`, `budgets-list`, `subscription-list`. |

### Color tokens (budgets)

| Element | Token | Used in |
| ------- | ----- | ------- |
| Budget icon tile | `bg-[#FFBABA]/40 text-[#D8000C]` | Budget list rows, budget detail pill |
| Subscription icon tile | `bg-[#FFD9A0]/40 text-[#B25B00]` | Subscription list rows, subscription detail pill |
| Under-budget progress | `bg-[#00C610]` (brand green) | Summary cards, list mini-bars, detail sheet bar |
| Over-budget progress | `bg-[#D8000C]` (expense red) | Summary cards, list mini-bars, detail sheet bar |
| Spending-streams bar fill | `bg-[#FFBABA]` (under) / `bg-[#D8000C]` (over) | `spending-streams-chart` |
| Budget limit tick | `bg-black/40` | `spending-streams-chart` |

> Subscriptions reuse the **transfer orange** tint (`#FFD9A0`/`#B25B00`) because
> they're recurring outflows — semantically closer to "money moving out on a
> schedule" than one-off expenses. This keeps the 3-tint system (income green /
> expense red / transfer orange) intact without introducing a 4th hue (per
> `UI_DESIGN.md` §3).

### Gotchas

- **`prisma.subscription` undefined at runtime after adding the model**: the
  `PrismaClient` singleton in `src/lib/prisma.ts` is cached on `globalThis`
  during dev to survive hot-reload. When the schema changes + the client is
  regenerated, the **cached instance is stale** and lacks the new `subscription`
  delegate → `Cannot read properties of undefined (reading 'findMany')`. Fix:
  **restart `bun run dev`** to clear `globalThis.prisma`. The build is unaffected
  (it creates a fresh client). This applies to any new Prisma model added mid-dev.
- **Budget `category` is a Prisma enum (`Category`), not `String`**: the budget
  page casts `b.category as Category` when passing to
  `prisma.transaction.aggregate`'s `where.category` (typed as `Category`).
  `spentByBudgetCategory` is keyed by `string` for ergonomic lookups.
- **No edit in v1**: budgets and subscriptions support create + delete only.
  The PATCH routes exist (`api.budgets[":id"].$patch` /
  `api.subscriptions[":id"].$patch`) but the UI doesn't wire them — adding edit
  is a small follow-up (the detail sheet would gain an "Edit" button → a dialog
  prefilled with the current row).
- **`AddBudgetDialog` hides already-used categories**: the `(userId, category)`
  unique constraint means a second budget for the same category would 409. The
  dialog's category `<select>` filters out `usedCategories` (passed from the
  page). When all 10 expense categories are taken, the select shows "All expense
  categories already have budgets" and the form can't be submitted.
- **Subscriptions are independent of transactions**: creating a subscription
  does **not** create a recurring transaction or auto-deduct from any account.
  They're a planning/tracking surface — the UI computes the next billing date
  client-side via `nextBillingDate(startDate, periodDays)`. Auto-deduct is a
  future feature.

---

## 20. Profile & Plus UI (frontend)

The profile page (`src/app/profile/page.tsx`, RSC) is the account & subscription
surface: identity card, Plus membership management, and sign-out. The Plus
checkout flow uses a **mock Midtrans QRIS** payment wizard — every mock piece
is clearly marked and designed to be swapped for the real Midtrans SDK without
touching the frontend.

### Data flow (RSC)

1. **Session**: `auth.api.getSession({ headers: await headers() })` → redirect
   to `/sign-in` if absent.
2. **Plus status**: `api.user.$get` (cookie-forwarded) → `{ plus: boolean }`.
   Guards `res.ok` + 401 → redirect. On non-OK, `plus` defaults to `false`
   (graceful fallback — the upgrade card shows).

### Layout

```
<PageShell>
  header: h1 "Account" + Back (outline) + SignOutButton (softred)

  {/* Identity card — black, centered, staggered entrance */}
  <div rounded-[35px] bg-black animate-[profileReveal]>
    avatar (80px, getInitials) + name + email + tier pill (Plus=green / Free=white/10)
    hairline divider + membership id
  </div>

  {plus ? (
    {/* Plus member card — white, border, shadow, staggered entrance */}
    <div rounded-[35px] border border-black/10 bg-white>
      "Budgie Plus" + "Active" badge (success) + plan/payment inset card
      <UpgradePlusButton plus={true} /> → outline "Downgrade to Free"
    </div>
  ) : (
    {/* Upgrade card — white, border, shadow, staggered entrance */}
    <div rounded-[35px] border border-black/10 bg-white>
      "Budgie Plus" + "50% off your first month"
      hero price: Rp 24.500 (green) + struck Rp 49.000 + "/month"
      "Then Rp 49.000 per month. Cancel anytime."
      payment/billing inset card
      <UpgradePlusButton plus={false} /> → success "Upgrade to Plus" (opens wizard)
    </div>
  )}
</PageShell>
```

The conditional rendering ensures **one `variant="success"` CTA per surface**
(§12): the upgrade card shows the wizard trigger (success variant), the Plus
card shows an outline Downgrade button — never two greens at once. Both cards
use the §4.6 AccountCard shape (`rounded-[35px] border border-black/10 shadow-
[0_4px_24px_-8px_rgba(0,0,0,0.08)]`) — no saturated green background (the
sign-in screen is the only saturated surface per §9). Real pricing (Rp 24.500
first month / Rp 49.000 regular) — no placeholders. Entrance animations use
the `profileReveal` keyframe (8px slide-up + blur-in, 200ms ease-out,
`motion-reduce` gated) with staggered delays (0ms / 60ms / 120ms).

### Components

| File | Role |
| ---- | ---- |
| `src/app/profile/page.tsx` (RSC) | Auth gate + fetch `api.user.$get` (cookie-forwarded) + conditional Plus/upgrade card. Black identity card (avatar, name, email, tier pill, membership ID) + white card (upgrade pricing or Plus member status). Real pricing (Rp 24.500 / Rp 49.000). Staggered `profileReveal` entrance animations. |
| `src/components/upgradePlusButton.tsx` (`"use client"`) | Two-mode button. `plus=false` → renders `<PlusPaymentWizard>` with `triggerVariant="success" triggerSize="lg" triggerFullWidth triggerLabel="Upgrade to Plus"`. `plus=true` → full-width `outline` "Downgrade to Free" button: PATCHes `api.user.$patch({ json: { plus: false } })` with loading + error pill (§7.6), then `router.refresh()`. No payment flow for downgrade. |
| `src/components/plus-payment-wizard.tsx` (`"use client"`) | 3-step Dialog-wizard (§14.3 pattern). Accepts `triggerVariant`/`triggerSize`/`triggerFullWidth`/`triggerLabel` props. **Step 1**: hero price (Rp 24.500 green + struck Rp 49.000) + "Then Rp 49.000 per month. Cancel anytime." + inset pricing card (first-month, regular, QRIS) + `success` "Continue to pay" → `POST /api/plus/checkout`. **Step 2**: QRIS display — `<QRCodeSVG>` from `qrcode.react` (renders `qrString` as a real scannable QR), "Scan with your e-wallet" title, spinning `Loader2` "Waiting for payment…", `outline` "I've paid" → `POST /api/plus/simulate-payment/:orderId`, `outline` "Cancel". Polls `GET /api/plus/status/:orderId` every 3s. On `settlement` → step 3. **Step 3**: "Welcome to Budgie Plus" + `success` "Done" → close + `router.refresh()`. Step transitions use `stepReveal` keyframe (6px slide-up + fade, 200ms, `motion-reduce` gated). No decorative icons. |
| `src/components/account-tab.tsx` (async RSC) | Fetches `api.user.$get` → renders `<AccountTabView plus={...} userName={...} />`. Shows "Get Budgie Plus" `success` button (links to `/profile`) only when `plus === false`. |
| `src/components/account-tab.tsx` → `AccountTabView` (sync presentational) | The exported sync component — **test this, not the async wrapper** (React Testing Library can't await async server components in jsdom). Props: `{ userName, plus }`. |
| `src/lib/midtrans.ts` | **Mock Midtrans QRIS client**. `createQrisTransaction` (→ `{ qrString, status, expiresAt }`), `getTransactionStatus`, `simulatePayment` (**MOCK ONLY**), `verifyWebhookSignature` (mock: always true), `parseWebhookNotification`. Every function marked `// === MOCK: replace with midtrans-client ===`. In-memory `Map` store. Generates EMVCo-style QRIS strings (`00020101021226...`). |

### The mock Midtrans QRIS flow

```
Frontend                          Backend (src/server/services/plus.ts)
   │
   │  POST /api/plus/checkout
   │─────────────────────────────►│ createCheckout(userId)
   │                               │  → generate orderId (BUDGIE-PLUS-…)
   │                               │  → midtrans.createQrisTransaction (MOCK)
   │                               │  → prisma.plusOrder.create (pending)
   │  ◄────────────────────────────│  201 { orderId, qrString, status, expiresAt }
   │
   │  render QR (qrcode.react)
   │  poll GET /api/plus/status/:orderId every 3s
   │─────────────────────────────►│ getStatus(userId, orderId)
   │                               │  → ownership check (findFirst orderId+userId)
   │                               │  → midtrans.getTransactionStatus (MOCK)
   │  ◄────────────────────────────│  { transactionStatus: "pending", plus: false }
   │
   │  user clicks "I've paid" (MOCK SIMULATION)
   │  POST /api/plus/simulate-payment/:orderId
   │─────────────────────────────►│ simulatePaymentForOrder(userId, orderId)
   │                               │  → ownership check
   │                               │  → midtrans.simulatePayment (MOCK: pending→settlement)
   │                               │  → prisma.plusOrder.update (status, paidAt)
   │                               │  → prisma.user.update (plus = true)
   │  ◄────────────────────────────│  { transactionStatus: "settlement" }
   │
   │  step 3: "Welcome to Budgie Plus"
   │  router.refresh()
   ▼
```

**Real Midtrans integration** (swap path):
1. `bun add midtrans-client`
2. In `src/lib/midtrans.ts`: replace each `// === MOCK ===` function body with
   the corresponding `midtransClient.SnapBi.qris()` SDK call. `createQrisTransaction`
   → `.createPayment(externalId)`, `getTransactionStatus` → `.getStatus(externalId)`,
   `verifyWebhookSignature` → `.notification().isWebhookNotificationVerified()`.
3. Remove `simulatePayment()` from `midtrans.ts` and the
   `POST /api/plus/simulate-payment/:orderId` route + controller + service
   function — the webhook replaces it.
4. Keep `plus-payment-wizard.tsx` **unchanged** — it already polls
   `GET /api/plus/status/:orderId`, which will see `settlement` when the real
   webhook grants Plus. The "I've paid" button can stay as a "check status"
   action or be removed.
5. Set `MIDTRANS_SERVER_KEY` / `MIDTRANS_CLIENT_KEY` env vars.
6. Everything else (PlusOrder model, services, frontend) stays the same.

### The `PlusOrder` model

```prisma
model PlusOrder {
  id        String    @id @default(cuid())
  orderId   String    @unique       // Midtrans order id (BUDGIE-PLUS-…)
  userId    String
  amount    Float                    // price paid (first-month or regular)
  status    String    @default("pending")  // pending | settlement | expire | …
  paidAt    DateTime?                // set when status → settlement
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  user      User      @relation(...)
  @@index([userId])
  @@map("plus_order")
}
```

- `orderId` is `@unique` — one Midtrans order per row.
- `status` is a `String` (not an enum) so Midtrans' free-form status values
  (`settlement`, `capture`, `expire`, `cancel`, `deny`, `refund`) don't need a
  migration when Midtrans adds new ones.
- `paidAt` is nullable — only set on `settlement` / `capture+accept`.
- **Two `add_plus_order` migrations** (sequential, not duplicate): `20260720000000_add_plus_order` creates the `plus_order` table (unique index on `orderId`, index on `userId`, FK `plus_order_userId_id_fkey` — Prisma's auto-name with a doubled `_id`); `20260720072945_add_plus_order` is a corrective follow-up that renames that constraint to the standard `plus_order_userId_fkey` form (matching every other FK in the `init` migration). Both are committed and applied by `prisma migrate deploy`.

### Gotchas

- **The webhook is public** (`POST /api/plus/webhook`, no `requireAuth`).
  Midtrans calls it server-to-server. The mock `verifyWebhookSignature` always
  returns `true` — **NEVER ship this in production**. An attacker could POST a
  fake `{ transaction_status: "settlement" }` and grant themselves Plus. The
  real integration must verify the `X-Signature` header via the Midtrans SDK.
- **`qrcode.react` renders the mock QR string as a real scannable QR** — but a
  real e-wallet would reject it (the mock merchant isn't registered). The mock
  flow uses `simulatePayment()` to mark it paid. When real Midtrans is wired,
  the same `QRCodeSVG` component renders the real `qr_string` unchanged.
- **Polling is a fallback, not the primary signal.** The webhook is the source
  of truth for payment status. The frontend polls `GET /api/plus/status` every
  3s as a backup (in case the webhook is delayed), but the "I've paid" button
  (mock) or the webhook (real) is what actually transitions the order.
- **`PlusOrder.status` is a `String`, not a Prisma enum** — Midtrans may add
  new status values. Using `String` avoids a migration. The service handles
  the known values; unknown ones are stored as-is.
- **`AccountTabView` is the sync presentational component** — test that, not
  the async `AccountTab` wrapper (jsdom can't await async server components).

---

## 21. Landing Page (frontend) — public marketing surface

`src/app/page.tsx` is the **public, unauthenticated** root route (`/`). It is a
React Server Component (RSC) and deliberately stands **outside** the 3-layer
backend and the type-safety chain — it imports neither `requireAuth`, nor
Prisma, nor the Hono `App`, nor the `api` RPC client. Its sole job is marketing
copy + SEO, so that an anonymous visitor lands on `/` and sees the product
before auth, while `/dashboard`, `/budget`, `/transactions`, `/profile`, and
`/chat` remain auth-gated and untouched.

### Composition

`page.tsx` renders `<LandingPage/>` (re-exported from `src/components/landing/`,
21 components) wrapped with four `<script type="application/ld+json">` blobs:

```
src/app/page.tsx                       # public RSC — metadata + JSON-LD + <LandingPage/>
src/components/landing/
  ├─ index.tsx                         # <LandingPage/> (async RSC) → <LandingPageView session> (sync, testable)
  ├─ reveal.tsx                        # "use client" — IntersectionObserver fade/translate (≤300ms)
  ├─ scroll-progress.tsx               # "use client" — top reading-progress bar
  ├─ landing-nav.tsx                   # sticky translucent nav (Get started / Sign in)
  ├─ smooth-scroll.tsx                 # "use client" — Lenis smooth scroll + hash-click gliding
  ├─ hero-headline.tsx                 # "use client" — staggered line-mask reveal H1 (green accent)
  ├─ hero-preview.tsx                  # hero net-worth mockup, wrapped in <TiltCard>
  ├─ animated-counter.tsx              # "use client" — count-up on reveal
  ├─ marquee.tsx                       # infinite logos strip (green-fill pill hover)
  ├─ video-showcase.tsx                # "See it in motion" — wraps <AutoVideo>
  ├─ auto-video.tsx                    # "use client" — the ONLY <video> in the repo
  ├─ spotlight.tsx                     # "use client" — mouse-follow green radial glow (CSS vars)
  ├─ tilt.tsx                          # "use client" — 3D perspective tilt (±6°, perspective:1200px)
  ├─ magnetic.tsx                      # "use client" — cursor-follow CTA nudge (≤4px, 150ms)
  ├─ feature-grid.tsx                  # 3-up feature cards (SpotlightCard + hover lift)
  ├─ showcase.tsx                      # alternating image/text feature rows
  ├─ vignettes.tsx                     # 3× 9:16 silent vignettes (AutoVideo per slot)
  ├─ privacy-spotlight.tsx             # balance-masking marketing copy
  ├─ pricing.tsx                       # Plus pricing tiers (SpotlightCard, green-glow hover)
  ├─ faq.tsx                           # animated FAQ accordion + FAQ_ITEMS constant
  ├─ footer.tsx                        # links + copyright
  └─ mock-data.ts                      # stat/feature copy
```

`<LandingPage/>` order: `ScrollProgress` → `LandingNav` → hero (`HeroPreview`)
→ `Marquee` → `VideoShowcase` → `FeatureGrid` →
`Showcase` → `Vignettes` → `PrivacySpotlight` → `Pricing` → `Faq` → final CTA
→ `Footer`. (The animated stat strip is currently commented out in `index.tsx`.)
Anchor navigation uses `/#section` hrefs (nav, footer, hero) glided by
`SmoothScroll` — a Lenis-powered "use client" layer in `LandingPageView`
(eased rAF loop, −88px offset for the sticky nav, deep-link hash settling +
`replaceState` cleanup). It never mounts under `prefers-reduced-motion`, and
`globals.css` carries Lenis's recommended `.lenis` styles.

### `AutoVideo` — the only `<video>` in the repo

`src/components/landing/auto-video.tsx` is a `"use client"` component that
renders an HTML `<video>` with `muted`, `loop`, `playsInline`, and a poster tint
that fades out once the media can play. Props (see `video-showcase.tsx`):

```tsx
<AutoVideo
  webm="/videos/brand.webm"                       // local drop-in (public/videos/brand.webm)
  mp4="https://…vercel-storage.com/budgieDemo.mp4"  // hosted Vercel-Blob fallback (same clip as README.md)
  label="Budgie app walkthrough, sixty seconds, silent"
  glyphSize="w-16 h-16"
  posterClassName="bg-[#FAFAFA]"
  frameClassName="mt-10 aspect-[16/9] rounded-[35px] …"
/>
```

The `<video>` lists `webm` first, `mp4` second; the browser picks the first it
supports (modern Chromium/Firefox use `.webm`, Safari falls back to `.mp4`).
Under `prefers-reduced-motion: reduce` the video does **not** autoplay and the
poster stays — the surrounding text carries the message. `budgieDemo.mp4` is
the exact same hosted Vercel-Blob clip embedded as the demo `<video>` in
`README.md`, so the landing page and the README demo never drift apart.

### Video asset drop-in — `public/videos/`

`public/videos/` is a **drop-in** directory: it ships only a `README.md`
specifying filenames (`brand.webm` + `brand.mp4` for the 16:9 main walkthrough;
`vignette-1..3.webm`/`.mp4` for 9:16 vignettes). Until the files land, the page
never looks broken — `AutoVideo` keeps its poster layer up and the `<video>`
silently no-ops. The moment a matching file exists at `/videos/brand.webm` (or
is resolved via the Vercel-Blob `mp4` URL), the section lights up. See
`public/videos/README.md` for compression targets (≤8MB brand, ≤3MB vignettes,
silent, loopable).

### SEO surface

`page.tsx` exports a full Next.js `metadata` export (title/description/keywords,
`openGraph.videos` for both `brand.mp4` and `brand.webm` at 1920×1080, twitter
card) plus four JSON-LD blocks injected as raw `<script type="application/ld+json">`:

- `WebApplication` — `applicationCategory: "FinanceApplication"`, free `Offer` in IDR.
- `BreadcrumbList` — Home → Pricing (`#pricing`) → FAQ (`#faq`).
- `FAQPage` — generated from the `FAQ_ITEMS` constant in `src/components/landing/faq.tsx`.
- `VideoObject` — `contentUrl` = the Vercel-Blob `brand.mp4`, `duration: "PT1M0S"`.

Supporting files in `src/app/`: `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`.

### Gotchas

- **Do not add auth, Prisma, or Hono to the landing page.** It is intentionally
  public and static. Any data needs belong to the auth-gated routes or the
  `/api` Hono app — the landing page reads nothing from the DB.
- **`AutoVideo` is the only `<video>` in the repo.** Don't reach for a second
  video primitive; extend this one. If you need a new vignette slot, reuse
  `AutoVideo` with different `webm`/`mp4`/`label` props (see `vignettes.tsx`).
- **The README demo `<video>` and the landing `AutoVideo` share one mp4 URL.**
  Keep them in sync — swap the Vercel-Blob asset in both `auto-video.tsx`'s
  usage site (`video-showcase.tsx`) and `README.md` together.
- **Missing video assets must never break the page.** The poster stays up by
  design; do not "fix" the silent failure into an error state.
