import { formatRupiah } from "@/lib/format";
import { periodLabel } from "@/lib/budget";

interface BudgetSummaryCardsProps {
  monthly: { total: number; spent: number };
  daily: { total: number; spent: number };
}

function SummaryCard({
  label,
  total,
  spent,
  caption,
  emptyTitle,
  emptyDesc,
}: {
  label: string;
  total: number;
  spent: number;
  caption: string;
  emptyTitle: string;
  emptyDesc: string;
}) {
  const hasBudget = total > 0;
  const pct = hasBudget ? Math.min((spent / total) * 100, 100) : 0;
  const over = hasBudget && spent > total;
  const remaining = hasBudget ? Math.max(total - spent, 0) : 0;

  return (
    <div className="w-full bg-white rounded-[35px] border border-black/10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-black/50">{label}</h2>
        <span className="text-xs text-black/30">{caption}</span>
      </div>

      {hasBudget ? (
        <>
          <p className="text-2xl font-bold tracking-tight tabular-nums text-black mt-2">
            {formatRupiah(total)}
          </p>
          <p className="text-xs text-black/40 mt-1 tabular-nums">
            {over
              ? `${formatRupiah(spent - total)} over budget`
              : `${formatRupiah(remaining)} remaining`}
          </p>
          <div className="h-2 w-full bg-black/[0.06] rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                over ? "bg-[#D8000C]" : "bg-[#00C610]"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[11px] text-black/35 mt-2 tabular-nums">
            {formatRupiah(spent)} spent
          </p>
        </>
      ) : (
        <>
          <p className="text-base font-semibold text-black mt-3">{emptyTitle}</p>
          <p className="text-sm text-black/40 mt-1 max-w-xs">{emptyDesc}</p>
        </>
      )}
    </div>
  );
}

export function BudgetSummaryCards({ monthly, daily }: BudgetSummaryCardsProps) {
  const monthLabel = new Date().toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const todayLabel = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
      <SummaryCard
        label="Monthly Budget"
        caption={monthLabel}
        total={monthly.total}
        spent={monthly.spent}
        emptyTitle="No monthly budget yet"
        emptyDesc="Set a monthly limit per category to track spending against your overall plan."
      />
      <SummaryCard
        label="Daily Budget"
        caption={todayLabel}
        total={daily.total}
        spent={daily.spent}
        emptyTitle="No daily budget yet"
        emptyDesc="Set a daily limit per category to keep day-to-day spending in check."
      />
    </div>
  );
}

export function periodBadgeLabel(periodDays: number): string {
  return periodLabel(periodDays);
}
