<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Build & verify commands
- Lint: `bun run lint`
- Typecheck: `bun run typecheck`
- Build: `bun run build`
- Dev: `bun run dev`
- Test: `bun run test` (Vitest + jsdom + @testing-library; one-shot)
- Test (watch): `bun run test:watch`

## Stack
- Runtime: Bun (`bunx`/`bun run`)
- Frontend: Next.js 16 (App Router, `src/`)
- Backend: Hono mounted as a catch-all Route Handler at `src/app/api/[[...route]]/route.ts` (REST, NOT server actions). All backend logic lives in `src/server/`.
- ORM: Prisma 7 (schema at `prisma/schema.prisma`, generated client at `src/generated/prisma` — gitignored). Config in `prisma.config.ts`. `build` runs `prisma migrate deploy` first (non-interactive, applies pending migrations from `prisma/migrations/` to the prod DB via `DIRECT_URL`), then `prisma generate`, then `next build`. `DIRECT_URL` = direct (non-pooled) connection for migrations; `DATABASE_URL` = pooled connection used at runtime by `src/lib/prisma.ts`. On Neon: use the `-pooler` hostname for `DATABASE_URL`, the direct hostname for `DIRECT_URL`. Local dev: both may point to the same local Postgres.
- Validation/typesafety: Zod via `@hono/zod-validator`. End-to-end typed client via `hono/client` (`src/lib/api-client.ts`), typed against `App` exported from `src/server/index.ts`.
- PDF generation: `jspdf` + `jspdf-autotable` (client-side, used by Download PDF dialog).

## Resources (backend)
- `/api/budgets` — full CRUD (`routes/budgets.ts` + `controllers/budgets.ts` + `services/budgets.ts` + `schemas/budget.ts`). One budget per `(userId, category)` — `@@unique([userId, category])` enforces it; service throws `"Budget for this category already exists"` → 409 on clash. Schema picks `{ category, amount, periodDays }` (no `title`, no `currency` from the client — `currency` defaults to `"IDR"` in the schema). `category` is `z.enum(EXPENSE_CATEGORIES)`, `amount` is `z.number().positive()`, `periodDays` is `z.number().int().positive()` (1=daily, 7=weekly, 30=monthly, or any custom N). No balance/account linkage — budgets are category-level spending limits tracked against `prisma.transaction.aggregate` of expense txns in the trailing `periodDays`.
- `/api/subscriptions` — full CRUD (same 3-layer pattern: `routes/subscriptions.ts` + `controllers/subscriptions.ts` + `services/subscriptions.ts` + `schemas/subscription.ts`). One subscription per `(userId, name)` — `@@unique([userId, name])` enforces it; service throws `"Subscription with this name already exists"` → 409 on clash. Schema picks `{ name, amount, currency, category, periodDays, startDate, active }`; `category` is `z.enum(EXPENSE_CATEGORIES)`, `amount` positive, `periodDays` positive int (7=weekly, 30=monthly, 365=yearly), `startDate` is `z.coerce.date()`, `active` defaults `true`. Subscriptions are recurring charges — name + amount + billing cycle, independent of transactions (no auto-deduct; the UI shows next billing date computed from `startDate + ceil((now-start)/periodDays)*periodDays` via `nextBillingDate` in `src/lib/budget.ts`).
- `/api/balance-accounts` — full CRUD (same 3-layer pattern)
- `/api/transactions` — list/getOne/create/delete (no update/edit). Create & delete run inside a Prisma `$transaction` that **auto-updates `BalanceAccount.balance`** (income +amount, expense -amount, transfer: source -(amount+adminFee), dest +amount; delete reverses). **No negative balance guard**: create (expense/transfer) and delete (income/transfer) throw `"Insufficient balance"` → 400 if the operation would push a `BalanceAccount.balance` below 0. `Transaction` has optional FK to `BalanceAccount` (source) + `toBalanceAccount` (transfer destination), `onDelete: SetNull` so deleting an account preserves history. Schema uses `z.enum(["income","expense","transfer"])` + `z.enum(ALL_CATEGORIES)` (premade per-type lists from `src/lib/categories.ts` — users cannot type custom categories) + `.refine()` for transfer validation + `.refine()` for per-type category validation.

## Conventions
- Backend routes are Hono sub-apps registered in `src/server/index.ts` with `app.route("/x", x)` — start each chain with `.use("*", requireAuth)`.
- Auth: `requireAuth` middleware (`src/server/middleware/auth.ts`) gates every router. Controllers read `c.get("user").id` and services scope every Prisma query by `userId`.
- App schemas live in `src/server/schemas/` — `.pick()` public fields (exclude `userId`) then `.extend()` overrides. Export `Create*`/`Update*` Zod schemas + inferred types.
- Services are pure TS (no Hono, no Context). First arg is always `userId: string`. Only services import `@/lib/prisma`. Ownership checked via `findFirst({ where: { id, userId } })` before mutate.
- Prisma singleton: `src/lib/prisma.ts` (global cached in dev). Driver adapter `@prisma/adapter-pg` mandatory (Prisma 7).
- Do not use Server Actions for backend logic — use Hono routes.
- Server Components reading the DB use `prisma` directly; for mutations use the `api` client from a `"use client"` component (cookies auto-attached in the browser).
- `api` in Server Components: `hc`'s `fetch` does NOT forward incoming cookies — pass `{ headers: Object.fromEntries(await headers()) }` as the 2nd arg, or the call will 401. **Always guard `res.ok` and `Array.isArray(data)`** before casting `res.json()` to an array (non-OK responses return `{ error }` object — a bare `as T[]` cast will crash the page).
- Formatting helpers in `src/lib/format.ts`: `formatRupiah`, `formatBalanceInput`, `formatDate`, `formatTime` (am/pm), `formatDateTimeLocalValue`.
- Premade categories in `src/lib/categories.ts`: per-type lists (`INCOME_CATEGORIES`, `EXPENSE_CATEGORIES`, `TRANSFER_CATEGORIES`), `CATEGORIES_BY_TYPE` lookup, `ALL_CATEGORIES` for `z.enum`. Shared by transaction + budget + subscription schemas. Users cannot type custom categories.
- Budget/subscription helpers in `src/lib/budget.ts`: `periodLabel(days)` (1→"Daily", 7→"Weekly", 30→"Monthly", 365→"Yearly", else "Every N days"), `periodStartDate(days)` (subtracts days from now, midnight), `nextBillingDate(startDate, days)` (`start + ceil((now-start)/days)*days`), `startOfToday`, `startOfMonth`. Category→icon element helper in `src/lib/category-icon.tsx` (`categoryIcon(category, className)` returns a ReactElement — must NOT return a component type/class, or `react-hooks/static-components` lint errors).
- Full Architecture reference: see `ARCHITECTURE.md` (sections, layer contracts, RPC client usage §6.5, gotchas §14, dashboard UI §18, budgets UI §19).
- Full UI/UX design reference: see `UI_DESIGN.md`. **Before writing or modifying any component, dialog, list, or screen, read `UI_DESIGN.md`** — it pins the visual tone (calm minimal fintech), color tokens (one brand green + 3 semantic pastel tints: income/expense/transfer), radius system (`rounded-2xl` list rows, `rounded-[20px]` tiles, `rounded-[28px]`/`[35px]` sheets/cards, `rounded-full` icon tiles — **no `rounded-md/lg/xl`**), type scale, motion rules (≤300ms `ease-out`, no bounce, `motion-reduce` gated), and the canonical patterns: rounded list item (§7.2), inset card (§7.3), hero amount (§7.4), empty state (§7.5), error callout (§7.6), auth-screen special case (§9). Reuse existing tints before inventing new colors; one `variant="success"` CTA per surface. New UI checklist in §12.

