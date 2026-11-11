import Link from "next/link";
import { HeroStatement } from "./hero-statement";
import { MoneySnapshot } from "./money-snapshot";

/**
 * The hero: a mixed sans/serif statement on the left and a static month
 * snapshot on the right. The snapshot replaces the old walkthrough video and
 * borrows Wise's clear, practical card without losing the paper register.
 */
export function Hero() {
  return (
    <section
      id="overview"
      className="mx-auto max-w-[1280px] px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24"
    >
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
        <div className="lg:col-span-7">
          <HeroStatement />

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/sign-in"
              className="inline-flex h-10 items-center justify-center rounded-full bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand/90"
            >
              Start free
            </Link>
            <Link
              href="/#live"
              className="text-sm text-ink underline decoration-ink/25 underline-offset-4 transition-colors hover:decoration-ink"
            >
              See how it works
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5">
          <MoneySnapshot />
        </div>
      </div>
    </section>
  );
}
