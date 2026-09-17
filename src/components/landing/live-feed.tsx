"use client";

import { formatRupiah } from "@/lib/format";
import { LedgerRow } from "./ledger-row";
import { useLiveTick } from "./use-live-tick";
import { LIVE_TICK_MS, MOCK_LIVE_TRANSACTIONS } from "./mock-data";

const VISIBLE = 6;

/**
 * The ledger panel — Budgie's system of record, shown as a quiet statement:
 * a hairline-divided list on one white surface, closed by a net-today footer,
 * no card-in-card. Every `LIVE_TICK_MS` the window slides by one, so a fresh
 * row enters at the top (React keys it by id → only the new row re-mounts and
 * plays the 200ms `stepReveal`). The green dot plus "Updating live" is the
 * only chrome; under reduced motion the tick freezes on the stable first
 * window.
 */
export function LiveFeed() {
  const tick = useLiveTick(LIVE_TICK_MS);

  const start = tick % MOCK_LIVE_TRANSACTIONS.length;
  const rows = Array.from({ length: VISIBLE }, (_, i) => {
    const item =
      MOCK_LIVE_TRANSACTIONS[(start + i) % MOCK_LIVE_TRANSACTIONS.length];
    return { item, entering: i === 0 };
  });

  const net = rows.reduce(
    (sum, { item }) =>
      item.type === "income"
        ? sum + item.amount
        : item.type === "expense"
          ? sum - item.amount
          : sum,
    0,
  );

  return (
    <div className="flex h-full flex-col rounded-[35px] border border-black/[0.06] bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between px-6 pt-6 pb-3 sm:px-7">
        <p className="text-[13px] text-black/40">Today</p>
        <p className="flex items-center gap-1.5 text-xs text-black/35">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-[#00C610]"
          />
          Updating live
        </p>
      </div>

      <div className="flex flex-1 flex-col divide-y divide-black/[0.05] px-6 sm:px-7">
        {rows.map(({ item, entering }) => (
          <div
            key={item.id}
            className={`flex flex-1 ${
              entering
                ? "animate-[stepReveal_0.2s_ease-out] motion-reduce:animate-none"
                : ""
            }`}
          >
            <LedgerRow transaction={item} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-black/[0.05] px-6 py-4 sm:px-7">
        <p className="text-[13px] text-black/40">Net today</p>
        <p className="text-[15px] font-semibold tabular-nums text-black">
          {formatRupiah(net)}
        </p>
      </div>
    </div>
  );
}
