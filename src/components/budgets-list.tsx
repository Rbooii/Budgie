"use client";

import { useState } from "react";
import { ChevronRight, Wallet } from "lucide-react";
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
        <div className="w-full flex flex-col items-center justify-center text-center py-16 px-4">
          <div className="w-12 h-12 rounded-full bg-[#F2F2F2] flex items-center justify-center text-black/30 mb-4">
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
      <div className="flex flex-col gap-1.5 mt-3">
        {list.map((b) => {
          const spent = spentByCategory[b.category] ?? 0;
          const pct = b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0;
          const over = spent > b.amount;

          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelected({ budget: b, spent })}
              className="group w-full flex items-center gap-3.5 px-3.5 py-3.5 text-left rounded-2xl hover:bg-[#FAFAFA] transition active:scale-[0.98]"
            >
              <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#FFBABA]/40 text-[#D8000C]">
                {categoryIcon(b.category, "w-5 h-5")}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-black truncate">
                  {categoryLabel(b.category)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-black/40 shrink-0">
                    {periodLabel(b.periodDays)}
                  </span>
                  <div className="flex-1 h-1.5 bg-black/[0.06] rounded-full overflow-hidden min-w-[40px]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        over ? "bg-[#D8000C]" : "bg-[#00C610]"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <p className="text-lg font-semibold tabular-nums text-black">
                  {formatRupiah(b.amount)}
                </p>
                <p className="text-xs text-black/35 tabular-nums">
                  {formatRupiah(spent)} spent
                </p>
              </div>

              <ChevronRight className="w-5 h-5 text-black/15 group-hover:text-black/30 transition shrink-0 hidden sm:block" />
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
