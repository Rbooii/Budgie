import { Reveal } from "./reveal";

export const FAQ_ITEMS: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: "Is Budgie really free?",
    a: "Yes. The free tier includes up to 3 accounts, unlimited transactions, budgets, and subscriptions. Upgrade to Budgie Plus only if you want deeper insights and priority PDF exports.",
  },
  {
    q: "Does Budgie work with Indonesian rupiah?",
    a: "Budgie is built around the rupiah. Every amount is formatted with id-ID grouping and two decimals, and Budgie Plus checkout uses QRIS — the Indonesian standard.",
  },
  {
    q: "How are my balances kept private?",
    a: "Balances are hidden behind bullets by default. Tap the eye icon to reveal each character with a short blur-in, capped at 260ms. The reveal honors your reduced-motion setting.",
  },
  {
    q: "Can I export my transactions?",
    a: "Yes. Download a clean, monochrome PDF of your transactions for any date range directly from the dashboard — no third-party tool required.",
  },
  {
    q: "What happens if I go over budget?",
    a: "Spending bars turn red the moment a category crosses its limit, and a budget tick marks where your limit sits on the chart. Nothing is blocked — Budgie informs, it never nags.",
  },
  {
    q: "How do transfers between accounts work?",
    a: "Transfers debit the source account and credit the destination, with an optional admin fee. Deleting a transfer reverses both sides automatically so balances always reconcile.",
  },
];

export function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="mx-auto max-w-screen-xl px-5 sm:px-8 py-20 sm:py-28 scroll-mt-24"
    >
      <Reveal className="max-w-2xl">
        <p className="text-sm font-semibold text-[#00C610]">Questions</p>
        <h2
          id="faq-title"
          className="text-3xl sm:text-4xl font-bold tracking-tight text-black mt-2"
        >
          Things people ask
        </h2>
        <p className="text-base text-black/45 mt-3 leading-relaxed">
          Short, honest answers. If something is missing, the app itself is the
          best place to look — it only takes a minute to set up.
        </p>
      </Reveal>

      <Reveal delay={120} className="mt-10 max-w-3xl">
        <div className="flex flex-col gap-2">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.q}
              className="group rounded-[28px] border border-black/[0.06] bg-white px-5 sm:px-6 open:bg-[#FAFAFA] transition-colors duration-200"
            >
              <summary
                className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden"
              >
                <span className="text-base font-semibold text-black leading-snug">
                  {item.q}
                </span>
                <span
                  aria-hidden="true"
                  className="shrink-0 w-7 h-7 rounded-full bg-[#F2F2F2] flex items-center justify-center transition-transform duration-200 ease-out group-open:rotate-45"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-3.5 h-3.5 text-black/60"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-open:grid-rows-[1fr] motion-reduce:transition-none">
                <div className="overflow-hidden">
                  <p className="text-sm text-black/60 leading-relaxed pb-5 -mt-1">
                    {item.a}
                  </p>
                </div>
              </div>
            </details>
          ))}
        </div>
      </Reveal>
    </section>
  );
}