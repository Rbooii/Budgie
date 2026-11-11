"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BalanceSection } from "@/components/balance-section";
import { BalanceVisibilityContext } from "@/components/balance-visibility";
import { BudgetSummaryCards } from "@/components/budget-summary-cards";
import CashflowCard from "@/components/cashflow-card";
import { SpendingStreamsChart } from "@/components/spending-streams-chart";

const SPENDING = [
  { category: "FoodAndDrink", spent: 1_240_000 },
  { category: "Transportation", spent: 420_000 },
  { category: "Shopping", spent: 380_000 },
  { category: "Entertainment", spent: 320_000 },
] as const;

const BUDGETS = [
  { category: "FoodAndDrink", amount: 1_500_000 },
  { category: "Transportation", amount: 600_000 },
  { category: "Shopping", amount: 400_000 },
  { category: "Entertainment", amount: 500_000 },
] as const;

/**
 * The showcase is inert, so the eye toggle cannot be clicked. This wrapper
 * supplies a demo-local visibility state instead of the app-wide persisted
 * store: the balance starts masked, then reveals once through the real
 * per-character animation. It never changes the user's saved preference.
 */
function AutoRevealBalance({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(true);
  const [toggleCount, setToggleCount] = useState(0);
  const noop = useCallback(() => {}, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setHidden(false);
      setToggleCount(1);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <BalanceVisibilityContext.Provider
      value={{ hidden, toggle: noop, toggleCount }}
    >
      {children}
    </BalanceVisibilityContext.Provider>
  );
}

const STEPS = [
  {
    id: "balance",
    title: "See your balance.",
    body: "Every account in one number. Hidden by default in the app.",
    content: (
      <div>
        <AutoRevealBalance>
          <BalanceSection
            value={24_680_000}
            deltaPct={5.2}
            deltaAbsolute={1_240_000}
          />
        </AutoRevealBalance>
        <p className="mt-4 text-xs text-ink/45">
          Revealed here for the demo.
        </p>
      </div>
    ),
  },
  {
    id: "budget",
    title: "Give the month a shape.",
    body: "A budget summary and the categories behind it.",
    content: (
      <div className="space-y-6">
        <BudgetSummaryCards
          monthly={{ total: 3_000_000, spent: 2_360_000, count: 4 }}
          daily={{ total: 0, spent: 0, count: 0 }}
        />
        <SpendingStreamsChart
          data={[...SPENDING]}
          budgets={[...BUDGETS]}
          monthLabel="November 2026"
          variant="bare"
        />
      </div>
    ),
  },
  {
    id: "cashflow",
    title: "See where it went.",
    body: "Income and expenses, from the same transactions.",
    content: (
      <CashflowCard
        title="This Month's Cashflow"
        date="November 2026"
        income={8_000_000}
        expense={3_240_000}
      />
    ),
  },
] as const;

/**
 * Real product components on a paper stage. The wrapper adds a paper-sheet
 * reveal; the components themselves keep their app behavior and data flow.
 */
export function ProductStory() {
  const [active, setActive] = useState(0);
  const panels = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.step);
          if (!Number.isNaN(index)) setActive(index);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    for (const panel of panels.current) {
      if (panel) observer.observe(panel);
    }
    return () => observer.disconnect();
  }, []);

  const step = STEPS[active];

  return (
    <section id="live">
      <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="max-w-2xl">
          <h2 className="max-w-[12ch] font-serif text-[clamp(2.5rem,5.6vw,5rem)] font-light leading-[1.05] tracking-[-0.02em] text-ink">
            See it work.
          </h2>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-10">
          <div className="hidden lg:col-span-5 lg:block">
            <div className="lg:sticky lg:top-24">
              <div
                key={step.id}
                className="animate-[stepText_0.3s_ease-out] motion-reduce:animate-none"
              >
                <h3 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-light leading-[1.08] tracking-[-0.02em] text-ink">
                  {step.title}
                </h3>
                <p className="mt-5 max-w-md text-[17px] leading-[26px] text-ink/65">
                  {step.body}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {STEPS.map((item, index) => (
              <div
                key={item.id}
                ref={(el) => {
                  panels.current[index] = el;
                }}
                data-step={index}
                className="flex min-h-[55vh] flex-col justify-center py-10 lg:min-h-[65vh] lg:py-0"
              >
                <div className="mb-6 lg:hidden">
                  <h3 className="font-serif text-3xl font-light leading-tight text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-[24px] text-ink/65">
                    {item.body}
                  </p>
                </div>
                <div
                  className="paper-sheet mx-auto w-full max-w-xl"
                  data-active={active === index}
                  inert
                >
                  {item.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes stepText {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 1024px) {
          .paper-sheet {
            clip-path: inset(0 0 100% 0);
            opacity: 0;
            transform: translateY(10px);
            transition: clip-path 600ms ease-out, opacity 600ms ease-out, transform 600ms ease-out;
          }
          .paper-sheet[data-active="true"] {
            clip-path: inset(0 0 0 0);
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .paper-sheet {
            clip-path: inset(0);
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
