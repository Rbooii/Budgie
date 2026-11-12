"use client";

import { useState, type ReactNode } from "react";
import {
  MaskedBalance,
  useBalanceVisibility,
} from "@/components/balance-visibility";
import { formatRupiah } from "@/lib/format";

const GROWTH_COLORS = {
  up: "var(--income)",
  flat: "var(--stagnant)",
  down: "var(--expense)",
} as const;

const PLACEHOLDER_COLOR = "var(--chart-placeholder)";

interface AssetGrowthCardProps {
  data: { month: number; value: number }[];
  startingValue: number;
  currentTotal: number;
  currentMonth: number;
  hasTransactions: boolean;
  activeMonths: boolean[];
  shortLabels: string[];
  fullLabels: string[];
  rangeLabel: string;
  changeLabel: string;
  actions?: ReactNode;
}

function signedRupiah(value: number) {
  return `${value >= 0 ? "+" : "-"}${formatRupiah(Math.abs(value))}`;
}

export default function AssetGrowthCard({
  data,
  startingValue,
  currentTotal,
  currentMonth,
  hasTransactions,
  activeMonths,
  shortLabels,
  fullLabels,
  rangeLabel,
  changeLabel,
  actions,
}: AssetGrowthCardProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const { hidden } = useBalanceVisibility();

  const change = currentTotal - startingValue;
  const changeColor = change >= 0 ? "text-brand" : "text-expense";

  const chartW = 300;
  const chartH = 100;
  const labelH = 18;
  const svgH = chartH + labelH;
  const padX = 4;
  const slot = (chartW - padX * 2) / 12;
  const barW = 13;

  const valueByMonth = new Map(data.map((d) => [d.month, d.value]));
  const maxValue = Math.max(startingValue, ...data.map((d) => d.value), 0.01);

  function barColor(month: number, value: number) {
    const prev =
      month === 0 ? startingValue : valueByMonth.get(month - 1) ?? startingValue;
    const delta = value - prev;
    if (Math.abs(delta) < 0.005) return GROWTH_COLORS.flat;
    return delta > 0 ? GROWTH_COLORS.up : GROWTH_COLORS.down;
  }

  const hoveredValue = hovered !== null ? valueByMonth.get(hovered) : undefined;
  const hoveredBarH =
    hoveredValue !== undefined
      ? Math.max((hoveredValue / maxValue) * chartH, 12)
      : 0;

  return (
    <div className="w-full h-full flex flex-col bg-card rounded-[35px] border border-hairline p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-ink/50">
            Asset Growth
          </h2>
          <p className="mt-0.5 text-xs text-ink/30 tabular-nums">{rangeLabel}</p>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
          <MaskedBalance
            value={change}
            mask="short"
            signed
            className={changeColor}
          />
        </p>
        <span className="text-[11px] font-medium text-ink/40">
          {changeLabel}
        </span>
      </div>

      <div className="mt-4 flex flex-1 items-center">
        <div className="relative w-full">
          <svg
            viewBox={`0 0 ${chartW} ${svgH}`}
            className="w-full h-auto"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={
              hidden
                ? `Asset growth ${rangeLabel}`
                : `Asset growth ${rangeLabel}: ${signedRupiah(change)} ${changeLabel}`
            }
          >
            {Array.from({ length: 12 }, (_, m) => m).map((m) => {
              const x = padX + slot * m + (slot - barW) / 2;
              const value = valueByMonth.get(m);
              const isFuture = m > currentMonth;
              const isRecorded = !isFuture && value !== undefined;
              const isActive = hasTransactions && isRecorded && activeMonths[m];
              const isHovered = hovered === m;

              let barH: number;
              let color: string;
              let opacity: number;
              if (isFuture) {
                barH = 6;
                color = PLACEHOLDER_COLOR;
                opacity = 0.35;
              } else if (!isActive) {
                barH = Math.max(((value ?? 0) / maxValue) * chartH, 6);
                color = PLACEHOLDER_COLOR;
                opacity = isHovered ? 1 : 0.85;
              } else {
                barH = Math.max((value! / maxValue) * chartH, 12);
                color = barColor(m, value!);
                opacity = isHovered ? 1 : 0.85;
              }

              const y = chartH - barH;
              const rx = Math.min(6, barH / 2);

              return (
                <g
                  key={m}
                  onMouseEnter={() => isRecorded && setHovered(m)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() =>
                    isRecorded && setHovered((prev) => (prev === m ? null : m))
                  }
                  style={{ cursor: isRecorded ? "pointer" : "default" }}
                >
                  <rect
                    className="bar-grow"
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    rx={rx}
                    fill={color}
                    opacity={opacity}
                  />
                  <text
                    x={x + barW / 2}
                    y={chartH + 13}
                    textAnchor="middle"
                    className={
                      isHovered
                        ? "fill-ink/70"
                        : isActive
                          ? "fill-ink/45"
                          : "fill-ink/25"
                    }
                    style={{ fontSize: 9 }}
                  >
                    {shortLabels[m] ?? ""}
                  </text>
                </g>
              );
            })}
          </svg>

          {hovered !== null && hoveredValue !== undefined && (
            <div
              className="absolute pointer-events-none bg-card rounded-[10px] border border-hairline px-2 py-1.5 whitespace-nowrap z-10"
              style={{
                left: `${(((padX + slot * hovered + slot / 2)) / chartW) * 100}%`,
                top: `${((chartH - hoveredBarH) / svgH) * 100}%`,
                transform: "translate(-50%, calc(-100% - 8px))",
              }}
            >
              <p className="text-[10px] font-semibold text-ink/50 leading-none">
                {fullLabels[hovered] ?? ""}
              </p>
              <p className="text-[10px] font-bold tabular-nums text-ink leading-none mt-1">
                <MaskedBalance value={hoveredValue} mask="short" />
              </p>
            </div>
          )}
        </div>
      </div>

      {!hasTransactions && (
        <p className="mt-3 text-center text-xs text-ink/40">
          No transactions yet. Your growth will appear here.
        </p>
      )}

      {hasTransactions && (
        <div className="mt-2 flex items-center gap-3.5 text-[10px] font-medium">
          <span className="text-brand">Growth</span>
          <span className="text-stagnant">Stable</span>
          <span className="text-expense">Decline</span>
        </div>
      )}
    </div>
  );
}
