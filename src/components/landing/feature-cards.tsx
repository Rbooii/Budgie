import { SketchLine } from "./sketch-line";

const BALANCE = [18.2, 19.1, 18.8, 20.4, 21.0, 20.6, 22.3, 23.1, 22.8, 23.9, 24.2, 24.68];
const SAVINGS = [3.2, 3.8, 4.1, 4.9, 5.6, 5.2, 6.1, 6.8, 7.2, 7.8, 8.1, 8.4];
const SPENDING = [1.2, 1.8, 1.4, 2.1, 1.7, 2.4, 2.0, 2.8, 2.3, 3.0, 2.6, 3.24];

const CARDS = [
  {
    label: "Balance",
    value: "Rp 24.680.000",
    title: "Every account, one line.",
    body: "Checking, savings, cash, and e-wallets, drawn from the balance you already have.",
    color: "ink" as const,
    values: BALANCE,
    target: undefined,
    targetLabel: undefined,
    ariaLabel: "Balance history line chart, rising over twelve months",
  },
  {
    label: "Savings",
    value: "Rp 8.400.000",
    title: "Savings, in motion.",
    body: "A target on the paper, and a line that shows how close you are.",
    color: "brand" as const,
    values: SAVINGS,
    target: 12,
    targetLabel: "target",
    ariaLabel: "Savings history line chart with a target line",
  },
  {
    label: "Spending",
    value: "Rp 3.240.000",
    title: "Spending, without the guesswork.",
    body: "See the trend before the month ends, not after the money is gone.",
    color: "expense" as const,
    values: SPENDING,
    target: 4,
    targetLabel: "budget",
    ariaLabel: "Spending trend line chart against a budget line",
  },
] as const;

/**
 * Three sketch-line cards. The chart is the visual; no abstract images, no
 * badges, no decorative labels.
 */
export function FeatureCards() {
  return (
    <section id="product">
      <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <h2 className="max-w-[12ch] font-serif text-[clamp(2.5rem,5.6vw,5rem)] font-light leading-[1.05] tracking-[-0.02em] text-ink lg:col-span-7">
            Balance, budget, and the next step.
          </h2>
          <p className="max-w-md text-[17px] leading-[26px] text-ink/60 lg:col-span-5 lg:justify-self-end">
            Three lines drawn from the same money. No spreadsheets, no guessing.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
          {CARDS.map((card) => (
            <article key={card.label}>
              <div className="rounded-[20px] border border-hairline bg-card p-5 [corner-shape:squircle] sm:rounded-[24px]">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-[13px] text-ink/45">{card.label}</p>
                  <p className="font-sans text-sm font-semibold tabular-nums text-ink">
                    {card.value}
                  </p>
                </div>
                <SketchLine
                  values={[...card.values]}
                  color={card.color}
                  target={card.target}
                  targetLabel={card.targetLabel}
                  startLabel="12 months ago"
                  endLabel="now"
                  ariaLabel={card.ariaLabel}
                  className="mt-4"
                />
              </div>
              <h3 className="mt-4 text-[17px] font-semibold leading-snug text-ink">
                {card.title}
              </h3>
              <p className="mt-2 text-[15px] leading-[24px] text-ink/60">
                {card.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
