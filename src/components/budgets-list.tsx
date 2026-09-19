"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";
import { categoryIcon } from "@/lib/category-icon";
import { periodLabel } from "@/lib/budget";
import { BudgetDetailSheet } from "@/components/budget-detail-sheet";

export type BudgetRow = {
  id: string;
  category: string;
  amount: number;
  currency: string;
  periodDays: number;
  createdAt: string;
  updatedAt: string;
};

interface BudgetsListProps {
  budgets: BudgetRow[];
  spentByCategory: Record<string, number>;
  addTrigger: React.ReactNode;
}

export function BudgetsList({
  budgets,
  spentByCategory,
  addTrigger,
}: BudgetsListProps) {
  const [selected, setSelected] = useState<{
    budget: BudgetRow;
    spent: number;
  } | null>(null);

  const list = budgets;

  if (list.length === 0) {
    return (
      <>
        <div className="w-full rounded-[35px] bg-white border border-black/10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center text-center py-16 px-4 mt-3">
          <div className="w-12 h-12 rounded-full bg-[#A0FFA8]/30 flex items-center justify-center text-[#00C610] mb-4">
            <Wallet className="w-7 h-7" />
          </div>
          <p className="text-base font-semibold text-black">No budgets yet</p>
          <p className="text-sm text-black/40 mt-1 max-w-xs">
            Set a limit per category to track spending and stay on plan.
          </p>
          <div className="mt-5">{addTrigger}</div>
        </div>
        <BudgetDetailSheet
          budget={selected?.budget ?? null}
          spent={selected?.spent ?? 0}
          onClose={() => setSelected(null)}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2.5 mt-3">
        {list.map((b) => {
          const spent = spentByCategory[b.category] ?? 0;
          const pct = b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0;
          const remaining = b.amount - spent;
          const over = remaining < 0;

          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelected({ budget: b, spent })}
              className="group w-full rounded-[35px] bg-white border border-black/10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_-10px_rgba(0,0,0,0.12)] p-4 text-left transition active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#FFBABA]/40 text-[#D8000C]">
                  {categoryIcon(b.category, "w-5 h-5")}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-black truncate">
                    {categoryLabel(b.category)}
                  </p>
                  <p className="text-xs text-black/50 mt-0.5">
                    {periodLabel(b.periodDays)}
                  </p>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <p className="text-base font-semibold tabular-nums text-black">
                    {formatRupiah(b.amount)}
                  </p>
                  <p
                    className={`text-[11px] font-medium tabular-nums ${
                      over ? "text-[#D8000C]" : "text-black/40"
                    }`}
                  >
                    {over
                      ? `Over ${formatRupiah(Math.abs(remaining))}`
                      : `${formatRupiah(remaining)} left`}
                  </p>
                </div>
              </div>

              <div className="h-1.5 w-full bg-black/[0.06] rounded-full mt-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    over ? "bg-[#D8000C]" : "bg-[#00C610]"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <BudgetDetailSheet
        budget={selected?.budget ?? null}
        spent={selected?.spent ?? 0}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
