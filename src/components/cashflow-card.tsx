import type { ReactNode } from "react";
import { formatRupiah } from "@/lib/format";

function signedRupiah(value: number) {
  return `${value >= 0 ? "+" : "-"}${formatRupiah(Math.abs(value))}`;
}

export default function CashflowCard({
  title = "Today's Cashflow",
  date = "12 December 2026",
  income = 3424500,
  expense = 1141500,
  actions,
}: {
  title?: string;
  date?: string;
  income?: number;
  expense?: number;
  actions?: ReactNode;
}) {
  const total = income + expense;
  const incomePct = total > 0 ? (income / total) * 100 : 0;
  const expensePct = 100 - incomePct;
  const net = income - expense;

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const gapDeg = 12;
  const gapLen = (gapDeg / 360) * circumference;

  const incomeLen = Math.max((incomePct / 100) * circumference - gapLen, 0);
  const expenseLen = Math.max((expensePct / 100) * circumference - gapLen, 0);

  const incomeOffset = 0;
  const expenseOffset = -(incomeLen + gapLen);

  return (
    <div className="w-full bg-card rounded-[35px] border border-hairline p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-ink/50">{title}</h2>
          <p className="mt-0.5 text-xs text-ink/30">{date}</p>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      <div className="relative mt-4 flex items-center justify-center">
        <svg
          viewBox="0 0 160 160"
          className="h-36 w-36 -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="var(--expense)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${expenseLen} ${circumference - expenseLen}`}
            strokeDashoffset={expenseOffset}
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="var(--income)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${incomeLen} ${circumference - incomeLen}`}
            strokeDashoffset={incomeOffset}
          />
        </svg>

        <div className="absolute flex flex-col items-center px-4 text-center">
          <span className="text-[10px] font-medium text-ink/40">Net</span>
          <span
            className={`mt-0.5 max-w-[104px] text-[11px] font-semibold leading-tight tabular-nums ${
              net >= 0 ? "text-brand" : "text-expense"
            }`}
          >
            {signedRupiah(net)}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-income">Income</span>
          <span className="text-[11px] tabular-nums text-ink/30">
            {Math.round(incomePct)}%
          </span>
          <span className="ml-auto text-sm font-medium tabular-nums text-ink">
            {formatRupiah(income)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-expense">Expense</span>
          <span className="text-[11px] tabular-nums text-ink/30">
            {Math.round(expensePct)}%
          </span>
          <span className="ml-auto text-sm font-medium tabular-nums text-ink">
            {formatRupiah(expense)}
          </span>
        </div>
      </div>
    </div>
  );
}
