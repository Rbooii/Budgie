"use client";

import { useEffect, useRef, useState } from "react";
import { TransactionItem } from "@/components/transaction-item";
import type { TransactionRow } from "@/components/transaction-item";
import { AnimatedCounter } from "./animated-counter";
import { TiltCard } from "./tilt";
import { MOCK_GROWTH, MOCK_LIVE_POOL } from "./mock-data";

const LIVE_INTERVAL_MS = 4000;

export function HeroPreview() {
  const [peek, setPeek] = useState<TransactionRow | null>(
    () => MOCK_LIVE_POOL[0] ?? null,
  );
  const poolIdxRef = useRef(1 % Math.max(MOCK_LIVE_POOL.length, 1));
  const frameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prefersReduced =
      (typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) ??
      true;
    if (prefersReduced) return;

    const id = window.setInterval(() => {
      const next = MOCK_LIVE_POOL[poolIdxRef.current % MOCK_LIVE_POOL.length];
      poolIdxRef.current += 1;
      setPeek(next ?? null);
    }, LIVE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  // Subtle scroll-linked parallax — frame drifts up slightly as the hero
  // scrolls out of view. Skipped entirely under reduced motion.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const prefersReduced =
      (typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) ??
      true;
    if (prefersReduced || typeof window === "undefined") return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = frame.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const progress = Math.min(Math.max(-rect.top / viewportH, 0), 1);
      frame.style.transform = `translateY(${-progress * 16}px)`;
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={frameRef}
      className="select-none w-full motion-reduce:transform-none"
    >
      <TiltCard className="rounded-[35px]">
        <div className="rounded-[35px] border border-black/[0.06] bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)] p-6 sm:p-8">
        {/* Net worth hero */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-black/50">Your Net Worth</p>
            <p className="text-3xl font-bold tracking-tight tabular-nums text-black mt-1">
              <AnimatedCounter
                value={MOCK_GROWTH.currentTotal}
                prefix={"Rp\u00A0"}
                decimals={2}
              />
            </p>
            <p className="text-xs text-black/30 mt-1">December 2026</p>
          </div>
          <span className="rounded-full bg-[#A0FFA8]/30 text-[#1F9B29] text-xs font-semibold px-2.5 py-1 tabular-nums whitespace-nowrap">
            +12.4% MoM
          </span>
        </div>

        {/* Live transaction — the signature moment */}
        <div className="mt-6 pt-6 border-t border-black/[0.04]">
          <div className="flex items-center gap-2 mb-3 px-2">
            <p className="text-xs text-black/40">Recent</p>
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#00C610] animate-[qrPulse_2.4s_ease-in-out_infinite] motion-reduce:animate-none"
              aria-hidden="true"
            />
            <span className="text-[10px] font-medium text-[#1F9B29] uppercase tracking-wide motion-reduce:hidden">
              Live
            </span>
          </div>
          <div
            key={peek?.id ?? "empty"}
            className="animate-[stepReveal_0.2s_ease-out] motion-reduce:animate-none"
          >
            {peek && <TransactionItem transaction={peek} />}
          </div>
        </div>
        </div>
      </TiltCard>
    </div>
  );
}