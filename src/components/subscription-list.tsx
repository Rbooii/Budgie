"use client";

import { useState } from "react";
import { ChevronRight, Repeat } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";
import { categoryIcon } from "@/lib/category-icon";
import { periodLabel, nextBillingDate } from "@/lib/budget";
import { SubscriptionDetailSheet } from "@/components/subscription-detail-sheet";

export type SubscriptionRow = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  category: string;
  periodDays: number;
  startDate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

interface SubscriptionListProps {
  subscriptions: SubscriptionRow[];
  addTrigger: React.ReactNode;
}

export function SubscriptionList({
  subscriptions,
  addTrigger,
}: SubscriptionListProps) {
  const [selected, setSelected] = useState<SubscriptionRow | null>(null);

  if (subscriptions.length === 0) {
    return (
      <>
        <div className="w-full flex flex-col items-center justify-center text-center py-16 px-4">
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-ink/30 mb-4">
            <Repeat className="w-7 h-7" />
          </div>
          <p className="text-base font-semibold text-ink">
            No subscriptions yet
          </p>
          <p className="text-sm text-ink/40 mt-1 max-w-xs">
            Add your recurring charges to see when the next payment is due.
          </p>
          <div className="mt-5">{addTrigger}</div>
        </div>
        <SubscriptionDetailSheet
          subscription={selected}
          onClose={() => setSelected(null)}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1.5 mt-3">
        {subscriptions.map((s) => {
          const next = nextBillingDate(s.startDate, s.periodDays);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(s)}
              className="group w-full flex items-center gap-3.5 px-3.5 py-3.5 text-left rounded-2xl hover:bg-hover transition active:scale-[0.98]"
            >
              <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-transfer-tint text-transfer">
                {categoryIcon(s.category, "w-5 h-5")}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-ink truncate">
                  {s.name}
                </p>
                <p className="text-sm text-ink/45 truncate">
                  {categoryLabel(s.category)} · {periodLabel(s.periodDays)}
                </p>
                <p className="text-xs text-ink/35 mt-0.5">
                  Next {formatDate(next)}
                </p>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <p className="text-lg font-semibold tabular-nums text-ink">
                  {formatRupiah(s.amount)}
                </p>
                {!s.active && (
                  <p className="text-[11px] text-ink/35">Inactive</p>
                )}
              </div>

              <ChevronRight className="w-5 h-5 text-ink/15 group-hover:text-ink/30 transition shrink-0 hidden sm:block" />
            </button>
          );
        })}
      </div>

      <SubscriptionDetailSheet
        subscription={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
