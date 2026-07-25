"use client";

import { useEffect, useRef, useState } from "react";
import CashflowCard from "@/components/cashflow-card";
import AssetGrowthCard from "@/components/asset-growth-card";
import { TransactionItem } from "@/components/transaction-item";
import type { TransactionRow } from "@/components/transaction-item";
import { AnimatedCounter } from "./animated-counter";
import {
  MOCK_CASHFLOW,
  MOCK_GROWTH,
  MOCK_TRANSACTIONS,
  MOCK_ACCOUNTS,
  MOCK_LIVE_POOL,
} from "./mock-data";
import { formatRupiah } from "@/lib/format";

const ACCOUNT_TAG_CLASS: Record<string, string> = {
  bank: "text-[#1F9B29]",
  ewallet: "text-[#B25B00]",
  cash: "text-[#D8000C]",
};

const PEEK_LIMIT = 3;
const LIVE_INTERVAL_MS = 4000;

export function HeroPreview() {
  const [peek, setPeek] = useState<TransactionRow[]>(() => MOCK_TRANSACTIONS.slice(0, PEEK_LIMIT));
  const poolIdxRef = useRef(0);
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
      setPeek((prev) => [next, ...prev].slice(0, PEEK_LIMIT));
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
      className="pointer-events-none select-none w-full motion-reduce:transform-none"
    >
      <div className="rounded-[35px] border border-black/[0.06] bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)] p-6 sm:p-8">
        {/* Hero net worth block */}
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

        {/* Accounts strip */}
        <div className="grid grid-cols-3 gap-2 mt-6">
          {MOCK_ACCOUNTS.map((a) => (
            <div
              key={a.id}
              className="rounded-[20px] bg-[#F2F2F2] px-3 py-3 flex flex-col gap-0.5 min-w-0"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    ACCOUNT_TAG_CLASS[a.type] ?? "bg-black/30"
                  }`}
                  aria-hidden="true"
                />
                <p className="text-xs text-black/50 truncate">{a.name}</p>
              </div>
              <p className="text-sm font-bold tabular-nums text-black truncate">
                {formatRupiah(a.balance)}
              </p>
            </div>
          ))}
        </div>

        {/* Charts — stacked so both breathe */}
        <div className="grid grid-cols-1 gap-4 mt-6">
          <CashflowCard
            title={MOCK_CASHFLOW.title}
            date={MOCK_CASHFLOW.date}
            income={MOCK_CASHFLOW.income}
            expense={MOCK_CASHFLOW.expense}
          />
          <AssetGrowthCard
            year={MOCK_GROWTH.year}
            data={MOCK_GROWTH.data}
            startingValue={MOCK_GROWTH.startingValue}
            currentTotal={MOCK_GROWTH.currentTotal}
            currentMonth={MOCK_GROWTH.currentMonth}
            hasTransactions
            activeMonths={MOCK_GROWTH.activeMonths}
          />
        </div>

        {/* Live transactions */}
        <div className="mt-7">
          <div className="flex items-center gap-2 mb-2 px-2">
            <p className="text-xs text-black/40">Recent</p>
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#00C610] animate-[qrPulse_2.4s_ease-in-out_infinite] motion-reduce:animate-none"
              aria-hidden="true"
            />
            <span className="text-[10px] font-medium text-[#1F9B29] uppercase tracking-wide motion-reduce:hidden">
              Live
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {peek.map((t, idx) => (
              <div
                key={t.id}
                className={
                  idx > 0
                    ? ""
                    : "animate-[stepReveal_0.2s_ease-out] motion-reduce:animate-none"
                }
              >
                <TransactionItem transaction={t} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}