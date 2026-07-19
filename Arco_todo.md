[x] fix why add account card under transactions/add is having a centered text
[x] update asset growth pill calculations refactoring +0%ytd and +infinity
[x] build Subscription backend — Prisma model + migration `20260719070857_add_subscription` + 3-layer route `/api/subscriptions` (schema/service/controller/route) + mount in `src/server/index.ts`
[x] build Budgets frontend (`src/app/budget/page.tsx`) — monthly + daily summary cards, spending-streams horizontal bar chart (per-category expense this month + budget markers), budgets list with mini progress bars, 3-step add-budget wizard in Dialog, bottom-sheet detail + confirm delete
[x] build Subscriptions frontend — subscription list with next-billing-date, single-dialog add form, bottom-sheet detail + confirm delete
[x] add `src/lib/budget.ts` helpers (periodLabel, periodStartDate, nextBillingDate, startOfToday, startOfMonth) + `src/lib/category-icon.tsx` (categoryIcon → ReactElement, lint-safe)
[x] update ARCHITECTURE.md (§19 Budgets UI, Subscription model/schema/route, repo structure), UI_DESIGN.md (§14 Budgets UI patterns, §13 where-to-look), AGENTS.md (resources + conventions), README.md (features done + structure)