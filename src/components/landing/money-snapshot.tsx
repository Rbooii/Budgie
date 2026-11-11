"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import CashflowCard from "@/components/cashflow-card";
import { BudgetSummaryCards } from "@/components/budget-summary-cards";
import {
  TransactionItem,
  type TransactionRow,
} from "@/components/transaction-item";
import { NaniteField } from "./nanite-field";

type CardType = "income" | "expense" | "summary" | "budget";
type Slot = { x: number; y: number };
type CompositionCard = {
  id: string;
  type: CardType;
  slot: number;
  jitterX: number;
  jitterY: number;
  z: number;
  floatX: number;
  floatY: number;
  floatRotate: number;
  floatDuration: number;
  floatDelay: number;
};
type Composition = {
  key: number;
  cards: CompositionCard[];
  search: { x: number; y: number; key: number };
};

const COMPOSITION_MS = 4600;
const FULL_POOL: CardType[] = ["income", "expense", "summary", "budget"];
const COMPACT_POOL: CardType[] = ["income", "expense", "budget"];

const SLOTS: Record<number, Slot[]> = {
  1: [{ x: 50, y: 50 }],
  2: [
    { x: 50, y: 28 },
    { x: 50, y: 72 },
  ],
  3: [
    { x: 50, y: 20 },
    { x: 50, y: 50 },
    { x: 50, y: 80 },
  ],
};

const INCOME_ROWS: TransactionRow[] = [
  {
    id: "hero-income-1",
    name: "Salary",
    amount: 8_000_000,
    type: "income",
    category: "Salary",
    date: new Date("2026-11-01T09:00:00"),
    adminFee: 0,
    balanceAccountId: "bca",
    toBalanceAccountId: null,
    balanceAccount: { id: "bca", name: "BCA", currency: "IDR" },
    toBalanceAccount: null,
  },
  {
    id: "hero-income-2",
    name: "Freelance",
    amount: 1_500_000,
    type: "income",
    category: "Freelance",
    date: new Date("2026-11-02T14:30:00"),
    adminFee: 0,
    balanceAccountId: "bca",
    toBalanceAccountId: null,
    balanceAccount: { id: "bca", name: "BCA", currency: "IDR" },
    toBalanceAccount: null,
  },
];

const EXPENSE_ROWS: TransactionRow[] = [
  {
    id: "hero-expense-1",
    name: "Groceries",
    amount: 420_000,
    type: "expense",
    category: "FoodAndDrink",
    date: new Date("2026-11-03T18:30:00"),
    adminFee: 0,
    balanceAccountId: "cash",
    toBalanceAccountId: null,
    balanceAccount: { id: "cash", name: "Cash", currency: "IDR" },
    toBalanceAccount: null,
  },
  {
    id: "hero-expense-2",
    name: "Transport",
    amount: 85_000,
    type: "expense",
    category: "Transportation",
    date: new Date("2026-11-04T08:15:00"),
    adminFee: 0,
    balanceAccountId: "wallet",
    toBalanceAccountId: null,
    balanceAccount: { id: "wallet", name: "E-wallet", currency: "IDR" },
    toBalanceAccount: null,
  },
];

function TransactionCard({
  title,
  total,
  rows,
}: {
  title: string;
  total: string;
  rows: TransactionRow[];
}) {
  return (
    <div className="flex min-h-[260px] flex-col rounded-[24px] border border-hairline bg-card p-4 [corner-shape:squircle]">
      <p className="text-[12px] text-ink/45">{title}</p>
      <p className="mt-2 font-sans text-[28px] font-semibold tracking-[-0.03em] tabular-nums text-ink">
        {total}
      </p>
      <div className="mt-auto -mx-2 space-y-1">
        {rows.map((row) => (
          <TransactionItem key={row.id} transaction={row} hideChevron />
        ))}
      </div>
    </div>
  );
}

const CARD_CONTENT: Record<CardType, ReactNode> = {
  income: (
    <TransactionCard title="Money in" total="+Rp 9.500.000" rows={INCOME_ROWS} />
  ),
  expense: (
    <TransactionCard
      title="Money out"
      total="-Rp 505.000"
      rows={EXPENSE_ROWS}
    />
  ),
  summary: (
    <CashflowCard
      title="This Month's Cashflow"
      date="November 2026"
      income={8_000_000}
      expense={3_240_000}
    />
  ),
  budget: (
    <BudgetSummaryCards
      monthly={{ total: 3_000_000, spent: 2_360_000, count: 4 }}
      daily={{ total: 0, spent: 0, count: 0 }}
    />
  ),
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeComposition(key: number): Composition {
  const roll = Math.random();
  const count = roll < 0.33 ? 1 : roll < 0.72 ? 2 : 3;
  const pool = count === 3 ? COMPACT_POOL : FULL_POOL;
  const types = shuffle(pool).slice(0, count);
  const slots = SLOTS[count];

  const cards = types.map((type, index) => ({
    id: `${key}-${type}-${index}`,
    type,
    slot: index,
    jitterX: Math.round((Math.random() - 0.5) * 16),
    jitterY: Math.round((Math.random() - 0.5) * 16),
    z: 1 + Math.floor(Math.random() * 3),
    floatX: Math.round((Math.random() - 0.5) * 36),
    floatY: Math.round((Math.random() - 0.5) * 28),
    floatRotate: Math.round((Math.random() - 0.5) * 14) / 10,
    floatDuration: 5000 + Math.round(Math.random() * 3000),
    floatDelay: -Math.round(Math.random() * 5000),
  }));

  const searchCard = cards[Math.floor(Math.random() * cards.length)];
  const searchSlot = slots[searchCard.slot];

  return {
    key,
    cards,
    search: { x: searchSlot.x / 100, y: searchSlot.y / 100, key },
  };
}

const INITIAL_COMPOSITION: Composition = {
  key: 0,
  cards: [
    {
      id: "initial-income",
      type: "income",
      slot: 0,
      jitterX: 0,
      jitterY: 0,
      z: 1,
      floatX: 12,
      floatY: -8,
      floatRotate: 0.5,
      floatDuration: 6500,
      floatDelay: 0,
    },
    {
      id: "initial-summary",
      type: "summary",
      slot: 1,
      jitterX: 0,
      jitterY: 0,
      z: 2,
      floatX: -12,
      floatY: 8,
      floatRotate: -0.5,
      floatDuration: 7500,
      floatDelay: -1800,
    },
  ],
  search: {
    x: SLOTS[2][1].x / 100,
    y: SLOTS[2][1].y / 100,
    key: 0,
  },
};

function scaleFor(count: number) {
  if (count === 1) return "scale-[0.78] sm:scale-[0.72]";
  if (count === 2) return "scale-[0.55] sm:scale-[0.56]";
  return "scale-[0.55] sm:scale-[0.5]";
}

/**
 * A borderless dark stage in the hero. Every 4.6s it builds a random
 * composition of 1 to 3 real app components, scaled down and placed in loose
 * slots with jitter. The nanites roam, then briefly search toward one card.
 */
export function MoneySnapshot() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [composition, setComposition] = useState<Composition>(INITIAL_COMPOSITION);
  const [visible, setVisible] = useState(false);
  const [runId, setRunId] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    if (typeof IntersectionObserver === "undefined") {
      const id = window.setTimeout(() => {
        setVisible(true);
        setRunId((n) => n + 1);
      }, 0);
      return () => window.clearTimeout(id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setVisible(entry.isIntersecting);
          if (entry.isIntersecting) setRunId((n) => n + 1);
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || reduced) return;
    const id = window.setInterval(() => {
      setComposition((previous) => makeComposition(previous.key + 1));
    }, COMPOSITION_MS);
    return () => window.clearInterval(id);
  }, [visible, reduced]);

  const scaleClass = scaleFor(composition.cards.length);
  const search = {
    x: composition.search.x,
    y: composition.search.y,
    key: composition.search.key + runId * 100,
  };

  return (
    <div
      ref={stageRef}
      className="relative min-h-[520px] overflow-hidden sm:min-h-[560px]"
    >
      <div className="nanite-stage absolute inset-0 bg-transparent dark:bg-ink-field">
        <NaniteField
          search={search}
          className="absolute inset-0 block h-full w-full"
        />
      </div>

      <div
        className="hero-card-slot pointer-events-none absolute inset-0 z-10"
        data-visible={visible}
        data-composition={composition.key}
        inert
      >
        {composition.cards.map((card) => {
          const slot = SLOTS[composition.cards.length][card.slot];
          return (
            <div
              key={`${composition.key}-${card.id}-${runId}`}
              className="absolute"
              style={{
                left: `calc(${slot.x}% + ${card.jitterX}px)`,
                top: `calc(${slot.y}% + ${card.jitterY}px)`,
                zIndex: card.z,
                "--float-x": `${card.floatX}px`,
                "--float-y": `${card.floatY}px`,
                "--float-rotate": `${card.floatRotate}deg`,
                "--float-duration": `${card.floatDuration}ms`,
                "--float-delay": `${card.floatDelay}ms`,
              } as CSSProperties}
            >
              <div className="absolute -translate-x-1/2 -translate-y-1/2">
                <div className="hero-card-float">
                  <div className="hero-card">
                    <div className={`w-[460px] origin-center ${scaleClass}`}>
                      {CARD_CONTENT[card.type]}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .nanite-stage {
          -webkit-mask-image: radial-gradient(ellipse at center, black 78%, transparent 100%);
          mask-image: radial-gradient(ellipse at center, black 78%, transparent 100%);
        }
        .hero-card {
          opacity: 0;
        }
        .hero-card-slot[data-visible="true"] .hero-card {
          animation: heroCardCycle ${COMPOSITION_MS}ms ease-out both;
        }
        .hero-card-float {
          animation: heroCardFloat var(--float-duration, 8000ms) ease-in-out var(--float-delay, 0ms) infinite alternate;
        }
        .hero-card-slot[data-visible="false"] .hero-card-float {
          animation-play-state: paused;
        }
        @keyframes heroCardFloat {
          from { transform: translate3d(0, 0, 0) rotate(0deg); }
          to { transform: translate3d(var(--float-x, 10px), var(--float-y, -8px), 0) rotate(var(--float-rotate, 0.4deg)); }
        }
        @keyframes heroCardCycle {
          0% { opacity: 0; transform: translateY(14px) scale(0.94); filter: blur(8px); }
          10% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          82% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          100% { opacity: 0; transform: translateY(-10px) scale(0.97); filter: blur(6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-card,
          .hero-card-slot[data-visible="true"] .hero-card {
            opacity: 1;
            animation: none;
            transform: none;
            filter: none;
          }
          .hero-card-float {
            animation: none;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
