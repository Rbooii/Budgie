"use client";

import { useState } from "react";
import CashflowCard from "@/components/cashflow-card";
import AssetGrowthCard from "@/components/asset-growth-card";
import { PeriodSelect } from "@/components/select";

export interface CashflowPeriod {
  id: string;
  label: string;
  dateLabel: string;
  income: number;
  expense: number;
}

export interface GrowthPeriod {
  id: string;
  label: string;
  rangeLabel: string;
  changeLabel: string;
  shortLabels: string[];
  fullLabels: string[];
  data: { month: number; value: number }[];
  startingValue: number;
  currentTotal: number;
  currentMonth: number;
  hasTransactions: boolean;
  activeMonths: boolean[];
}

export function QuickInsightView({
  cashflowPeriods,
  growthPeriods,
}: {
  cashflowPeriods: CashflowPeriod[];
  growthPeriods: GrowthPeriod[];
}) {
  const [cashflowId, setCashflowId] = useState(cashflowPeriods[0]?.id ?? "");
  const [growthId, setGrowthId] = useState(growthPeriods[0]?.id ?? "");

  const cashflow =
    cashflowPeriods.find((period) => period.id === cashflowId) ??
    cashflowPeriods[0];
  const growth =
    growthPeriods.find((period) => period.id === growthId) ?? growthPeriods[0];

  if (!cashflow || !growth) return null;

  return (
    <div className="w-full h-fit grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
      <CashflowCard
        title="Cashflow"
        date={cashflow.dateLabel}
        income={cashflow.income}
        expense={cashflow.expense}
        actions={
          <PeriodSelect
            id="cashflow-period"
            label="Cashflow period"
            value={cashflowId}
            onValueChange={setCashflowId}
            options={cashflowPeriods.map((period) => ({
              value: period.id,
              label: period.label,
            }))}
          />
        }
      />

      <AssetGrowthCard
        data={growth.data}
        startingValue={growth.startingValue}
        currentTotal={growth.currentTotal}
        currentMonth={growth.currentMonth}
        hasTransactions={growth.hasTransactions}
        activeMonths={growth.activeMonths}
        shortLabels={growth.shortLabels}
        fullLabels={growth.fullLabels}
        rangeLabel={growth.rangeLabel}
        changeLabel={growth.changeLabel}
        actions={
          <PeriodSelect
            id="growth-period"
            label="Growth period"
            value={growthId}
            onValueChange={setGrowthId}
            options={growthPeriods.map((period) => ({
              value: period.id,
              label: period.label,
            }))}
          />
        }
      />
    </div>
  );
}
