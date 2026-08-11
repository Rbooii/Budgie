import Link from "next/link";
import { Wallet, Receipt, Target, RefreshCw, TrendingUp } from "lucide-react";
import { Reveal } from "./reveal";
import { LandingNav } from "./landing-nav";
import { HeroHeadline } from "./hero-headline";
import { HeroMedia } from "./hero-media";
import { Bento } from "./bento";
import { UseCases } from "./use-cases";
import { Pricing } from "./pricing";
import { Faq } from "./faq";
import { FactsMarquee } from "./facts-marquee";
import { Footer } from "./footer";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * The hero icon pile — Notion's avatar-pile anatomy (`pileImage`): a small
 * stack of overlapping round Budgie icon tiles above the headline, each
 * rotating 15° on hover. Honest version of Notion's agent pile: these are
 * the app's own feature tiles, not fake people.
 */
const PILE = [
  { icon: <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />, tint: "bg-[#A0FFA8]/40 text-[#1F9B29]", label: "Accounts" },
  { icon: <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />, tint: "bg-[#FFBABA]/40 text-[#D8000C]", label: "Transactions" },
  { icon: <Target className="w-4 h-4 sm:w-5 sm:h-5" />, tint: "bg-[#FFD9A0]/40 text-[#B25B00]", label: "Budgets" },
  { icon: <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />, tint: "bg-[#FFD9A0]/40 text-[#B25B00]", label: "Subscriptions" },
  { icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />, tint: "bg-[#A0FFA8]/40 text-[#1F9B29]", label: "Insights" },
] as const;

export async function LandingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return <LandingPageView session={Boolean(session)} />;
}

/**
 * Sync presentational half of the landing page. `LandingPage` (async RSC)
 * fetches the session and delegates here so the full page stays testable in
 * jsdom (same split as `AccountTab`/`AccountTabView`).
 */
export function LandingPageView({ session }: { session: boolean }) {
  return (
    <main className="min-h-screen bg-white text-black font-[family-name:var(--font-inter)]">
      {/* Native smooth scrolling — Lenis-free. Gated by reduced motion. */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          html { scroll-behavior: smooth; }
        }
      `}</style>

      <LandingNav session={session} />

      {/* Hero — Notion anatomy: pile, headline + rotating pill, mono deck, CTAs, video */}
      <section className="mx-auto max-w-screen-xl px-5 sm:px-8 pt-10 sm:pt-16 pb-8 sm:pb-12">
        <div className="text-center">
          <Reveal delay={80}>
            <div className="flex items-center justify-center -ml-3 sm:-ml-4 mt-2">
              {PILE.map((item) => (
                <span
                  key={item.label}
                  title={item.label}
                  className={`relative -ml-3 sm:-ml-4 first:ml-0 flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 rounded-full border border-black/5 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.18)] ${item.tint} transition-transform duration-200 ease-out hover:rotate-[15deg] motion-reduce:transition-none motion-reduce:hover:rotate-0`}
                >
                  {item.icon}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-6 sm:mt-8">
              <HeroHeadline />
            </div>
          </Reveal>

          <Reveal delay={160}>
            <p className="text-lg leading-[28px] font-normal  text-black/60 mt-6 max-w-2xl mx-auto">
              Capture context, find answers, and automate busywork. a calm
              dashboard built around the rupiah.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center text-sm font-normal px-[20px] py-[6px] h-11 rounded-[35px] bg-[#00C610] text-white hover:bg-[#00B609] active:scale-[0.98] transition transform duration-150"
              >
                Get started for free
              </Link>
              <Link
                href="/#features"
                className="inline-flex items-center justify-center text-sm font-normal py-[10px] px-[20px] rounded-[35px] bg-white text-black border border-black/10 hover:bg-[#F2F2F2] active:scale-[0.98] transition transform duration-150"
              >
                See what Budgie can do
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <div className="mt-12 sm:mt-16">
            <HeroMedia />
          </div>
        </Reveal>
      </section>

      <Bento />
      <UseCases />
      <Pricing />
      <Faq />
      <FactsMarquee />

      {/* Final CTA — Notion's neutral endcap (quiet gray surface, one primary CTA) */}
      <section className="bg-[#F2F2F2] mt-20 sm:mt-28">
        <div className="mx-auto max-w-screen-xl px-5 sm:px-8 py-24 sm:py-36 text-center">
          <Reveal>
            <h2 className="text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.1] tracking-[-0.5px] text-black">
              Get started today.
            </h2>
            <p className="text-base text-black/50 mt-4 max-w-xl mx-auto">
              Free to start. No card required. Upgrade to Plus whenever you want
              deeper insights.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center text-sm font-normal px-[20px] py-[6px] h-11 rounded-[35px] bg-[#00C610] text-white hover:bg-[#00B609] active:scale-[0.98] transition transform duration-150"
              >
                Get Budgie free
              </Link>
              <Link
                href="/#features"
                className="inline-flex items-center justify-center text-sm font-normal py-[10px] px-[20px] rounded-[35px] bg-white text-black border border-black/10 hover:bg-[#F2F2F2] active:scale-[0.98] transition transform duration-150"
              >
                See what Budgie can do
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
