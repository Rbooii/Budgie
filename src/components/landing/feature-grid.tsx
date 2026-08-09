import {
  ArrowRightLeft,
  Target,
  RefreshCw,
  Wallet,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { Reveal } from "./reveal";
import { SpotlightCard } from "./spotlight";

type Tint = "income" | "expense" | "transfer";

const TINT_CLASS: Record<Tint, string> = {
  income: "bg-[#A0FFA8]/30 text-[#1F9B29]",
  expense: "bg-[#FFBABA]/40 text-[#D8000C]",
  transfer: "bg-[#FFD9A0]/40 text-[#B25B00]",
};

interface Feature {
  icon: React.ReactNode;
  tint: Tint;
  title: string;
  desc: string;
}

const FEATURES: Feature[] = [
  {
    icon: <ArrowRightLeft className="w-5 h-5" />,
    tint: "income",
    title: "Transactions",
    desc: "Log income, expenses, and transfers. Balances update automatically with every entry.",
  },
  {
    icon: <Target className="w-5 h-5" />,
    tint: "expense",
    title: "Budgets",
    desc: "Set category-level spending limits and watch your progress bars fill in real time.",
  },
  {
    icon: <RefreshCw className="w-5 h-5" />,
    tint: "transfer",
    title: "Subscriptions",
    desc: "Track recurring charges and never be surprised by a billing date again.",
  },
  {
    icon: <Wallet className="w-5 h-5" />,
    tint: "income",
    title: "Multiple accounts",
    desc: "Bank, e-wallet, and cash accounts live side by side with live balances.",
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    tint: "transfer",
    title: "Insights",
    desc: "Cashflow donuts, asset-growth bars, and per-category spending streams at a glance.",
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    tint: "income",
    title: "Privacy first",
    desc: "Balances hide by default with a per-character reveal. Your money stays yours to show.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-screen-xl px-5 sm:px-8 py-20 sm:py-28">
      <Reveal className="max-w-2xl">
        <p className="text-sm font-semibold text-[#00C610]">Everything in one place</p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-black mt-2">
          A calm home for your money
        </h2>
        <p className="text-base text-black/45 mt-3 leading-relaxed">
          Budgie brings your accounts, transactions, budgets, and subscriptions together
          with quiet, focused design that lets the numbers do the talking.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-12">
        {FEATURES.map((f, i) => (
          <Reveal
            key={f.title}
            delay={(i % 3) * 70}
            className="h-full"
          >
            <SpotlightCard className="h-full rounded-[35px] border border-black/[0.06] bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] p-6 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_12px_36px_-12px_rgba(0,0,0,0.14)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)]">
              <span
                className={`w-12 h-12 rounded-full flex items-center justify-center ${TINT_CLASS[f.tint]} transition-transform duration-200 ease-out group-hover/spot:scale-110 motion-reduce:transition-none motion-reduce:group-hover/spot:scale-100`}
              >
                {f.icon}
              </span>
              <h3 className="text-lg font-semibold text-black mt-5">{f.title}</h3>
              <p className="text-sm text-black/45 mt-1.5 leading-relaxed">{f.desc}</p>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}