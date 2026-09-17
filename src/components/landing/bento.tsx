import { Reveal } from "./reveal";
import { FindCard } from "./find-card";
import { LiveFeed } from "./live-feed";
import { LiveSpending } from "./live-spending";

/**
 * The bento — one focal white ledger panel (3 of 5 columns) beside two quiet
 * gray tiles: search stacked over budgets. No eyebrows, no card titles: the
 * real Budgie UI is the content, and the section deck carries the words.
 */
export function Bento() {
  return (
    <section
      id="features"
      aria-labelledby="bento-title"
      className="mx-auto max-w-screen-xl px-5 sm:px-8 py-20 sm:py-28 scroll-mt-24"
    >
      <Reveal>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <h2
            id="bento-title"
            className="text-[32px] font-bold leading-10 tracking-[-0.75px] text-black"
          >
            Where your money lives.
          </h2>
          <p className="text-lg leading-[28px] font-normal text-black/60 lg:max-w-md lg:text-right">
            One ledger for every account, transaction, and budget. No imports,
            no sync.
          </p>
        </div>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-5 lg:items-stretch">
        <Reveal className="h-full lg:col-span-3">
          <LiveFeed />
        </Reveal>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <Reveal className="flex-1">
            <FindCard />
          </Reveal>
          <Reveal className="flex-1">
            <LiveSpending />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
