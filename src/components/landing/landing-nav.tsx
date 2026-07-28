"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { label: "Motion", href: "#motion" },
  { label: "Features", href: "#features" },
  { label: "Stories", href: "#stories" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
] as const;

export function LandingNav({
  session
}:{
  session : boolean
}) {
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
        scrolled
          ? "bg-white/80 backdrop-blur-sm border-b border-black/[0.06]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="mx-auto max-w-screen-xl flex items-center justify-between px-5 sm:px-8 py-3.5">
        <Link href="/" className="font-bold text-xl tracking-tight text-black">
          Budgie
        </Link>
        <div className="hidden sm:flex items-center gap-8">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-black/60 hover:text-black transition"
            >
              {item.label}
            </a>
          ))}
        </div>
        {!session && <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center text-sm font-semibold py-[10px] px-[20px] rounded-[35px] bg-white text-black border border-black/10 hover:bg-[#F2F2F2] active:scale-[0.98] transition transform duration-150"
          >
            Sign in
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center text-sm font-semibold py-[10px] px-[20px] rounded-[35px] bg-[#00C610] text-white hover:bg-[#00B609] active:scale-[0.98] transition transform duration-150"
          >
            Get started
          </Link>
        </div>}
        {session && <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center text-sm font-semibold py-[10px] px-[20px] rounded-[35px] bg-[#00C610] text-white hover:bg-[#00B609] active:scale-[0.98] transition transform duration-150"
          >
            Dashboard
          </Link>
        </div>}
      </nav>
    </header>
  );
}