## 16. Landing Page — Marketing Surface (public `/`)

`src/app/page.tsx` → `<LandingPage/>` (`src/components/landing/`) is Budgie's
**public marketing surface**, rebuilt to mirror **notion.com's homepage anatomy
1:1** (the saved reference lives in `ui/` at the repo root — Notion's actual
`/` page). It sits **outside** the auth-gated app: a React Server Component —
no auth data beyond the session flag, no Prisma, no Hono — with a calmer
visual register than the dense app screens. Read this section before touching
anything under `src/components/landing/`.

### Visual register vs the auth-gated app

| Surface | Tone | Radii | Hero type |
| --- | --- | --- | --- |
| Auth-gated app (`/dashboard` …) | Calm minimal fintech, dense data | `rounded-2xl` rows, `rounded-[20px]` tiles, `rounded-[35px]` cards | Tabular nums, `dynamicFontSize` |
| Landing page (`/`) | Notion-calmed product marketing, airy | `rounded-[35px]` ledger panel, `rounded-[20px]` bento tiles + link tiles, Budgie `rounded-[35px]` CTAs | Fluid `clamp(2.625rem, 11.25vw - 25.5px, 6rem)` headline |

The landing runs on white + `#F9F9F8` gray surfaces with **one brand green
`#00C610`** for CTAs and pricing accents; the semantic pastel tints
(income/expense/transfer) appear only inside the real app components shown in
the bento previews. Section rhythm is `py-20 sm:py-28` inside
`max-w-screen-xl px-5 sm:px-8`.

### Page anatomy (Notion's exact order)

1. **Nav** (`landing-nav.tsx`) — app-icon mark (`/android-chrome-192x192.png`
   via `next/image`, 28px, decorative `alt=""` so the link name stays
   "Budgie") + wordmark, anchor links (Use cases / Features / Pricing / FAQ),
   then Budgie's green-pill CTAs (Sign in / Get started; Dashboard when
   authed). Translucent white + hairline after scroll. **No dropdowns, no
   mega-menus** — Budgie has no sub-pages.
2. **Hero** — center column: mascot → headline → mono deck → CTAs →
   demo video.
   - **Mascot** (`budgie-mascot.tsx`) — Notion's mascot language (Roman
     Muradov's ink faces: wobbly monoline strokes, dot eyes, short brows, a
     hooked nose, one flat fill) drawn for Budgie: a round-glasses character
     in the income-green shirt, 104px tall (124px on `sm`). **Original
     artwork — no third-party illustration SVGs, no icon pile.** The only
     motion is a 6s blink, `motion-safe` only (reduced motion keeps the eyes
     still).
   - **Headline** (`hero-headline.tsx`) — Notion's exact fluid type:
     `font-semibold`, `clamp(2.625rem, 11.25vw - 25.5px, 6rem)`, line-height
     `clamp(3rem, 10.83vw - 17px, 6.25rem)`, tracking
     `clamp(-0.2875rem, -0.6458vw + 2.375px, -0.09375rem)`. Two mask-reveal
     lines: "Where your money" / `{HeroPill}`.
   - **Rotating pill** (`hero-pill.tsx`, `"use client"`) — Notion's
     `productPillAnimation`: pastel rounded-rect capsule + saturated square
     dot, verb cycles **works → grows → rests → flows → stays** every 2.2s
     with the label's inline-size animating to hug each word (offscreen
     measurer spans, Notion's `--pill-label-inline-size`). Colors are Notion's
     own pastel pairs (green/teal/purple/blue/orange 200-bg + 500-dot).
     All sizes are **em-based** so the pill scales with the fluid H1. Static
     first word under `prefers-reduced-motion`.
   - **Deck** — mono font (`font-[family-name:var(--font-geist-mono)]`,
     Notion's iA-Writer-Mono analog), `text-lg leading-[28px]`, `text-black/60`.
   - **CTAs** — Budgie green pill ("Get started for free" → `/sign-in`) +
     white outline pill ("See what Budgie can do" → `/#features`).
   - **Video** (`hero-media.tsx`) — `AutoVideo` in a `max-w-[960px]`
     hairline-bordered 8px-radius frame (`aspect-square` mobile,
     `sm:aspect-[1.6]`), 32px round play/pause controller bottom-left
     (`bg-black/10 backdrop-blur`), controller hidden under reduced motion.
3. **Bento** (`bento.tsx`, `#features`) — "Where your money lives." Heading
   left, one-line deck bottom-aligned right on `lg`. Then an asymmetric
   `lg:grid-cols-5`: the focal **ledger panel** (`LiveFeed`, `lg:col-span-3`)
   on a white `rounded-[35px]` surface with hairline border + soft shadow —
   the app's own card language — beside a `lg:col-span-2` rail stacking the
   **search panel** (`FindCard`) over the **budget panel** (`LiveSpending`),
   both quiet `bg-[#F9F9F8]` `rounded-[20px]` tiles. **No eyebrows, no card
   titles, no uppercase "LIVE" badges, no legends, no trailing result
   counters, no hover tooltips** — the real Budgie UI is the content, and the
   section deck carries the words. The ledger lists hairline-divided rows (`LedgerRow` —
   the app's transaction row one step quieter: 32px tinted tile, 15px type,
   no hover background, no chevron) and slides one row in per tick. All three
   tiles share one anatomy — **caption row** (13px `text-black/40` left,
   `text-xs text-black/35` right), live body, **hairline summary footer** —
   so they read as one system: ledger "Today / Updating live" → "Net today"
   (income minus expenses of the visible window, transfers excluded); search
   "All transactions / Filters as you type" → "Showing 3 of 4"; budgets
   "Spent in December / total" → "Left to spend". The budget bars measure
   each category against its own budget (the track *is* the limit, so no
   marker or legend is needed) and grow via the 200ms width transition. Media
   sits directly on the panel surface at natural height — never a
   fixed-aspect box, never card-in-card. The old card eyebrows ("Capture every rupiah" / "Find
   answers" / "Automate busywork") and 22px card titles were removed as
   AI-slop chrome and must not return.
4. **Use cases** (`use-cases.tsx`, `#use-cases`) — "See what Budgie can do":
   five compact `rounded-[20px]` bordered link cards (tinted icon tile +
   bold title, no arrows) → `/sign-in`.
5. **Pricing** (`pricing.tsx`, `#pricing`) — Budgie's own card language:
   `rounded-[35px]`, Free tier + Plus tier with green border/highlight. No
   pulse animations.
6. **FAQ** (`faq.tsx`, `#faq`) — `details` accordions, `rounded-[28px]`.
7. **Facts marquee** (`facts-marquee.tsx`) — Notion's `statsMarquee` anatomy
   (single infinite row, `marquee` keyframe, warm-gray `#615d59` text) filled
   with **true, verifiable product facts** (21 categories, QRIS, Rp-first
   formatting, 12-month history, PDF exports, hidden balances). Notion's
   invented-stats slot is used honestly — no fake "users/countries" numbers.
8. **Endcap** — "Get started today." on a **neutral `bg-[#F2F2F2]`
   full-bleed section** (Notion's `surfaceNeutral`, NOT a saturated green
   block) with `py-24 sm:py-36`, the green pill ("Get Budgie free") + outline
   secondary.
9. **Footer** (`footer.tsx`) — Notion's anatomy trimmed to **real links
   only**: app-icon mark (32px) + wordmark + one-liner + ©, then Product (`/#features`, `/#use-cases`,
   `/#pricing`, `/#faq`) and Get started (`/sign-in` ×2). No fake columns, no
   language selector, no cookie settings.

### `AutoVideo` — the only `<video>` (canonical video spec)

`src/components/landing/auto-video.tsx` is the sole `<video>` in the repo (a
`"use client"` component): `muted` + `loop` + `playsInline`, a poster tint that
fades out once the media can play, and a tasteful play glyph. It does **not**
autoplay under `prefers-reduced-motion: reduce` (the poster stays — the text
carries the message). Always render `<video>` through `AutoVideo`; never
hand-roll a second video primitive. Canonical specs (`public/videos/`
drop-in):

| File | Role | Spec |
| --- | --- | --- |
| `brand.mp4` + `brand.webm` | Hero demo walkthrough | 16:9 (played at 1.6 in the hero frame), 1920×1080, ~60s, silent, loopable, < 8MB |

List `.mp4` first, `.webm` second — the mp4 is the asset that always exists
(the hosted `BudgieDemo` Vercel-Blob clip, or a local `brand.mp4`), so listing
the optional `.webm` first used to fire a 404 on every landing visit. The
hosted `BudgieDemo` mp4 URL is the same clip embedded in `README.md`'s demo
`<video>` — keep the landing `AutoVideo` and the README demo in sync.

### Motion (ties to §8)

All landing motion is ≤300ms, `ease-out`, never bounces, always honors
`motion-reduce`:

- `Reveal` (`reveal.tsx`) — the **only** landing motion primitive:
  `IntersectionObserver` fade + small translate on enter; renders final state
  immediately under reduced motion.
- `FactsMarquee` — `marquee` keyframe (defined in `globals.css`),
  `motion-reduce:animate-none`.
- `HeroPill` rotation — 2.2s interval; the label swap is a 200ms keyframe
  (`heroPillWord`) gated by `motion-reduce`; the interval never starts under
  reduced motion.
- `HeroHeadline` — `headlineReveal` line-mask, 300ms ease-out, 80ms stagger,
  `motion-reduce:animate-none`.
- **Smooth scroll** — native `html { scroll-behavior: smooth }` via a
  `<style>` tag in `LandingPageView` (media-gated to
  `prefers-reduced-motion: no-preference`). Anchored sections carry
  `scroll-mt-24` so they clear the sticky nav. **No Lenis.**

Keyframe names stay namespaced (`headlineReveal`, `heroPillWord`, `marquee`)
and are defined in the component that uses them (or `globals.css` for the
shared `marquee`), following the `dialogIn`/`sheetIn` pattern.

### What was deliberately removed (the anti-slop list)

The landing used to carry classic AI-generated-page chrome; all of it is gone
and must not return: floating icon chips around the hero, a tilt/parallax
"live" transaction card, magnetic CTAs, scroll-progress bars, Lenis smooth
scroll, pulsing pricing badges, fake bank "trusted by" logo walls, invented
testimonials (Dimas P., Sari W.), card eyebrows stacked above every preview,
uppercase "LIVE" badges, trailing match counters ("3 of 3 most recent" adrift
under a list — a count belongs in the tile's summary footer, ledger-style),
chart legends and tooltips, and footer links that pointed at `#`.
Budgie does not fake social proof: the only marquee carries true product
facts, and every footer/nav link resolves to a real page or section.

### Testability split

`landing/index.tsx` exports **two** components:
- `LandingPage` — the **async RSC** (fetches the session via
  `auth.api.getSession` + `headers()`), delegating to the view below. It is
  NOT rendered in tests (jsdom can't await async RSC — same rule as
  `AccountTab`).
- `LandingPageView` — the **sync presentational** half, props
  `{ session: boolean }`. This is what `tests/components/landing/index.test.tsx`
  exercises: full page
  composition, CTA copy, section headings, session-conditional nav. When
  editing landing copy, update `tests/components/landing/index.test.tsx` in the
  same change.

### Reuse rules
- Reuse the §2 color tokens and §6 radius system — **do not invent new
  colors** (the pill's six pastel pairs are the one sanctioned exception:
  they are Notion's own tokens, documented in `hero-pill.tsx`).
- Motion follows §8 exactly (≤300ms, ease-out, `motion-reduce` gated).
- Don't add auth, Prisma, or Hono here; this surface is static marketing only.
- A missing `public/videos/` asset must never break the page — the poster stays
  (do not "fix" the graceful no-op into an error state).
- **No decorative arrows** anywhere on the landing (the app's own list
  chevrons are hidden in previews via `TransactionItem hideChevron`).
- When embedding app data in a bento, render it directly on the panel
  surface (`LedgerRow` for transaction rows) instead of boxing it — never
  card-in-card.

## 17. Chat UI (auth-gated `/chat`)

`src/components/chat/` is the Budgie AI assistant surface (`ChatView` in
`src/app/chat/page.tsx` via `PageShell`). The visual language mirrors the iOS
app's chat (iMessage + Cash App register): iMessage tails, a serif greeting,
circle header buttons, and compact tool-result cards. The web palette stays in
force — brand green `#00C610` (user bubble, progress), `#F2F2F2` surfaces, the
3 semantic tints (`#1F9B29` income / `#D8000C` expense / `#B25B00` transfer),
`tabular-nums`, `formatRupiah`, motion ≤200ms `ease-out` (`stepReveal`),
`motion-reduce` respected.

### Layout

```
mx-auto w-full max-w-3xl flex-col (viewport-fitted height)
├─ header: [New chat ○] [centered model menu] [Clear ○ when messages]
├─ scroll thread (flex-1 min-h-0 overflow-y-auto, chat-scroll scrollbar)
│   └─ feed: gap-3.5 — empty state / bubbles / thinking / tool cards / typing
├─ error surface (only in the error state)
└─ composer: lighter-model notice + white rounded-[26px] card + send button
```

The column height is measured at runtime (`ChatView` reads its
`getBoundingClientRect().top` and sets `height: calc(100dvh - top - bottomPad)`,
re-measuring on resize) — the page never scrolls, the thread is the only scroll
area. The composer is **fixed at the bottom of the column** (outside the scroll
area), exactly like iOS.

### Header

`grid grid-cols-[40px_1fr_40px]`:
- **New chat** — 40px white circle (`border-black/[0.06]` + soft shadow),
  `SquarePen` icon; clears the conversation.
- **Model menu** (`ChatModelMenu`) — centered label + `ChevronDown`; opens a
  `w-44 rounded-2xl border bg-white shadow-xl` panel listing `MODEL_CHAIN`
  with a `Check` on the active model. `aria-label="Select model. Current: …"`.
- **Clear chat** — the same circle with `Trash2`, only when messages exist.

### Empty state (`ChatEmptyState`)

Serif (`font-serif`) 34px "How can I help you this morning/afternoon/evening/
late night?" (computed post-mount so SSR never mismatches), then the first
**three** iOS suggestions as white capsule chips (`h-10 rounded-full
border-black/10 text-sm font-medium text-black/60`). Tapping a chip sends
immediately.

### Bubbles & states

| Element | Style |
| ------- | ----- |
| User bubble | right-aligned, `max-w-[85%] sm:max-w-[300px]`, `rounded-[20px] rounded-br-[6px] bg-[#00C610] px-4 py-2.5 text-base text-white` (iMessage tail) |
| Assistant text | full width, no bubble, `text-base leading-relaxed`, `whitespace-pre-wrap` |
| Message gap | `gap-3.5` |
| Typing | white bubble with tail (`rounded-[20px] rounded-tl-[6px]`, soft shadow), three 7px `bg-black/30` dots on the `typingPulse` keyframe, `role="status"` |
| Thinking (`ChatThinking`) | streaming: `Loader2` + "Thinking…" 13px; done: chevron + "Thought for a moment" toggle → plain `font-mono text-[13px] text-black/45` reasoning text (no box) |
| Tool running (`ChatToolStatus`) | `rounded-full bg-[#F2F2F2] px-3.5 py-2.5 text-[13px] text-black/45` + brand spinner; per-tool labels ("Looking up your accounts…", "Fetching your transactions…", "Analyzing your money…", …) |
| Tool error | `rounded-[16px] bg-[#D8000C]/10 text-[#D8000C]` + `AlertTriangle` + message |
| Error surface | `rounded-[16px] bg-[#D8000C]/10 px-3.5 py-2.5` above the composer: `AlertTriangle` + "Something went wrong" + capsule "Retry" → `regenerate()` |

### Tool result cards (`ChatToolResult`)

Compact iOS-style card: `max-w-[310px] rounded-[16px] border border-black/[0.06]
bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]`, header = 12px tool icon +
13px semibold title, `stepReveal` in. Contents (small type, `tabular-nums`):
- **Accounts** — "Total balance" 11px + 18px bold total, then name/balance rows.
- **Transactions** — up to **6** rows (name 13px + "Category · Account" 11px,
  unsigned amount 13px semibold in the type tint), "+N more" caption; empty →
  "No transactions found."
- **Budgets** — per budget: label + "spent / limit" (red when over) + 6px
  progress track; empty → "No budgets yet."
- **Subscriptions** — name + "Next {date}" 11px, amount in transfer tint;
  empty → "No subscriptions yet."
- **Insights** — net worth 18px bold, plain Income/Expense text tiles
  (10/12px tinted), top categories rows (max 5).
- **create_transaction** — success: `CheckCircle2` + name + "amount · account";
  failure: `AlertTriangle` + the reason.

Cards are static (no navigation/sheets) and unknown tools render nothing.

### Composer (`ChatInput`)

White `rounded-[26px] shadow-[0_6px_16px_rgba(0,0,0,0.06)]` card (no border):
- Textarea `placeholder="Message Budgie…"`, `text-base`, auto-grows 1–5 lines
  (`max-h-[120px]`), `px-[18px] pt-3.5`; `Enter` sends, `Shift+Enter` newline.
- Bottom-right circular button (38px): dark `#171717` `ArrowUp` when there is
  text, 20% opacity when empty, swaps to a `Square` stop while streaming;
  disabled in the error state.
- No voice input, no model selector, no disclaimer caption (iOS parity).
- The lighter-model notice sits just above the card: `Info` 11px +
  "Switched to a lighter model to stay within free limits."

### Persistence & Clear chat

- Messages + draft persist in `localStorage`
  (`budgie.chat.{userId}.messages` / `.draft`); restored post-hydration.
- Both header circle buttons clear the conversation, storage, and the model
  choice; the model persists separately in `budgie.chat.{userId}.model` (12h).
- **Auto-downgrade** — on a rate-limit error the client regenerates with
  `gemini-3.5-flash-lite` and shows the notice (see ARCHITECTURE.md §22).

### Gotchas

- Assistant text is plain `whitespace-pre-wrap` — no markdown dependency.
- Icons only from `lucide-react`; no new colors beyond the tokens above.
- The time-of-day greeting must not be computed during SSR; compute it in an
  effect.
