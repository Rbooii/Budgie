"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { label: "Product", href: "/#live" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Questions", href: "/#faq" },
] as const;

export function LandingNav({ session }: { session: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 ${
        scrolled ? "bg-paper/85 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-sans text-[19px] font-semibold tracking-[-0.03em] text-ink"
          aria-label="Budgie"
        >
          <Image
            src="/android-chrome-192x192.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7"
          />
          Budgie
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[13px] text-ink/60 transition-colors hover:text-ink"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {!session && (
            <Link
              href="/sign-in"
              className="hidden text-[13px] text-ink/60 transition-colors hover:text-ink sm:block"
            >
              Sign in
            </Link>
          )}
          <Link
            href={session ? "/dashboard" : "/sign-in"}
            className="inline-flex h-9 items-center justify-center rounded-full bg-brand px-4 text-[13px] font-medium text-white transition-colors hover:bg-brand/90"
          >
            {session ? "Open Budgie" : "Start free"}
          </Link>
        </div>
      </nav>
    </header>
  );
}
