"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The rotating hero pill — Notion's `productPillAnimation`, recreated 1:1.
 * A pastel rounded-rect capsule with a saturated square dot; the verb cycles
 * every 2.2s while the label's inline-size animates to hug the next word
 * (measured offscreen, exactly like Notion's `--pill-label-inline-size`).
 *
 * Colors are Notion's own pastel pairs (blue/green/orange/yellow/purple/teal
 * 200-bg + 500-dot). Under `prefers-reduced-motion` the first word renders
 * statically — no interval, no keyframes. All sizes are em-based so the pill
 * scales with the hero title's fluid clamp.
 */
const WORDS = [
  { label: "works", bg: "#d0f4d8", dot: "#1aae39" },
  { label: "grows", bg: "#bde6e4", dot: "#27918d" },
  { label: "rests", bg: "#eadbfa", dot: "#9849e8" },
  { label: "flows", bg: "#e6f3fe", dot: "#097fe8" },
  { label: "stays", bg: "#ffdec4", dot: "#ff6d00" },
] as const;

const ROTATE_MS = 2200;

export function HeroPill() {
  const [active, setActive] = useState(0);
  const [widths, setWidths] = useState<readonly number[]>([]);
  const [reduced, setReduced] = useState(false);
  const measureRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    const measure = () => {
      const el = measureRef.current;
      if (!el) return;
      setWidths(
        Array.from(el.children).map((c) => (c as HTMLElement).offsetWidth),
      );
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % WORDS.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(id);
  }, [reduced]);

  const word = WORDS[active];
  const measured = widths[active];

  return (
    <span
      className="relative inline-flex items-center gap-[0.18em] align-baseline rounded-[0.22em] px-[0.4em] py-[0.1em] text-[0.75em] font-medium leading-[1.21] tracking-[-0.0278em] whitespace-nowrap transition-colors duration-200 ease-out motion-reduce:transition-none"
      style={{ backgroundColor: word.bg }}
    >
      <span
        aria-hidden="true"
        className="size-[0.4em] shrink-0 self-center rounded-[0.08em] transition-colors duration-200 ease-out motion-reduce:transition-none"
        style={{ backgroundColor: word.dot }}
      />
      <span
        className="inline-block overflow-hidden whitespace-nowrap transition-[width] duration-200 ease-out motion-reduce:transition-none"
        style={measured ? { width: `${measured}px` } : undefined}
      >
        <span
          key={word.label}
          className="inline-block animate-[heroPillWord_0.2s_ease-out] motion-reduce:animate-none"
        >
          {word.label}
        </span>
      </span>

      {/* Offscreen word measurers — same font context, zero layout impact. */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 -z-10 opacity-0"
      >
        {WORDS.map((w) => (
          <span key={w.label} className="inline-block whitespace-nowrap">
            {w.label}
          </span>
        ))}
      </span>

      <style>{`
        @keyframes heroPillWord {
          from { opacity: 0; transform: translateY(0.35em); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </span>
  );
}
