"use client";

import { SpendingStreamsChart } from "@/components/spending-streams-chart";
import { useLiveTick } from "./use-live-tick";
import {
  LIVE_TICK_MS,
  MOCK_LIVE_EXPENSE_EVENTS,
  MOCK_LIVE_SPENDING_BASE,
  MOCK_LIVE_SPENDING_BUDGETS,
} from "./mock-data";

/**
 * The live "Automate" preview — a month in miniature. It starts at the base
 * spending month, accumulates one real expense event per tick (bars grow via
 * the chart's existing width transition), and loops back to the base once
 * every event has landed. The chart itself marks the data as `live`.
 */
export function LiveSpending() {
  const tick = useLiveTick(LIVE_TICK_MS);

  const step = tick % (MOCK_LIVE_EXPENSE_EVENTS.length + 1);
  const events = MOCK_LIVE_EXPENSE_EVENTS.slice(0, step);

  const data = MOCK_LIVE_SPENDING_BASE.map((stream) => {
    const added = events
      .filter((e) => e.category === stream.category)
      .reduce((sum, e) => sum + e.amount, 0);
    return { ...stream, spent: stream.spent + added };
  });

  return (
    <div className="w-full">
      <SpendingStreamsChart
        data={data}
        budgets={MOCK_LIVE_SPENDING_BUDGETS}
        monthLabel="December 2026"
        variant="bare"
        live
      />
    </div>
  );
}
