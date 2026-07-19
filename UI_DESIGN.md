# Budgie — UI/UX Design Reference

A precise blueprint of Budgie's visual language, interaction patterns, and
component conventions. Written so that any engineer (human or AI) can extend the
UI without breaking tone, consistency, or the minimalist philosophy.

---

## 1. Design Philosophy

Budgie is a **personal finance app** that feels calm, honest, and effortless.

### North Stars
1. **Minimalism over ornament.** Every pixel earns its place. No decorative
   gradients, no glassmorphism spam, no chunky borders, no skeuomorphic shadows.
   A single accent color, generous whitespace, and clear typography carry the
   whole product.
2. **Money is the hero.** Balances and amounts are the largest text on screen.
   Labels, metadata, and chrome stay quiet so the eye lands on the numbers
   first. Use `tabular-nums` on every numeric/monetary value so digits don't
   jitter as values change.
3. **Calm confidence.** Animations are short (150–300ms), use
   `cubic-bezier(0.22, 1, 0.36, 1)` or `ease-out`, and never bounce or
   overshoot. Motion reveals content (blur-in, slide-up, scale-in), it does
   not perform.
4. **Mobile-first, desktop-aware.** Default layouts are single-column and
   flush to the viewport edges on mobile; `sm:` / `md:` / `lg:` breakpoints
   widen to multi-column grids and reveal a persistent sidebar. Never design a
   desktop-only screen first.
5. **Privacy is a feature.** Balances are hidden by default
   (`HIDDEN_DEFAULT = true` in `balance-visibility.tsx`) and revealed on tap.
   The reveal animates per-character (`balanceReveal`, 28ms stagger delay,
   capped at 260ms). The eye icon does a 3D flip (`eyeFlip`). Both respect
   `motion-reduce` and `suppressHydrationWarning` to avoid SSR flicker.

### Anti-patterns (do NOT do)
- Don't add box shadows for decoration. Shadows exist only on **cards** and
  **dialogs** (foreground lifts above the page). Lists, rows, buttons, and
  inputs use flat fills or hairline borders.
- Don't introduce new brand colors. The palette is fixed (§3). If you need a
  new semantic token, reuse an existing hue at a different alpha.
- Don't use raw `text-gray-*` / `text-slate-*`. Opacity modifiers
  (`text-black/40`, `bg-black/[0.04]`) on the neutral `#171717` ink keep the
  tonal scale coherent.
- Don't ship dense forms. Fields stack vertically with `gap-3`; buttons sit
  in a `flex gap-2` row. One primary action per surface; secondary actions are
  `outline` / `soft`.
- Don't use `border-b` hairlines as the only row separator in rounded lists —
  items are rounded containers with `gap` between them. A hairline divider is
  reserved for **insets** inside a card (wizard field rows, detail sheet rows).

---

## 2. Visual Tone

| Attribute | Value |
| --- | --- |
| Mood | Calm, trustworthy, modern fintech. Not playful. Not corporate-bank. |
| Density | Low. Generous padding (`py-3.5`, `px-6`), small type scales, breathing room. |
| Color usage | ~90% white/neutral, ~10% semantic accent. Green for income/positive, soft red for expense/negative, soft orange for transfer. |
| Borders | Hairline (1px, `black/[0.04]`–`black/10`) or none. Rounded containers replace borders where possible. |
| Shadows | Only on elevated surfaces: `shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)]` (card), `shadow-2xl` (dialog). Never on buttons/inputs/lists. |
| Iconography | `lucide-react` line icons, 1.5px stroke implied. Sizes `w-4 h-4`–`w-5 h-5` for inline, `w-7 h-7` for empty-state heroes. Never filled/duo-tone. |
| Numeric font | `tabular-nums` mandatory on all amounts, balances, percentages, times. |
| Microcopy | Indonesian-Rupiah context (formatting via `formatRupiah`), labels in English. No emojis. |

---

## 3. Color Tokens

All colors are inline Tailwind classes — there is **no theme color palette**
beyond `--background` / `--foreground` in `globals.css`. These literals are the
source of truth; do not invent new hex values.

### Inks & neutrals
| Token | Class | Used for |
| --- | --- | --- |
| Ink | `text-black` (`#000`), `#171717` (foreground) | Primary text. |
| Ink 65% | `text-black/50`–`black/60` | Secondary labels, field captions. |
| Ink 40% | `text-black/40`–`black/45` | Subtitles, helper text, placeholder. |
| Ink 30% | `text-black/30` | Timestamps, group captions (in list view). |
| Ink 15% | `text-black/15` | Disabled icons, chevrons. |
| Hairline | `border-black/[0.04]` | Inset dividers (wizard card, detail sheet). |
| Border | `border-black/10` | Input/select outlines. |
| Hover border | `border-black/20` (focus ring `ring-black/20`) | Input focus/hover states. |
| Surface | `bg-white` (`#FFFFFF`) | Cards, dialogs, inputs, mobile nav. |
| Surface alt | `bg-[#F2F2F2]` | Pill backgrounds, inactive sidebar items, hover fills, hairline section boundaries (`border-[#F2F2F2]` in sidebar). |
| Surface fainter | `bg-[#FAFAFA]` | Row hover inside rounded lists (subtle). |
| Surface faintest | `bg-[#F8F8F8]` | Unselected option-row hover in dialogs. |
| Backdrop | `bg-black/30`–`bg-black/40` + `backdrop-blur-[2px]`–`backdrop-blur-sm` | Modal scrim behind sheets/dialogs. |
| Scrim (auth) | `bg-white/15` + `border-white/25` | Error pill on the green auth screen. |

### Signature brand green
The brand green appears in two contexts:
1. **Sign-in surface**: full-bleed `bg-[#00CE11]` / `bg-[#00C610]` background —
   the only saturated screen in the app.
2. **Primary action (success variant)**: `bg-[#00C610]` text-white, hover
   `bg-[#00B609]`. Used for the main CTA on every form (Add, Save, Continue,
   Get Budgie Plus, Details).

> The card donut chart reuses `#00C610`→`#00B609` (linear gradient) for the
> income arc and `#e0584f`→`#c4453b` for the expense arc. The expense gradient
> is the only place a non-tinted red is used; everywhere else expenses are the
> **soft red** tint below.

### Semantic type tints (transaction palette)
Soft pastel backgrounds + saturated text. Reused in list rows, wizard type
cards, detail sheet pills, and badges.

| Type | Icon bg fill | Text | Pill bg (detail sheet) | Wizard active ring |
| --- | --- | --- | --- | --- |
| Income | `bg-[#A0FFA8]/30` | `text-[#1F9B29]` | `bg-[#A0FFA8]` | `border-[#A0FFA8] bg-[#A0FFA8]/15` |
| Expense | `bg-[#FFBABA]/40` | `text-[#D8000C]` | `bg-[#FFBABA]` | `border-[#FFBABA] bg-[#FFBABA]/20` |
| Transfer | `bg-[#FFD9A0]/40` | `text-[#B25B00]` | `bg-[#FFD9A0]` | `border-[#FFD9A0] bg-[#FFD9A0]/20` |

> The expense red `#D8000C` and income green `#1F9B29` are reused by the
> `softred` / `soft` button variants (§4).
> **Do not** introduce a 4th semantic hue. Reuse these tints for any
> context-dependent UI (budgets, charts, chat) by mapping positive→income,
> negative→expense, movement→transfer.

### Error palette
| Token | Class | Used for |
| --- | --- | --- |
| Error bg | `bg-red-50` | Error callout background (forms, dialogs, sheets). |
| Error border | `border-red-200` | Error callout border. |
| Error text | `text-red-600` (`text-red-500` for the donut) | Error copy + the AccentCircle icon stroke. |

> Error callouts use a **rounded pill** (`rounded-[20px]`), an AlertCircle
> icon (`w-4 h-4 shrink-0`), and a single-line message. They never span more
> than ~2 lines. Pattern: `flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-[20px] px-4 py-2.5`.

---

## 4. Component Library

### 4.1 `Button` — `src/components/button.tsx`
The only button. Variants (single accent per surface):

| Variant | Visual | Use |
| --- | --- | --- |
| `primary` | `bg-black text-white hover:bg-black/85` | Rare standalone dark CTA (sign-in submit, PDF download confirm). |
| `success` | `bg-[#00C610] text-white hover:bg-[#00B609]` | **Default primary CTA** on all authenticated forms. |
| `soft` | `bg-[#A0FFA8] text-[#1F9B29]` | Income-flavored secondary (Add Account, Cancel-pair-from-Add Account, Save Account). |
| `softred` | `bg-[#FFBABA] text-[#D8000C]` | Expense-flavored destructive secondary (Delete confirm in a dialog). **Not** the sheet's "Delete transaction" trigger — that's the full-width `bg-[#FFBABA]` button in the detail sheet, which only *opens* the confirm dialog. |
| `outline` | `bg-white text-black border border-black/10 hover:bg-[#F2F2F2]` | Tertiary actions (Edit, Download, Back-to-home, social sign-in, "Get Budgie Plus" on success surface). |
| `icon` | `bg-white hover:bg-[#F2F2F2] active:scale-95` | Icon-only buttons; never mixes with `size`. |

Sizes:
- `lg`: `h-11 text-lg font-semibold px-[20px] py-[6px] rounded-[35px]` — single full-width CTA at the bottom of a wizard/step/dialog.
- `md`: `text-sm font-semibold py-[10px] px-[20px] rounded-[35px]` — inline buttons in action rows (`flex gap-2`).
- No `sm` size exists. If you need a smaller action, rethink the hierarchy rather than shrinking.

Universal button micro-interactions:
- `active:scale-[0.98]` (variant buttons) or `active:scale-95` (icon) — every press visibly *presses in*.
- `transition transform duration-150` (not 200/300 — buttons feel snappy).
- `disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100` (a disabled button must NOT scale on click).
- `loading` swaps `leadingIcon` for `<Loader2 className="animate-spin" />`.

### 4.2 `Badge` — `src/components/badge.tsx`
Tiny pill `rounded-[24px] px-2 py-0.5 text-xs font-semibold`. Three variants:
`default` (white/black — unused so far), `success` (full green), `soft` (income
tint). Used for account "type" tags inside account cards.

### 4.3 `AuthInput` — `src/components/auth-input.tsx`
The form text/email/password input. `h-11 text-lg rounded-[20px] border
border-black/10` with `focus:ring-2 focus:ring-black/20 focus:scale-[1.015]
focus:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.25)]`. The slight focus scale is
the input's signature micro-interaction — **preserve it**. Never use `rounded-full` for text inputs (reserved for search/buttons).

### 4.4 `Dialog` — `src/components/dialog.tsx`
The center-screen modal. Scrim `bg-black/40 backdrop-blur-sm`. Container
`max-w-md rounded-[35px] p-6 shadow-2xl`, `dialogIn` entrance
(scale 0.96→1 over 180ms). Close on scrim click, ✕ button, or `Escape`.
Body scroll locked while open. Every other modal-style surface in the app
(add account, edit account, download PDF) is this `Dialog` + a form inside it.

### 4.5 `Sidebar` — `src/components/sidebar.tsx`
- **Desktop** (`md:flex`, w-250px): wordmark "Budgie" centered, nav items
  `rounded-[35px] px-[22px] py-[10px] gap-[15px]`, active/inactive both use
  `bg-[#F2F2F2]` (active is solid fill, inactive fills on hover). A
  `border-t border-[#F2F2F2]` divides nav from `SignOutButton`.
  **`md:sticky md:top-0 self-start`** — pins to viewport top while the content
  column scrolls (stays in flex flow, no layout break vs `absolute`/`fixed`).
  `self-start` overrides flex `align-items: stretch` so the sidebar keeps its
  `h-fit` content height instead of stretching to the content column's height.
- **Mobile** (`md:hidden`, fixed bottom): 4 tabs fill the width, icon `h-5 w-5`
  + label `text-[10px]`. Active = `text-[#00C610]`, inactive =
  `text-black/50`. **No border on the active indicator** (no pill, no
  underline) — color alone signals state. This is deliberate minimalism.

### 4.6 `AccountCard` — `src/components/account-card.tsx`
The dashboard account tile. `h-[180px] sm:h-[200px] rounded-[35px] border
border-black/10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_-10px_rgba(0,0,0,0.12)]`.
Top row: name (`text-lg sm:text-xl font-bold`) + `Badge variant="soft"` type
tag. Bottom: "Available Balance" caption (`text-xs text-black/40`) above a
masked balance (`text-xl sm:text-2xl font-bold tracking-tight`). Whole card is
a click target → opens the edit/view `Dialog`. Hover deepens the shadow
(gravity feel), no scale.

### 4.7 `BalanceSection` + `MaskedBalance` + `useBalanceVisibility`
Net worth hero on the dashboard. "Your Net Worth" label
(`text-sm text-black/50`) + eye-toggle button + amount
(`text-3xl md:text-4xl font-semibold tracking-tight`). The reveal animates
each character with staggered delay (see §1). State is a module-level store +
`useSyncExternalStore`, persisted to `localStorage` under `budgie:hideBalance`,
default **hidden**. Always wrap any balance-revealing subtree in
`<BalanceVisibilityProvider>`.
**Delta line** (`text-sm font-medium tabular-nums`): props `deltaPct: number | null`
+ `deltaAbsolute: number`. When `deltaPct !== null` → `+X.X% From last Month`.
When `deltaPct === null` (last month's base was 0, e.g. new account) →
`+Rp … this month` (absolute, via `formatRupiah`, §10 sign convention). Color
dynamic: green `text-[#00C610]` / red `text-[#D8000C]` by `deltaAbsolute` sign.
Hidden state shows `•••• From last Month`.

### 4.8 `CashflowCard` (donut) — `src/components/cashflow-card.tsx`
Pure SVG, no chart library. Optional `title` prop (default `"Today's Cashflow"`)
+ `date`/`income`/`expense` props. Two arcs (income green gradient, expense red
gradient) with a 20° gap, `-rotate-90` so 0° starts at top. `radius=64`,
rendered `w-56 h-56` (224px) for comfortable center-label clearance. Center
label: `+/- N mil` (color by sign) above the rupiah amount. Income/Expense
breakdown rows use `bg-[#F2F2F2] rounded-[20px] px-5 py-4` tiles — the
inset-tile pattern (§7) inside a card. Container:
`max-w-sm mx-auto rounded-[35px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] border border-black/5 p-6`.

### 4.8b `AssetGrowthCard` (bar chart) — `src/components/asset-growth-card.tsx`
Apple-style bar chart (pure SVG, no library). **`"use client"`** (hover state).
Props: `year`, `data` (per-month cumulative asset value), `startingValue`,
`currentTotal`, `currentMonth`, `hasTransactions`, `activeMonths` (boolean[12],
true if that month had ≥1 transaction — passed from the dashboard RSC which
computes it from `yearTxns`). Container matches CashflowCard shape
(`w-full rounded-[35px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] border border-black/10 p-6`).
- **Layout (number is hero)**: top row = label "Asset Growth" + year + YTD pill
  (`rounded-full`, tinted by sign using §3 semantic tints); hero number =
  current assets (`text-2xl font-bold tracking-tight tabular-nums`); bar chart;
  3-dot legend (Growth/Stable/Decline).
- **Bar chart**: always 12 slots (Jan–Dec), `barW=16px`, slot ≈24px, gap ≈8px.
  Recorded months (0..currentMonth): full bars colored
  by growth vs previous month — green `#00C610` (up), orange `#B25B00` (flat),
  red `#D8000C` (down). Future months: no bar, faint label (`fill-black/20`).
  Min-based Y scaling (not from 0) so growth differences are visible.
- **No-activity months** (`activeMonths[m] === false`): rendered as grey
  placeholder bars (`#E5E5E5`) with a taller min height (~12px) so they read as
  "no data" bars, not ovals. Active net-zero months still use brown "Stable".
  `rx` is capped at `renderedH/2` globally so short bars never look like
  stadiums/ovals.
- **Hover tooltip**: each recorded bar's `<g>` has `onMouseEnter`/
  `onMouseLeave`/`onClick` (tap toggles on mobile). A Budgie-styled HTML
  tooltip (`bg-white rounded-[20px] shadow border px-3 py-2`) renders above the
  bar via percentage coords, showing full month+year + `formatRupiah(value)`.
  `pointer-events-none`. Hovered bar dims to `opacity 0.85` + its month label
  darkens.
- **Empty state**: full card structure preserved (title, hero number, YTD pill
  "0% YTD"), all 12 month labels, zero bars. `TrendingUp` icon + "No
  transactions yet — your growth will appear here" caption. Card never looks
  dead.

### Dashboard Quick Insight layout
Both cards sit in a `grid grid-cols-1 md:grid-cols-2 gap-3` — stacked on
mobile, side-by-side on desktop. Cards are `w-full` (flush to their grid cell
edges, no `max-w-sm mx-auto`) so they fill the column at all breakpoints.
**Whole section is hidden for brand-new users** (`yearTxns.length === 0`):
the heading stays, but the card grid is replaced by
`<QuickInsightEmptyState>` (§7.5 "Nothing exists yet": `Sparkles` icon +
"No insight yet" + "Add a transaction…" + `success` CTA → `/transactions/add`).

### 4.9 Transactions list — `TransactionsView` + `TransactionItem`
**Read first** (`src/components/transactions-view.tsx`,
`src/components/transaction-item.tsx`). This is the canonical example of the
"rounded list item" pattern (§7) and must stay in sync with it.

Layout: search bar row (`flex sm:flex-row gap-3`) → grouped list. Each group:
uppercase day label (`text-[11px] text-black/35`, `px-3.5`) → items with
`gap-1.5` between them → `gap-3` between groups. **No `-mx-2`, no
`border-b`** — items are `rounded-2xl px-3.5 py-3.5` containers that fill
`bg-[#FAFAFA]` on hover; whitespace between them acts as the divider.

Item anatomy (current post-tweak scale):
- 40px round tinted icon `w-10 h-10 rounded-full` with the type's lucide icon `w-5 h-5`.
- Name `text-base font-medium text-black`, subtitle (bank • category) `text-sm text-black/45`.
- Amount `text-lg font-semibold tabular-nums ${typeText}`, with `+`/`-`/`` sign.
- Time `text-xs text-black/35` under the amount.
- Chevron `w-5 h-5 text-black/15 group-hover:text-black/30 hidden sm:block` — revealed only on desktop because tap → sheet on mobile.

### 4.10 `TransactionDetailSheet` — bottom sheet / centered dialog
Mobile: docked to bottom `rounded-t-[28px]` with a 36px drag handle bar;
desktop: centered `sm:rounded-[28px]`. Same scrim as `Dialog`. Entrance
`sheetIn` (12px slide-up + fade, 200ms). Sections:
- Type pill (full-strength tint, `rounded-[20px]`) + `✕` close.
- Hero block: name `text-sm text-black/40`, amount `text-3xl font-bold
  tabular-nums ${text}`, optional admin fee caption `text-xs`.
- Inset detail card (`rounded-[20px] bg-[#FAFAFA] divide-y divide-black/[0.04]`)
  with `DetailRow`s: label `text-xs text-black/40` left, value
  `text-sm text-black font-medium` right.
- Delete trigger: full-width `h-11 rounded-[35px] bg-[#FFBABA] text-[#D8000C]
  hover:bg-[#FF9A9A]` — the only place that uses the destructive fill at full
  size. Trailing `<Trash2 />`. This button does **not** delete directly; it
  opens the confirm `Dialog` (below).
- **Confirm `Dialog`** (sibling, not nested in the sheet — so scrim clicks don't
  bubble to the sheet's `onClose`): title `text-2xl font-medium` "Delete
  transaction?", body naming the txn name + signed amount +
  "will reverse its balance effect and cannot be undone", optional error
  callout (§7.6 shape), then a `flex gap-2` button row: `Button variant="softred"`
  Delete (with `loading` → spinner) + `Button variant="outline"` Cancel.
  `onOpenChange` is guarded by `loading` so the dialog can't be scrim/Escape
  closed mid-request. On success → `setConfirmOpen(false)` + sheet `onClose()` +
  `router.refresh()`. Rendered as a sibling of the sheet scrim (wrapped in a
  `<>` fragment) to avoid modal-on-modal scrim propagation.

### 4.11 `AddTransactionWizard` — 3-step flow
Immersive centered wizard (`flex items-center justify-center`, **no sidebar**).
- `TopBar`: back chevron (left, `w-9 h-9 rounded-full hover:bg-[#F2F2F2]`),
  `N of 3` (right), balanced with a spacer span (so titles stay centered).
- `ProgressBar`: 2px slim track (`h-0.5 bg-black/[0.06]`) with green fill that
  animates `width` over 300ms `ease-out`. **Not** a chunky numbered stepper —
  this is the deliberate "modern progress" replacement.
- Step 1 — type cards: full-width buttons with tinted ring when active
  (`border-[#A0FFA8] bg-[#A0FFA8]/15`), neutral `border-black/10` when not,
  each holding a `w-10 h-10 rounded-full bg-[#F2F2F2]` icon tile + label +
  desc. Active shows a trailing `<Check className="w-4 h-4" />`.
  **Transfer is disabled when `accounts.length < 2`** (`disabled:opacity-40
  disabled:cursor-not-allowed`, hover styles suppressed, desc swaps to "Add
  another account to transfer") — prevents the single-account dead-end in
  step 2 where "Transfer to" would be empty.
- **No-accounts guard** (RSC `add/page.tsx`): when `accounts.length === 0`,
  the wizard is replaced by a §7.5 "Nothing exists yet" empty state
  (`Wallet` icon + "No accounts yet" + "Create an account first…" +
  `AddAccountDialog` inline as the `success`/`lg`/`fullWidth` CTA). On account
  creation the dialog's `router.refresh()` re-runs the RSC fetch → the wizard
  renders automatically. `AddAccountDialog` accepts optional
  `triggerVariant`/`triggerSize`/`triggerFullWidth`/`triggerLabel` props
  (default to `soft`/`md`/`false`/"Add Account" — dashboard usage unchanged).
- Step 2 — amount hero at top (currency prefix + `dynamicFontSize`-scaled
  input via `formatBalanceInput`, `text-gray-400 font-semibold`, centered,
  `max-w-[240px]`) + an inset "card" of rows (`Card`/`CardRow` with
  `divide-y divide-black/[0.04]`, label `w-20 text-xs text-black/40`, inline
  input/select right-aligned). Inline inputs are borderless (`bg-transparent`).
- Step 3 — review: same hero amount + an inset review card (read-only rows)
  + optional error + the Confirm CTA.
- Single full-width CTA per step (`size="lg"`), label flips to "Confirm and
  Add" on the last step with a trailing `<Check />`.

### 4.12 `DownloadPdfDialog`
A `Dialog` containing option rows (radio-card pattern, `rounded-[20px]
border-black/10` with `bg-[#F2F2F2]` active border `border-black/30`). Active
option shows a filled radio dot. "Date range" expands two side-by-side date
inputs. Buttons: `soft` Cancel + `primary` Download PDF (full-width primary).
PDF generation is **client-side** `jspdf` + `jspdf-autotable`; the exported
file is monochrome (black header, alternating `#F5F5F5` rows) by design.

---

## 5. Type Scale (in use)

| Class | Where |
| --- | --- |
| `text-6xl`–`text-3xl` | `dynamicFontSize()` for the amount hero in the wizard/edit-account — scales DOWN as digits grow (`text-6xl` ≤7 chars → `text-3xl` >14). |
| `text-4xl md:text-3xl` | Sign-in H1, page H1 (Transactions, Budget, Chat, Add Transaction). |
| `text-3xl` | Net worth amount (`md:text-4xl`), detail-sheet hero amount, account-card masked balance (`sm:text-2xl`). |
| `text-2xl` | Form dialog titles ("Add Account", "Download PDF", "Edit Account"), active account name in edit dialog. |
| `text-xl sm:text-xl` | "Your Accounts" section header, account-card name, donut "Today's Cashflow". |
| `text-lg` | Transaction item amount (post-tweak), `AuthInput` text, donut breakdown row amounts, donut center "N mil". |
| `text-base` | Transaction item name (post-tweak). |
| `text-sm` | Default body, sidebar labels, button-md label, subtitle text, `MaskedBalance` alt, "Available Balance", wizard hero name. |
| `text-xs` | Captions, field labels ("Name", "Type"), detail row labels, wizard `CardRow` labels, "Available Balance", error text, mobile nav labels. |
| `text-[11px]` | Group day headers in the transactions list (`uppercase tracking-wide text-black/35`), account-card "Available Balance" caption was upgraded to `text-xs`; this token survives only where the label needs to whisper. |
| `text-[10px]` | Mobile bottom-nav tab labels (`leading-none`). |

Weights lean on `font-medium` / `font-semibold` / `font-bold`. Body is regular.
**Never use `font-light` or `font-thin`** — they read as broken on small
screens. `tracking-tight` on big display numbers (balances, amount heroes, page
H1s) tightens the kerning for visual weight.

---

## 6. Radius System

Budgie's radii are aggressive and consistent. Don't mix modest `rounded-md`
with the system or screens will feel off.

| Radius | Class | Used for |
| --- | --- | --- |
| Extra full | `rounded-full` (`9999px`) | Icon tiles, avatars, round close buttons, the search input's pill outline, sidebar top tabs. |
| Hero button | `rounded-[35px]` | All `Button` sizes, sidebar nav items. |
| Card / dialog | `rounded-[35px]`, `rounded-[28px]` | Card containers, `Dialog`, bottom sheet — `35` for cards/buttons, `28` for sheets/dialogs is the established split. |
| Tile / row | `rounded-[20px]` | Cashflow breakdown tiles, wizard type cards, option rows in PDF dialog, date inputs, selects, `AuthInput`. |
| List item | `rounded-2xl` (16px) | **Transaction list rows** — the deliberate list scale. Smaller than the 20px tiles because rows pack tighter and need to feel like list rows, not cards. |
| Pill | `rounded-[24px]`, `rounded-[20px]` | Badge (`24`), type pill in detail sheet (`20`). |
| Track | none / `rounded-full` | Sidebar progress bar (rectangular), donut bar fills (`rounded-full` via `strokeLinecap`). |

> **Adding a new container?** Pick from the system: list row → `rounded-2xl`;
> tile/option/inline form control → `rounded-[20px]`; sheet/dialog →
> `rounded-[28px]`; card → `rounded-[35px]`. If it's a chip/avatar →
> `rounded-full`. There is no `rounded-md/lg/xl` in this app — don't introduce one.

---

## 7. Layout Patterns

### 7.1 Authenticated page shell

The shared shell is a `PageShell` component (`src/components/page-shell.tsx`,
`"use client"`). Every signed-in screen (except the add-transaction wizard and
auth screens) renders:

```
<PageShell>
  <AccountTab userName={...} />
  {/* page content — no <main>/<Sidebar> boilerplate */}
</PageShell>
```

Under the hood it renders:
```
<main className="w-full max-w-screen-2xl mx-auto min-h-screen flex flex-col md:flex-row bg-white text-black">
  <Sidebar />
  <div className="flex-1 min-h-screen py-6 md:py-10 px-4 sm:px-8 md:px-12 lg:px-20 pb-20 md:pb-10">
    {children}
  </div>
</main>
```
- `max-w-screen-2xl mx-auto` (≈1536px) caps the entire layout (sidebar + content) on
  ultrawide screens so lines don't stretch too far. The layout is horizontally
  centered via `mx-auto`.
- Mobile reserves `pb-20` so the fixed bottom nav never covers content.
- `AccountTab` sits top-right of the content column. On mobile, only the
  avatar circle renders (name hidden `hidden sm:block`) to save horizontal
  space; "Get Budgie Plus" stays visible because it's the conversion surface.

### 7.2 The rounded list item pattern
Applies to any tappable row in a vertical list (transactions, search results,
budget rows, future settings rows). Rules:

1. **Container** is `rounded-2xl` (or `rounded-[20px]` for slightly chunkier
   rows like wizard type cards / PDF options). NEVER a flat `border-b` divider
   between rounded items — use `gap-1.5`–`gap-2` between items instead.
2. **Hover** fills the row with a near-invisible tint (`bg-[#FAFAFA]` for
   lists, `bg-[#F2F2F2]` for stronger affordances like sidebar items). The
   fill is clipped to the rounded shape, so the hover itself reads as "the
   row is a button". No underline, no shadow on hover.
3. **Press** is `active:scale-[0.98]`. Tiny, consistent.
4. **Left slot** is a `w-9/10` round tinted icon. The icon's tint carries
   semantic meaning (type/category). If a row has no semantic type, reuse the
   neutral `bg-[#F2F2F2] text-black/60` icon tile (see wizard option rows).
5. **Body** is `flex-1 min-w-0` with `truncate` on any line that can overflow
   (names, subtitles).
6. **Right slot** carries the key number/value, right-aligned,
   `tabular-nums`, semibold, in the semantic color when applicable.
7. **Disclosure** (chevron) optional, `hidden sm:block` — mobile uses tap
   to open a sheet, so the chevron would be noise on small screens.

### 7.3 The inset card pattern (multi-row stacked lists inside a surface)
Used inside the transaction detail sheet and the wizard's step 2/3. A flat
`divide-y divide-black/[0.04]` container (no outer border) where each row is
`flex items-center gap-3 px-4 py-3`. Left label is fixed-width
(`w-20 text-xs text-black/40`), right value is `flex-1`/`text-right`. The
hairline divider is the inset's only separator — the parent surface supplies
the visual boundary. Add a `last` row with slightly larger `py-3.5` bottom
padding so the inset doesn't feel cramped.

### 7.4 The hero amount pattern
Two contexts share this pattern: the edit/add-account balance field, and the
wizard step 2 amount field. Container is centered (`flex items-center
justify-center gap-2`). Currency prefix is gray (`text-gray-400 font-semibold`)
at the SAME dynamic size as the value (so they line up). Value uses
`bg-transparent text-center tabular-nums` and accepts raw digits only —
format via `formatBalanceInput` which groups with `id-ID` and preserves a
leading `-`. `dynamicFontSize(text)` picks the size class by digit count so
the hero stays on one line.

### 7.5 Empty states
Two flavors, both centered (`flex flex-col items-center text-center py-20`):
- **"Nothing exists yet"** — large `w-12 h-12 rounded-full bg-[#F2F2F2]` icon
  circle with a `w-7 h-7` lucide icon in `text-black/30`. Title
  `text-base font-semibold`, desc `text-sm text-black/40 max-w-xs`. **Always
  include a primary CTA** (the success button) when the user can create the
  first item. See "No transactions yet".
- **"No results"** — same shell but **no CTA** (the empty state is a
  consequence of a filter), smaller icon (`w-6 h-6`), desc adapts to context
  (`"Nothing matches "...". Try a different keyword."`). See "No transactions
  found".

### 7.6 Error / callout pattern
Single shared shape across all forms / sheets / dialogs:
```
<p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-[20px] px-4 py-2.5">
  <AlertCircle className="w-4 h-4 shrink-0" />
  {message}
</p>
```
Inside the green sign-in screen, swap the colors for the white-on-translucent
scrim variant (§3) so it reads against the saturated background.

---

## 8. Motion

| Element | Animation | Duration / easing |
| --- | --- | --- |
| Button press | `active:scale-[0.98]` | `transform duration-150` |
| Input focus | `focus:scale-[1.015]` + focus ring + focus shadow | `transition-all duration-200 ease-out` |
| Sidebar nav | `active:scale-[0.98]` only; hover is color/fill | `transition` |
| Mobile bottom nav tap | `active:scale-95` | `transition` |
| Dialog open | scale 0.96→1, opacity 0→1 | `0.18s ease-out` (`@keyframes dialogIn`) |
| Sheet open | translateY 12px→0, opacity 0→1 | `0.2s ease-out` (`@keyframes sheetIn`) |
| Balance reveal | per-char `translateY(0.5em)+blur(8px)→0`, staggered | `0.3s cubic-bezier(0.22,1,0.36,1)`, 28ms stagger, capped 260ms (`@keyframes balanceReveal`) |
| Eye flip | `rotateY(90deg)→0` with a small overshoot (`-8deg @1.08`) at 60% | `0.25s ease-out` (`@keyframes eyeFlip`) |
| Wizard progress | bar `width` grows | `300ms ease-out` |
| Budget card hover | shadow deepens (`0_4px_24px_-8px_*`→`0_8px_32px_-10px_*`) — NO scale | `transform duration-200` |

Motion rules:
- **No bounce, no overshoot** except the eye icon's intentional 8°/-8° flip
  flourish (it sells the privacy/confidence toggle). Everything else lands flat.
- **`motion-reduce:animate-none`** on every keyframe-based animation
  (`balanceReveal`, `eyeFlip`). Required for accessibility.
- **`suppressHydrationWarning`** anywhere SSR-rendered text depends on client
  state (the masked balance does this).
- Keep `transform duration` prose terse: `transform duration-150` /
  `duration-200`. Don't reach for `300`+ unless it's a deliberately slow reveal.

---

## 9. Auth Screen — Special Case

The only saturated, non-neutral screen.
- Full-bleed `bg-[#CE0E11]` (currently `#00CE11`).
- Card constrains to `w-82` (330px) for an intimate "card in the void" feel.
- All chrome is white-on-green: outline buttons (white bg, black text) for
  social sign-in, white/30 dividers, white/80 helper copy, primary `Button`
  (black bg, white text) for the submit.
- Error pill uses `bg-white/15 border-white/25 backdrop-blur-sm` instead of
  the red palette so the error sits on the green surface without screaming.
- Toggle between sign-in/sign-up is a plain underline button
  (`underline underline-offset-2`). No segmented control.

> When adding auth surfaces (forgot password, 2FA, OAuth callback), keep this
> same saturated-green shell and white-on-tint chrome. The rest of the app is
> purposefully muted so this entry point feels distinct.

---

## 10. Formatting Conventions

All monetary/date formatting lives in `src/lib/format.ts`. **Never** use
`Number.toLocaleString` or `Date.toString` directly in components — call these
helpers so locale and formatting stay consistent app-wide.

| Helper | Output | Used for |
| --- | --- | --- |
| `formatRupiah(n)` | `"Rp 1.234.567,00"` (`id-ID` grouping, 2 decimals) | Amounts in lists, sheets, cards, PDF. |
| `formatBalanceInput(raw)` | Strips non-digits, `id-ID` grouping, keeps leading `-` | Hero amount inputs. |
| `formatDate(d)` | `"14 Jul 2026"` (`en-GB` short, D MMM YYYY) | Date group headers, detail rows, PDF. |
| `formatTime(d)` | `"2:30 pm"` (`en-US` hour12, lowercased) | Transaction list time, detail Time row. |
| `formatDateTimeLocalValue(d)` | `"2026-07-14T14:30"` | Default value for `<input type="datetime-local">`. |
| `dynamicFontSize(text)` | Tailwind class (`text-6xl`→`text-3xl`) | Hero amount inputs — scale down as length grows. |

Sign convention: income `+`, expense `-`, transfer ``(empty). The sign is part
of the colored amount string, rendered in the same semantic text color as the
value (`+` green, `-` red).

---

## 11. Accessibility & Hydration

- **Interactive targets**: minimum `40px` height (`h-11` = 44px on buttons/inputs;
  `w-9 h-9`–`w-10 h-10` round icon buttons reach the threshold via visual + the
  wider hit padding of their parent flex row). The wizard back chevron is
  `w-9 h-9` (36px) — tolerated because the surrounding `py-4` padding expands
  the actual hit area; do not shrink icon targets further.
- **Focus**: visible `ring-2 ring-black/20` on inputs. The slight focus scale
  (`focus:scale-[1.015]`) doubles as a focus affordance for mouse users.
- **Reduced motion**: every loop/keyframe animation is gated by
  `motion-reduce:animate-none`. Do not add un-gated entrance animations.
- **SSR-safe stores**: any client-only state with a persisted default
  (`localStorage`) must (a) read inside an `typeof window !== "undefined"`
  guard, (b) expose `getServerSnapshot` returning the SSR-safe default, and
  (c) render with `suppressHydrationWarning` so the first paint matches the
  server. The balance-visibility store is the canonical example — clone its
  shape if you add another.
- **Color contrast**: the soft tints (`#A0FFA8` bg with `#1F9B29` text, etc.)
  pass WCAG AA for the text sizes used here. Don't lighten the text hex below
  `#1F9B29` / `#D8000C` / `#B25B00` or you'll break contrast on the soft
  backgrounds.
- **Auth**: every page calls `auth.api.getSession({ headers: await headers() })`
  and `redirect("/sign-in")` when absent — keep this guard on any new page.

---

## 12. Adding New UI — Checklist

When introducing a new screen, dialog, list, or component, run through this:

1. **Shell**: start from the authenticated page shell (§7.1) unless it's an
   auth surface (§9) or an immersive flow like the add wizard (no sidebar,
   centered `max-w-md`).
2. **Primary action**: there should be exactly one `variant="success"` CTA on
   the surface. Secondary actions are `outline` or `soft`/`softred`.
3. **List rows**: use §7.2 — rounded `rounded-2xl`, gap (not borders), tint
   fill hover, `active:scale-[0.98]`.
4. **Stacked rows inside a card**: use §7.3 — `divide-y divide-black/[0.04]`,
   fixed-width label / right-aligned value.
5. **Hero amount**: use §7.4 — `dynamicFontSize` + `formatBalanceInput` +
   `tabular-nums` + gray currency prefix.
6. **Empty state**: §7.5 — with CTA when the user can create; without when
   it's a filter consequence.
7. **Errors**: §7.6 — the pill shape is identical everywhere.
8. **Motion**: ≤300ms, `ease-out`, no bounce, gated by `motion-reduce`.
9. **Colors**: only from §3. Reuse transaction tints for any semantic
   positive/negative/movement context. Do not introduce a new hue.
10. **Numbers**: always `tabular-nums`. Money via `formatRupiah`. Digits-only
    input via `formatBalanceInput`.
11. **Radii**: from the §6 system. No `rounded-md/lg/xl`.
12. **Verify**: `bun run lint && bun run typecheck`. After a visual change,
    eyeball the desktop and a ~375px mobile viewport — Budgie is
    mobile-first; a cramped mobile layout is a regression.

---

## 13. Where to look in the code

| Want to understand | Read |
| --- | --- |
| The button system | `src/components/button.tsx` |
| The input system + focus micro-interaction | `src/components/auth-input.tsx` |
| The modal pattern | `src/components/dialog.tsx` |
| The rounded list row pattern (canonical) | `src/components/transactions-view.tsx`, `src/components/transaction-item.tsx`, `src/components/budgets-list.tsx`, `src/components/subscription-list.tsx` |
| The inset card / stacked rows | `src/components/add-transaction-wizard.tsx` (`Card`/`CardRow`/`ReviewRow`), `src/components/transaction-detail-sheet.tsx` (`DetailRow`), `src/components/budget-detail-sheet.tsx`, `src/components/subscription-detail-sheet.tsx` |
| The hero amount input | `src/components/add-account-dialog.tsx`, `src/components/add-transaction-wizard.tsx` step 2, `src/components/add-budget-dialog.tsx` step 2, `src/components/add-subscription-dialog.tsx`, `src/lib/font-size.ts` |
| The privacy/balance reveal | `src/components/balance-visibility.tsx`, `src/components/balance-section.tsx`, `src/app/globals.css` (`@keyframes balanceReveal`, `eyeFlip`) |
| The authenticated page shell | `src/components/page-shell.tsx` (Sidebar + max-w-screen-2xl content wrapper) |
| The visual page shells | `src/app/dashboard/page.tsx`, `src/app/transactions/page.tsx`, `src/app/budget/page.tsx`, `src/app/sign-in/sign-in-form.tsx` |
| Donut / data visualization | `src/components/cashflow-card.tsx` |
| Bar chart / asset growth + hover tooltip | `src/components/asset-growth-card.tsx` |
| Horizontal bar chart / spending streams | `src/components/spending-streams-chart.tsx` |
| Summary cards with progress bars | `src/components/budget-summary-cards.tsx` |
| 3-step wizard in a Dialog (budgets) | `src/components/add-budget-dialog.tsx` |
| Single-dialog form (subscriptions) | `src/components/add-subscription-dialog.tsx` |
| Bottom sheet + confirm dialog (budget/subscription) | `src/components/budget-detail-sheet.tsx`, `src/components/subscription-detail-sheet.tsx` |
| Empty state with CTA (dashboard + wizard + budgets + subscriptions) | `src/components/quick-insight-empty-state.tsx`, `src/app/transactions/add/page.tsx`, `src/components/budgets-list.tsx`, `src/components/subscription-list.tsx` |
| Delete confirm dialog (modal-on-sheet) | `src/components/transaction-detail-sheet.tsx`, `src/components/budget-detail-sheet.tsx`, `src/components/subscription-detail-sheet.tsx` |
| Premade categories | `src/lib/categories.ts` |
| Category → icon element helper | `src/lib/category-icon.tsx` (`categoryIcon(category, className)` → `ReactElement`, NOT a component type) |
| Budget/subscription period helpers | `src/lib/budget.ts` (`periodLabel`, `periodStartDate`, `nextBillingDate`, `startOfToday`, `startOfMonth`) |
| Semantic type tints | `TYPE_META` in `transaction-item.tsx` and `transaction-detail-sheet.tsx`, `TYPES`/`AMOUNT_TYPE_TEXT` in `add-transaction-wizard.tsx`; budget/subscription tints in `budgets-list.tsx` / `subscription-list.tsx` (expense red / transfer orange) |
| Formatting helpers | `src/lib/format.ts`, `src/lib/font-size.ts` |

---

## 14. Budgets UI — Special Patterns

The budgets page (`src/app/budget/page.tsx`, RSC) introduces a few patterns not
seen elsewhere in the app. Read this before extending the budget/subscription
surfaces.

### 14.1 Summary cards with progress bars (`BudgetSummaryCards`)
Two `rounded-[35px]` cards in a `grid grid-cols-1 sm:grid-cols-2 gap-3`. Each
card: label (`text-sm font-semibold text-black/50`) + caption (month/date,
`text-xs text-black/30`) + hero `formatRupiah(total)` (`text-2xl font-bold
tracking-tight tabular-nums`) + "remaining"/"over budget" caption (`text-xs
text-black/40 tabular-nums`) + progress track (`h-2 w-full bg-black/[0.06]
rounded-full overflow-hidden`) with fill (`h-full rounded-full transition-all
duration-300`, green `bg-[#00C610]` under budget / red `bg-[#D8000C]` over) +
"spent" footnote (`text-[11px] text-black/35 tabular-nums`). Empty state when
`total === 0`: "No monthly/daily budget yet" + helper text — **no CTA here**
(the CTA lives in the list section below).

### 14.2 Horizontal bar chart (`SpendingStreamsChart`)
**`"use client"`** (hover state). Pure HTML/CSS — no SVG, no chart library. One
row per expense category with spend this month, sorted desc. Each row is a
`flex items-center gap-3`:
- 24-char category label (`w-24 shrink-0 text-xs truncate`, darkens on hover).
- `flex-1 h-3 bg-black/[0.04] rounded-full` track with a fill div whose width
  is `(spent / chartMax) * 100%` (min 1.5% so tiny bars are visible). Fill color:
  `bg-[#FFBABA]` under budget, `bg-[#D8000C]` over.
- **Budget limit marker**: a `w-0.5 h-4 bg-black/40 rounded-full` absolute div
  positioned at `(budget / chartMax) * 100%` (capped at 99.5%). Only rendered
  if a budget exists for that category. This is the canonical "budget tick"
  pattern — reuse it for any "actual vs limit" bar.
- Right-aligned `formatRupiah(spent)` (`w-24 shrink-0 text-right text-xs
  font-semibold tabular-nums`).

Hover/tap tooltip: absolute `bg-white rounded-[20px] shadow border border-black/5
px-3 py-2` above the row, showing category + spent + budget + remaining/over.
`pointer-events-none`. Tap toggles on mobile (same `setHovered(prev === cat ?
null : cat)` pattern as `AssetGrowthCard`). Legend at the bottom: Spent
(`#FFBABA` dot) / Over budget (`#D8000C` dot) / Budget limit (black tick). Empty
state: `TrendingUp` icon + "No spending this month yet".

> **Why horizontal bars (not vertical like `AssetGrowthCard`)?** Category labels
> are long ("Food & Drink", "Entertainment") — horizontal rows give them room
> without rotation. Vertical bars work for `AssetGrowthCard` because month
> labels are 3 chars ("Jan", "Feb"). Pick the chart orientation by label width.

### 14.3 3-step wizard inside a `Dialog` (`AddBudgetDialog`)
The add-transaction wizard is an immersive full-page flow (no sidebar). The
add-budget wizard is the **same step pattern compressed into a `Dialog`**:
- Slim 2px progress track (`h-0.5 w-full bg-black/[0.06]` with `bg-[#00C610]`
  fill, `transition-all duration-300 ease-out`, width = `(step/3)*100%`) —
  identical to `AddTransactionWizard`'s `ProgressBar`.
- Step 1: period cards (`rounded-[20px] border` with `border-[#A0FFA8]
  bg-[#A0FFA8]/15` active ring + trailing `<Check>`, neutral `border-black/10`
  otherwise). Custom period reveals a days input.
- Step 2: category `<select>` (filtered to exclude `usedCategories`) + hero
  amount (`dynamicFontSize` + `formatBalanceInput` + gray `IDR` prefix, same
  as `add-account-dialog`).
- Step 3: review rows (`bg-[#FAFAFA] divide-y divide-black/[0.04]` inset card)
  + "Confirm and Add" CTA with trailing `<Check>`.
- CTA row: `success` Continue + `outline` Back/Cancel. `loading` swaps the
  leading icon for a spinner.

> **When to use a Dialog-wizard vs. a page-wizard**: Dialog-wizards are for
> quick multi-step forms that don't need the full viewport (budgets,
> subscriptions, future settings). Page-wizards are for flows where focus
> matters and the user shouldn't see the rest of the app (add transaction —
> money is sensitive, and step 2's hero amount wants the whole width).

### 14.4 Single-dialog form (`AddSubscriptionDialog`)
Subscriptions are simpler than budgets (no period-card step — just a `<select>`
with 3 billing cycles). This is a **single `Dialog` form**, not a wizard:
fields stack vertically with `gap-3`, then a `flex gap-2` button row (`success`
Add + `outline` Cancel). Use this pattern when a resource has ≤5 fields and no
branching logic. If a future resource needs >5 fields or conditional steps,
upgrade to the Dialog-wizard (§14.3) or page-wizard.

### 14.5 Subscriptions reuse the transfer-orange tint
Subscriptions are recurring outflows — semantically "money moving out on a
schedule." They reuse the **transfer orange** tint (`bg-[#FFD9A0]/40
text-[#B25B00]`) for their icon tiles and detail pill, rather than the expense
red. This keeps the 3-tint system (income green / expense red / transfer
orange) intact without introducing a 4th hue (§3 anti-pattern). Budgets, by
contrast, use the **expense red** tint (`bg-[#FFBABA]/40 text-[#D8000C]`)
because they're category-level spending limits — directly expense-oriented.

### 14.6 Category icon helper (`categoryIcon`)
`src/lib/category-icon.tsx` exports `categoryIcon(category, className)` which
returns a **`ReactElement`** (a lucide icon per `Category` enum value). **It
must return an element, not a component type/class** — returning a component
type and rendering `<Icon className=... />` at the call site triggers
`react-hooks/static-components` lint errors (the linter sees a component
created during another component's render). The correct usage:
```tsx
{categoryIcon(b.category, "w-5 h-5")}
```
NOT:
```tsx
const Icon = categoryIcon(b.category);  // ❌ returns a type, lint error
<Icon className="w-5 h-5" />
```
This applies to any helper that maps data → icon.

---

## 15. Tone Summary (5 sentences for the next agent)

Budgie is a calm, minimal fintech UI built on white surfaces, one brand green,
and three semantic pastel tints (income green / expense red / transfer
orange). Typography is small and quiet so money can be the hero; big numbers
use `dynamicFontSize`, `tracking-tight`, and `tabular-nums`. Radii are
aggressive (`rounded-2xl` for list rows, `rounded-[20px]` for tiles, `rounded-35px`
for cards/buttons, `rounded-full` for icon tiles) and never stray into
`rounded-md/lg/xl`. Motion is short (≤300ms), ease-out, never bounces, always
honors `motion-reduce`, and the only signature flourish is the per-character
balance reveal. When in doubt: fewer borders, more whitespace, one primary
CTA per surface, and reuse the existing tints before inventing new colors.