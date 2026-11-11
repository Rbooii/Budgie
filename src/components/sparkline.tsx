"use client";

import { useEffect, useRef, useState } from "react";

const HEIGHT = 44;
const LINE_WIDTH = 2.5;
/** SSR/jsdom fallback before the container has been measured. */
const DEFAULT_WIDTH = 100;

interface SparklineProps {
  values: number[];
  color: string;
  className?: string;
  /** `paper` adds a faint grid, a sketchier curve, and an end dot. */
  variant?: "plain" | "paper";
}

type Point = { x: number; y: number };

function buildPaperPath(points: Point[]) {
  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    }
    const previous = points[index - 1];
    const control = (previous.x + point.x) / 2;
    return `${path} C${control.toFixed(2)},${previous.y.toFixed(2)} ${control.toFixed(2)},${point.y.toFixed(2)} ${point.x.toFixed(2)},${point.y.toFixed(2)}`;
  }, "");
}

/**
 * Mini balance-history line for account cards — iOS `Sparkline.swift` parity:
 * the path is drawn in real pixel geometry (measured container width, 2.5px
 * stroke) and revealed with a left-to-right wipe. Never use a dash-based draw
 * here: `stroke-dasharray` is resolved in host space under the (previously
 * present) `non-scaling-stroke`, which rendered the line dotted.
 */
export function Sparkline({
  values,
  color,
  className,
  variant = "plain",
}: SparklineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const next = Math.round(el.getBoundingClientRect().width);
      if (next > 0) setWidth(next);
    };
    measure();
    if (typeof ResizeObserver === "function") {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const single = values.length < 2;
  const inset = LINE_WIDTH;
  const innerWidth = Math.max(width - inset * 2, 1);
  const innerHeight = HEIGHT - inset * 2;

  let d: string;
  let points: Point[] = [];

  if (single) {
    const y = HEIGHT * 0.6;
    d = `M0,${y} L${width},${y}`;
  } else {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    points = values.map((value, index) => {
      const x = inset + (innerWidth * index) / (values.length - 1);
      const normalized = range === 0 ? 0.5 : (value - min) / range;
      const jitter =
        variant === "paper" ? Math.sin(index * 12.9898) * 0.8 : 0;
      const y = Math.min(
        HEIGHT - inset,
        Math.max(
          inset,
          inset + innerHeight * (1 - normalized) + jitter,
        ),
      );
      return { x, y };
    });

    d =
      variant === "paper"
        ? buildPaperPath(points)
        : points
            .map(
              (point, index) =>
                `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`,
            )
            .join(" ");
  }

  const last = points[points.length - 1];

  return (
    <div ref={ref} className={className}>
      <svg
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className="spark-reveal block h-full w-full"
        aria-hidden="true"
      >
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={LINE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={single ? "4 5" : undefined}
          opacity={single ? 0.3 : undefined}
        />

        {variant === "paper" && last && (
          <circle cx={last.x} cy={last.y} r="2.4" fill={color} />
        )}
      </svg>
    </div>
  );
}
