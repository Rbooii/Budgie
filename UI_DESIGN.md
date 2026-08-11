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
| Landing page (`/`) | Notion-calmed product marketing, airy | `rounded-[12px]` bento cards, `rounded-[20px]` link tiles, Budgie `rounded-[35px]` CTAs | Fluid `clamp(2.625rem, 11.25vw - 25.5px, 6rem)` headline |

The landing runs on white + `#F9F9F8` gray surfaces with **one brand green
`#00C610`** for CTAs and pricing accents; the semantic pastel tints
(income/expense/transfer) appear only inside the real app components shown in
the bento previews. Section rhythm is `py-20 sm:py-28` inside
`max-w-screen-xl px-5 sm:px-8`.

### Page anatomy (Notion's exact order)

1. **Nav** (`landing-nav.tsx`) — wordmark, anchor links (Use cases /
   Features / Pricing / FAQ), then Budgie's green-pill CTAs (Sign in / Get
   started; Dashboard when authed). Translucent white + hairline after scroll.
   **No dropdowns, no mega-menus** — Budgie has no sub-pages.
2. **Hero** — center column: feature-icon pile → headline → mono deck → CTAs →
   demo video.
   - **Icon pile** — five overlapping round tinted tiles (Accounts,
     Transactions, Budgets, Subscriptions, Insights) above the H1, each
     `hover:rotate-[15deg]` — Notion's `pileImage` anatomy, honest version of
     their agent pile (real app features, not fake avatars).
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
3. **Bento** (`bento.tsx`, `#features`) — "Where your money lives." One wide
   Capture card + two side cards (Find / Automate). Cards are Notion's:
   `bg-[#F9F9F8]`, `rounded-[12px]`, **no border, no lift**; hover fades in a
   soft shadow only. Eyebrow = quiet 14px `text-black/45` caption; title =
   22px bold; **no arrows**. Media is the **real Budgie UI rendered directly
   on the gray surface, at natural height** — never a fixed-aspect box, never
   card-in-card: transaction rows (`TransactionItem hideChevron`), the
   interactive search (`FindCard`), and `SpendingStreamsChart variant="bare"`.
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
   only**: brand + one-liner + ©, then Product (`/#features`, `/#use-cases`,
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

List `.webm` first, `.mp4` second — the browser picks the first it supports
(modern Chromium/Firefox use `.webm`, Safari falls back to `.mp4`). The hosted
`BudgieDemo` Vercel-Blob mp4 URL is the same clip embedded in `README.md`'s
demo `<video>` — keep the landing `AutoVideo` and the README demo in sync.

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
testimonials (Dimas P., Sari W.), and footer links that pointed at `#`.
Budgie does not fake social proof: the only marquee carries true product
facts, and every footer/nav link resolves to a real page or section.

### Testability split

`landing/index.tsx` exports **two** components:
- `LandingPage` — the **async RSC** (fetches the session via
  `auth.api.getSession` + `headers()`), delegating to the view below. It is
  NOT rendered in tests (jsdom can't await async RSC — same rule as
  `AccountTab`).
- `LandingPageView` — the **sync presentational** half, props
  `{ session: boolean }`. This is what `index.test.tsx` exercises: full page
  composition, CTA copy, section headings, session-conditional nav. When
  editing landing copy, update `index.test.tsx` in the same change.

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
- When embedding an app component in a bento, use its `bare`/`hideChevron`
  variants instead of boxing it — media sits directly on the gray card.
