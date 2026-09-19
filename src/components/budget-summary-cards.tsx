import { formatRupiah } from "@/lib/format";
import { periodLabel } from "@/lib/budget";

interface BudgetGroupSummary {
  total: number;
  spent: number;
  count: number;
}

interface BudgetSummaryCardsProps {
  monthly: BudgetGroupSummary;
  daily: BudgetGroupSummary;
}

export function BudgetSummaryCards({ monthly, daily }: BudgetSummaryCardsProps) {
  const group = monthly.total > 0
    ? { title: "Monthly budget", ...monthly }
    : daily.total > 0
      ? { title: "Daily budget", ...daily }
      : null;

  if (!group) return null;

  const { title, total, spent, count } = group;
  const remaining = total - spent;
  const over = remaining < 0;
  const pct = total > 0 ? Math.min((spent / total) * 100, 100) : 0;

  return (
    <div
      className={`w-full mt-4 rounded-[35px] p-6 text-white ${
        over ? "bg-[#D8000C]" : "bg-[#00C610]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white/95">{title}</p>
        <span className="text-xs font-semibold tabular-nums text-white/95">
          {count} {count === 1 ? "budget" : "budgets"}
        </span>
      </div>

      <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">
        {formatRupiah(Math.abs(remaining))}
      </p>
      <p className="mt-1 text-xs font-semibold text-white/85">
        {over ? "Over budget" : "Left to spend"}
      </p>

      <div className="h-1.5 w-full bg-white/25 rounded-full mt-3 overflow-hidden">
        <div
          className="h-full rounded-full bg-white transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-xs text-white/85 mt-2 tabular-nums">
        {formatRupiah(spent)} spent of {formatRupiah(total)}
      </p>
    </div>
  );
}

export function periodBadgeLabel(periodDays: number): string {
  return periodLabel(periodDays);
}
