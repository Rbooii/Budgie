import Link from "next/link";
import { SketchLine } from "./sketch-line";

const SAVINGS = [3.2, 3.8, 4.1, 4.9, 5.6, 5.2, 6.1, 6.8, 7.2, 7.8, 8.1, 8.4];

/**
 * One editorial spread. The visual is a sketch line of savings history with a
 * target, not an abstract image.
 */
export function EditorialSection() {
  return (
    <section id="how">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-6">
          <h2 className="max-w-[12ch] font-serif text-[clamp(2.5rem,5.6vw,5rem)] font-light leading-[1.05] tracking-[-0.02em] text-ink">
            Saving is easier when you can see the line move.
          </h2>
          <div className="mt-8 max-w-xl space-y-4 text-[17px] leading-[26px] text-ink/65">
            <p>
              Set a target, add what you can, and watch the gap close. No
              projections, no promises, just the number you have today.
            </p>
            <p>
              Budgie also explains the basics in plain language, so the next
              month is easier than the last.
            </p>
          </div>
          <Link
            href="/sign-in"
            className="mt-8 inline-block text-sm text-ink underline decoration-ink/25 underline-offset-4 transition-colors hover:decoration-ink"
          >
            Start free
          </Link>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <div className="rounded-[20px] border border-hairline bg-card p-6 [corner-shape:squircle] sm:rounded-[24px]">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-[13px] text-ink/45">Savings history</p>
              <p className="font-sans text-sm font-semibold tabular-nums text-ink">
                Rp 8.400.000
              </p>
            </div>
            <SketchLine
              values={SAVINGS}
              color="brand"
              target={12}
              targetLabel="target"
              startLabel="12 months ago"
              endLabel="now"
              ariaLabel="Savings history line chart with a target line"
              className="mt-4"
            />
            <p className="mt-4 text-xs text-ink/45">
              The line is the balance. The dashed line is the target.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
