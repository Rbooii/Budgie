# Budgie API Reference

Canonical REST contract for the Budgie backend. The **web app** consumes it
through the typed `hono/client` (`src/lib/api-client.ts`); the **iOS app** is a
pure HTTP client (see `HANDSOFF_IOS.md` for the Swift-side wire protocol, auth
cookie handling, and the chat SSE framing).

- Base URL (dev): `http://localhost:3000/api`
- Base URL (prod): `https://<your-app>.vercel.app/api`
- All endpoints are JSON in / JSON out unless noted. No versioning — additive
  changes only (new optional params/fields), never breaking shape changes.

Related docs: `ARCHITECTURE.md` (layer contracts), `AGENTS.md` (performance
rules), `HANDSOFF_IOS.md` (iOS handoff).

## 1. Conventions

### Authentication

Every `/api/*` route except `/api/health`, `/api/auth/*` and
`/api/plus/webhook` requires the better-auth session cookie
(`better-auth.session_token`, or `__Secure-better-auth.session_token` over
HTTPS). Send it as a cookie, not as a bearer token.

- Missing/expired session → `401 { "error": "Unauthorized" }` (Hono routes) or
  plain-text `Unauthorized` (`/api/chat`).
- Session validation is **cached in a signed cookie for 5 minutes**
  (`session.cookieCache`), so most requests never touch Postgres. A revoked
  session stops working within that window.
- Log in/out through better-auth itself: `POST /api/auth/sign-in/email`,
  `POST /api/auth/sign-up/email`, `GET /api/auth/get-session`,
  `POST /api/auth/sign-out`.

### Caching & conditional requests

- All authenticated `GET` routes ship `Cache-Control: private, no-cache` plus a
  strong `ETag`.
- Send the `ETag` back as `If-None-Match` on the next read of the same URL →
  **`304 Not Modified` with an empty body**. This is the cheapest possible
  refresh for mobile clients that poll or re-enter a screen.
- Never cache a response whose `ETag` came from a different session.

### Pagination

List endpoints return a **bare JSON array** (unchanged from the original
contract) and put pagination metadata in headers:

| Header | Meaning |
| --- | --- |
| `X-Has-More` | `true` when more rows exist past this page |
| `X-Next-Cursor` | Opaque row id to pass as `?cursor=` for the next page |

`GET /api/transactions?limit=100&cursor=<id>` — omit **both** params for the
legacy "return everything" behaviour. `limit` is clamped to `1…500`
(`src/lib/limits.ts`, default page size `100` when only `cursor` is sent).
Rows are ordered `date DESC, id DESC` so paging can never skip or duplicate.

### Errors

Errors are `{ "error": "<message>" }` (Hono routes) with the status codes in
the per-endpoint tables. Validation failures from `@hono/zod-validator` return
`400` with Zod's issue payload. Unhandled errors → `500
{ "error": "Internal Server Error" }`.

### Security headers

Every response goes through `secureHeaders()` (`src/server/index.ts`);
`Content-Security-Policy`, `Cross-Origin-Embedder-Policy` and
`Cross-Origin-Resource-Policy` are disabled because this is a JSON API.

## 2. Resources

### 2.1 `GET /api/health` (public)

```json
{ "status": "ok", "timestamp": "2026-09-17T12:00:00.000Z" }
```

### 2.2 `/api/user`

| Method | Path | Body | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/api/user` | — | `200 { plus: boolean }` | 401 |
| PATCH | `/api/user` | `{ plus: boolean }` (required) | `200 { plus: boolean }` | 400, 401, 404 |

Only the `plus` flag is exposed/editable; the full `User` row is never
returned. `PATCH` rejects Prisma op objects (`{ set: true }`) and a missing
field with `400`.

### 2.3 `/api/plus` (mock Midtrans QRIS)

| Method | Path | Body | Success | Errors |
| --- | --- | --- | --- | --- |
| POST | `/api/plus/checkout` | — | `201 { orderId, qrString, status: "pending", expiresAt }` | 401 |
| GET | `/api/plus/status/:orderId` | — | `200 { transactionStatus, plus }` | 401, 404 |
| POST | `/api/plus/simulate-payment/:orderId` | — | `200 { transactionStatus }` | 400, 401, 404 |
| POST | `/api/plus/webhook` | Midtrans notification | `200 { ok: true }` | 400 |

`/status/:orderId` is owner-scoped. `simulate-payment` is **mock-only** and is
removed when real Midtrans is wired; the public webhook replaces it. Webhook
signature verification lives in `src/lib/midtrans.ts`. Pricing: Rp 24.500 first
month, Rp 49.000/month after (`PLUS_PRICING`).

### 2.4 `/api/budgets` — full CRUD

| Method | Path | Body | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/api/budgets` | — | `200 [Budget]` | 401 |
| GET | `/api/budgets/:id` | — | `200 Budget` | 400, 401, 404 |
| POST | `/api/budgets` | `{ category, amount, periodDays }` | `201 Budget` | 400, 401, 409 |
| PATCH | `/api/budgets/:id` | `{ category, amount, periodDays }` (all required) | `200 Budget` | 400, 401, 404, 409 |
| DELETE | `/api/budgets/:id` | — | `204` | 400, 401, 404 |

One budget per `(userId, category)` → `409 { "error": "Budget for this
category already exists" }`. `category` must be an `EXPENSE_CATEGORIES` value,
`amount > 0`, `periodDays` a positive int (1 daily, 7 weekly, 30 monthly,
365 yearly, or any custom N).

### 2.5 `/api/balance-accounts` — full CRUD

| Method | Path | Body | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/api/balance-accounts` | — | `200 [BalanceAccount]` | 401 |
| GET | `/api/balance-accounts/:id` | — | `200 BalanceAccount` | 400, 401, 404 |
| POST | `/api/balance-accounts` | `{ name, type, balance?, currency? }` | `201 BalanceAccount` | 400, 401 |
| PATCH | `/api/balance-accounts/:id` | `{ name, balance, currency, type }` (all required) | `200 BalanceAccount` | 400, 401, 404 |
| DELETE | `/api/balance-accounts/:id` | — | `204` | 400, 401, 404 |

`DELETE` runs in one `$transaction`: it removes the account's **source-side**
transactions and then the account. Transfers *into* the account keep their
history (`toBalanceAccount` → `SetNull`).

`BalanceAccount`:

```json
{
  "id": "cuid",
  "name": "BCA",
  "balance": 1500000,
  "currency": "IDR",
  "type": "bank",
  "userId": "user-id",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### 2.6 `/api/transactions`

| Method | Path | Body | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/api/transactions?limit=&cursor=` | — | `200 [Transaction]` + `X-Has-More` / `X-Next-Cursor` / `ETag` | 400, 401 |
| GET | `/api/transactions/:id` | — | `200 Transaction` | 400, 401, 404 |
| POST | `/api/transactions` | `CreateTransaction` | `201 Transaction` | 400, 401, 404 |
| DELETE | `/api/transactions/:id` | — | `204` | 400, 401, 404 |

There is deliberately no `PATCH`/`PUT` — edit by deleting and re-creating.

`CreateTransaction`:

```json
{
  "name": "Lunch",
  "amount": 45000,
  "type": "expense",
  "category": "FoodAndDrink",
  "date": "2026-09-17T12:30:00.000Z",
  "adminFee": 0,
  "balanceAccountId": "acc-id",
  "toBalanceAccountId": null
}
```

Rules enforced server-side:

- `type` ∈ `income | expense | transfer`; `category` must belong to that type's
  list (`src/lib/categories.ts`) → otherwise `400`.
- `transfer` requires `toBalanceAccountId`, distinct from `balanceAccountId`.
- The balance update happens **in the same transaction** as the row write,
  using a conditional `updateMany` guard (`balance >= amount`), so concurrent
  spends can never push a balance negative.
- Error mapping: `"Account not found"` / `"Destination account not found"` →
  `404`; `"Insufficient balance"` / `"Destination account required"` → `400`.

`Transaction` (list/detail include both account relations):

```json
{
  "id": "cuid",
  "name": "Lunch",
  "amount": 45000,
  "type": "expense",
  "category": "FoodAndDrink",
  "date": "2026-09-17T12:30:00.000Z",
  "adminFee": 0,
  "balanceAccountId": "acc-id",
  "toBalanceAccountId": null,
  "userId": "user-id",
  "createdAt": "2026-09-17T12:30:01.000Z",
  "updatedAt": "2026-09-17T12:30:01.000Z",
  "balanceAccount": { "id": "acc-id", "name": "BCA", "currency": "IDR" },
  "toBalanceAccount": null
}
```

Example — first page, then the next page:

```bash
curl -s -D- "$BASE/api/transactions?limit=100" -b "$COOKIE"
# → 200, X-Has-More: true, X-Next-Cursor: clx123..., ETag: "..."

curl -s "$BASE/api/transactions?limit=100&cursor=clx123..." -b "$COOKIE"
# → next 100 rows (bar array)

curl -s -IH "$BASE/api/transactions?limit=100&cursor=clx123..." \
  -b "$COOKIE" -H 'If-None-Match: "..."'
# → 304 with an empty body
```

### 2.7 `/api/subscriptions` — full CRUD

| Method | Path | Body | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/api/subscriptions` | — | `200 [Subscription]` | 401 |
| GET | `/api/subscriptions/:id` | — | `200 Subscription` | 400, 401, 404 |
| POST | `/api/subscriptions` | `{ name, amount, category, periodDays, startDate, currency?, active? }` | `201 Subscription` | 400, 401, 409 |
| PATCH | `/api/subscriptions/:id` | same fields, all required | `200 Subscription` | 400, 401, 404, 409 |
| DELETE | `/api/subscriptions/:id` | — | `204` | 400, 401, 404 |

One subscription per `(userId, name)` → `409 { "error": "Subscription with this
name already exists" }`. `startDate` accepts any `Date`-parsable string
(`z.coerce.date()`); the next billing date is derived client-side from
`startDate + ceil((now-start)/periodDays)*periodDays`.

### 2.8 `/api/chat`

Not a Hono route — a dedicated Route Handler (`src/app/api/chat/route.ts`)
streaming a Vercel AI SDK UI message stream.

- `POST /api/chat` with `{ messages: UIMessage[], model?: string }`.
- `200` → SSE-ish UI message stream (`result.toUIMessageStreamResponse()`).
- `400` when `messages` is missing/not an array; `401` (plain text) without a
  session.
- `maxDuration = 30`. Tools call the same services as the REST API, so their
  output shapes mirror the endpoints above.

See `HANDSOFF_IOS.md` §7 for chunk-by-chunk SSE framing and the tool schemas.

## 3. Performance notes for clients

1. **Revalidate, don't refetch.** Cache the `ETag` per URL per session and send
   `If-None-Match`; a `304` is ~200 bytes and costs no DB work.
2. **Page the transaction list** (and only the transaction list — budgets,
   subscriptions and accounts are inherently small). Persist `X-Next-Cursor`
   and request the next page on scroll.
3. **`GET /api/user` is the only source of truth for `plus`** — the `plus`
   value inside a cached session cookie can lag up to 5 minutes.
4. **Parallelize independent reads** (`/api/balance-accounts` + `/api/budgets`
   + `/api/subscriptions`); the API is stateless and each request is
   independent.
5. **Don't poll `/api/plus/status/:orderId` faster than ~2s** — it proxies the
   payment gateway.
