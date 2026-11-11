import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CopyrightYear, CopyrightYearFallback } from "./copyright-year";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    items: [
      { label: "Product", href: "/#product" },
      { label: "How it works", href: "/#live" },
      { label: "Learn", href: "/#learn" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Questions", href: "/#faq" },
    ],
  },
  {
    title: "Get started",
    items: [
      { label: "Start free", href: "/sign-in" },
      { label: "Sign in", href: "/sign-in" },
    ],
  },
] as const;

/**
 * The ink footer. Wordmark only, real links only, no language selector or
 * cookie theatre.
 */
export function Footer() {
  return (
    <footer className="bg-ink-field text-on-ink">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-5 py-14 sm:px-8 md:py-20 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-5">
          <Link
            href="/"
            className="flex w-fit items-center gap-2.5 font-sans text-[19px] font-semibold tracking-[-0.03em] text-on-ink"
            aria-label="Budgie"
          >
            <Image
              src="/android-chrome-192x192.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8"
            />
            Budgie
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-on-ink/60">
            A personal finance app for balance, savings, and everyday
            spending. Built for rupiah.
          </p>
          <p className="text-sm text-on-ink/45">
            <Suspense fallback={<CopyrightYearFallback />}>
              <CopyrightYear />
            </Suspense>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:col-span-6 lg:col-start-7">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col">
              <p className="text-xs text-on-ink/40">{col.title}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-on-ink/65 transition-colors hover:text-on-ink"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
