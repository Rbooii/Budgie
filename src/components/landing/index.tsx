import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "./reveal";
import { BudgieMascot } from "./budgie-mascot";
import { LandingNav } from "./landing-nav";
import { HeroHeadline } from "./hero-headline";
import { HeroMedia } from "./hero-media";
import { Bento } from "./bento";
import { UseCases } from "./use-cases";
import { Pricing } from "./pricing";
import { Faq } from "./faq";
import { FactsMarquee } from "./facts-marquee";
import { Footer } from "./footer";
import { getSession } from "@/lib/session";

export async function LandingPage() {
  const session = await getSession();

  return <LandingPageView session={Boolean(session)} />;
}

/**
 * Session-aware half of the nav. Kept in its own async component so the rest of
 * the landing page can be prerendered as a static shell and only this small
 * subtree streams in (Cache Components / PPR).
 */
export async function LandingNavLive() {
  const session = await getSession();
  return <LandingNav session={Boolean(session)} />;
}

/**
 * Sync presentational half of the landing page. `LandingPage` (async RSC)
 * fetches the session and delegates here so the full page stays testable in
 * jsdom (same split as `AccountTab`/`AccountTabView`).
 *
 * `nav` lets `page.tsx` drop the session-dependent nav behind a `Suspense`
 * boundary while the rest of the marketing surface stays static.
 */
export function LandingPageView({
  session,
  nav,
}: {
  session: boolean;
  nav?: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-white text-black font-[family-name:var(--font-inter)]">
      {/* Native smooth scrolling — Lenis-free. Gated by reduced motion. */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          html { scroll-behavior: smooth; }
        }
      `}</style>

      {nav ?? <LandingNav session={session} />}

      {/* Hero — Notion anatomy: mascot, headline + rotating pill, deck, CTAs, video */}
      <section className="mx-auto max-w-screen-xl px-5 sm:px-8 pt-10 sm:pt-16 pb-8 sm:pb-12">
        <div className="text-center">
          <Reveal delay={80}>
            <div className="flex justify-center mt-2">
              <BudgieMascot className="h-[104px] w-auto sm:h-[124px]" />
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-6 sm:mt-8">
              <HeroHeadline />
            </div>
          </Reveal>

          <Reveal delay={160}>
            <p className="text-lg leading-[28px] font-normal  text-black/60 mt-6 max-w-2xl mx-auto">
              Capture every rupiah, find any answer, and stay ahead of every
              budget.
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
