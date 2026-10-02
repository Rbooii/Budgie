import React from "react";
import { formatRupiah } from "@/lib/format";

export default function CashflowCard({
  title = "Today's Cashflow",
  date = "12 December 2026",
  income = 3424500,
  expense = 1141500,
}: {
  title?: string;
  date?: string;
  income?: number;
  expense?: number;
}) {
  const total = income + expense;
  const incomePct = total > 0 ? (income / total) * 100 : 0;
  const expensePct = 100 - incomePct;
  const net = income - expense;

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const gapDeg = 20;
  const gapLen = (gapDeg / 360) * circumference;

  const incomeLen = Math.max((incomePct / 100) * circumference - gapLen, 0);
  const expenseLen = Math.max((expensePct / 100) * circumference - gapLen, 0);

  const incomeOffset = 0;
  const expenseOffset = -(incomeLen + gapLen);

  return (
    <div className="w-full bg-card rounded-[35px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] border border-hairline p-6">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-ink">{title}</h2>
        <p className="text-sm text-ink/40 mt-1">{date}</p>
      </div>

      {/* Donut chart */}
      <div className="relative flex items-center justify-center my-4">
        <svg viewBox="0 0 160 160" className="w-56 h-56 -rotate-90 drop-shadow-[0_4px_8px_rgba(0,0,0,0.06)]">
          {/* Expense arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="var(--expense)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={`${expenseLen} ${circumference - expenseLen}`}
            strokeDashoffset={expenseOffset}
          />
          {/* Income arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="var(--income)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={`${incomeLen} ${circumference - incomeLen}`}
            strokeDashoffset={incomeOffset}
          />
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center">
          <span className={`font-bold text-lg ${net >= 0 ? "text-brand" : "text-expense"}`}>
            {net >= 0 ? "+" : "-"} {(Math.abs(net) / 1_000_000).toFixed(1)} mil
          </span>
          <span className="text-ink font-medium text-sm mt-0.5">
            {formatRupiah(Math.abs(net))}
          </span>
        </div>
      </div>

      {/* Income row */}
      <div className="flex items-center justify-between bg-income-tint rounded-[20px] px-5 py-4 mb-3">
        <div>
          <p className="text-income text-xs font-semibold">Income</p>
          <p className="text-income text-2xl font-bold">
            {Math.round(incomePct)}%
          </p>
        </div>
        <p className="text-income text-lg font-semibold">{formatRupiah(income)}</p>
      </div>

      {/* Expense row */}
      <div className="flex items-center justify-between bg-expense-tint rounded-[20px] px-5 py-4">
        <div>
          <p className="text-expense text-xs font-semibold">Expense</p>
          <p className="text-expense text-2xl font-bold">
            {Math.round(expensePct)}%
          </p>
        </div>
        <p className="text-expense text-lg font-semibold">{formatRupiah(expense)}</p>
      </div>
    </div>
  );
}
