"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";

export interface SpendingStream {
  category: string;
  spent: number;
}

export interface SpendingStreamsBudget {
  category: string;
  amount: number;
}

interface SpendingStreamsChartProps {
  data: SpendingStream[];
  budgets: SpendingStreamsBudget[];
  monthLabel: string;
}

export function SpendingStreamsChart({
  data,
  budgets,
  monthLabel,
}: SpendingStreamsChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const withSpend = data.filter((d) => d.spent > 0);
  const totalSpent = withSpend.reduce((sum, d) => sum + d.spent, 0);
  const hasData = withSpend.length > 0;

  const budgetByCategory = new Map(
    budgets.map((b) => [b.category, b.amount]),
  );

  const rows = [...withSpend].sort((a, b) => b.spent - a.spent);
  const chartMax = Math.max(
    ...rows.map((r) => Math.max(r.spent, budgetByCategory.get(r.category) ?? 0)),
    1,
  );

  if (!hasData) {
    return (
      <div className="w-full bg-white rounded-[35px] border border-black/10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-black/50">Spending Streams</h2>
          <span className="text-xs text-black/30">{monthLabel}</span>
        </div>
        <p className="text-2xl font-bold tracking-tight tabular-nums text-black mt-2">
          {formatRupiah(0)}
        </p>
        <div className="flex items-center gap-2 justify-center py-10">
          <div className="w-12 h-12 rounded-full bg-[#F2F2F2] flex items-center justify-center text-black/30 mb-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        <p className="text-sm text-black/40 text-center -mt-4">
          No spending this month yet — your streams will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-[35px] border border-black/10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-black/50">Spending Streams</h2>
        <span className="text-xs text-black/30">{monthLabel}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight tabular-nums text-black mt-2">
        {formatRupiah(totalSpent)}
      </p>

      <div className="flex flex-col gap-2.5 mt-5">
        {rows.map((r) => {
          const budget = budgetByCategory.get(r.category);
          const hasBudget = budget !== undefined && budget > 0;
          const fillPct = (r.spent / chartMax) * 100;
          const markerPct = hasBudget ? ((budget as number) / chartMax) * 100 : null;
          const over = hasBudget && r.spent > (budget as number);
          const remaining = hasBudget ? (budget as number) - r.spent : null;
          const isHovered = hovered === r.category;

          return (
            <div
              key={r.category}
              className="relative"
              onMouseEnter={() => setHovered(r.category)}
              onMouseLeave={() => setHovered(null)}
              onClick={() =>
                setHovered((prev) => (prev === r.category ? null : r.category))
              }
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-24 shrink-0 text-xs truncate transition ${
                    isHovered ? "text-black font-medium" : "text-black/45"
                  }`}
                >
                  {categoryLabel(r.category)}
                </span>
                <div className="relative flex-1 h-3 bg-black/[0.04] rounded-full overflow-visible">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${
                      over ? "bg-[#D8000C]" : "bg-[#FFBABA]"
                    } ${isHovered ? "opacity-90" : ""}`}
                    style={{ width: `${Math.max(fillPct, 1.5)}%` }}
                  />
                  {markerPct !== null && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-black/40 rounded-full"
                      style={{ left: `${Math.min(markerPct, 99.5)}%` }}
                      aria-label="Budget limit"
                    />
                  )}
                </div>
                <span className="w-24 shrink-0 text-right text-xs font-semibold tabular-nums text-black">
                  {formatRupiah(r.spent)}
                </span>
              </div>

              {isHovered && (
                <div className="absolute right-24 top-0 z-10 pointer-events-none bg-white rounded-[20px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] border border-black/5 px-3 py-2 whitespace-nowrap"
                  style={{ transform: "translateY(-100%)", marginTop: "-6px" }}>
                  <p className="text-[10px] text-black/40 leading-none">
                    {categoryLabel(r.category)}
                  </p>
                  <p className="text-sm font-bold tabular-nums text-black leading-tight mt-1">
                    {formatRupiah(r.spent)}
                  </p>
                  {hasBudget && (
                    <p className="text-[10px] text-black/40 tabular-nums mt-1">
                      Budget {formatRupiah(budget as number)}
                      {over
                        ? " · over"
                        : ` · ${formatRupiah(remaining as number)} left`}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#FFBABA]" />
          <span className="text-[10px] text-black/40">Spent</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#D8000C]" />
          <span className="text-[10px] text-black/40">Over budget</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-0.5 h-3 bg-black/40 rounded-full" />
          <span className="text-[10px] text-black/40">Budget limit</span>
        </span>
      </div>
    </div>
  );
}
