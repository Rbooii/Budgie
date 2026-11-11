import type { ReactNode } from "react";
import { LandingNav } from "./landing-nav";
import { Hero } from "./hero";
import { ProductStory } from "./product-story";
import { FeatureCards } from "./feature-cards";
import { EditorialSection } from "./editorial-section";
import { LearnSection } from "./learn-section";
import { Pricing } from "./pricing";
import { Faq } from "./faq";
import { Endcap } from "./endcap";
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
 */
export function LandingPageView({
  session,
  nav,
}: {
  session: boolean;
  nav?: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-paper font-sans text-ink">
      {/* Native smooth scrolling. No scroll library. Gated by reduced motion. */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          html { scroll-behavior: smooth; }
        }
      `}</style>

      {nav ?? <LandingNav session={session} />}

      <Hero />
      <ProductStory />
      <FeatureCards />
      <EditorialSection />
      <LearnSection />
      <Pricing />
      <Faq />
      <Endcap />
      <Footer />
    </main>
  );
}
