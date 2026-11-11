import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { LandingPageView, LandingNavLive } from "@/components/landing";
import { LandingNav } from "@/components/landing/landing-nav";
import { FAQ_ITEMS } from "@/components/landing/faq";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const canonical = new URL(siteUrl).origin.toString();

const title = "Budgie, a clearer way to see your money";
const description =
  "See your balance, plan your savings, and learn where your spending goes. A personal finance app built for rupiah and everyday money.";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f5" },
    { media: "(prefers-color-scheme: dark)", color: "#141413" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  keywords: [
    "personal finance",
    "budget app",
    "expense tracker",
    "money management",
    "savings",
    "financial literacy",
    "subscriptions",
    "rupiah",
    "Indonesia",
    "QRIS",
  ],
  applicationName: "Budgie",
  authors: [{ name: "Budgie" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: canonical,
    siteName: "Budgie",
    title,
    description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

const webAppLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Budgie",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description,
  url: canonical,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "IDR",
  },
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: canonical,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Pricing",
      item: `${canonical}/#pricing`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "FAQ",
      item: `${canonical}/#faq`,
    },
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default function HomePage() {
  // The whole marketing surface is prerenderable; only the session-aware nav
  // streams in, so `/` ships as a static shell (CDN-cacheable, instant TTFB).
  const nav = (
    <Suspense fallback={<LandingNav session={false} />}>
      <LandingNavLive />
    </Suspense>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <LandingPageView session={false} nav={nav} />
    </>
  );
}