import type { ReactNode } from "react";
import { MaskedBalance } from "@/components/balance-visibility";

const STROKE = 16;
const RADIUS = 64;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Round caps paint STROKE / 2 past each dash end, so the dash-space has to
 * include the full stroke width to leave a real GAP_PX hole between arcs.
 */
const GAP_PX = 10;
const GAP_LEN = GAP_PX + STROKE;

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
  const incomeRatio = total > 0 ? income / total : 0;
  const expenseRatio = total > 0 ? expense / total : 0;
  const incomePct = incomeRatio * 100;
  const expensePct = expenseRatio * 100;
  const net = income - expense;

  const incomeLen = Math.max(incomeRatio * CIRCUMFERENCE - GAP_LEN, 0);
  const expenseLen = Math.max(expenseRatio * CIRCUMFERENCE - GAP_LEN, 0);
  const expenseOffset = -(incomeRatio * CIRCUMFERENCE);
  const netColor = net >= 0 ? "text-brand" : "text-expense";

  return (
    <div className="w-full h-full flex flex-col bg-card rounded-[35px] border border-hairline p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-ink/50">{title}</h2>
          <p className="mt-0.5 text-xs text-ink/30">{date}</p>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium text-ink/40">Net</p>
        <p
          className={`mt-1 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl lg:text-4xl ${netColor}`}
        >
          <MaskedBalance value={net} mask="long" signed />
        </p>
      </div>

      <div className="mt-5 flex items-center justify-center">
        <svg
          viewBox="0 0 160 160"
          className="h-40 w-40 -rotate-90"
          aria-hidden="true"
        >
          {total === 0 && (
            <circle
              cx="80"
              cy="80"
              r={RADIUS}
              fill="none"
              stroke="var(--chart-placeholder)"
              strokeWidth={STROKE}
            />
          )}
          {expenseLen > 0 && (
            <circle
              cx="80"
              cy="80"
              r={RADIUS}
              fill="none"
              stroke="var(--expense)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${expenseLen} ${CIRCUMFERENCE - expenseLen}`}
              strokeDashoffset={expenseOffset}
            />
          )}
          {incomeLen > 0 && (
            <circle
              cx="80"
              cy="80"
              r={RADIUS}
              fill="none"
              stroke="var(--income)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${incomeLen} ${CIRCUMFERENCE - incomeLen}`}
            />
          )}
        </svg>
      </div>

      <div className="mt-auto pt-4 space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-income">Income</span>
          <span className="text-xs tabular-nums text-ink/35">
            {Math.round(incomePct)}%
          </span>
          <span className="ml-auto text-lg font-bold tabular-nums text-ink sm:text-xl">
            <MaskedBalance value={income} mask="short" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-expense">Expense</span>
          <span className="text-xs tabular-nums text-ink/35">
            {Math.round(expensePct)}%
          </span>
          <span className="ml-auto text-lg font-bold tabular-nums text-ink sm:text-xl">
            <MaskedBalance value={expense} mask="short" />
          </span>
        </div>
      </div>
    </div>
  );
}
