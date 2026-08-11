"use client";

import { TransactionItem } from "@/components/transaction-item";
import { useLiveTick } from "./use-live-tick";
import { LIVE_TICK_MS, MOCK_LIVE_TRANSACTIONS } from "./mock-data";

const VISIBLE = 3;

/**
 * The live "Capture" feed — a circular pool of transactions walked as a
 * sliding window of three. Every `LIVE_TICK_MS` the window advances by one,
 * so a fresh row enters at the top (React keys it by id → only the new row
 * re-mounts and plays the 200ms `stepReveal` slide). The quiet green dot +
 * "Live" caption marks that the feed is genuinely updating; under reduced
 * motion the tick freezes on the stable first window.
 */
export function LiveFeed() {
  const tick = useLiveTick(LIVE_TICK_MS);

  const start = tick % MOCK_LIVE_TRANSACTIONS.length;
  const window = Array.from({ length: VISIBLE }, (_, i) => {
    const item = MOCK_LIVE_TRANSACTIONS[(start + i) % MOCK_LIVE_TRANSACTIONS.length];
    return { item, entering: i === 0 };
  });

  return (
    <div className="w-full" aria-label="Recent activity, updating live">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <p className="text-xs text-black/40">Recent activity</p>
          <span
            aria-hidden="true"
            className="w-1.5 h-1.5 rounded-full bg-[#00C610]"
          />
          <span className="text-[10px] font-medium text-[#1F9B29] uppercase tracking-wide">
            Live
          </span>
        </div>
        <p className="text-xs text-black/30">Today</p>
      </div>

      <div className="flex flex-col">
        {window.map(({ item, entering }) => (
          <div
            key={item.id}
            className={entering ? "animate-[stepReveal_0.2s_ease-out] motion-reduce:animate-none" : undefined}
          >
            <TransactionItem transaction={item} hideChevron />
          </div>
        ))}
      </div>
    </div>
  );
}
