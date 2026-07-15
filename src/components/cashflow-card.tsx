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
    <div className="w-full bg-white rounded-[35px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] border border-black/5 p-6">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-black">{title}</h2>
        <p className="text-sm text-black/40 mt-1">{date}</p>
      </div>

      {/* Donut chart */}
      <div className="relative flex items-center justify-center my-4">
        <svg viewBox="0 0 160 160" className="w-56 h-56 -rotate-90 drop-shadow-[0_4px_8px_rgba(0,0,0,0.06)]">
          <defs>
            <linearGradient id="incomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00C610" />
              <stop offset="100%" stopColor="#00B609" />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e0584f" />
              <stop offset="100%" stopColor="#c4453b" />
            </linearGradient>
          </defs>

          {/* Base track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            strokeWidth="18"
          />

          {/* Expense arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="url(#expenseGrad)"
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
            stroke="url(#incomeGrad)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={`${incomeLen} ${circumference - incomeLen}`}
            strokeDashoffset={incomeOffset}
          />
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center">
          <span className={`font-bold text-lg ${net >= 0 ? "text-[#00C610]" : "text-[#e0584f]"}`}>
            {net >= 0 ? "+" : "-"} {(Math.abs(net) / 1_000_000).toFixed(1)} mil
          </span>
          <span className="text-black font-medium text-sm mt-0.5">
            {formatRupiah(Math.abs(net))}
          </span>
        </div>
      </div>

      {/* Income row */}
      <div className="flex items-center justify-between bg-[#A0FFA8] rounded-[20px] px-5 py-4 mb-3">
        <div>
          <p className="text-[#1F9B29] text-xs font-semibold">Income</p>
          <p className="text-[#1F9B29] text-2xl font-bold">
            {Math.round(incomePct)}%
          </p>
        </div>
        <p className="text-[#1F9B29] text-lg font-semibold">{formatRupiah(income)}</p>
      </div>

      {/* Expense row */}
      <div className="flex items-center justify-between bg-[#FFBABA] rounded-[20px] px-5 py-4">
        <div>
          <p className="text-[#e0584f] text-xs font-semibold">Expense</p>
          <p className="text-[#e0584f] text-2xl font-bold">
            {Math.round(expensePct)}%
          </p>
        </div>
        <p className="text-[#e0584f] text-lg font-semibold">{formatRupiah(expense)}</p>
      </div>
    </div>
  );
}
