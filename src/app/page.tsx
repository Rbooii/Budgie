import type { Metadata, Viewport } from "next";
import { LandingPage } from "@/components/landing";
import { FAQ_ITEMS } from "@/components/landing/faq";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const canonical = new URL(siteUrl).origin.toString();
const brandVideoUrl = `${canonical}/videos/brand.mp4`;
const brandVideoWebm = `${canonical}/videos/brand.webm`;

const title = "Budgie — Track your money in calm focus";
const description =
  "A calm, minimal personal-finance app for tracking accounts, transactions, budgets, and subscriptions. Built around the rupiah.";

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
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
    videos: [
      {
        url: brandVideoUrl,
        secureUrl: brandVideoUrl,
        type: "video/mp4",
        width: 1920,
        height: 1080,
      },
      {
        url: brandVideoWebm,
        secureUrl: brandVideoWebm,
        type: "video/webm",
        width: 1920,
        height: 1080,
      },
    ],
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

const videoLd = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "Budgie — See it in motion",
  description:
    "A sixty-second silent walkthrough of the Budgie personal-finance app: accounts, transactions, budgets, and insights.",
  thumbnailUrl: `${canonical}/opengraph-image`,
  contentUrl: brandVideoUrl,
  contentSize: "8000000",
  encodingFormat: "video/mp4",
  uploadDate: "2026-07-27",
  duration: "PT1M0S",
  isFamilyFriendly: true,
};

export default function HomePage() {
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd) }}
      />
      <LandingPage />
    </>
  );
}