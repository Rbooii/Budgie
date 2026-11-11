import { SketchLine } from "./sketch-line";

const SPENDING = [0.82, 0.91, 0.86, 0.98, 1.02, 0.94, 1.08, 1.12, 1.04, 1.18, 1.16, 1.24];

/**
 * Financial literacy, without the lecture. One sketch line against a budget,
 * plus a single plain-language note.
 */
export function LearnSection() {
  return (
    <section id="learn">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-6">
          <h2 className="max-w-[12ch] font-serif text-[clamp(2.5rem,5.6vw,5rem)] font-light leading-[1.05] tracking-[-0.02em] text-ink">
            Money words, made plain.
          </h2>
          <p className="mt-6 max-w-xl text-[17px] leading-[26px] text-ink/65">
            Short notes on emergency funds, spending leaks, and the difference
            between a need and a habit. No jargon, no lectures.
          </p>

          <div className="mt-8 max-w-md">
            <p className="font-serif text-xl leading-snug text-ink">
              An emergency fund is usually three to six months of essential
              spending.
            </p>
            <p className="mt-3 text-sm text-ink/45">A note from Budgie.</p>
          </div>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <div className="rounded-[20px] border border-hairline bg-card p-6 [corner-shape:squircle] sm:rounded-[24px]">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-[13px] text-ink/45">Food &amp; Drink</p>
              <p className="font-sans text-sm font-semibold tabular-nums text-ink">
                Rp 1.240.000
              </p>
            </div>
            <SketchLine
              values={SPENDING}
              color="expense"
              target={1.5}
              targetLabel="budget"
              startLabel="12 weeks ago"
              endLabel="now"
              ariaLabel="Spending line chart against a budget line"
              className="mt-4"
            />
            <p className="mt-4 text-xs text-ink/45">
              The dashed line is the budget. The line is what you spent.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
