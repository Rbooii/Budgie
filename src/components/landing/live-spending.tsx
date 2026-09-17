"use client";

import { formatRupiah } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";
import { useLiveTick } from "./use-live-tick";
import {
  LIVE_TICK_MS,
  MOCK_LIVE_EXPENSE_EVENTS,
  MOCK_LIVE_SPENDING_BASE,
  MOCK_LIVE_SPENDING_BUDGETS,
} from "./mock-data";

/**
 * The budget panel — a month in miniature. Each bar is one category's spend
 * against its own budget (the quiet track is the limit, so no legend or
 * marker needed); every tick lands one real expense event and the bars grow
 * via a 200ms width transition, looping back to the base month. Same anatomy
 * as the ledger tile: caption row, bars, summary footer.
 */
export function LiveSpending() {
  const tick = useLiveTick(LIVE_TICK_MS);

  const step = tick % (MOCK_LIVE_EXPENSE_EVENTS.length + 1);
  const events = MOCK_LIVE_EXPENSE_EVENTS.slice(0, step);

  const budgetByCategory = new Map(
    MOCK_LIVE_SPENDING_BUDGETS.map((b) => [b.category, b.amount]),
  );

  const rows = MOCK_LIVE_SPENDING_BASE.map((stream) => {
    const added = events
      .filter((e) => e.category === stream.category)
      .reduce((sum, e) => sum + e.amount, 0);
    const spent = stream.spent + added;
    const budget = budgetByCategory.get(stream.category) ?? spent;
    return {
      category: stream.category,
      spent,
      pct: Math.min((spent / budget) * 100, 100),
      over: spent > budget,
    };
  }).sort((a, b) => b.spent - a.spent);

  const spent = rows.reduce((sum, r) => sum + r.spent, 0);
  const left = [...budgetByCategory.values()].reduce((sum, b) => sum + b, 0) - spent;

  return (
    <div className="flex h-full flex-col rounded-[35px] border border-black/[0.06] bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)]">
      <div className="flex items-baseline justify-between gap-4 px-5 pt-5 pb-3 sm:px-6">
        <p className="text-[13px] text-black/40">Spent in December</p>
        <p className="text-xl font-semibold tabular-nums tracking-tight text-black">
          {formatRupiah(spent)}
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-3 px-5 sm:px-6">
        {rows.map((row) => (
          <div key={row.category} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-xs text-black/45">
              {categoryLabel(row.category)}
            </span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.05]">
              <span
                className={`block h-full rounded-full transition-[width] duration-200 ease-out motion-reduce:transition-none ${
                  row.over ? "bg-[#D8000C]" : "bg-[#FFBABA]"
                }`}
                style={{ width: `${row.pct}%` }}
              />
            </span>
            <span className="w-[92px] shrink-0 text-right text-[11px] tabular-nums text-black/55">
              {formatRupiah(row.spent)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-black/[0.05] px-5 py-4 sm:px-6">
        <p className="text-[13px] text-black/40">Left to spend</p>
        <p className="text-[15px] font-semibold tabular-nums text-black">
          {formatRupiah(left)}
        </p>
      </div>
    </div>
  );
}
