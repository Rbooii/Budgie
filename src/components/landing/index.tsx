import Link from "next/link";
import { Reveal } from "./reveal";
import { AnimatedCounter } from "./animated-counter";
import { ScrollProgress } from "./scroll-progress";
import { LandingNav } from "./landing-nav";
import { HeroPreview } from "./hero-preview";
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

const STATS = [
  { counter: <AnimatedCounter value={21} suffix="+" />, label: "premade categories" },
  { counter: <AnimatedCounter value={3} />, label: "transaction types" },
  { counter: <AnimatedCounter value={12} />, label: "months of growth history" },
];

export async function LandingPage() {
  const session = await auth.api.getSession({
      headers: await headers(),
  });
  

  return (
    <main className="min-h-screen bg-white text-black">
      <ScrollProgress />
      <LandingNav 
        session = {session ? true : false}
      />

      {/* Hero */}
      <section className="mx-auto max-w-screen-xl px-5 sm:px-8 pt-10 sm:pt-16 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <Reveal>
              <p className="text-sm font-semibold text-[#00C610]">
                Personal finance, quietly powerful
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-black mt-3 leading-[1.05]">
                Your money,
                <br />
                in calm focus
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="text-base sm:text-lg text-black/50 mt-5 max-w-xl leading-relaxed">
                Budgie helps you track accounts, transactions, budgets, and
                subscriptions with a minimal, distraction-free dashboard —
                built around the rupiah.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-8">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center text-lg font-semibold px-[20px] py-[6px] h-11 rounded-[35px] bg-[#00C610] text-white hover:bg-[#00B609] active:scale-[0.98] transition transform duration-150"
                >
                  Get started free
                </Link>
                <a
                  href="#motion"
                  className="inline-flex items-center justify-center text-sm font-semibold py-[10px] px-[20px] rounded-[35px] bg-white text-black border border-black/10 hover:bg-[#F2F2F2] active:scale-[0.98] transition transform duration-150"
                >
                  See it in motion
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal delay={200}>
            <HeroPreview />
          </Reveal>
        </div>

        {/* Stats strip */}
        <Reveal delay={120}>
          <div className="mt-16 sm:mt-24 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-[28px] border border-black/[0.06] bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] px-6 py-6 text-center"
              >
                <p className="text-3xl sm:text-4xl font-bold tracking-tight text-black">
                  {s.counter}
                </p>
                <p className="text-xs text-black/45 mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
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
      <section className="mx-auto max-w-screen-xl px-5 sm:px-8 py-12 sm:py-20">
        <Reveal>
          <div className="rounded-[35px] bg-[#00CE11] px-8 sm:px-16 py-14 sm:py-20 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Start tracking your money today
            </h2>
            <p className="text-base text-white/80 mt-3 max-w-xl mx-auto leading-relaxed">
              Free to start. No card required. Upgrade to Plus whenever you want
              deeper insights.
            </p>
            <Link
              href="/sign-in"
              className="mt-8 inline-flex items-center justify-center text-lg font-semibold px-[20px] py-[6px] h-11 rounded-[35px] bg-black text-white hover:bg-black/85 active:scale-[0.98] transition transform duration-150"
            >
              Get started free
            </Link>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}