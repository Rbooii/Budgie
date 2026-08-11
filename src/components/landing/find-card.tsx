"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { TransactionItem } from "@/components/transaction-item";
import { MOCK_TRANSACTIONS } from "./mock-data";

/**
 * The interactive "Find" card — a real search box that filters the mock
 * transaction pool live. This is the bento grid's hands-on card: type a name
 * or category and watch the rows narrow down. Rows sit directly on the gray
 * card surface (no per-row boxes), matching the app's rounded-list pattern.
 */
export function FindCard() {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const results =
    q.length === 0
      ? MOCK_TRANSACTIONS.slice(0, 3)
      : MOCK_TRANSACTIONS.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q),
        );

  return (
    <div className="w-full">
      <div className="relative">
        <Search className="w-4 h-4 text-black/30 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your transactions"
          aria-label="Search your transactions"
          className="w-full h-11 pl-11 pr-4 text-sm bg-white border border-black/10 rounded-[20px] focus:ring-2 focus:ring-black/20 focus:scale-[1.01] transition-all duration-200 ease-out outline-none placeholder:text-black/30"
        />
      </div>

      <div className="mt-3 flex flex-col">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <p className="text-sm text-black/45">
              Nothing matches &ldquo;{query.trim()}&rdquo;
            </p>
            <p className="text-xs text-black/30">Try a different keyword.</p>
          </div>
        ) : (
          results.map((t) => (
            <TransactionItem key={t.id} transaction={t} hideChevron />
          ))
        )}
      </div>

      <p className="mt-3 text-[11px] text-black/35 tabular-nums">
        {q.length === 0
          ? "3 of 3 most recent"
          : `${results.length} of ${MOCK_TRANSACTIONS.length} matches`}
      </p>
    </div>
  );
}
