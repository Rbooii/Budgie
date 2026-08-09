import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Reveal } from "./reveal";
import { ScrollProgress } from "./scroll-progress";
import { SmoothScroll } from "./smooth-scroll";
import { LandingNav } from "./landing-nav";
import { HeroHeadline } from "./hero-headline";
import { HeroPreview } from "./hero-preview";
import { Magnetic } from "./magnetic";
import { Marquee } from "./marquee";
import { VideoShowcase } from "./video-showcase";
import { FeatureGrid } from "./feature-grid";
import { Showcase } from "./showcase";
import { Vignettes } from "./vignettes";
import { PrivacySpotlight } from "./privacy-spotlight";
import { Pricing } from "./pricing";
import { Faq } from "./faq";
import { Footer } from "./footer";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
    <main className="min-h-screen bg-white text-black">
      <SmoothScroll />
      <ScrollProgress />
      <LandingNav
        session={session}
      />

      {/* Hero */}
      <section className="relative mx-auto max-w-screen-xl px-5 sm:px-8 pt-10 sm:pt-16 pb-16 sm:pb-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[680px] rounded-full bg-[#00C610]/[0.07] blur-[110px] motion-reduce:hidden"
        />
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <div className="mt-3">
              <HeroHeadline />
            </div>
            <Reveal delay={160}>
              <p className="text-base sm:text-lg text-black/50 mt-5 max-w-xl leading-relaxed">
                Budgie helps you track accounts, transactions, budgets, and
                subscriptions with a minimal, distraction free dashboard.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-8">
                <Magnetic>
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center justify-center text-lg font-semibold px-[20px] py-[6px] h-11 rounded-[35px] bg-[#00C610] text-white hover:bg-[#00B609] active:scale-[0.98] transition transform duration-150"
                  >
                    Get started for free
                  </Link>
                </Magnetic>
                <Link
                  href="/#motion"
                  className="inline-flex items-center justify-center text-sm font-semibold py-[10px] px-[20px] rounded-[35px] bg-white text-black border border-black/10 hover:bg-[#F2F2F2] active:scale-[0.98] transition transform duration-150"
                >
                  See Budgie in motion
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal delay={200}>
            <HeroPreview />
          </Reveal>
        </div>

        {/* Scroll cue */}
        <div
          aria-hidden="true"
          className="mt-14 flex justify-center animate-[scrollCue_1.8s_ease-in-out_infinite] motion-reduce:animate-none"
        >
          <ChevronDown className="w-4 h-4 text-black/25" />
        </div>

        {/* Stats strip — commented out until the stat data is finalized */}

        <style>{`
          @keyframes livePulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          @keyframes scrollCue {
            0%, 100% { opacity: 0.9; transform: translateY(0); }
            50% { opacity: 0.25; transform: translateY(3px); }
          }
        `}</style>
      </section>

      <Marquee />
      <VideoShowcase />
      <FeatureGrid />
      <Showcase />
      <Vignettes />
      <PrivacySpotlight />
      <Pricing />
      <Faq />

      {/* Final CTA */}
      <section className="relative mx-auto max-w-screen-xl px-5 sm:px-8 py-12 sm:py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-[35px] bg-[#00CE11] px-8 sm:px-16 py-14 sm:py-20 text-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-16 h-[320px] w-[320px] rounded-full bg-white/[0.12] blur-[80px] motion-reduce:hidden"
            />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Start tracking your money today
              </h2>
              <p className="text-base text-white/80 mt-3 max-w-xl mx-auto leading-relaxed">
                Free to start. No card required. Upgrade to Plus whenever you want
                deeper insights.
              </p>
              <Magnetic strength={6}>
                <Link
                  href="/sign-in"
                  className="mt-8 inline-flex items-center justify-center text-lg font-semibold px-[20px] py-[6px] h-11 rounded-[35px] bg-black text-white hover:bg-black/85 active:scale-[0.98] transition transform duration-150"
                >
                  Get started for free
                </Link>
              </Magnetic>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
