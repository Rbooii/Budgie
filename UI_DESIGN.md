## 16. Landing Page — Anthropic Company Register (public `/`)

`src/app/page.tsx` renders `<LandingPageView>` from `src/components/landing/`.
It follows **anthropic.com's company register**, not Claude's product register.
Read this before touching anything under `src/components/landing/`.

### Visual register

- Warm paper canvas (`bg-paper` / `#FAF9F5`), ink text (`#141413`), and
  hairline borders only on cards and chart frames. **No section separators, no
  list rules, no image plates**, no shadows, no gradients. Sections are
  separated by whitespace and type, not lines.
- **Accent: Budgie green + ink.** The accent is sampled from the green dollar
  sign in the Budgie logo: `#5ABB37`, with `#41802A` for stronger text and
  hover states. It carries CTAs, the logo, positive figures, and chart lines.
  No clay, terracotta, or orange in the UI. Surfaces stay paper/ink; colour
  comes from the charts and the green accent.
- **Wise clarity, Anthropic register.** Borrow Wise's practical card structure
  and minimalist navigation, but keep the paper, serif headings, hairlines,
  and restrained motion. The hero stage is theme-aware: transparent paper in
  light mode and an ink field in dark mode. No stock photos, gradients, or app-store
  chrome.
- **Animated sketch line charts**, not abstract images. `sketch-line.tsx`
  draws a lightly jittered ink line on paper, with a dashed target line and a
  left-to-right reveal. Used in the feature cards, editorial, and
  learn sections. **No mascot, no radial mark, no abstract image plates.**
- Typography is the Anthropic split, not a Claude slogan:
  - Hero: one paragraph, **sans lead 600** + **serif statement 400**,
    `clamp(1.5625rem, 3vw, 3rem)`, line-height `1.3`, tracking `-0.01em`.
  - Section headings: **serif 300**, `clamp(2.5rem, 5.6vw, 5rem)`,
    line-height `1.05`, `max-width: 12ch`.
  - Body: sans `17px/26px`.
  - Logo: the old green app icon (`/android-chrome-192x192.png`) beside the
    "Budgie" wordmark in Geist 600.
- **No AI-slop typography:** no em dashes, en dashes, middle dots, uppercase
  labels, badge pills, "Fig." captions, "Optional", "Sample", "By the
  numbers", or generic filler.

### Page anatomy

1. **Nav** (`landing-nav.tsx`): green app icon + wordmark, links Product /
   Pricing / Questions, one green pill. No demo or learn link.
2. **Hero** (`hero.tsx`): mixed statement and one green CTA on the left, a
   borderless `MoneySnapshot` stage on the right. The stage is a masked dark
   field (`bg-transparent` in light, `bg-ink-field` in dark), not a card. `NaniteField` is a
   roaming field of independent dots that occasionally searches toward a card,
   not an orbit. Every 4.6s the stage builds a random composition of 1 to 3
   real app components,
   scaled down: income rows (`TransactionItem`), expense rows, `CashflowCard`
   summary, and `BudgetSummaryCards`. Cards use loose slots with jitter; the
   three-card composition uses the compact pool so it fits. No header, no net
   number, no controls, no live counters.
3. **Product story** (`product-story.tsx`, `#live`): sticky 3-step story
   built from real app components: `BalanceSection`, `BudgetSummaryCards`,
   `SpendingStreamsChart` (bare), and `CashflowCard`. Mobile stacks each step.
   The wrapper adds a paper-sheet reveal; the components keep their app
   behavior and data flow. Each sheet is `inert`, so the showcase cannot be
   clicked, focused, or hovered for tooltips. `AutoRevealBalance` supplies a
   demo-local visibility state, so the masked balance animates open once
   without user input and without touching the saved preference. There is no deck
   copy beside the heading.
4. **Feature cards** (`feature-cards.tsx`, `#product`): three sketch-line
   cards (balance, savings, spending), no images or badges.
5. **Editorial** (`editorial-section.tsx`, `#how`): a savings line chart with
   a target line, large serif pull statement, two short paragraphs.
6. **Learn** (`learn-section.tsx`, `#learn`): a spending line chart against a
   budget, plus one static plain-language note.
7. **Pricing** (`pricing.tsx`): honest supporter tier, two plain columns,
   green Plus heading, no rules, cards, or badges.
8. **FAQ** (`faq.tsx`): borderless `<details>`, separated by whitespace, thin
   plus line.
9. **Endcap** (`endcap.tsx`): paper section, "Start with what you have.",
   green CTA.
10. **Footer** (`footer.tsx`): ink field `#141413`, paper text, green logo,
    real links.

### Motion

- Hero word reveal, once, `motion-reduce` gated.
- `NaniteField`: 100 to 140 dots in a canvas. Each dot wanders on its own
  smooth phase and keeps a minimum distance from its neighbors; there is no
  cohesion or alignment, so the field never merges. A short search pull toward
  a card fades before dispersing. Every dot has a thin outline, plus faint
  connection edges to nearby dots. No orbit, no ring, no random per-frame
  jitter. Pause offscreen, reduced motion static. The stage mask keeps the
  field contained without a card edge.
- `MoneySnapshot` cards: a random 1 to 3 card composition every 4.6s, using
  loose slots, jitter, and adaptive scale. Each card also floats on its own
  path (different direction, 5 to 8 second duration, negative delay, tiny
  rotation). The composition spawns with opacity, scale, and blur, holds, then
  despawns. Reduced motion shows the initial income and summary cards
  statically with no float or cycle.
- Sticky story: active text cross-fades as each panel enters.
- `SketchLine`: a left-to-right clip-path draw-in on view. No dash-based
  draws, no fake live counters.
- Product story: paper-sheet clip-path reveal. The real components are not
  animated internally by the landing, except the demo-local balance reveal
  driven once by `AutoRevealBalance` and the chart's own mount animation.
- No per-section fade-slide, no marquee, no scroll progress bar, no fake live
  counters.

### Data visualization, not abstract imagery

Feature and editorial visuals are `sketch-line.tsx` data charts. Do not add
abstract image plates, stock photos, or copied Anthropic/Claude assets. If a
new visual is needed, extend `SketchLine` or use a real app component. Keep the
ink line, dashed target, end dot, and restrained labels. No chart grid.

### Anti-slop rules

The canonical checklist lives in [`ANTI_SLOP.md`](./ANTI_SLOP.md). It applies
to the whole app, not only the landing. In short:

- No `Sparkles` or AI-coded symbols, no blinking or typing dots, no status
  dots, no decorative badges or pills.
- No horizontal separators between sections, FAQ rows, pricing lists, or
  footer/nav edges. Whitespace is the divider.
- No dead controls. The showcase is `inert`, so its real controls are never
  half-clickable. Every link resolves to a real page or section.
- No fake product claims. Plus is optional support, not a gated feature.
- No gradients, glassmorphism, card-per-item, or heavy shadows.
- Solid buttons with a non-white fill use white text; soft/tint buttons keep
  ink or semantic text.
- No em/en dashes, middle dots, or uppercase labels in UI copy.
- No `rounded-md/lg/xl` and no rigid 12px frames. Landing cards use
  `rounded-[20px] sm:rounded-[24px]`; the hero stage has no card frame, and the
  cards add `[corner-shape:squircle]` for Apple-style continuous corners.
  Buttons and controls stay `rounded-full`.
- Tests: `tests/components/landing/anti-slop.test.ts` enforces the landing copy
  and class rules; `tests/anti-slop.test.ts` enforces the global symbols,
  badges, dots, and uppercase rules.

## 17. Chat UI (auth-gated `/chat`)

`src/components/chat/` is the Budgie AI assistant surface. The anatomy follows
modern AI apps (history rail, centered thread, floating composer, markdown)
while the register stays **quiet and app-native on Budgie tokens** — no
sparkles, no AI iconography, no per-message avatars. The tokens stay in force —
`brand` (user bubble, send, streaming caret), `surface` trays, the 3 semantic
tokens (`income` / `expense` / `transfer`), `tabular-nums`, `formatRupiah`,
motion ≤200ms `ease-out`, `motion-reduce` respected. The whole surface is
`bg-screen` (the same page background as the dashboard), the thread is
transparent, and the composer, suggestion tiles and tool widgets use `bg-card`.
The old `bg-chat` column is no longer used here.

### Layout — full-bleed (`PageShell flush`)

`/chat` renders `<PageShell flush>` (no page padding, `h-[100dvh]
overflow-hidden`, mobile tab-bar clearance via `--app-tabbar-h`) directly into
`<ChatView>`. There is **no `AccountTab` and no page `<h1>`** on this route —
the chat owns the viewport. `ChatView` is a full-height row:

```
├─ thread column (flex-1)
│   ├─ header (shrink-0): app mark + thread title + model label;
│   │   right group = [history ○] (mobile only) + [New chat ○] (the only one)
│   ├─ thread (relative flex-1 min-h-0)
│   │   ├─ .chat-scroll overflow-y-auto — the only scroll area
│   │   │   └─ centered max-w-3xl role="log" feed: empty state / bubbles /
│   │   │      markdown / thinking / tool cards / typing
│   │   └─ "Latest" pill (absolute bottom-4 center) when scrolled >56px
│   └─ composer (shrink-0, centered max-w-3xl): error callout /
│       lighter-model notice + ChatInput + mistakes caption
├─ history rail (desktop ≥lg, 268px, border-l, on the right): Chats,
│   Today / Yesterday / Earlier groups, delete on hover, 2-day caption
└─ mobile history sheet (right drawer, Escape/backdrop closes)
```

The mobile root is `h-[calc(100dvh-var(--app-tabbar-h))]`, desktop
`md:h-[100dvh]`, so the composer is always pinned above the tab bar instead of
floating with the message content.

The old runtime `getBoundingClientRect` height measuring is gone — the shell
owns the height, so the page never scrolls.

### Header

App-icon mark (`/android-chrome-192x192.png`, 30px `rounded-[9px]`) + the
active thread title (14px semibold, truncated; fallback "Budgie Assistant") +
the active model label (11px `text-ink/40`). The right group holds the mobile
history toggle (`History`, `aria-label="Open chat history"`) and the **single**
`SquarePen` **New chat** (`aria-label="New chat"`). The rail and the mobile
drawer have no New chat button. New chat starts a fresh conversation; it never
deletes the previous thread.

### Empty state (`ChatEmptyState`)

Centered (`min-h-full justify-center`), **no icon**: `text-2xl font-semibold
tracking-tight` **"Hi {firstName}, how can I help you
this morning/afternoon/evening/late night?"** (time-of-day computed
post-mount; `userName` comes from the RSC). Subtitle: "Ask about your
balances, spending and budgets — or record a transaction in plain words."

Below, the four suggestions are a **2×2 tile grid** (`grid grid-cols-1
sm:grid-cols-2 gap-2 max-w-lg`): `rounded-[20px] border border-hairline
bg-card p-4 text-left text-sm font-medium leading-snug text-ink/70`, hover
`bg-hover text-ink`. No icon tiles, no hint copy, no serif greeting.

### Bubbles & states

| Element | Style |
| ------- | ----- |
| User bubble | right-aligned `max-w-[85%] sm:max-w-[340px] rounded-[20px] rounded-br-[6px] bg-brand px-4 py-2.5 text-[15px] text-white` (iMessage tail kept) |
| Assistant | full-width `text-[15px] leading-relaxed` **markdown prose** (`ChatMarkdown`: paragraphs, lists, bold, inline code, fenced code, blockquote, GFM tables/links) — **no avatar, no bubble** |
| Message gap | `gap-4`; every message enters with `stepReveal` 180ms, `motion-reduce` off |
| Actions | under an assistant message: **Copy** (clipboard → "Copied" for 1.5s) and **Regenerate** (last assistant message only, `aria-label="Regenerate response"`) — 11px ghost pills, `-ml-2` |
| Streaming caret | 2px `bg-brand` pill appended to the last text part while `status === "streaming"` (`.chat-caret`, static, no blink). Streaming text stays plain (`whitespace-pre-wrap`) so the caret stays attached; completed messages switch to markdown. |
| Typing | white bubble with tail (no avatar), static `Thinking` text, `role="status" aria-label="Budgie is thinking"` |
| Thinking (`ChatThinking`) | streaming: neutral `Loader2` (`text-black/30`) + "Thinking…" 13px `text-ink/45`; done: plain chevron + "Thought for a moment" text button → 13px `text-ink/45` reasoning |
| Tool running (`ChatToolStatus`) | inline neutral row (no card) — `Loader2` + per-tool label, 13px `text-ink/45` |
| Tool error | `rounded-[16px] bg-expense-tint text-expense` + `AlertTriangle` |
| Error surface | `role="alert"` red callout above the composer: `AlertTriangle` + "Something went wrong" + capsule "Retry" → `regenerate()` |
| Jump to latest | white capsule + `ArrowDown` + "Latest", `absolute bottom-4`, appears only when the user scrolls away (`scrollHeight - scrollTop - clientHeight >= 56`) |

### Tool result widgets (`ChatToolResult`)

Tool output renders as a **quiet panel built from the app's own list rows**:
`max-w-[440px] rounded-[20px] border border-black/[0.08] p-2`, `stepReveal` in,
header = the app's 11px section label (`font-medium text-ink/35`). Rows follow
the real screens: 36px `rounded-full` full-tint
icon circle + 14px medium title + 12–13px `text-ink/45` subtitle,
`tabular-nums` amounts, semantic tints. No `surface` icon-tile header, no
card-per-item, no sparkles.
- **Accounts** — "Total balance" 13px label + 18px bold, then per account a
  neutral `bg-surface` circle with `Wallet`, name + capitalized type.
- **Transactions** — up to **6** `TransactionItem`-style rows (type icon circle,
  name, `Account • Category` 12px, signed amount in the type tint, date 11px),
  "+N more" caption; empty → "No transactions found."
- **Budgets** — `BudgetsList`-style rows: expense-tinted category circle, label
  + `periodLabel`, limit + "left"/"Over …" (red when over) + 6px progress
  track; empty → "No budgets yet."
- **Subscriptions** — `SubscriptionList`-style rows: transfer-tinted category
  circle, name + `Category · period`, "Next {date}", amount in transfer tint,
  "Inactive" caption; empty → "No subscriptions yet."
- **Insights** — "Net worth" 11px label + 20px bold, plain Income/Expense tiles
  (10/12px tinted), top categories rows (max 5, neutral circles).
- **create_transaction** — success: a transaction row + green "Added" caption;
  failure: `rounded-[16px] bg-expense-tint` callout + `AlertTriangle`.
- **get_financial_overview** — net-worth hero, up to 4 account rows, a quiet
  Income/Expense/Net stat tray, a one-line budget/bill summary, and up to 3
  top-category rows.
- **get_cashflow_trend** — up to 6 monthly rows with a signed net and a
  semantic mini bar, plus a total-net row.
- **get_spending_breakdown** — category (or `Store` for merchant) rows with
  share, period-over-period delta and amount, plus a total.
- **get_net_worth_history** — net-worth hero + signed change + the paper
  `Sparkline`.
- **get_budget_status** — budget rows with limit/spent, remaining or "Over",
  the 6px progress track, and a pace projection when it exceeds the limit.
- **get_upcoming_bills** — subscription rows with next date and a window total.
- **get_largest_transactions** — the same transaction rows as `get_transactions`
  (up to 6).
- **create_budget / update_budget / create_subscription / update_subscription**
  — compact `bg-income-tint` "saved" row or the standard red callout on failure.

Widgets are static (no navigation/sheets) and unknown tools render nothing.

### Composer (`ChatInput`)

Bordered card (`rounded-[28px] border-hairline bg-card`, soft shadow; focus
deepens the hairline + a 4px `ring-ink/[0.04]`):
- Textarea `placeholder="Ask Budgie about your money…"`, `text-[15px]`,
  auto-grows 1–6 lines (`max-h-[160px]`), `px-4 pt-3.5`; `Enter` sends,
  `Shift+Enter` newline.
- Bottom row: **left = `ChatModelMenu`** — a 28px chip (model label +
  `ChevronDown`, `aria-label="Select model. Current: …"`) whose panel opens
  **upward** (`bottom-full mb-2`) listing `MODEL_CHAIN` with a `Check` on the
  active model, then a divider and the custom-provider entry ("Your model" or
  "Connect a model") plus "Manage model". **right = send**: 36px circle,
  `bg-brand text-white` when sendable, `bg-hairline-track text-ink/30` when
  empty, swaps to a dark `Square` stop while streaming; disabled in the error
  state.
- Caption below the card: 11px `text-ink/35` "Budgie can make mistakes.
  Double-check the important numbers."
- `ChatProviderDialog` (from the model menu or Profile → Settings): endpoint,
  write-only API key, model id, optional label, Save / Test / Disconnect. The
  key is stored encrypted server-side and never returned; production endpoints
  must be public HTTPS.

### Persistence, history & model fallback

- **Threads live server-side** (`ChatThread`, owner-scoped, last 48 hours).
  The first send creates a thread (`POST /api/chat/threads`), the client sends
  `threadId` in the chat body, and `streamText(...).toUIMessageStreamResponse({
  originalMessages, onFinish })` saves the completed `UIMessage[]`.
- The rail lists Today / Yesterday / Earlier and only non-empty threads. The
  active thread is restored from `?thread=<id>` or
  `budgie.chat.{userId}.activeThread`; expired threads fall back to a new chat.
- Local storage is limited to the **draft**, the **active thread id** and the
  **model selection** (`budgie.chat.{userId}.draft | .activeThread | .model`).
  The old single-conversation `messages` key is read once and shown as an
  unsaved legacy conversation. **New chat** clears the draft + active pointer
  and keeps every saved thread; it does not delete history.
- **Auto-downgrade** — on a rate-limit error the client regenerates with
  `gemini-3.5-flash-lite` and shows the notice (see ARCHITECTURE.md §22).
  Custom-provider selections are deliberate and do not auto-downgrade.

### Gotchas

- Assistant text renders **markdown** (`react-markdown` + `remark-gfm`, no raw
  HTML); streaming stays plain so the caret stays attached. User bubbles stay
  plain `whitespace-pre-wrap`.
- The chat surface is full-bleed `bg-screen`; do not bring back the narrow
  `bg-chat` column. The rail/drawer are the only additional chrome.
- The time-of-day greeting must not be computed during SSR; compute it in an
  effect.
- Threads are retained for exactly 2 days and pruned lazily on list/create;
  do not add infinite history without revisiting the privacy decision.
- The model key is write-only. Never return it in a GET, never log it, and
  validate custom endpoints (HTTPS + no private hosts in production).
- Never re-introduce a second clear button, a serif greeting, or a page
  `AccountTab`/`h1` on `/chat`.
- **No AI slop**: see [`ANTI_SLOP.md`](./ANTI_SLOP.md). No `Sparkles` or
  `CheckCircle2` brand tiles, no per-message avatars, no per-tool icon-tile
  headers, no card-per-item, no blinking dots or status badges. Widgets reuse
  the app's list-row primitives and tints, don't invent new chrome.

## 18. App Shell — Mobile Tab Bar, Graph Draw-in, Skeletons

### Mobile bottom tab bar (`Sidebar`)

The mobile tab bar is `fixed bottom-0` with height
`--app-tabbar-h: calc(3.5rem + env(safe-area-inset-bottom, 0px))`
(`globals.css`), `pb-[env(safe-area-inset-bottom,0px)]`, frosted
`bg-card/90 backdrop-blur-xl` and a `border-hairline` hairline. The active
tab is a `bg-brand/10` pill behind a green icon + green label
(`aria-current="page"`); inactive tabs are `text-ink/45`. `viewportFit:
"cover"` is set in `src/app/layout.tsx` — without it `env(safe-area-inset-*)`
is always `0` on iOS and the bar collides with the home indicator.

Pages clear the bar with the same token:
`pb-[calc(var(--app-tabbar-h)_+_1.5rem)] md:pb-10` (`PageShell` non-flush) or
`PageShell flush` for `h-[100dvh]` surfaces (`/chat`). Never hardcode a bottom
padding for the bar — use the token.

### Chart draw-in (no dash-based draws)

Reveal animations on SVG must not use `stroke-dasharray` + `pathLength` while
the path also sets `vector-effect="non-scaling-stroke"`: dash lengths resolve
in host space under that vector effect, so `stroke-dasharray: 1` renders the
line **dotted** (the old account-sparkline bug).

- `Sparkline` (`sparkline.tsx`) — iOS `Sparkline.swift` parity: measures its
  container, draws in real pixel geometry (`viewBox 0 0 w 44`, 2.5px stroke),
  and reveals via the `.spark-reveal` `clip-path` wipe (0.7s ease-out,
  `motion-reduce` off). `variant="paper"` adds a jittered cubic curve and an
  end dot; the dashboard account cards use it. No grid lines.
- `AssetGrowthCard` bars use the `.bar-grow` `scaleY` transform instead.

### Skeletons (`PageSkeleton`)

`src/components/page-skeleton.tsx` takes a `variant`
(`dashboard | transactions | budget | profile | chat | add-transaction`) and
mirrors that route's real geometry — the AccountTab row, the green balance
card, account-card grid, list rows, the chat header/thread/composer. Blocks are
`bg-surface animate-pulse motion-reduce:animate-none` with bg-skeleton inner bars
on cards, entire tree `aria-hidden`. Add a variant when a new route appears —
never reuse the generic rows shape.

### Dashboard account cards + Quick Insight

- **Account cards are papery**: `rounded-[28px] border border-hairline
  bg-card`, no shadow. The card face has a name, a `GripVertical` drag handle,
  a paper `Sparkline`, and the masked balance. The whole card opens the detail
  dialog unless it is being dragged; the handle stops propagation.
- **Kanban reorder**: `AccountGrid` uses dnd-kit with pointer + keyboard
  sensors. Dropping a card optimistically reorders the grid and persists the
  full id list through `POST /api/balance-accounts/reorder`. The server stores
  `BalanceAccount.sortOrder` and lists by `sortOrder ASC, createdAt DESC`.
- **Quick Insight header**: each card owns a shadcn-style Radix Select in the
  header row, aligned with a quiet `text-sm font-semibold text-ink/50` title and
  a `text-xs text-ink/30` date/range. The visible period label is `sr-only`; the
  trigger shows the active period. Trigger is a compact hairline button with a
  chevron; the popover has a checkmark on the selected item, highlighted hover
  states, and keyboard/outside-click handling. Cashflow presets are This month /
  Last month / Last 3 months / This year / Last year. Asset Growth presets are
  This year / Last year / Last 12 months. The dashboard precomputes the compact
  period data in the RSC, so switching is instant.
- **Cashflow**: `Net` is the single focal number under the header
  (`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight tabular-nums`,
  brand or expense). The 160px donut below it uses 16px strokes and a real
  10px hole between arcs: round caps paint `STROKE / 2` past each dash end, so
  the dash-space is `GAP_PX + STROKE` (26px). A zero period renders a quiet
  `var(--chart-placeholder)` ring and two `0%` rows. Income and expense are
  full-width rows with semantic labels, muted percentages, and
  `text-lg sm:text-xl font-bold` amounts. No center label, no tinted blocks,
  no status dots, no pills. Both cards stretch to the shared grid row height
  (`h-full flex flex-col`); Cashflow anchors its rows with `mt-auto`.
- **Asset Growth**: no `Sparkles`, no pill, no dots. The signed change is the
  hero (`text-2xl font-semibold`), `changeLabel` (`YTD` / `Year` / `12M`) is a
  quiet caption, the chart keeps 12 slots with slimmer bars, and the legend is
  text-only (`Growth`, `Stable`, `Decline`). Month labels and tooltip labels
  come from the selected period. The chart wrapper is `flex-1` so the card
  fills the shared row height; an inner `relative w-full` wrapper keeps the
  tooltip percentages aligned with the SVG. No shadow.
- **Balance visibility**: `MaskedBalance` (from `balance-visibility.tsx`)
  masks every monetary value on the dashboard. The context default outside the
  dashboard provider is visible, so landing demos and tests still show sample
  numbers; `BalanceVisibilityProvider` owns the persisted default (hidden).
  Cashflow masks the net (`mask="long" signed`) and both amounts
  (`mask="short"`). Asset Growth masks the signed change and the hover tooltip,
  and drops the amount from the chart `aria-label` while hidden. Percentages,
  the donut, and the bars stay visible: they show ratios and trend, not
  nominal values.
- **Empty state**: Quick Insight renders only when there are no transactions at
  all, not merely none this year. The empty state is plain text plus the real
  Add transaction CTA, with no sparkles or decorative icon tile.

## 19. Theme & Dark Mode (iOS palette parity)

The web palette is a **1:1 port of `Budgie-ios/Budgie/Core/DesignSystem/Colors.swift`**
and is fully semantic: every surface/ink/hue flips with the theme, and no
component picks a raw hex directly.

### Token table (`globals.css`)

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `background` | `#F7F7F7` | `#101014` | app scroll backgrounds |
| `screen` | `#FFFFFF` | `#101014` | full-screen shells (auth, add flow, landing, footer) |
| `card` | `#FFFFFF` | `#1C1C1E` | cards, sheets, dialogs, rows, inputs |
| `surface` | `#F2F2F2` | `white 10%` | icon tiles, inset/gray rows, skeleton bars |
| `chat` | `#FCFAF7` | `#16151A` | `/chat` thread |
| `ink` | `#171717` | `#FFFFFF` | primary text (`text-ink`, `/45`, `/35`… keep the opacity hierarchy) |
| `ink-soft` / `ink-contrast` | `#3D3D3D` / white | `#F2F2F2` / `#171717` | dark controls (chat stop/send) |
| `hairline` | `black 6%` | `white 12%` | borders/dividers |
| `hairline-track` | `black 6%` | `white 16%` | progress tracks |
| `hover` | `black 3%` | `white 6%` | hover/quiet inset fills |
| `skeleton` | `white 70%` | `white 14%` | skeleton inner bars |
| `scrim` | `#000000` | `#000000` | dialog/sheet overlays (`bg-scrim/30|40`) |
| `brand` | `#5ABB37` | `#5ABB37` | CTAs, active tabs, under-budget fills |
| `income` | `#2F9E44` | `#3DDC74` | income amounts/icons |
| `expense` | `#FF2600` | `#FF5A4D` | expense amounts/icons/over-budget |
| `transfer` | `#FF9F33` | `#FFB454` | transfer amounts/icons |
| `stagnant` | `#B0B0B0` | `#8E8E93` | flat chart bars, "Stable" legend |
| `brand/income/expense/transfer-tint` | `color-mix(hue 12–16%)` | same | icon circles, soft buttons |
| `chart-placeholder` | `#E5E5E5` | `white 16%` | future/unrecorded chart bars |

### Mechanism

- **`.dark` on `<html>`**, not `prefers-color-scheme` directly — a system
  listener in `ThemeProvider` keeps `system` in sync.
- `ThemeScript` (first child of `<body>`, `layout.tsx`) applies the stored class
  **before paint**, so there is no light flash. Logic duplicated: keep
  `theme-provider.tsx` and the inline script in sync.
- Storage: `localStorage["budgie.theme"]` = `system | light | dark` (default
  `system`). `useTheme()` exposes `{ theme, resolved, setTheme, toggle }`.
- Controls: **Profile → Settings → Appearance** (`ThemePicker`, segmented
  System/Light/Dark, mirrors the iOS settings row) plus the sidebar quick-toggle
  row. `suppressHydrationWarning` is set on `<html>`.
- **Token changes need a dev restart.** After renaming/adding tokens in
  `globals.css`, Turbopack can keep serving the old Tailwind sheet (old utility
  names, old `:root` vars) — the app then renders unstyled/monochrome because
  the new class names don't exist in the served CSS. Stop dev, `rm -rf .next`,
  start again.

### Rules

- **Never** write raw `#hex`, `text-black`, `bg-white`, `border-black`, or
  Tailwind grays in app/landing components — use the semantic utilities
  (`text-ink/…`, `bg-card`, `bg-surface`, `border-hairline`, `text-income`, …).
- Keep the text-opacity hierarchy (`text-ink/45` secondary, `/35` tertiary,
  `/25` faint) — the alpha is what makes it match `budgieTextSecondary` etc.
- Tints are derived with `color-mix` from the adaptive hue, so they flip for
  free; prefer them over new opacity piles.
- **Always-light exceptions**: QRIS QR container (`plus-payment-wizard`),
  jsPDF output, `opengraph-image.tsx`, and the identity card (always dark,
  `#1C1C1E`). Shadows stay black-based in both themes.
- SVG colors use `var(--income|expense|transfer|stagnant|chart-placeholder)` or
  `fill-ink/…`; never hardcode a fixed `fill` value, use `fill-ink/…` or `var(--brand)`.
- No gradients (`cashflow-card` arcs are solid semantic strokes).
- Tests: `tests/components/theme.test.tsx` (provider/system sync/persistence/
  picker/no-flash script) + the sidebar toggle test wrap `ThemeProvider` and
  `stubMatchMedia(false)`.
