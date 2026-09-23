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
}

/**
 * Mini balance-history line for account cards — iOS `Sparkline.swift` parity:
 * the path is drawn in real pixel geometry (measured container width, 2.5px
 * stroke) and revealed with a left-to-right wipe. Never use a dash-based draw
 * here: `stroke-dasharray` is resolved in host space under the (previously
 * present) `non-scaling-stroke`, which rendered the line dotted.
 */
export function Sparkline({ values, color, className }: SparklineProps) {
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

  let d: string;
  if (single) {
    const y = HEIGHT * 0.6;
    d = `M0,${y} L${width},${y}`;
  } else {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const innerWidth = Math.max(width - inset * 2, 1);
    const innerHeight = HEIGHT - inset * 2;
    d = values
      .map((value, index) => {
        const x = inset + (innerWidth * index) / (values.length - 1);
        const normalized = range === 0 ? 0.5 : (value - min) / range;
        const y = inset + innerHeight * (1 - normalized);
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }

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
      </svg>
    </div>
  );
}
