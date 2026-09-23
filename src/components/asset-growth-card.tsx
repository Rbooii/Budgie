"use client";

import { useState } from "react";
import { Sparkles, TrendingUp } from "lucide-react";
import { formatRupiah } from "@/lib/format";

const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const GROWTH_COLORS = {
  up: "#00C610",
  flat: "#B25B00",
  down: "#D8000C",
} as const;

const PLACEHOLDER_COLOR = "#E5E5E5";

interface AssetGrowthCardProps {
  year: number;
  data: { month: number; value: number }[];
  startingValue: number;
  currentTotal: number;
  currentMonth: number;
  hasTransactions: boolean;
  activeMonths: boolean[];
}

function signedRupiah(value: number) {
  return `${value >= 0 ? "+" : "-"}${formatRupiah(Math.abs(value))}`;
}

export default function AssetGrowthCard({
  year,
  data,
  startingValue,
  currentTotal,
  currentMonth,
  hasTransactions,
  activeMonths,
}: AssetGrowthCardProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const ytd = currentTotal - startingValue;
  const ytdColor = ytd >= 0 ? "text-[#00C610]" : "text-[#D8000C]";

  const chartW = 300;
  const chartH = 100;
  const labelH = 18;
  const svgH = chartH + labelH;
  const padX = 4;
  const slot = (chartW - padX * 2) / 12;
  const barW = 16;

  const valueByMonth = new Map(data.map((d) => [d.month, d.value]));
  const maxValue = Math.max(startingValue, ...data.map((d) => d.value), 0.01);

  function barColor(month: number, value: number) {
    const prev = month === 0 ? startingValue : valueByMonth.get(month - 1) ?? startingValue;
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
    <div className="w-full h-fit bg-white rounded-[35px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] border border-black/10 p-6">
      {/* Label + YTD pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <h2 className="text-base font-semibold text-black truncate">Asset Growth</h2>
          <span className="text-sm text-black/30 tabular-nums">{year}</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#F2F2F2] px-2.5 py-1 shrink-0">
          <Sparkles className="w-3 h-3 text-black/60" />
          <span className="text-[11px] font-semibold text-black/60">YTD</span>
          <span className={`text-[11px] font-semibold tabular-nums ${ytdColor}`}>
            {signedRupiah(ytd)}
          </span>
        </span>
      </div>

      {/* Bar chart — always 12 slots, baseline 0 */}
      <div className="relative mt-4">
        <svg viewBox={`0 0 ${chartW} ${svgH}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
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
            const rx = Math.min(8, barH / 2);

            return (
              <g
                key={m}
                onMouseEnter={() => isRecorded && setHovered(m)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => isRecorded && setHovered((prev) => (prev === m ? null : m))}
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
                      ? "fill-black/70"
                      : isActive
                        ? "fill-black/45"
                        : "fill-black/25"
                  }
                  style={{ fontSize: 9 }}
                >
                  {MONTH_LABELS[m]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hovered !== null && hoveredValue !== undefined && (
          <div
            className="absolute pointer-events-none bg-white rounded-[12px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] border border-black/5 px-2 py-1.5 whitespace-nowrap z-10"
            style={{
              left: `${(((padX + slot * hovered + slot / 2)) / chartW) * 100}%`,
              top: `${((chartH - hoveredBarH) / svgH) * 100}%`,
              transform: "translate(-50%, calc(-100% - 8px))",
            }}
          >
            <p className="text-[10px] font-semibold text-black/50 leading-none">
              {MONTH_FULL[hovered]} {year}
            </p>
            <p className="text-[10px] font-bold tabular-nums text-black leading-none mt-1">
              {formatRupiah(hoveredValue)}
            </p>
          </div>
        )}
      </div>

      {/* Empty state caption */}
      {!hasTransactions && (
        <div className="flex items-center gap-2 justify-center mt-3">
          <TrendingUp className="w-4 h-4 text-black/30" />
          <p className="text-xs text-black/40">No transactions yet — your growth will appear here</p>
        </div>
      )}

      {/* Legend */}
      {hasTransactions && (
        <div className="flex items-center gap-3.5 mt-3">
          <span className="flex items-center gap-1.5">
            <span className="w-[7px] h-[7px] rounded-full bg-[#00C610]" />
            <span className="text-[11px] text-black/45">Growth</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-[7px] h-[7px] rounded-full bg-[#B25B00]" />
            <span className="text-[11px] text-black/45">Stable</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-[7px] h-[7px] rounded-full bg-[#D8000C]" />
            <span className="text-[11px] text-black/45">Decline</span>
          </span>
        </div>
      )}
    </div>
  );
}
