import CashflowCard from "@/components/cashflow-card";
import AssetGrowthCard from "@/components/asset-growth-card";
import { SpendingStreamsChart } from "@/components/spending-streams-chart";
import { TransactionItem } from "@/components/transaction-item";
import { Reveal } from "./reveal";
import {
  MOCK_CASHFLOW,
  MOCK_GROWTH,
  MOCK_TRANSACTIONS,
  MOCK_SPENDING_STREAMS,
  MOCK_SPENDING_BUDGETS,
} from "./mock-data";
import { formatRupiah } from "@/lib/format";

type Tint = "income" | "expense" | "transfer";
const DOT_CLASS: Record<Tint, string> = {
  income: "bg-[#1F9B29]",
  expense: "bg-[#D8000C]",
  transfer: "bg-[#B25B00]",
};

interface ShowcaseRowProps {
  id?: string;
  reverse?: boolean;
  tint: Tint;
  eyebrow: string;
  title: string;
  desc: string;
  bullets: string[];
  visual: React.ReactNode;
}

function ShowcaseRow({
  id,
  reverse = false,
  tint,
  eyebrow,
  title,
  desc,
  bullets,
  visual,
}: ShowcaseRowProps) {
  return (
    <section id={id} className="mx-auto max-w-screen-xl px-5 sm:px-8 py-20 sm:py-24">
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
          reverse ? "lg:[&>*:first-child]:order-2" : ""
        }`}
      >
        <Reveal>
          <p className="text-sm font-semibold text-[#00C610]">{eyebrow}</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-black mt-2">
            {title}
          </h2>
          <p className="text-base text-black/45 mt-3 leading-relaxed">{desc}</p>
          <ul className="mt-6 flex flex-col gap-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${DOT_CLASS[tint]}`}
                  aria-hidden="true"
                />
                <span className="text-sm text-black/70 leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={120}>
          <div className="pointer-events-none select-none">{visual}</div>
        </Reveal>
      </div>
    </section>
  );
}

export function Showcase() {
  return (
    <>
      <ShowcaseRow
        tint="income"
        eyebrow="Transactions"
        title="Every rupiah, in its place"
        desc="Three clean types — income, expense, and transfer — with auto-balanced accounts and a tidy timeline grouped by day."
        bullets={[
          "Balances update automatically on create and delete",
          "Transfers move between accounts, debiting the source and crediting the destination",
          "Search, group, and export to PDF for your records",
        ]}
        visual={
          <div className="rounded-[35px] border border-black/[0.06] bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)] p-5 sm:p-6">
            <div className="flex items-center justify-between pb-4">
              <p className="text-xs text-black/40">Recent activity</p>
              <p className="text-xs text-black/30">Today</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {MOCK_TRANSACTIONS.map((t) => (
                <TransactionItem key={t.id} transaction={t} />
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between rounded-[20px] bg-[#F2F2F2] px-5 py-4">
              <p className="text-xs text-black/50 font-semibold">Net this month</p>
              <p className="text-base font-bold tabular-nums text-[#1F9B29]">
                {formatRupiah(MOCK_CASHFLOW.income - MOCK_CASHFLOW.expense)}
              </p>
            </div>
          </div>
        }
      />

      <ShowcaseRow
        reverse
        id="showcase-budgets"
        tint="expense"
        eyebrow="Budgets"
        title="Limits that keep you honest"
        desc="Set a budget per category and watch how much you've spent against your limit, with a clear tick marker when you're near the edge."
        bullets={[
          "Daily, weekly, monthly, or any custom period",
          "One budget per category — no clutter",
          "Live spending bars turn red the moment you go over",
        ]}
        visual={
          <div className="rounded-[35px] border border-black/[0.06] bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)] p-5 sm:p-6">
            <SpendingStreamsChart
              data={MOCK_SPENDING_STREAMS}
              budgets={MOCK_SPENDING_BUDGETS}
              monthLabel="December 2026"
            />
          </div>
        }
      />

      <ShowcaseRow
        id="insights"
        tint="transfer"
        eyebrow="Insights"
        title="See where you're headed"
        desc="A cashflow donut and a twelve-month asset-growth chart turn raw transactions into a story you can actually read."
        bullets={[
          "Income vs expense at a glance, month over month",
          "Cumulative asset trajectory with hover tooltips",
          "Stays calm even when the numbers are big",
        ]}
        visual={
          <div className="grid grid-cols-1 gap-3">
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
        }
      />
    </>
  );
}