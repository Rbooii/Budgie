# Budgie anti-AI-slop guardrails

Canonical rules for every surface: landing, dashboard, transactions, budgets,
chat, dialogs, empty states, docs, and tests. When a component and this file
disagree, this file wins. `UI_DESIGN.md` owns the tokens and the layout scale;
this file owns what not to build.

The test in `tests/anti-slop.test.ts` enforces the machine-checkable parts.
`tests/components/landing/anti-slop.test.ts` keeps the stricter landing copy
guard. Update both the guide and the tests when a rule changes.

## 1. Symbols and iconography

Do not use AI-coded symbols as decoration:

- `Sparkles`, `Sparkle`, `Star`, `Wand`, `Wand2`, `Magic`, `Bot`, `Robot`,
  `Brain`, `Cpu`, or `Zap` as a decorative mark.
- Sparkle, magic wand, robot, or lightbulb emoji.
- A sparkle or star in an icon tile, empty state, loading state, upgrade card,
  or chat header.
- Per-message avatars, AI brand marks, or a mascot.

Icons are functional, not ornamental. Use the existing `lucide-react` set for
actions and states: arrows, chevrons, plus, check, close, eye, grip, wallet,
receipt, alert, search, calendar, and similar. An icon must communicate an
action or a real state. If removing it loses no meaning, remove it.

Empty states use plain text and a real action. Do not wrap an AI symbol or a
decorative icon in a `rounded-full bg-surface` tile. A functional data icon
(for example `TrendingUp` for an empty chart) may stay when it clarifies the
missing data.

## 2. Motion

Do not use blinking or ambient attention devices:

- Blinking dots, typing dots, pulsing status dots, or a "live" pulse.
- Infinite decorative loops, marquee, scroll progress, floating badges, or
  shimmer that exists only to look busy.
- Bounce, spring, or overshoot.

Allowed motion is functional and short:

- One-shot reveals already in the system: `stepReveal`, `barGrow`,
  `sparkReveal`, `balanceReveal`, `eyeFlip`, `profileReveal`.
- Hover and press transitions at 300ms or less, `ease-out`.
- Loading skeletons in `src/components/page-skeleton.tsx` only. They are
  `aria-hidden`, non-decorative, and `motion-reduce:animate-none`.
- A static streaming caret in chat. No blink.

Every animation must be gated by `motion-reduce`.

## 3. Badges, pills, and dots

Do not build badge-like chrome:

- Decorative status badges, the deleted `Badge` primitive, or a new badge
  component.
- `New`, `Beta`, `AI`, `Live`, `Pro`, or `Plus` marketing pills.
- Change pills, "best value" chips, floating labels, or a pill wrapped around
  metadata that reads fine as plain text.
- Status dots, legend dots, bullet dots, online indicators, or colored dots
  used as a key.
- Icon tiles whose only job is to hold a decorative symbol.

Functional controls are allowed even when they are capsule-shaped: CTA buttons,
the period select trigger, the "Latest" jump button, the drag handle, and the
progress track. The difference is that a control performs an action; a badge
only decorates metadata.

Existing semantic category or state labels that carry real data and already
belong to the iOS design (budget category, subscription category, profile
membership state) may stay. Do not add a new decorative pill on top of them.
New metadata is plain text with type hierarchy. If a status needs emphasis, use
semantic text color or a plain label, not a background pill.

Chart marks are data, not decoration and not status dots:

- Sparkline end dot.
- Donut arcs.
- Bar chart bars.
- Budget limit marker.
- Drag handle dots.

## 4. Copy

Do not use:

- Em dashes, en dashes, or middle dots in UI copy.
- Uppercase labels, letter-spaced kickers, or `uppercase` utility classes.
- `By the numbers`, `Optional`, `Sample data`, `Sample ledger`, `Updating live`,
  `quiet place`, `ledger`, `See it in motion`, or
  `A sixty-second walkthrough`.
- AI marketing filler: `AI-powered`, `magic`, `effortless`, `seamless`,
  `supercharge`, `unlock`, `elevate`, `revolutionize`.
- Fake product claims. Plus is optional support, not a gated feature.

Write in sentence case, plain language, and specific nouns. A label should say
what the data is, not how impressive it is.

Code comments are exempt from the copy rules. User-facing strings are not.

## 5. Layout and chrome

Do not use:

- Nested cards, a card per item, or a card inside a card.
- Decorative dividers, section rules, or horizontal separators. Whitespace and
  type hierarchy are the dividers.
- Glassmorphism, gradients, neon, glow, 3D, or heavy shadows.
- Raw hex values outside the documented always-light or always-dark surfaces.
- `rounded-md`, `rounded-lg`, or `rounded-xl`. Use the app scale:
  `rounded-[10px]` controls, `rounded-2xl` rows, `rounded-[20px]` tiles,
  `rounded-[28px]`/`rounded-[35px]` sheets and cards, `rounded-full` controls.
- Mascots, abstract image plates, stock photos, or copied Anthropic/Claude
  assets.
- Dead controls or a showcase that is half-clickable.

One focal number per card. A chart supports the number, it does not compete with
it. Use hairline borders, spacing, and a quiet title instead of nested tinted
blocks.

## 6. Charts

- No grid lines in paper charts.
- No 3D, gradients, glow, or fake data labels.
- Use the ink line, dashed target, end dot, or semantic bars.
- Keep axis labels small and quiet.
- Tooltips are plain text with a hairline, not a card with a heavy shadow.
- Semantic colors only: `income`, `expense`, `transfer`, `stagnant`, `brand`.

## 7. Enforcement

Run `bun run test`. The global guard scans `src/components` and `src/app` for:

- `Sparkles`, `Badge`, `@/components/badge`, and `typingPulse`.
- `uppercase`, `animate-pulse` outside `page-skeleton.tsx`, `rounded-md`,
  `rounded-lg`, `rounded-xl`.
- The status-dot patterns `w-1.5 h-1.5 rounded-full`, `w-2 h-2 rounded-full`,
  and `w-[7px] h-[7px] rounded-full`.
- `bg-gradient` and raw hex utilities, except the always-dark profile identity
  card.

The landing guard additionally scans the landing directory for banned copy,
raw hex, illustration plates, and the old Claude chrome.

Review checklist before shipping:

```bash
grep -RIn "Sparkles\|Badge\|typingPulse\|uppercase\|animate-pulse\|rounded-xl" src
grep -RIn "w-1.5 h-1.5 rounded-full\|w-2 h-2 rounded-full\|w-\[7px\] h-\[7px\] rounded-full" src
grep -RIn "—\|–\|·" src/components src/app
```

Fix UI strings, not just the class names. A passing test is the floor, not the
goal.

## 8. Exceptions

These are the only documented exceptions:

- `src/components/page-skeleton.tsx`: `animate-pulse` loading placeholder.
- `src/components/landing/nanite-field.tsx`: canvas ambient dots. They are not
  status dots, never blink, and have a reduced-motion static fallback.
- `src/components/sparkline.tsx`: the end dot is a data mark.
- `src/components/cashflow-card.tsx`: donut arcs are data marks.
- `src/components/asset-growth-card.tsx`: bars and month marks are data marks.
- `src/components/chat/chat-message.tsx`: the streaming caret is static.
- Always-light surfaces: the QRIS box, jsPDF output, and `opengraph-image.tsx`.
- Always-dark surface: the profile identity card.

No other component may add a blinking dot, a status badge, a sparkle, or a
decorative pill.
