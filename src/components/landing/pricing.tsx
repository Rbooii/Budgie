import Link from "next/link";
import { formatRupiah } from "@/lib/format";

const FIRST_MONTH = 24_500;
const REGULAR = 49_000;

const PLUS_INCLUDES = [
  "A Plus badge on your profile",
  "Support independent development",
  "Cancel anytime. No lock-in.",
] as const;

/**
 * Honest pricing: every feature is free; Plus is optional support, not a
 * paywall. Plain ruled columns, no cards, no badges.
 */
export function Pricing() {
  return (
    <section id="pricing">
      <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <h2 className="max-w-[12ch] font-serif text-[clamp(2.5rem,5.6vw,5rem)] font-light leading-[1.05] tracking-[-0.02em] text-ink lg:col-span-7">
            Free to use. Plus if you want to keep it going.
          </h2>
          <p className="max-w-md text-[17px] leading-[26px] text-ink/60 lg:col-span-5 lg:justify-self-end">
            Every feature is free. Plus is optional support.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
          <div className="pt-8">
            <h3 className="font-serif text-2xl text-ink">Free</h3>
            <p className="mt-5 font-serif text-5xl leading-none tracking-[-0.03em] text-ink">
              {formatRupiah(0)}
            </p>
            <p className="mt-5 max-w-sm text-[17px] leading-[26px] text-ink/60">
              Every Budgie feature: accounts, transactions, budgets, savings,
              the assistant, and PDF export.
            </p>
            <Link
              href="/sign-in"
              className="mt-8 inline-flex h-10 items-center justify-center rounded-full border border-ink/20 px-4 text-sm font-medium text-ink transition-colors hover:bg-ink/5"
            >
              Start free
            </Link>
          </div>

          <div className="pt-8">
            <h3 className="font-serif text-2xl text-brand">Plus</h3>
            <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-serif text-5xl leading-none tracking-[-0.03em] text-ink">
                {formatRupiah(FIRST_MONTH)}
              </p>
              <p className="text-sm text-ink/35 line-through tabular-nums">
                {formatRupiah(REGULAR)}
              </p>
            </div>
            <p className="mt-2 text-xs text-ink/45">
              First month, then {formatRupiah(REGULAR)} per month.
            </p>
            <p className="mt-5 max-w-sm text-[17px] leading-[26px] text-ink/60">
              A Plus badge on your profile, and the knowledge that you are
              supporting independent development. Cancel anytime.
            </p>
            <ul className="mt-6 space-y-2.5">
              {PLUS_INCLUDES.map((item) => (
                <li key={item} className="text-sm text-ink/70">
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/sign-in"
              className="mt-8 inline-flex h-10 items-center justify-center rounded-full bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand/90"
            >
              Support Budgie
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
