import Link from "next/link";

/**
 * A quiet endcap on paper, not a saturated block. One line, one CTA.
 */
export function Endcap() {
  return (
    <section className="bg-paper">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-12 lg:items-end">
        <h2 className="max-w-[12ch] font-serif text-[clamp(2.5rem,5.6vw,5rem)] font-light leading-[1.05] tracking-[-0.02em] text-ink lg:col-span-7">
          Start with what you have.
        </h2>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:col-span-5 lg:justify-end">
          <Link
            href="/sign-in"
            className="inline-flex h-10 items-center justify-center rounded-full bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand/90"
          >
            Start free
          </Link>
          <Link
            href="/#pricing"
            className="text-sm text-ink underline decoration-ink/25 underline-offset-4 transition-colors hover:decoration-ink"
          >
            See pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
