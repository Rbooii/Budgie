"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { formatRupiah } from "@/lib/format";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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

function ytdPillClass(pct: number) {
  if (pct > 0) return "bg-[#A0FFA8]/30 text-[#1F9B29]";
  if (pct < 0) return "bg-[#FFBABA]/40 text-[#D8000C]";
  return "bg-[#FFD9A0]/40 text-[#B25B00]";
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

  const ytdPct = startingValue > 0
    ? ((currentTotal - startingValue) / startingValue) * 100
    : 0;
  const ytdText = `${ytdPct >= 0 ? "+" : ""}${ytdPct.toFixed(1)}% YTD`;

  const chartW = 300;
  const chartH = 100;
  const labelH = 18;
  const svgH = chartH + labelH;
  const padX = 4;
  const barAreaW = chartW - padX * 2;
  const slot = barAreaW / 12;
  const barW = 16;

  const allMonths = Array.from({ length: 12 }, (_, m) => m);
  const recordedValues = hasTransactions
    ? [startingValue, ...data.map((d) => d.value)]
    : [currentTotal];
  const min = Math.min(...recordedValues);
  const max = Math.max(...recordedValues);
  const pad = (max - min) * 0.15 || max * 0.1 || 1;
  const yMin = min - pad;
  const yMax = max + pad;
  const yRange = yMax - yMin || 1;

  function barColor(value: number, idx: number) {
    const prev = idx === 0 ? startingValue : data[idx - 1].value;
    if (value > prev) return GROWTH_COLORS.up;
    if (value < prev) return GROWTH_COLORS.down;
    return GROWTH_COLORS.flat;
  }

  const hoveredPoint = hovered !== null ? data[hovered] : null;

  return (
    <div className="w-full h-fit bg-white rounded-[35px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] border border-black/10 p-6">
      {/* Label + YTD pill */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <h2 className="text-sm font-semibold text-black/50">Asset Growth</h2>
          <span className="text-sm text-black/30 tabular-nums">{year}</span>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${ytdPillClass(ytdPct)}`}>
          {ytdText}
        </span>
      </div>

      {/* Hero number */}
      <p className="text-2xl font-bold tracking-tight tabular-nums text-black mt-2">
        {formatRupiah(currentTotal)}
      </p>

      {/* Bar chart — always 12 slots */}
      <div className="relative mt-4">
        <svg viewBox={`0 0 ${chartW} ${svgH}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {allMonths.map((m) => {
            const x = padX + slot * m + (slot - barW) / 2;
            const isRecorded = hasTransactions && m <= currentMonth;
            const isFuture = !isRecorded;

            if (isFuture) {
              return (
                <text
                  key={m}
                  x={x + barW / 2}
                  y={chartH + 13}
                  textAnchor="middle"
                  className="fill-black/20"
                  style={{ fontSize: 9 }}
                >
                  {MONTH_LABELS[m]}
                </text>
              );
            }

            const dataPoint = data[m];
            if (!dataPoint) {
              return (
                <text
                  key={m}
                  x={x + barW / 2}
                  y={chartH + 13}
                  textAnchor="middle"
                  className="fill-black/20"
                  style={{ fontSize: 9 }}
                >
                  {MONTH_LABELS[m]}
                </text>
              );
            }

            const isActive = activeMonths[m];
            const rawH = ((dataPoint.value - yMin) / yRange) * chartH;
            const minH = isActive ? 2 : 12;
            const renderedH = Math.max(rawH, minH);
            const y = chartH - renderedH;
            const color = isActive ? barColor(dataPoint.value, m) : PLACEHOLDER_COLOR;
            const rx = Math.min(8, renderedH / 2);
            const isHovered = hovered === m;

            return (
              <g
                key={m}
                onMouseEnter={() => setHovered(m)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setHovered((prev) => (prev === m ? null : m))}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={renderedH}
                  rx={rx}
                  fill={color}
                  opacity={isHovered ? 0.85 : 1}
                />
                <text
                  x={x + barW / 2}
                  y={chartH + 13}
                  textAnchor="middle"
                  className={isHovered ? "fill-black/70" : "fill-black/35"}
                  style={{ fontSize: 9 }}
                >
                  {MONTH_LABELS[m]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hovered !== null && hoveredPoint && (
          <div
            className="absolute pointer-events-none bg-white rounded-[20px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] border border-black/5 px-3 py-2 whitespace-nowrap z-10"
            style={{
              left: `${(((padX + slot * hovered + slot / 2)) / chartW) * 100}%`,
              top: `${((chartH - ((hoveredPoint.value - yMin) / yRange) * chartH) / svgH) * 100}%`,
              transform: "translate(-50%, calc(-100% - 8px))",
            }}
          >
            <p className="text-[10px] text-black/40 leading-none">
              {MONTH_FULL[hovered]} {year}
            </p>
            <p className="text-sm font-bold tabular-nums text-black leading-tight mt-1">
              {formatRupiah(hoveredPoint.value)}
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
        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00C610]" />
            <span className="text-[10px] text-black/40">Growth</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#B25B00]" />
            <span className="text-[10px] text-black/40">Stable</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D8000C]" />
            <span className="text-[10px] text-black/40">Decline</span>
          </span>
        </div>
      )}
    </div>
  );
}
