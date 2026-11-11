export const FAQ_ITEMS: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: "Is Budgie really free?",
    a: "Yes. Every feature is free. Accounts, transactions, budgets, savings, the assistant, and PDF export. Plus is optional support, not a paywall.",
  },
  {
    q: "What does Budgie Plus include?",
    a: "Budgie Plus is optional support. You get a Plus badge on your profile, and the knowledge that you are supporting independent development. Every feature stays free. Cancel anytime.",
  },
  {
    q: "Does Budgie work with Indonesian rupiah?",
    a: "Yes. Budgie is built for the rupiah. Every amount uses id-ID grouping and two decimals, and Plus checkout uses QRIS.",
  },
  {
    q: "How are my balances kept private?",
    a: "Balances are hidden behind bullets by default. Tap the eye to reveal each character with a short blur-in, capped at 260ms. The reveal honors your reduced-motion setting.",
  },
  {
    q: "Can I move money to savings?",
    a: "Yes. Create a savings account, then transfer money from checking. Both balances update at once, with an optional admin fee.",
  },
  {
    q: "Can I export my transactions?",
    a: "Yes. Download a clean, monochrome PDF for any date range from the transactions screen. No third-party tool required.",
  },
  {
    q: "What happens if I go over budget?",
    a: "Spending bars turn red when a category crosses its limit. A tick marks the limit on the chart. Nothing is blocked. Budgie informs, it never nags.",
  },
  {
    q: "How do transfers between accounts work?",
    a: "Transfers debit the source account and credit the destination, with an optional admin fee. Deleting a transfer reverses both sides automatically, so balances always reconcile.",
  },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title">
      <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <h2
            id="faq-title"
            className="max-w-[12ch] font-serif text-[clamp(2.5rem,5.6vw,5rem)] font-light leading-[1.05] tracking-[-0.02em] text-ink lg:col-span-7"
          >
            Questions, answered.
          </h2>
          <p className="max-w-md text-[17px] leading-[26px] text-ink/60 lg:col-span-5 lg:justify-self-end">
            Short, honest answers. If something is missing, the app itself is
            the best place to look.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-2">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                <span className="font-serif text-xl leading-snug text-ink">
                  {item.q}
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 shrink-0 items-center justify-center text-ink/45 transition-transform duration-200 ease-out group-open:rotate-45 motion-reduce:transition-none"
                >
                  <svg
                    viewBox="0 0 16 16"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  >
                    <path d="M8 2v12M2 8h12" />
                  </svg>
                </span>
              </summary>
              <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-open:grid-rows-[1fr] motion-reduce:transition-none">
                <div className="overflow-hidden">
                  <p className="max-w-2xl pb-6 text-[15px] leading-[24px] text-ink/60">
                    {item.a}
                  </p>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
