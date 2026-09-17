"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { LedgerRow } from "./ledger-row";
import { MOCK_TRANSACTIONS } from "./mock-data";

const LIMIT = 3;

/**
 * The search panel — a real input that filters the mock ledger live. Recent
 * rows show by default; typing narrows them by name or category, capped at
 * three so the panel keeps its height while you type. Same anatomy as the
 * ledger tile: caption row, hairline-divided rows, summary footer — no match
 * chrome in between: the rows themselves are the feedback.
 */
export function FindCard() {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const matches =
    q.length === 0
      ? MOCK_TRANSACTIONS
      : MOCK_TRANSACTIONS.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q),
        );
  const results = matches.slice(0, LIMIT);

  return (
    <div className="flex h-full flex-col rounded-[35px] border border-black/[0.06] bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between px-5 pt-5 pb-3 sm:px-6">
        <p className="text-[13px] text-black/40">All transactions</p>
        <p className="text-xs text-black/35">Filters as you type</p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-5 sm:px-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions"
            aria-label="Search transactions"
            className="h-10 w-full rounded-[20px] border border-black/10 bg-white pl-10 pr-4 text-sm outline-none transition-colors duration-200 ease-out placeholder:text-black/30 focus:border-black/20 focus:ring-2 focus:ring-black/20"
          />
        </div>

        <div className="mt-2 flex flex-col">
          {results.length === 0 ? (
            <p className="py-8 text-center text-sm text-black/40">
              Nothing matches &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            results.map((t) => <LedgerRow key={t.id} transaction={t} />)
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-black/[0.05] px-5 py-4 sm:px-6">
        <p className="text-[13px] text-black/40">Showing</p>
        <p className="text-[15px] font-semibold tabular-nums text-black">
          {results.length} of {matches.length}
        </p>
      </div>
    </div>
  );
}
