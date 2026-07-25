import Link from "next/link";
import { Check } from "lucide-react";
import { Reveal } from "./reveal";
import { formatRupiah } from "@/lib/format";

const FIRST_MONTH = 24_500;
const REGULAR = 49_000;

const PLUS_PERKS = [
  "Unlimited accounts, budgets, and subscriptions",
  "Asset-growth and cashflow insights",
  "Priority PDF exports",
  "Cancel anytime — no lock-in",
];

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-screen-xl px-5 sm:px-8 py-20 sm:py-28">
      <Reveal className="max-w-2xl">
        <p className="text-sm font-semibold text-[#00C610]">Simple pricing</p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-black mt-2">
          Free forever. Plus when you grow.
        </h2>
        <p className="text-base text-black/45 mt-3 leading-relaxed">
          Start with everything you need to track your money. Upgrade to Plus
          for deeper insights whenever you like.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-12">
        {/* Free tier */}
        <Reveal className="rounded-[35px] border border-black/[0.06] bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] p-6 sm:p-8 h-full flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums tracking-tight text-black">
              {formatRupiah(0)}
            </span>
            <span className="text-sm text-black/40">/month</span>
          </div>
          <p className="text-base font-semibold text-black mt-3">Free</p>
          <p className="text-sm text-black/45 mt-1.5">Everything you need to start.</p>
          <ul className="mt-6 flex flex-col gap-3 flex-1">
            {[
              "Up to 3 accounts",
              "Unlimited transactions",
              "Budgets and subscriptions",
            ].map((p) => (
              <li key={p} className="flex items-start gap-3">
                <Check className="w-4 h-4 text-[#1F9B29] shrink-0 mt-0.5" />
                <span className="text-sm text-black/70 leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/sign-in"
            className="mt-8 inline-flex items-center justify-center text-sm font-semibold py-[10px] px-[20px] rounded-[35px] bg-white text-black border border-black/10 hover:bg-[#F2F2F2] active:scale-[0.98] transition transform duration-150"
          >
            Start free
          </Link>
        </Reveal>

        {/* Plus tier */}
        <Reveal
          delay={90}
          className="rounded-[35px] border border-[#A0FFA8] bg-white shadow-[0_8px_30px_-12px_rgba(0,198,16,0.18)] p-6 sm:p-8 h-full flex flex-col"
        >
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-black">Budgie Plus</p>
            <span className="rounded-full bg-[#A0FFA8]/30 text-[#1F9B29] text-xs font-semibold px-2.5 py-1">
              50% off first month
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-bold tabular-nums tracking-tight text-[#1F9B29]">
              {formatRupiah(FIRST_MONTH)}
            </span>
            <span className="text-sm text-black/30 line-through tabular-nums">
              {formatRupiah(REGULAR)}
            </span>
            <span className="text-sm text-black/40">/month</span>
          </div>
          <p className="text-xs text-black/40 mt-1.5">
            Then {formatRupiah(REGULAR)} per month. Cancel anytime.
          </p>

          <ul className="mt-6 flex flex-col gap-3 flex-1">
            {PLUS_PERKS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <Check className="w-4 h-4 text-[#1F9B29] shrink-0 mt-0.5" />
                <span className="text-sm text-black/70 leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/sign-in"
            className="mt-8 inline-flex items-center justify-center text-lg font-semibold px-[20px] py-[6px] h-11 rounded-[35px] bg-[#00C610] text-white hover:bg-[#00B609] active:scale-[0.98] transition transform duration-150"
          >
            Get Budgie Plus
          </Link>
        </Reveal>
      </div>
    </section>
  );
}