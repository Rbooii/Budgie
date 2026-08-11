import { Reveal } from "./reveal";
import { FindCard } from "./find-card";
import { LiveFeed } from "./live-feed";
import { LiveSpending } from "./live-spending";

interface BentoCardProps {
  wide?: boolean;
  eyebrow: string;
  title: string;
  media: React.ReactNode;
}

/**
 * A Notion bento card: `#F9F9F8` gray fill, 12px radius, no border, no lift.
 * Hover fades in a soft card shadow (Notion's `:has(:hover)` shadow reveal) —
 * the fill never moves. Eyebrow is a quiet 14px caption, title is 22px bold.
 * The media is the real Budgie UI rendered directly on the gray surface
 * (natural height — never a fixed-aspect box, never card-in-card).
 */
function BentoCard({ wide = false, eyebrow, title, media }: BentoCardProps) {
  return (
    <Reveal className="h-full">
      <article
        className={`group flex h-full flex-col overflow-hidden rounded-[12px] bg-[#F9F9F8] transition-shadow duration-200 ease-out hover:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.18)] motion-reduce:transition-none motion-reduce:hover:shadow-none ${
          wide ? "lg:flex-row" : ""
        }`}
      >
        <header
          className={`flex flex-col gap-2 p-6 sm:p-8 ${
            wide ? "lg:w-[40.5%] lg:max-w-[500px] lg:justify-center" : ""
          }`}
        >
          <p className="text-sm font-normal text-black/45">{eyebrow}</p>
          <h3 className="text-[22px] font-bold leading-[28px] tracking-[-0.25px] text-black">
            {title}
          </h3>
        </header>

        <div
          className={`flex items-center justify-center mt-auto px-6 sm:px-8 pb-8 sm:pb-10 ${
            wide ? "lg:flex-1 lg:pl-0 lg:pr-8 lg:pb-8 lg:mt-0" : ""
          }`}
        >
          {media}
        </div>
      </article>
    </Reveal>
  );
}

/**
 * The bento grid — Notion's "AI where your team works" layout mapped to
 * Budgie: one wide "Capture" card (media right), two side cards
 * ("Find" — the interactive search, "Automate" — spending streams).
 */
export function Bento() {
  return (
    <section
      id="features"
      aria-labelledby="bento-title"
      className="mx-auto max-w-screen-xl px-5 sm:px-8 py-20 sm:py-28 scroll-mt-24"
    >
      <Reveal className="max-w-2xl">
        <h2
          id="bento-title"
          className="text-[32px] font-bold leading-10 tracking-[-0.75px] text-black"
        >
          Where your money lives.
        </h2>
        <p className="text-lg leading-[28px] font-normal text-black/60 mt-3">
          Three quiet superpowers in one system of record. No imports, no
          sync — your money starts and stays here.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <div className="lg:col-span-2">
          <BentoCard
            wide
            eyebrow="Capture every rupiah"
            title="One system of record for your money."
            media={
              <div className="w-full max-w-[560px]">
                <LiveFeed />
              </div>
            }
          />
        </div>

        <BentoCard
          eyebrow="Find answers"
          title="Instantly, with every detail."
          media={
            <div className="w-full max-w-[420px]">
              <FindCard />
            </div>
          }
        />

        <BentoCard
          eyebrow="Automate busywork"
          title="Budgets that keep watch, 24/7."
          media={
            <div className="w-full max-w-[420px]">
              <LiveSpending />
            </div>
          }
        />
      </div>
    </section>
  );
}
