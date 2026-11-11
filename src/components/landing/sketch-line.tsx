"use client";

import { useInView } from "./use-in-view";

const W = 480;
const H = 220;
const PAD = { top: 28, right: 24, bottom: 30, left: 24 };

type LineColor = "ink" | "brand" | "expense" | "transfer";

interface SketchLineProps {
  values: number[];
  color?: LineColor;
  target?: number;
  targetLabel?: string;
  startLabel?: string;
  endLabel?: string;
  ariaLabel: string;
  className?: string;
}

const STROKE: Record<LineColor, string> = {
  ink: "var(--ink)",
  brand: "var(--brand)",
  expense: "var(--expense)",
  transfer: "var(--transfer)",
};

function buildPath(points: Array<{ x: number; y: number }>) {
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const control = (previous.x + point.x) / 2;
    return `${path} C ${control} ${previous.y}, ${control} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

/**
 * A line chart that reads like a pencil sketch on paper: a lightly jittered
 * ink line, a faint grid, a dashed target, and a left-to-right draw-in. This is
 * data visualization, not a decorative illustration.
 */
export function SketchLine({
  values,
  color = "ink",
  target,
  targetLabel = "target",
  startLabel,
  endLabel,
  ariaLabel,
  className,
}: SketchLineProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const stroke = STROKE[color];

  const series = values.length >= 2 ? values : [values[0] ?? 0, values[0] ?? 0];
  const min = Math.min(...series, target ?? Number.POSITIVE_INFINITY);
  const max = Math.max(...series, target ?? Number.NEGATIVE_INFINITY);
  const range = max - min || 1;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const points = series.map((value, index) => {
    const jitter = Math.sin(index * 12.9898) * 1.1;
    return {
      x: PAD.left + (index / (series.length - 1)) * plotW,
      y: PAD.top + (1 - (value - min) / range) * plotH + jitter,
    };
  });

  const last = points[points.length - 1];
  const targetY =
    target !== undefined
      ? PAD.top + (1 - (target - min) / range) * plotH
      : null;

  return (
    <div ref={ref} data-inview={inView} className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="sketch-reveal h-auto w-full"
        role="img"
        aria-label={ariaLabel}
      >
        <line
          x1={PAD.left}
          y1={H - PAD.bottom}
          x2={W - PAD.right}
          y2={H - PAD.bottom}
          stroke="var(--ink)"
          strokeOpacity="0.25"
          strokeWidth="1"
        />

        {targetY !== null && (
          <>
            <line
              x1={PAD.left}
              y1={targetY}
              x2={W - PAD.right}
              y2={targetY}
              stroke="var(--ink)"
              strokeOpacity="0.35"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
            <text
              x={PAD.left}
              y={targetY - 7}
              className="fill-ink/40"
              style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10 }}
            >
              {targetLabel}
            </text>
          </>
        )}

        <path
          d={buildPath(points)}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={last.x} cy={last.y} r="3" fill={stroke} />

        {startLabel && (
          <text
            x={PAD.left}
            y={H - 8}
            className="fill-ink/40"
            style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10 }}
          >
            {startLabel}
          </text>
        )}
        {endLabel && (
          <text
            x={W - PAD.right}
            y={H - 8}
            textAnchor="end"
            className="fill-ink/40"
            style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10 }}
          >
            {endLabel}
          </text>
        )}
      </svg>

      <style>{`
        .sketch-reveal {
          clip-path: inset(0 100% 0 0);
          transition: clip-path 900ms ease-out;
        }
        [data-inview="true"] .sketch-reveal {
          clip-path: inset(0 0 0 0);
        }
        @media (prefers-reduced-motion: reduce) {
          .sketch-reveal {
            clip-path: inset(0);
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
