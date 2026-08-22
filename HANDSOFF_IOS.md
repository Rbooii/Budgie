# Budgie iOS — Full Handoff Specification

**Audience:** an AI agent (or engineer) building the native **iOS** version of Budgie in **Swift**.

**Source of truth:** the web app at `https://budgiez.vercel.app/` (Next.js 16 + Hono REST + Prisma/Postgres + better-auth + Vercel AI SDK chat). This document is a complete, self-contained handoff: every feature, every API contract, the auth wire protocol, the AI chat wire protocol, the Swift data layer, and the iOS 26 **Liquid Glass** design system ("Budgie Glass") that uses Budgie's color palette.

---

## Table of Contents

1. [The Task](#1-the-task)
2. [Product Overview & Feature Matrix](#2-product-overview--feature-matrix)
3. [Backend & Environment](#3-backend--environment)
4. [Authentication (better-auth)](#4-authentication-better-auth)
5. [REST API Contract](#5-rest-api-contract)
6. [Swift Data Layer](#6-swift-data-layer)
7. [AI Chat Wire Protocol](#7-ai-chat-wire-protocol)
8. [Design System — "Budgie Glass" (iOS 26 Liquid Glass)](#8-design-system--budgie-glass-ios-26-liquid-glass)
9. [Screen-by-Screen Specifications](#9-screen-by-screen-specifications)
10. [Charts Math (port to Swift)](#10-charts-math-port-to-swift)
11. [PDF Export](#11-pdf-export)
12. [Local Persistence](#12-local-persistence)
13. [Networking Layer Design](#13-networking-layer-design)
14. [Recommended Swift Project Structure](#14-recommended-swift-project-structure)
15. [Roadmap / Implementation Order](#15-roadmap--implementation-order)
16. [Gotchas & Traps](#16-gotchas--traps)
17. [Appendix: Web Reference Architecture](#17-appendix-web-reference-architecture)

---

## 1. The Task

Build **Budgie iOS** — a native SwiftUI app that is a **feature-parity port** of the authenticated Budgie web app. Requirements:

- **Zero feature loss.** Every feature the web app has must exist in iOS (see the feature matrix in §2).
- **Different visual design:** iOS 26 **Liquid Glass**-centric (translucent, vibrant, depth-layered glass surfaces with dynamic tinting), but using **Budgie's exact color palette** (one brand green + 3 semantic pastel tints). The design must feel modern and minimalist — "Budgie's soul, Apple's skin".
- **Same backend.** The iOS app is a pure client of the deployed backend at `https://budgiez.vercel.app`. Do **not** reimplement the backend, do not fork the database. All reads/writes go over HTTP to the existing API.
- **Auth scope (decided):** email/password sign-in + sign-up only. Social OAuth (Google/GitHub) is out of scope for v1 (see §4.6 for the optional path).
- **Page scope (decided):** the authenticated app (dashboard, transactions, budgets, subscriptions, profile/Plus, chat) + a native onboarding/sign-in experience. The web marketing/landing page is **not** part of the iOS app.
- **Deliverable:** a complete Xcode/SwiftUI project, tested, with the exact wire contracts in this document.

---

## 2. Product Overview & Feature Matrix

Budgie is a calm, minimal **Indonesian personal-finance app** (Rupiah-first). Users track balance accounts, transactions, budgets, and subscriptions; the app auto-reconciles balances, shows charts, exports PDF, sells a "Budgie Plus" subscription (mock Midtrans QRIS), and includes an AI financial assistant.

### 2.1 Feature parity matrix (web → iOS)

| # | Feature | Web | iOS required | Notes |
|---|---------|-----|--------------|-------|
| 1 | Email/password sign in & sign up | ✅ | ✅ | §4 |
| 2 | Dashboard — net worth hero (eye-toggle mask) | ✅ | ✅ | §9.1 |
| 3 | Dashboard — account cards grid + add/edit/delete account | ✅ | ✅ | §9.1 |
| 4 | Dashboard — cashflow donut chart (income vs expense, today/current month) | ✅ | ✅ | §9.1, §10 |
| 5 | Dashboard — 12-month asset-growth bar chart + hover/tap tooltip + YTD pill | ✅ | ✅ | §9.1, §10 |
| 6 | Dashboard — net-worth delta ("+X.X% From last Month") | ✅ | ✅ | §9.1, §10 |
| 7 | Balance accounts CRUD (bank/wallet/cash/credit/investment) | ✅ | ✅ | §5.5, §9.1 |
| 8 | Transactions — 3-step add wizard (type → details → review) | ✅ | ✅ | §9.2 |
| 9 | Transactions — searchable, date-grouped list (Today/Yesterday/date) | ✅ | ✅ | §9.2 |
| 10 | Transactions — bottom-sheet detail + confirm-gated delete | ✅ | ✅ | §9.2 |
| 11 | Auto balance reconciliation ($transaction) + insufficient-balance guard | ✅ | ✅ (client pre-check + server 400) | §5.6 |
| 12 | Budgets — monthly + daily summary cards (progress, remaining/over) | ✅ | ✅ | §9.3 |
| 13 | Budgets — spending-streams horizontal bar chart (per-category, budget markers) | ✅ | ✅ | §9.3, §10 |
| 14 | Budgets — rounded list + mini progress bars | ✅ | ✅ | §9.3 |
| 15 | Budgets — 3-step add wizard (period → category+amount → review), delete via detail sheet | ✅ | ✅ | §9.3 |
| 16 | Subscriptions — list with next-billing-date, add dialog, detail + delete | ✅ | ✅ | §9.4 |
| 17 | Profile — identity card, Plus membership card | ✅ | ✅ | §9.5 |
| 18 | Budgie Plus — 3-step QRIS checkout (mock Midtrans), 3s status polling, downgrade | ✅ | ✅ (see §5.2 + §16 mock note) | §9.5 |
| 19 | PDF export (all / filtered / date range) | ✅ | ✅ (PDFKit) | §11 |
| 20 | AI chat assistant (Gemini, 6 tools, thinking UI, tool cards, model fallback) | ✅ | ✅ | §7, §9.6 |
| 21 | Premade categories (21, per-type) — no free-text categories | ✅ | ✅ | §5.6.3, §6.3 |
| 22 | Chat persistence + input draft + clear chat + model choice | ✅ | ✅ | §12 |
| 23 | Public marketing landing page | ✅ | ❌ (not in scope) | — |

### 2.2 Feature details (behavior contracts)

- **One budget per `(userId, category)`** — duplicate category → 409.
- **One subscription per `(userId, name)`** — duplicate name → 409.
- **Transactions are create+delete only** — there is intentionally **no edit/update** (web has no `PATCH /transactions`).
- **Subscriptions are planning surfaces** — creating one does **not** auto-deduct from an account and does **not** create transactions.
- **Balances can never go negative** (server-enforced; the iOS wizard does a client-side pre-check for instant feedback).
- **Deleting a `BalanceAccount` hard-deletes its transactions** (server deletes transaction rows first), so confirm it clearly. (In the web schema the FK is `SetNull`, but the service explicitly `deleteMany`s the transactions.)
- **Transactions survive account deletion** in the *read* path only via the nullable `balanceAccount` include → shows **"Deleted account"**.

---

## 3. Backend & Environment

### 3.1 The one URL you need

```
App / web origin:  https://budgiez.vercel.app
API base URL:      https://budgiez.vercel.app/api
Auth base URL:     https://budgiez.vercel.app/api/auth
Chat endpoint:     https://budgiez.vercel.app/api/chat
```

All REST routes below are relative to `https://budgiez.vercel.app/api`. All auth routes are relative to `https://budgiez.vercel.app/api/auth`.

### 3.2 Backend stack (for context — the iOS app only consumes it)

| Concern | Choice |
| --- | --- |
| Runtime | Next.js 16 (App Router) + Hono 4 mounted as a catch-all Route Handler |
| DB | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`) |
| Auth | better-auth 1.6.x (email/password + Google + GitHub; iOS uses email/password only) |
| Chat | Vercel AI SDK v7 + Google Gemini 2.5 Flash (auto-fallback to 3.5 Flash Lite) |
| Payments | Mock Midtrans QRIS (see §16) |
| Deploy | Vercel + Neon Postgres |

### 3.3 Environment variables (web-side; iOS needs none of these secrets)

`BETTER_AUTH_URL=https://budgiez.vercel.app`, `NEXT_PUBLIC_APP_URL=https://budgiez.vercel.app`, `BETTER_AUTH_SECRET`, `DATABASE_URL`, `DIRECT_URL`, `GOOGLE_GENERATIVE_AI_API_KEY`, OAuth keys. **The iOS app must never hold server secrets** — it only replays cookies.

---

## 4. Authentication (better-auth)

Auth is **cookie-based session auth** (no bearer tokens). The iOS client logs in via the better-auth HTTP endpoints, captures the session cookie, stores it in the Keychain, and sends it as a `Cookie` header on every subsequent request.

### 4.1 Cookie the server sets

On successful sign-in/sign-up, the server responds with `Set-Cookie` headers. The critical one:

```
better-auth.session_token=<signedToken>
```

- **HTTPS production** (this app): the name is **`__Secure-better-auth.session_token`** (better-auth adds the `__Secure-` prefix when the origin is HTTPS). Because the iOS client can't know the prefix a priori, **read the actual cookie name from the first auth response and store whatever the server sent**.
- Attributes: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` (on HTTPS). No `Domain`.
- The cookie value is a **signed token** (`token.signature`) — the client never needs to compute or verify it, just replay it verbatim.
- **Expiry:** session `maxAge` defaults to **7 days**, with **sliding refresh** — `GET /api/auth/get-session` near expiry returns refreshed `Set-Cookie` headers. **Re-save the cookie after any response that carries a new `Set-Cookie`** to keep the session alive.
- A secondary `__Secure-better-auth.session_data` cookie (5-min cache) may also be set — optional to store; the server read path uses the `session_token` cookie.

### 4.2 Wire protocol

#### 4.2.1 Sign in — `POST /api/auth/sign-in/email`

Request (JSON; no cookies; **do not send an `Origin` header** — see §4.5):

```json
{ "email": "user@example.com", "password": "secret" }
```

Response `200` (sets `Set-Cookie`):

```json
{
  "redirect": false,
  "token": "<session token string>",
  "url": null,
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "...",
    "image": null,
    "emailVerified": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

Errors: `400` invalid email (`INVALID_EMAIL`), `401` wrong credentials (`INVALID_EMAIL_OR_PASSWORD`), `422` validation. **On 401, never interpret the body as a user.**

#### 4.2.2 Sign up — `POST /api/auth/sign-up/email`

Request:

```json
{ "name": "User", "email": "user@example.com", "password": "secret" }
```

(`name` may be empty → web defaults to `"User"`.)

Response `200` (sets session cookies): `{ "token": "<session token>", "user": { ...same user shape... } }`.
Errors: `422` user already exists, `400` password too short/long.

#### 4.2.3 Get session (validate + refresh) — `GET /api/auth/get-session`

Send the session cookie. Response `200`:

```json
{
  "session": { "id": "...", "token": "...", "userId": "...", "expiresAt": "ISO", "createdAt": "ISO", "updatedAt": "ISO", "ipAddress": "..." },
  "user": { "id": "...", "email": "...", "name": "...", "image": null, "emailVerified": true, "createdAt": "ISO", "updatedAt": "ISO" }
}
```

or `200` with body literal **`null`** (no session) — **not a 401**. Capture `Set-Cookie` for the sliding refresh. Use this on app launch to restore the session.

#### 4.2.4 Sign out — `POST /api/auth/sign-out`

Send the session cookie. Response `200`: `{ "success": true }`. Clears cookies server-side; the iOS client should also wipe the Keychain cookie and any cached user state.

### 4.3 Auth for the REST API & chat

Every protected endpoint (all `/api/*` Hono routes + `/api/chat`) requires:

```
Cookie: <cookieName>=<signedTokenValue>
```

Using the exact cookie name + value captured at login. Unauthenticated → **401** `{ "error": "Unauthorized" }` (Hono routes) or plain-text `401 "Unauthorized"` (`/api/chat`).

### 4.4 Keychain storage

Store the raw cookie pair (`name`, `value`) in the iOS **Keychain** (e.g. `kSecClassGenericPassword`, service `budgie.auth`, account `session`). On app launch: read Keychain → `GET /api/auth/get-session` → if `null`/401, clear and show sign-in; else refresh stored cookie and proceed. Never store the password.

### 4.5 ⚠️ CSRF origin-check gotcha (the #1 silent-failure point)

better-auth runs a CSRF check on `sign-in/email`, `sign-up/email`, and `sign-out`:

- If the request has **no `Cookie` header and no `Origin`/`Referer`/`Sec-Fetch-*` headers** → the check **passes**. (This is the normal native-app case for first login.)
- If the request **does carry a `Cookie` header** (e.g. re-login while a session exists) → better-auth **requires an `Origin` header matching `https://budgiez.vercel.app`**, otherwise **403 `INVALID_ORIGIN`**.

**iOS mitigation:** for the initial sign-in/sign-up, send **no `Cookie` and no `Origin`** headers. If you must POST with a cookie present, add `Origin: https://budgiez.vercel.app` to satisfy the check.

### 4.6 Social OAuth (optional, out of scope)

Google/GitHub would use `ASWebAuthenticationSession` to hit `POST /api/auth/sign-in/social { provider, callbackURL: "/dashboard" }` → open the returned `url` → capture the `Set-Cookie` from the `GET /api/auth/callback/<provider>` response inside the web session, then hand the cookie to the native session. The final redirect lands on the web `/dashboard`, so the cookie must be captured from the callback request's response headers. **Not required for v1.**

---

## 5. REST API Contract

**Base:** `https://budgiez.vercel.app/api`. **Auth:** all routes below are cookie-authed (`requireAuth`) except `GET /health` and `POST /plus/webhook`.

### 5.0 Global response conventions

| Status | Meaning | Body |
| --- | --- | --- |
| 200 | Success | Resource JSON |
| 201 | Created | Resource JSON |
| 204 | Deleted | empty body |
| 400 | Validation / business rule | `{ "error": string }` OR ZodError shape (below) |
| 401 | Not authenticated | `{ "error": "Unauthorized" }` |
| 404 | Not found / not owned | `{ "error": string }` |
| 409 | Unique-constraint clash | `{ "error": string }` |
| 500 | Uncaught | `{ "error": "Internal Server Error" }` |

**Zod validation failures** (from `@hono/zod-validator`) return `400` with a different shape:

```json
{ "success": false, "error": { "issues": [ { "code": "...", "message": "...", "path": ["amount"] } ], "name": "ZodError" } }
```

The iOS client should treat any non-2xx as an error and surface `body.error ?? "Something went wrong"` (parse both shapes defensively).

**Dates:** all `DateTime` fields serialize as ISO-8601 strings (`2026-08-21T12:34:56.789Z`). **Numbers:** `amount`, `balance`, `adminFee` are floats (may have decimals). **IDs:** `cuid()` strings.

### 5.1 Health

```
GET /api/health        (public)
→ 200 { "status": "ok", "timestamp": "2026-08-21T12:34:56.789Z" }
```

### 5.2 User

```
GET   /api/user      → 200 { "plus": boolean }        (only the plus flag, never the full row)
PATCH /api/user      body { "plus": true|false }      → 200 { "plus": boolean }
```

`plus` is **required** on PATCH (a plain boolean — not `{ set: true }`). Downgrading to Free = `PATCH { "plus": false }` (no payment flow).

### 5.3 Plus (mock Midtrans QRIS)

```
POST /api/plus/checkout                (authed, no body)
     → 201 { "orderId": "BUDGIE-PLUS-1755780000000-ab12cd",
             "qrString": "0002010102122652...",
             "status": "pending",
             "expiresAt": "2026-08-21T13:09:56.789Z" }     // now + 15 min
     Amount charged is always the first-month promo: Rp 24.500.

GET  /api/plus/status/:orderId         (authed, ownership-scoped)
     → 200 { "transactionStatus": "pending|settlement|expire|cancel|...", "plus": false }
     Mock auto-expires pending orders past 15 min → "expire".

POST /api/plus/simulate-payment/:orderId   (authed, MOCK ONLY)
     → 200 { "transactionStatus": "settlement" }
     Simulates the user paying (pending→settlement) and grants User.plus = true.
     Remove when real Midtrans is wired; the iOS app may keep a "I've paid" button
     that calls this while the backend is mocked.

POST /api/plus/webhook                  (PUBLIC — no auth; server-to-server from Midtrans)
     body: { "order_id": "BUDGIE-PLUS-...",
             "transaction_status": "settlement|capture|pending|deny|cancel|expire|refund",
             "fraud_status": "accept|challenge|deny|null",
             "status_code": "...", "signature_key": "..." }
     → 200 { "ok": true }
     Success = settlement, OR capture+fraud_status=accept → grants User.plus.
     The iOS client never calls the webhook directly.
```

The PlusOrder statuses are free-form strings (`pending | capture | settlement | expire | cancel | deny | refund`). **Important:** the mock store is in-memory — order state is lost if the backend restarts, so the iOS app should treat `expiresAt` (15 min) as authoritative for the countdown and handle a 404 from `/status/:orderId` gracefully.

### 5.4 Budgets — full CRUD

```
GET    /api/budgets        → 200 [ Budget ]            (orderBy createdAt desc)
GET    /api/budgets/:id    → 200 Budget | 404
POST   /api/budgets        body { category, amount, periodDays } → 201 Budget | 409
PATCH  /api/budgets/:id    body { category, amount, periodDays } (all required) → 200 | 404 | 409
DELETE /api/budgets/:id    → 204 | 404
```

Create/Update body:

```json
{
  "category": "FoodAndDrink",   // enum EXPENSE_CATEGORIES (see §5.6.3)
  "amount": 1500000,            // number > 0
  "periodDays": 30              // integer > 0 (1=daily, 7=weekly, 30=monthly, or custom N)
}
```

No `title`, no `currency` accepted (server defaults `currency: "IDR"`). 409 body: `{ "error": "Budget for this category already exists" }`. Budget row:

```json
{
  "id": "cm0cuid", "category": "FoodAndDrink", "amount": 1500000,
  "currency": "IDR", "periodDays": 30, "userId": "...",
  "createdAt": "ISO", "updatedAt": "ISO"
}
```

### 5.5 Balance Accounts — full CRUD

```
GET    /api/balance-accounts        → 200 [ BalanceAccount ]
GET    /api/balance-accounts/:id    → 200 | 404
POST   /api/balance-accounts        body { name, balance?, currency?, type } → 201 | 400
PATCH  /api/balance-accounts/:id    body { name, balance, currency, type } (all required) → 200 | 404
DELETE /api/balance-accounts/:id    → 204 | 404
```

Create body: `name` (string, required), `balance` (number, **optional**, defaults 0), `currency` (string, **optional**, defaults "IDR"), `type` (string, required, **free-form**: e.g. `"bank"`, `"cash"`, `"ewallet"`, `"credit"`, `"investment"` — no enum). Row:

```json
{
  "id": "cuid", "name": "BCA", "balance": 5000000, "currency": "IDR",
  "type": "bank", "userId": "...", "createdAt": "ISO", "updatedAt": "ISO"
}
```

**Delete behavior:** the service deletes the account's transactions (history) then the account. Confirm loudly in the UI.

### 5.6 Transactions — list / get / create / delete (NO update)

```
GET    /api/transactions        → 200 [ Transaction ]   (orderBy date desc, includes account relations)
GET    /api/transactions/:id    → 200 Transaction | 400 | 404
POST   /api/transactions        body CreateTransaction → 201 Transaction | 400/404 (business rules)
DELETE /api/transactions/:id    → 204 | 400 | 404
```

**List/get row shape** (includes `balanceAccount` / `toBalanceAccount` with only `{ id, name, currency }`, both nullable):

```json
{
  "id": "cuid",
  "name": "Grocery run",
  "amount": 250000,
  "type": "expense",              // "income" | "expense" | "transfer"
  "category": "FoodAndDrink",     // enum NAME (not the "Food & Drink" display label)
  "date": "2026-08-20T09:30:00.000Z",
  "adminFee": 0,
  "balanceAccountId": "cuid",
  "toBalanceAccountId": null,
  "userId": "...",
  "createdAt": "ISO", "updatedAt": "ISO",
  "balanceAccount": { "id": "cuid", "name": "BCA", "currency": "IDR" },
  "toBalanceAccount": null
}
```

**Create body** (`CreateTransaction`):

```json
{
  "name": "Grocery run",          // string min 1
  "amount": 250000,               // number (positive enforced by balance guard, not schema)
  "type": "expense",              // enum "income" | "expense" | "transfer"
  "category": "FoodAndDrink",     // must match the type's category list (§5.6.3)
  "date": "2026-08-20T09:30:00.000Z",   // ISO string (z.coerce.date)
  "adminFee": 0,                  // optional, >= 0, defaults 0 (transfers)
  "balanceAccountId": "cuid",     // required — source account
  "toBalanceAccountId": null      // optional — required (distinct from source) for transfers
}
```

Errors (service-mapped): `404` `"Account not found"`, `404` `"Destination account not found"`, `400` `"Destination account required"`, `400` `"Insufficient balance"`, `400` transfer-refine / category-type mismatch (ZodError).

#### 5.6.1 Balance reconciliation (server-side, inside `$transaction`)

| type | create | delete (reverse) |
| --- | --- | --- |
| income | source `+amount` | source `-amount` (guard: would go negative → 400) |
| expense | source `-amount` (guard) | source `+amount` |
| transfer | source `-(amount+adminFee)` (guard), dest `+amount` | source `+(amount+adminFee)`, dest `-amount` (guard) |

**Insufficient-balance rules (server):** expense/transfer create checks `source.balance − (amount [+ adminFee]) < 0` → 400; income delete and transfer-dest delete also guard. The iOS add wizard should **pre-check client-side** (`amount > source.balance`, or `amount + fee > source.balance` for transfer) and show "Insufficient balance" instantly, matching the web UX.

#### 5.6.2 Transfers

A transfer needs a distinct `toBalanceAccountId`. If the user has fewer than **2 accounts**, the transfer option is disabled with "Add another account to transfer". On the server the destination must exist and be owned.

#### 5.6.3 Categories (21, per-type — users cannot type custom ones)

```swift
INCOME:    ["Salary", "Bonus", "Freelance", "Investment", "Gift", "Refund", "OtherIncome"]
EXPENSE:   ["FoodAndDrink", "Rent", "Entertainment", "Transportation", "Shopping",
            "Utilities", "Healthcare", "Education", "Travel", "OtherExpense"]
TRANSFER:  ["AccountTransfer", "Savings", "LoanPayment", "OtherTransfer"]
```

Display labels: `FoodAndDrink` → "Food & Drink", `OtherIncome` → "Other Income", `OtherExpense` → "Other Expense", `AccountTransfer` → "Account Transfer", `LoanPayment` → "Loan Payment", `OtherTransfer` → "Other Transfer"; every other enum name is its own label. API sends/returns the **enum name**, never the spaced label.

---

## 6. Swift Data Layer

### 6.1 Codable models (1:1 with the wire)

```swift
struct AuthUser: Codable { var id, email, name: String; var image: String?; var emailVerified: Bool; var createdAt, updatedAt: String }
struct SessionInfo: Codable { var session: RawSession?; var user: AuthUser? }   // get-session; session may be nil

struct BalanceAccount: Codable, Identifiable {
    var id: String; var name: String; var balance: Double; var currency: String
    var type: String; var userId: String; var createdAt: String; var updatedAt: String
}

struct AccountRef: Codable { var id: String; var name: String; var currency: String }

struct Transaction: Codable, Identifiable {
    var id: String; var name: String; var amount: Double
    var type: TransactionType; var category: String
    var date: Date; var adminFee: Double
    var balanceAccountId: String?; var toBalanceAccountId: String?
    var userId: String; var createdAt: String; var updatedAt: String
    var balanceAccount: AccountRef?; var toBalanceAccount: AccountRef?
}

enum TransactionType: String, Codable, CaseIterable { case income, expense, transfer }

struct Budget: Codable, Identifiable {
    var id: String; var category: String; var amount: Double; var currency: String
    var periodDays: Int; var userId: String; var createdAt: String; var updatedAt: String
}

struct Subscription: Codable, Identifiable {
    var id: String; var name: String; var amount: Double; var currency: String
    var category: String; var periodDays: Int; var startDate: Date
    var active: Bool; var userId: String; var createdAt: String; var updatedAt: String
}

struct PlusStatus: Codable { var transactionStatus: String; var plus: Bool }
struct CheckoutResult: Codable { var orderId, qrString, status: String; var expiresAt: String }
struct UserStatus: Codable { var plus: Bool }
```

**Date decoding:** the API emits ISO-8601 strings; decode `date`/`startDate` with an ISO-8601 formatter (accept fractional seconds). Keep `createdAt`/`updatedAt` as strings or decode the same way.

### 6.2 Request DTOs

```swift
struct CreateTransactionBody: Encodable {
    var name: String; var amount: Double; var type: TransactionType; var category: String
    var date: String; var adminFee: Double = 0
    var balanceAccountId: String; var toBalanceAccountId: String?
}
struct CreateBudgetBody: Encodable { var category: String; var amount: Double; var periodDays: Int }
struct CreateAccountBody: Encodable { var name: String; var balance: Double?; var currency: String?; var type: String }
struct CreateSubscriptionBody: Encodable {
    var name: String; var amount: Double; var currency: String?; var category: String
    var periodDays: Int; var startDate: String; var active: Bool?
}
struct PatchUserBody: Encodable { var plus: Bool }
```

### 6.3 Category helpers (port `src/lib/categories.ts`)

Provide static lists + a lookup in Swift:

```swift
enum Categories {
    static let income = [...]; static let expense = [...]; static let transfer = [...]
    static func byType(_ t: TransactionType) -> [String]
    static let all: [String]   // 21, in the order above
    static func label(_ name: String) -> String   // enum name → display label
    static func icon(_ name: String) -> String    // SF Symbol (see §8.6)
}
```

### 6.4 Formatting helpers (port `src/lib/format.ts`, `src/lib/budget.ts`)

```swift
func formatRupiah(_ value: Double) -> String
// "Rp " + NumberFormatter, locale id_ID, min 2 fraction digits, group "." , decimal ","
// e.g. 1250000 → "Rp 1.250.000,00"

func formatBalanceInput(_ raw: String) -> String
// strip non-digits, keep leading "-", group with id-ID separators, no decimals

func formatDate(_ d: Date) -> String     // "21 Aug 2026"  (day 2-digit, month short, year)
func formatTime(_ d: Date) -> String     // "9:30 am"      (en-US hour12, lowercase)

func periodLabel(_ days: Int) -> String
// 1→"Daily", 7→"Weekly", 30→"Monthly", 365→"Yearly", else "Every N days"

func nextBillingDate(_ start: Date, _ days: Int) -> Date
// if start >= now → start
// else start + ceil((now - start) / days) * days  (calendar-day arithmetic)

func periodStartDate(_ days: Int) -> Date  // now - days, midnight local
func startOfToday() -> Date                // now at 00:00 local
func startOfMonth() -> Date                // first of current month, 00:00 local
```

The **net-worth hero** uses `dynamicFontSize` (web): by digit count ≤7→`text-6xl` … >14→`text-3xl` — in Swift, size money text by its rendered width (`monospacedDigit`) so long amounts never clip.

---

## 7. AI Chat Wire Protocol

The chat is a **server-side Gemini agent** streamed over SSE. The iOS client must replicate the exact wire protocol of the AI SDK v7 UI-message stream.

### 7.1 Endpoint & request

```
POST https://budgiez.vercel.app/api/chat
Cookie: <session cookie>
Content-Type: application/json
```

Request body:

```json
{
  "id": "<uuid chatId>",
  "messages": [ /* UIMessage[] — the full conversation */ ],
  "trigger": "submit-message",
  "model": "gemini-2.5-flash"          // allowlisted: "gemini-2.5-flash" | "gemini-3.5-flash-lite"
}
```

- `messages` = the whole conversation as `UIMessage[]` (each message has `id`, `role` (`"system"|"user"|"assistant"`), `parts`). The web client re-sends the whole array so multi-step tool calls resume.
- The user message part is `{ "type": "text", "text": "..." }`.
- Non-200: `401` plain `"Unauthorized"`, `400` plain `"Bad request"`, provider errors arrive as an `error` chunk.

### 7.2 Response — SSE framing

`Content-Type: text/event-stream`. Lines are `data: {json}\n\n` … terminated by `data: [DONE]\n\n`. Headers include `x-vercel-ai-ui-message-stream: v1`, `cache-control: no-cache`, `x-accel-buffering: no`. (There is **no** `X-Experimental-Stream-Data` header — that was AI SDK v5; this backend is v7.)

### 7.3 Chunk types (the full set this route can emit)

| `type` | Fields | Meaning |
| --- | --- | --- |
| `start` | `messageId?`, `messageMetadata?` | Response message begins |
| `text-start` | `id` | Begin a text part |
| `text-delta` | `id`, `delta` | Streaming text — **word-chunked** (smoothStream, 8ms) |
| `text-end` | `id` | End text part |
| `reasoning-start` | `id` | Begin reasoning (primary model only) |
| `reasoning-delta` | `id`, `delta` | Streaming reasoning |
| `reasoning-end` | `id` | End reasoning |
| `tool-input-start` | `toolCallId`, `toolName`, `title?`, … | Model begins emitting a tool call |
| `tool-input-delta` | `toolCallId`, `inputTextDelta` | Streaming tool-arg text (rare) |
| `tool-input-available` | `toolCallId`, `toolName`, `input` (JSON args) | Full args ready |
| `tool-input-error` | `toolCallId`, `toolName`, `input`, `errorText` | Args invalid |
| `tool-output-available` | `toolCallId`, `output` (JSON result) | Tool result returned |
| `tool-output-error` | `toolCallId`, `errorText` | Tool threw |
| `start-step` / `finish-step` | — | Step boundaries (up to 3 steps) |
| `finish` | `finishReason` (`stop\|length\|content-filter\|tool-calls\|error\|other`) | Finished |
| `error` | `errorText` | Error (UI: "Something went wrong" + Retry) |
| `abort` | `reason?` | Aborted |

Expected order for a typical turn: `start` → `reasoning-*` (primary) → `text-*` → per tool call `tool-input-start` → `tool-input-available` → `tool-output-available` → `start-step`/`finish-step` (repeats, max 3) → `finish`.

**Parsing:** split the SSE body on `\n\n`, for each `data:` line strip the prefix, skip `[DONE]`, `JSONDecoder` each payload into the chunk union above.

### 7.4 UIMessage + parts (local state model)

```swift
struct UIMessage: Codable {
    var id: String
    var role: String                    // "system" | "user" | "assistant"
    var parts: [UIPart]
}
enum UIPart: Codable {
    case text(id: String?, text: String, state: String?)            // state "streaming"|"done"
    case reasoning(id: String?, text: String, state: String?)
    case tool(name: String, callId: String, state: String, input: JSON?, output: JSON?, errorText: String?)
}
```

- The assistant's tool parts render as `tool-<name>` with state `input-streaming → input-available → output-available | output-error`.
- Keep the last **200** messages locally (mirror `src/lib/chat-storage.ts`).
- Before sending, prune like the server does (`prepareMessagesForApi`): send only the **last 10** messages; among those, keep tool parts only in the **last 2** and reasoning parts only in the **last 1**. (The server also prunes, but pruning client-side saves bandwidth.)

### 7.5 The 6 tools (input schema + output JSON)

**`get_balance_accounts`** — no args.
Output:

```json
{ "totalBalance": 5000000, "currency": "IDR",
  "accounts": [ { "id": "...", "name": "BCA", "type": "bank", "balance": 5000000 } ] }
```

**`get_transactions`** — args: `{ "type"?: "income|expense|transfer", "category"?: Category, "query"?: string, "from"?: "YYYY-MM-DD", "to"?: "YYYY-MM-DD", "limit"?: 1...30 }`.
Output (note: **no** `id`, `adminFee`, `toAccount` on the wire):

```json
{ "count": 47,
  "items": [ { "name": "Grocery run", "amount": 250000, "type": "expense",
               "category": "FoodAndDrink", "date": "ISO", "account": "BCA" | null } ] }
```

**`get_budgets`** — no args.
Output:

```json
{ "budgets": [ { "id": "...", "category": "FoodAndDrink", "categoryLabel": "Food & Drink",
                 "amount": 1500000, "periodDays": 30, "spent": 420000 } ] }
```

**`get_subscriptions`** — no args.
Output:

```json
{ "subscriptions": [ { "id": "...", "name": "Netflix", "amount": 169000,
                       "category": "Entertainment", "categoryLabel": "Entertainment",
                       "periodDays": 30, "active": true, "nextBillingDate": "ISO" } ] }
```

**`get_insights`** — no args.
Output:

```json
{ "netWorth": 1234567, "monthIncome": 5000000, "monthExpense": 245000,
  "topCategories": [ { "category": "FoodAndDrink", "amount": 150000 } ] }   // top 5, desc
```

**`create_transaction`** — args (mirrors `CreateTransactionBody` but with `date?: string` optional and no account objects):

```json
{ "name": "...", "amount": 45000, "type": "expense", "category": "FoodAndDrink",
  "date"?: "ISO", "adminFee"?: 0, "balanceAccountId": "...", "toBalanceAccountId"?: "..." }
```

Output:

```json
{ "ok": true, "transaction": { "id": "...", "name": "...", "amount": 45000,
                               "type": "expense", "category": "FoodAndDrink",
                               "date": "ISO", "account": "BCA" } }
```
or

```json
{ "ok": false, "error": "Insufficient balance" }
```

**Safety contract (mirror the system prompt):** `create_transaction` only fires after the user **explicitly asked** to record a transaction; the model must call `get_balance_accounts` first for a real `balanceAccountId` (never fabricate); transfers need a distinct `toBalanceAccountId`; category must match type. The iOS client doesn't need to enforce this, but the UI must show tool cards so the user sees what the model did.

### 7.6 Model fallback (free-tier quota)

- `MODEL_CHAIN = ["gemini-2.5-flash", "gemini-3.5-flash-lite"]`, default = first.
- On a stream **error chunk** (or failed request) whose text matches `429 | quota | resource_exhausted | rate limit` (case-insensitive), the client should:
  1. advance the model index once (only one downgrade),
  2. persist the choice as `{ model, savedAt }` with **12h validity** (`budgie.chat.{userId}.model` analog → iOS `UserDefaults`),
  3. auto-retry the same `messages` with `"model": "gemini-3.5-flash-lite"`,
  4. show a quiet "Switched to a lighter model to stay within free limits." notice + the active model label in the composer chip.
- Model labels: `"gemini-2.5-flash"` → "Gemini 2.5 Flash", `"gemini-3.5-flash-lite"` → "Gemini 3.5 Flash Lite".
- Reasoning parts stream only on the primary model (`thinkingConfig: { thinkingBudget: 256, includeThoughts: true }`); the lite model disables them — so an iOS parser must tolerate `reasoning-*` chunks being absent.

### 7.7 System prompt (for reference)

The server builds a system prompt that: names the user, gives today's date, demands answers only from tools (never invent balances), replies in the user's language, 2–3 short sentences, money as `Rp 1.234.567`, asks a clarifying question when vague, and follows the create-transaction safety rules (§7.5). Assistant text is plain text (whitespace-pre-wrap; no markdown rendering needed, keep instructions "no markdown tables unless asked").

---

## 8. Design System — "Budgie Glass" (iOS 26 Liquid Glass)

**Goal:** Budgie's calm-minimal fintech identity rendered through **iOS 26 Liquid Glass**: translucent, vibrant, depth-layered glass with dynamic tinting — but never drifting from Budgie's palette. One brand green + 3 semantic pastel tints; white/light-glass light-mode surfaces; ≤300ms ease-out motion; `monospacedDigit` on all money.

> The web app is **light-mode only** (`color-scheme: light`, white backgrounds). For iOS you **may** support dark mode via glass tint adaptation, but default light; if you add dark, keep the same semantic tints, not new hues.

### 8.1 Palette (Budgie tokens — do not invent new colors)

| Token | Hex | Role in "Budgie Glass" |
| --- | --- | --- |
| **Brand green** | `#00C610` | Primary accent / CTA / progress fill / live indicators / glass **tint** |
| Brand green (hover) | `#00B609` | Pressed state of green |
| Sign-in green | `#00CE11` | Full-bleed sign-in screen background (the one saturated surface) |
| **Income** | strong `#1F9B29` · pastel `#A0FFA8` (hover `#8EED96`) | Income amounts/text + glass tile tint |
| **Expense** | strong `#D8000C` · pastel `#FFBABA` (hover `#FF9A9A`) | Expense amounts/text, over-budget, delete |
| **Transfer** | strong `#B25B00` · pastel `#FFD9A0` | Transfer amounts/text, subscriptions (recurring outflows) |
| Surface gray | `#F2F2F2` | Chips, search field, icon-tile fill, user chat bubble |
| Inset surface | `#FAFAFA` | Inset cards, list-row hover |
| Card surface | `#FFFFFF` | Card fills |
| Landing gray | `#F9F9F8` | Thinking block / subtle fills |
| Chart placeholder | `#E5E5E5` | Inactive asset-growth bars |
| Text | `#171717` (near-black) + black alpha ramp | `black/80 70 60 50 45 40 35 30 15` for body→caption hierarchy |
| Hairlines | black alpha `0.04 / 0.05 / 0.06 / 0.10` | dividers, borders, tracks |

**Liquid-glass mapping:** the brand green `#00C610` is the Liquid Glass **tint** on interactive/accent glass (`GlassEffect.Tint`, `GlassEffect.vibrant`) — e.g. the tab bar selection, primary buttons, progress fills, and the chat send button. The three semantic pastels are used as **tinted glass backgrounds** for category/type icon tiles (income/expense/transfer) instead of flat fills.

### 8.2 Radius system (reuse Budgie's, via SwiftUI `UnevenRoundedRectangle` / `.clipShape`)

| Radius | Web class | iOS use |
| --- | --- | --- |
| Full | `rounded-full` | Icon tiles, circular buttons, progress, search field, chips |
| 20px | `rounded-[20px]` | Inputs, option rows, inset cards, chat user bubble, tool pills, QR box |
| 28px | `rounded-t-[28px]` | **Bottom sheets** (top corners) |
| 35px | `rounded-[35px]` | Cards, dialogs, big CTAs, list-row hover shape, tab-bar pill |
| 2xl (16px) | `rounded-2xl` | Compact list rows, tool-result rows |
| 24px | `rounded-[24px]` | Badges / status pills |
| 14px | `rounded-[14px]` | Chat thinking block |

**Never use generic `rounded-md/lg/xl`.** Keep this exact radius language.

### 8.3 Typography

- **Font:** SF Pro (system). Body `#171717`. Keep the mono/serif out of the app (Geist Mono was a web/landing quirk; the chat **thinking** block may use `.monospaced()` for the reasoning text).
- **Type scale:** page `h1` 28–34pt semibold `tracking-tight`; section `h2` 20–22pt semibold; row title 17pt medium; subtitle 15pt (`black/45`); caption 12pt (`black/35`); eyebrow labels 11pt uppercase `tracking-wide` `black/35`.
- **All money/amounts:** `.monospacedDigit()`, semibold/bold, `tracking-tight`.
- **Hero amounts:** net worth `text-3xl/4xl` equivalent (28–34pt); sheet hero 30pt bold; card hero 22pt bold.

### 8.4 Motion (≤300ms, ease-out; respect Reduce Motion)

- Micro-interactions ≤200ms ease-out; reveals ≤300ms ease-out. No bounce.
- Screen transitions: use the **iOS 26 glass push/scale** (reduced-motion-safe). Lists: subtle fade/rise 200ms.
- Pulse/typing: typing dots (3 dots, `black/30`, stagger 200ms); QR "waiting" pulse (opacity 0.5↔1); spinner = system `ProgressView`.
- Button press: scale 0.98 (like `active:scale-[0.98]`).
- Respect `@Environment(\.accessibilityReduceMotion)`.

### 8.5 Core glass primitives

- **GlassCard** — the primary container: system material (`.ultraThinMaterial` / Liquid Glass `.glassEffect`) with a hairline border (black alpha 0.06–0.10), soft shadow (`0 4px 24px -8px rgba(0,0,0,0.08)`), radius per context (§8.2). This replaces `bg-white border-black/10 shadow-...`.
- **GlassTile** — small tinted tiles for icons (income/expense/transfer glass tint at ~30–40% opacity of the pastel).
- **InsetCard** — `bg-[#FAFAFA]`-equivalent (`.quaternarySystemFill` or glass `.thinMaterial`) with `divide-black/0.04` row dividers; label 12pt `black/40`, value 15pt medium.
- **ProgressTrack** — track `black/6%`, fill brand green `#00C610` (under budget) or expense red `#D8000C` (over), `rounded-full`, 300ms ease-out.
- **BottomSheet** — `.presentationDetents([.medium, .large])`, top corners 28px, grabber `black/10`.
- **Primary CTA** — brand green glass fill with tint; pressed = `#00B609`; **one `success`/green CTA per screen** (web rule §12).
- **Buttons:** `primary` black (dark glass), `outline` white + hairline, `success` green, `soft` mint, `softred` pink. Sizes: large 44–48pt height, radius 35px.

### 8.6 SF Symbols (map of lucide → SF Symbol)

| Feature | SF Symbol |
| --- | --- |
| Dashboard / Home | `house.fill` / `house` |
| Transactions | `arrow.right.arrow.left` / `list.bullet.rectangle` |
| Budget | `target` / `chart.pie` |
| Chat | `message` / `sparkles` |
| Profile | `person.crop.circle` |
| Income type | `arrow.down.left` |
| Expense type | `arrow.up.right` |
| Transfer type | `arrow.left.arrow.right` |
| Wallet / account | `wallet.pass` |
| PDF export | `square.and.arrow.up` / `doc.richtext` |
| Eye toggle | `eye` / `eye.slash` |
| Delete | `trash` |
| Edit | `pencil` |
| Add | `plus` |
| Search | `magnifyingglass` |
| Error | `exclamationmark.triangle` / `xmark.circle` |
| Success | `checkmark.circle` |
| Sparkles (AI/Plus) | `sparkles` |
| QR | `qrcode` |

**Per-category icons (from `src/lib/category-icon.tsx`):**

| Category | SF Symbol |
| --- | --- |
| Salary | `briefcase` |
| Bonus / Gift | `gift` |
| Freelance | `briefcase` |
| Investment / Savings | `banknote` / `creditcard` |
| Refund | `arrow.counterclockwise` |
| OtherIncome / OtherExpense | `ellipsis` |
| FoodAndDrink | `fork.knife` |
| Rent | `house` |
| Entertainment | `film` |
| Transportation | `car` |
| Shopping | `bag` |
| Utilities | `bolt` |
| Healthcare | `heart.text.square` / `cross.case` |
| Education | `graduationcap` |
| Travel | `airplane` |
| AccountTransfer | `arrow.left.arrow.right` |
| LoanPayment | `creditcard` |
| OtherTransfer | `ellipsis` |

### 8.7 Navigation (Liquid Glass)

- **Tab bar:** Liquid Glass tab bar with 4 tabs — **Dashboard, Transactions, Budget, Chat** — with the selected tab tinted brand green (`#00C610`). Profile is reached from the account chip (top-right avatar) on the Dashboard; Budget tab may host both Budgets and Subscriptions (sections) exactly like the web budget page.
- **Detail sheets:** from any list row, a bottom sheet with the full detail + delete (§9).
- **Add flows:** 3-step wizards present as full-screen glass sheets with a slim 2px progress track (green fill, `(step/3)*100%`), a top bar with back chevron + "1 of 3", and **one CTA per step**.

---

## 9. Screen-by-Screen Specifications

### 9.1 Dashboard

Data needed: `GET /api/balance-accounts` (accounts + net worth), `GET /api/transactions` (this year for charts — or reuse for monthly cashflow), `GET /api/user` (plus status → "Get Budgie Plus" chip).

**Layout (top → bottom):**
1. Account chip (top-right): avatar (initials) + name → Profile. When `plus == false`, show a "Get Budgie Plus" green chip → Profile.
2. **Net worth hero** — "Your Net Worth", eye-toggle (masks balance; `eye`/`eye.slash`, flip animation), `formatRupiah(netWorth)` big `.monospacedDigit()`. Delta line: `+X.X% From last Month` (green `#00C610` if up / red `#D8000C` if down) — or `+Rp … this month` absolute when last month's base ≤ 0. Privacy: masked by default per web (`MaskedBalance` reveal-on-hover → on iOS default mask ON, tap eye to reveal).
3. "Your Accounts" — grid of account glass cards: tinted icon tile (type icon), name, type (capitalized), balance `formatRupiah`. Empty state: "No accounts yet" + Add Account CTA. Add/Edit/Delete via dialog/sheet → `POST/PATCH/DELETE /api/balance-accounts`.
4. "Quick Insight" — if any transactions this year: **CashflowCard** (donut income vs expense, current month) + **AssetGrowthCard** (12-month bars, hover/tap tooltip, YTD pill, legend Growth/Stable/Decline). Else: empty state (Sparkles + "No insight yet" + "Add transaction" CTA → transactions add flow).

**Chart data (compute on-device from `GET /api/transactions`):**
- Donut: month income sum vs month expense sum (+ transfer fees as expense). See §10.1.
- Asset growth: from all transactions this year → `monthlyNet[12]`, `startingAssets`, cumulative `growthData`, `activeMonths`. See §10.2.
- Net-worth delta: `accountNetThisMonth` per account + `lastMonthEndNetWorth`. See §10.4.

### 9.2 Transactions

- **List screen:** search field (client-side filter over name + category label), Add button (→ wizard), Download PDF button, date-grouped list: headers **Today / Yesterday / 14 Aug 2026** (formatDate). Each row (§8.5 GlassTile): tinted type icon tile (income `#A0FFA8/30` + `arrow.down.left`, expense `#FFBABA/40` + `arrow.up.right`, transfer `#FFD9A0/40` + `arrow.left.arrow.right`), name (17pt medium) + subtitle `category · account` (`black/45`), right: signed `formatRupiah` in the type tint + time caption. Tap → detail sheet. Two empty states: "No transactions yet" (CTA) vs "No results" (minimal).
- **Detail sheet:** type chip + hero signed amount (type tint) + inset rows (Bank / Category / Date / Time) + full-width **delete trigger** (`bg-[#FFBABA] text-[#D8000C]`, 35px radius). Delete does **not** fire directly — open a **confirm dialog**: "Delete transaction?" + name + amount + "cannot be undone" + Delete (loading-gated) + Cancel. On success: close sheet, refresh list. If `balanceAccount` is null → show **"Deleted account"** as the bank row.
- **Add wizard (3-step, full-screen glass sheet):**
  - *Step 1 — Type:* three glass option cards (income / expense / transfer) with the per-type active ring (pastel border + tint). Selecting a type resets the category. **Transfer disabled when `accounts.count < 2`** with "Add another account to transfer".
  - *Step 2 — Details:* hero editable amount at top (`formatBalanceInput`, `monospacedDigit`) + field list: bank (source), destination (transfers), name, category (picker filtered by type), admin fee (transfers), date (`DatePicker`).
  - *Step 3 — Review:* hero amount + review rows + "Confirm and Add".
  - **Client-side pre-check:** expense `amount > source.balance` → "Insufficient balance" instantly; transfer `amount + fee > source.balance` → same. Only then `POST /api/transactions`.
  - No-accounts guard: if `accounts.isEmpty`, show empty state (Wallet icon + Add Account) instead of the wizard; refresh swaps to the wizard after account creation.

### 9.3 Budgets (+ Subscriptions on the same screen, like web)

- **Summary cards:** two glass cards — **Monthly** (sum of `periodDays == 30` budgets) and **Daily** (`periodDays == 1`): label + caption + hero `formatRupiah(total)` + "remaining/over budget" caption + progress track (green under / red over). Empty: "No monthly/daily budget yet".
- **Spending streams chart:** per-category expense **this month** (from transactions, group by category, sort desc), each a row with 24-char label + progress track (fill `#FFBABA` under / `#D8000C` over) + right-aligned spent; a vertical budget-limit tick (`black/40`) at the budget's amount; tap tooltip (category + spent + budget + remaining/over); legend. Empty: "No spending this month yet". (§10.3)
- **Your Budgets list:** GlassTile rows — tinted icon (expense red tile, category icon), category label + period pill (`periodLabel`), mini progress bar, `formatRupiah(amount)` + "spent" caption. Tap → detail sheet.
- **Add budget wizard (3-step):** *Step 1* period cards (Daily=1 / Weekly=7 / Monthly=30 / Custom→days) with active green ring + check; *Step 2* category picker (only `EXPENSE_CATEGORIES` **not already budgeted**) + hero amount; *Step 3* review + "Confirm and Add" → `POST /api/budgets`. Handle 409 "Budget for this category already exists" as an inline error pill. When all 10 expense categories are budgeted, disable the picker with "All expense categories already have budgets".
- **Budget detail sheet:** category pill + hero "Budget limit" `formatRupiah(amount)` + spent caption + progress bar + inset detail rows (Period / Limit / Spent / Remaining) + delete trigger + confirm dialog → `DELETE /api/budgets/:id`.

### 9.4 Subscriptions

- **List:** rows with transfer-orange tile (`Repeat`/`arrow.triangle.2.circlepath`), name + `category · period` subtitle + "Next {date}" caption (`nextBillingDate`), amount, "Inactive" tag when `!active`. Tap → detail sheet.
- **Add dialog** (single form, not a wizard): name, category (EXPENSE), billing cycle picker (Weekly=7 / Monthly=30 / Yearly=365), start date, hero amount. → `POST /api/subscriptions { name, amount, category, periodDays, startDate: ISO, active: true }`. Handle 409 name clash inline.
- **Detail sheet:** rows Name / Category / Amount / Period / Started / Next billing / Status (Active/Inactive) + confirm-gated delete.

### 9.5 Profile & Budgie Plus

- **Identity card** (dark glass/black, 35px radius): avatar (initials), name, email, tier pill (Plus = green / Free = `white/10`), membership id, hairline.
- **Plus member card** (when `plus == true`): "Budgie Plus" + Active badge + plan/payment inset + **"Downgrade to Free"** outline button → `PATCH /api/user { plus: false }` (loading + error handling), then refresh.
- **Upgrade card** (when `plus == false`): "Budgie Plus", "50% off your first month", hero price **Rp 24.500** (green) + struck **Rp 49.000** + "/month", "Then Rp 49.000 per month. Cancel anytime.", inset pricing rows, **"Upgrade to Plus"** green CTA → QRIS wizard.
- **QRIS wizard (3-step):**
  1. *Package:* hero price + "Continue to pay" → `POST /api/plus/checkout`.
  2. *QR:* render `qrString` as a QR (`CoreImage.CIFilter.qrCodeGenerator`) in a white box, "Scan with your e-wallet", spinner "Waiting for payment…", outline **"I've paid"** → `POST /api/plus/simulate-payment/:orderId` (while the backend is mocked), outline "Cancel". **Poll `GET /api/plus/status/:orderId` every 3s** as a fallback; on `settlement` → step 3. Treat `expiresAt` (15 min) as the countdown; a 404 on status (mock store restarted) should show a graceful "order expired" state.
  3. *Success:* "Welcome to Budgie Plus" + green "Done" → close, refresh user state.
- **One green CTA per surface** (either upgrade or downgrade, never both).

### 9.6 Chat

Mirror the web chat anatomy (Claude-style, light):
- **Column** centered, max width ~768pt; the message list is the only scroll area; composer **sticky at bottom** with a frosted glass card (`ultraThinMaterial`, hairline + soft shadow) and a caption below: "Budgie can make mistakes. Double-check the important numbers."
- **Messages:** user bubble right-aligned, max 85%, 20px radius, `#F2F2F2` fill; assistant text full-width, no bubble, `whitespacePreWrap`, 15pt; gap ~20pt; typing indicator = 3 pulsing dots in a gray pill.
- **Thinking row:** while `reasoning` streams → spinner + "Thinking…"; when done → collapse to "Thought for a moment" toggle revealing the reasoning text in a 14px mono block.
- **Tool cards** (from `tool-*` parts): running → pill with spinner + per-tool label ("Looking up your accounts…", "Adding the transaction…"); result → a 20px glass card (`max-w ~85%`): Accounts (total hero + rows), Transactions (up to 8 rows + "+N more", empty "No transactions found."), Budgets (progress bars), Subscriptions (rows + next date), Insights (net worth hero + income/expense tint tiles + top-category bars), create_transaction (success green check + row, or red error + reason). Error → `softred` callout.
- **Composer:** auto-growing text area (Enter sends, Shift+Enter newline), bottom row: model chip (Sparkles + model label) left, circular green send button (swaps to Stop while streaming) right.
- **Slim top row:** "Switched to a lighter model…" notice (left, when downgraded) · Clear chat (right, `trash` circle).
- **Empty state:** 12×12 `#F2F2F2` circle + `message` icon, "Hi {name}, ask me anything about your money", up to 4 suggestion chips that send immediately.
- **Error surface:** softred callout above input + outline "Retry" → `regenerate()` (re-send the same last user message).
- **Persistence:** messages + draft + model choice (see §12).

### 9.7 Sign-in / Sign-up (native, "Budgie Glass")

- Full-bleed **brand green** `#00CE11` screen (the web sign-in special case): white headline ("Welcome to Budgie"), SF Pro bold 28–34pt white, mono-ish subtitle, email + password fields (white glass), **primary CTA** (white on green, or black glass), mode toggle Sign in / Sign up (sign-up adds a name field, defaults "User"), inline error (translucent white callout), loading states. On success → Dashboard.
- On app launch with no valid session → this screen. On 401 from any API → return here (after clearing the stale cookie).

---

## 10. Charts Math (port to Swift)

All computations are pure math — port `src/lib/dashboard.ts` exactly.

### 10.1 Cashflow donut (CashflowCard)

- Inputs: this-month `sum(income)`, `sum(expense)` (expense **includes transfer `adminFee`**), title "Today's Cashflow" (label may be month).
- Render: two arcs (income green gradient `#00C610→#00B609`, expense red gradient `#e0584f→#c4453b`) with a **20° gap**, radius 64 (SwiftUI `Circle().trim(...)` with rotation). Center: `+/- N mil` (color by sign; `mil` = millions, e.g. `-0,42 jt`) + rupiah. Breakdown rows: two tinted tiles.
- If both sums are 0 → empty state.

### 10.2 12-month asset growth (AssetGrowthCard)

- Inputs: all transactions this year (`yearTxns`: type, amount, adminFee, date, balanceAccountId, toBalanceAccountId) + `netWorth` (sum of account balances).
- `monthlyNet[m]` (0..11): income `+amount`, expense `−amount`, transfer `−adminFee`.
- `yearNetEffect = Σ monthlyNet`; `startingAssets = netWorth − yearNetEffect`.
- `growthData` for months 0...currentMonth: cumulative `startingAssets + Σ monthlyNet[0...m]`.
- `activeMonths[m]` = any transaction in month `m`.
- Bars (16pt wide, ~8pt gap): growth-colored vs previous month (`#00C610` up, `#B25B00` flat, `#D8000C` down); inactive months → grey `#E5E5E5` placeholder (~12pt min); future months → faint label only. Tap/hover tooltip: month+year + `formatRupiah`. YTD pill. Legend Growth / Stable / Decline. Empty: "No transactions yet".

### 10.3 Spending streams (per-category bars)

- From transactions this month with `type == "expense"`: group by `category`, sum amounts, sort desc.
- Track fill under budget `#FFBABA`, over `#D8000C`; budget-limit tick at the budget's `amount` position. Tooltip shows spent + budget + remaining/over. Legend Spent / Over budget / Budget limit.

### 10.4 Net-worth delta

- `accountNetThisMonth[accountId]` from this-month transactions (income `+amount`, expense `−amount`, transfer source `−(amount+fee)`, dest `+amount`).
- `lastMonthEndNetWorth = Σ (a.balance − accountNetThisMonth[a.id])` over **all** accounts.
- `absoluteChange = netWorth − lastMonthEndNetWorth`; `deltaPct = lastMonthEndNetWorth > 0 ? absoluteChange/lastMonthEndNetWorth*100 : null`. If `deltaPct == null` → show absolute ("+Rp … this month").

### 10.5 Budget "spent" (for lists + summary + chat `get_budgets`)

- Per budget: `sum(amount)` of expense transactions with that `category` and `date >= periodStartDate(b.periodDays)`. Remaining = `amount − spent`; over if negative.

---

## 11. PDF Export

Web uses jsPDF + autoTable client-side. On iOS use **PDFKit** (or a `UIGraphicsPDFRenderer`) to produce a "transactions.pdf" with three scope options: **All / Filtered by search / Date range**.

Contents: a transactions table (name, category, account, date, amount) + a summary of income / expense / transfer totals. Columns use `formatRupiah`/`formatDate`. Present via `ShareLink` / `UIActivityViewController` so the user can save/share.

---

## 12. Local Persistence

Web uses `localStorage`; on iOS:

| Web key | iOS storage | Content |
| --- | --- | --- |
| `budgie.chat.{userId}.messages` | File in Application Support (JSON), keyed by userId | `UIMessage[]`, cap **200** |
| `budgie.chat.{userId}.draft` | `UserDefaults` | composer draft string |
| `budgie.chat.{userId}.model` | `UserDefaults` | `{ model, savedAt }`, **12h validity** |
| balance-mask toggle | `@AppStorage` / `UserDefaults` | net-worth eye state (default masked) |
| session cookie | **Keychain** | `better-auth.session_token` (name + value) |

"Clear chat" clears messages + draft + resets model choice to default.

---

## 13. Networking Layer Design

- **Base URL:** `https://budgiez.vercel.app` (App Transport Security allows HTTPS; no `NSAllowsArbitraryLoads`).
- **Session:** a shared `URLSession` configured to store the session cookie; or (recommended for full control of the CSRF story) set the `Cookie` header explicitly from the Keychain value on every request, and update it whenever a `Set-Cookie` comes back. Ignore/overwrite only the `session_token` cookie.
- **Async:** `async/await` with typed `Codable` responses. Throw domain errors carrying `statusCode` + parsed message.
- **Error mapping:** non-2xx → `BudgieError(status: .unauthorized(.401), .notFound(.404), .conflict(.409), .validation(.400 ZodError), .server(.500), .network)`. On **401**, clear the session and route to sign-in.
- **Auth flow helpers:** `signIn(email, password)`, `signUp(name, email, password)`, `getSession()`, `signOut()` — implemented per §4.2. After each response, persist any new `Set-Cookie`.
- **SSE client for chat:** an `AsyncSequence`/`URLSession.bytes` parser that yields the chunk union (§7.3).
- **Retry/polling:** Plus status poll every 3s; chat model-downgrade retry per §7.6.
- **Concurrency-safe refresh:** because lists can be mutated from several screens, reload on `scenePhase` active + after every mutation (`router.refresh()` analog = refetch from the top-level view model).

---

## 14. Recommended Swift Project Structure

```
Budgie/
├─ BudgieApp.swift                     // @main, root switch: signed-out → SignIn / signed-in → AppTabView
├─ Core/
│  ├─ Networking/
│  │  ├─ APIClient.swift               // URLSession + cookie handling + typed endpoints
│  │  ├─ AuthAPI.swift                 // §4 endpoints
│  │  ├─ RESTAPI.swift                 // §5 endpoints (budgets/subscriptions/accounts/transactions/user/plus)
│  │  ├─ ChatAPI.swift                 // §7 SSE client
│  │  ├─ APIModels.swift               // §6 Codable models
│  │  └─ BudgieError.swift
│  ├─ Auth/
│  │  ├─ SessionStore.swift            // ObservableObject; Keychain cookie + get-session on launch
│  │  └─ KeychainStore.swift
│  ├─ DesignSystem/
│  │  ├─ Colors.swift                  // §8.1 tokens
│  │  ├─ GlassCard.swift / GlassTile.swift / InsetCard.swift
│  │  ├─ Buttons.swift                 // primary/outline/success/soft/softred
│  │  ├─ ProgressTrack.swift / BottomSheet.swift / Formatters.swift
│  │  └─ SFIcons.swift                 // §8.6 mapping
│  ├─ Charts/                          // §10 (donut, bars, spending streams)
│  └─ Persistence/                     // §12 (chat storage, model choice, mask)
├─ Features/
│  ├─ Dashboard/   (DashboardView, AccountCard, NetWorthHero, CashflowCard, AssetGrowthCard, AccountEditor)
│  ├─ Transactions/ (TransactionsView, TransactionRow, TransactionDetailSheet, AddTransactionWizard)
│  ├─ Budgets/     (BudgetsView, BudgetSummaryCards, SpendingStreamsChart, BudgetsList, AddBudgetWizard, BudgetDetailSheet)
│  ├─ Subscriptions/ (SubscriptionsList, AddSubscriptionDialog, SubscriptionDetailSheet)
│  ├─ Profile/     (ProfileView, PlusPaymentWizard)
│  ├─ Chat/        (ChatView, ChatMessageView, ChatThinking, ChatToolCards, ChatComposer)
│  └─ Auth/        (SignInView)
└─ Resources/
```

---

## 15. Roadmap / Implementation Order

1. **Foundation:** APIClient + AuthAPI + SessionStore + Keychain; sign-in/sign-up screen; session restore on launch. *(Validate against `GET /api/health` and `GET /api/auth/get-session`.)*
2. **Dashboard read:** accounts, net worth hero + mask toggle, account cards; then charts (donut, asset growth, delta) using §10 math.
3. **Accounts CRUD:** add/edit/delete dialogs.
4. **Transactions:** list + search + date grouping + detail sheet + confirm delete; then the 3-step add wizard with client-side insufficient-balance pre-check; then PDF export.
5. **Budgets:** summary cards + spending streams + list + add wizard + detail/delete. **Subscriptions:** list + add + detail/delete (same screen).
6. **Profile & Plus:** identity card, upgrade/downgrade, QRIS wizard with 3s polling (+ mock "I've paid" while backend is mocked).
7. **Chat:** SSE parser, UIMessage state model, bubbles/thinking/tool cards, composer, model fallback, persistence.
8. **Polish:** Liquid Glass design-system pass, empty/error states everywhere, motion + Reduce Motion, dark-mode option, tests.

---

## 16. Gotchas & Traps

1. **Cookie prefix:** production HTTPS uses `__Secure-better-auth.session_token`. Store the name returned by the server — don't hardcode it.
2. **CSRF origin-check:** initial sign-in/sign-up must NOT send `Cookie`/`Origin`; any cookie-bearing auth POST needs `Origin: https://budgiez.vercel.app` (§4.5).
3. **Sliding sessions:** re-save the cookie after any response with `Set-Cookie` (get-session refreshes it near the 7-day expiry).
4. **401 ≠ 404:** unauthenticated is `{ error: "Unauthorized" }`; sign-in wrong password is `401 INVALID_EMAIL_OR_PASSWORD` (don't treat as a user object).
5. **Zod 400 shape differs** from controller errors (`{ success:false, error:{issues:[...]} }`) — parse both.
6. **Category enums:** API uses enum **names** (`FoodAndDrink`), display uses labels ("Food & Drink"). Never send a spaced label.
7. **Balance reconciliation:** never mutate balances client-side as source of truth — always go through `POST/DELETE /api/transactions`; the client pre-check is UX only (server still enforces).
8. **Insufficient balance on delete** can 400 (`income` or transfer-dest reversal) — surface the message.
9. **No transaction edit** — the API has no `PATCH /transactions`; don't build an edit affordance that expects one.
10. **Deleting an account deletes its transactions** — confirm loudly. Also, historical rows may show `balanceAccount: null` → "Deleted account".
11. **Budget/subscription uniqueness:** 409 on duplicate category/name — show inline, and filter already-budgeted categories in the picker.
12. **Mock Midtrans:** `simulate-payment` is a **mock** (remove when real Midtrans is wired). The iOS "I've paid" button is the mock path; the webhook is the real path. The mock store is in-memory — a backend restart loses orders → handle 404/expiry gracefully; rely on `expiresAt` (15 min).
13. **Chat SSE:** parse `data:` frames, skip `[DONE]`; `text-delta` is **word-chunked**; `reasoning-*` only on the primary model; stop after 3 steps; `finishReason` may be `"length"` (truncated) — UI should handle gracefully.
14. **Chat 401/400** are plain-text bodies (`"Unauthorized"`/`"Bad request"`) — don't JSON-decode them.
15. **Model fallback:** one downgrade max, 12h persistence, `isRateLimitError` matching (`429|quota|resource_exhausted|rate limit`).
16. **Chat persistence** must be per-user (key by `userId`) and capped (200 messages).
17. **One green CTA per screen** (web §12 rule) — e.g. don't show both "Upgrade" and another success button on Profile.
18. **Rupiah formatting:** id-ID locale (`Rp 1.250.000,00`) with 2 fraction digits; `monospacedDigit` everywhere money renders.
19. **Never invent colors:** Budgie palette only (§8.1); Liquid Glass adds material/translucency, not new hues.
20. **Empty states on every list** (icon tile + title + helper + optional CTA) and **graceful error states** — never crash on a malformed/`null` payload (web's `Array.isArray` guard analog: validate `[T]`-typed decodes before iterating).

---

## 17. Appendix: Web Reference Architecture

For deeper context (not needed to build the client), see in the web repo:
- `ARCHITECTURE.md` — full stack, §5 layer contracts, §6.5 RPC usage, §17 balance `$transaction`, §18–22 UI.
- `UI_DESIGN.md` — §16 landing, §17 chat UI anatomy.
- `README.md` — feature overview, test suites, deployment.

Backend request lifecycle for reference: `iOS → POST https://budgiez.vercel.app/api/... (Cookie) → Next.js catch-all → Hono (requireAuth via better-auth getSession) → controller → service → Prisma/Postgres → JSON`. Chat instead routes to `POST /api/chat` → `streamText(Gemini)` → SSE. The backend is **shared and unchanged** — the iOS app is a pure, thin, cookie-authenticated HTTP client.
