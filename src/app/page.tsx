import type { Metadata, Viewport } from "next";
import { LandingPage } from "@/components/landing";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Budgie — Track your money in calm focus",
  description:
    "A calm, minimal personal-finance app for tracking accounts, transactions, budgets, and subscriptions. Built around the rupiah.",
  keywords: [
    "personal finance",
    "budget app",
    "expense tracker",
    "money management",
    "subscriptions",
    "rupiah",
    "Indonesia",
  ],
  applicationName: "Budgie",
  authors: [{ name: "Budgie" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Budgie",
    title: "Budgie — Track your money in calm focus",
    description:
      "A calm, minimal personal-finance app for tracking accounts, transactions, budgets, and subscriptions. Built around the rupiah.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Budgie — Track your money in calm focus",
    description:
      "A calm, minimal personal-finance app for tracking accounts, transactions, budgets, and subscriptions.",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Budgie",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "A calm, minimal personal-finance app for tracking accounts, transactions, budgets, and subscriptions. Built around the rupiah.",
  url: siteUrl,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "IDR",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}