"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRightLeft,
  House,
  MessageCircle,
  Moon,
  PiggyBank,
  Sun,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/cn";

type SidebarItem = {
  icon: React.ReactNode;
  label: string;
  href: string;
};

const sidebarData: SidebarItem[] = [
  {
    icon: <House className="h-5 w-5" />,
    label: "Home",
    href: "/dashboard",
  },
  {
    icon: <MessageCircle className="h-5 w-5" />,
    label: "Chat",
    href: "/chat",
  },
  {
    icon: <ArrowRightLeft className="h-5 w-5" />,
    label: "Transactions",
    href: "/transactions",
  },
  {
    icon: <PiggyBank className="h-5 w-5" />,
    label: "Budget",
    href: "/budget",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { resolved, toggle } = useTheme();
  const isDark = resolved === "dark";

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[250px] h-fit p-10 text-ink shrink-0 md:sticky md:top-0 self-start">
        <h1 className="font-bold text-2xl text-center">Budgie</h1>
        <nav className="mt-5 flex flex-col gap-1">
          {sidebarData.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex gap-[15px] px-[22px] py-[10px] rounded-[35px] items-center transition active:scale-[0.98] ${
                  isActive
                    ? "bg-surface"
                    : "hover:bg-surface"
                }`}
              >
                {item.icon}
                <p className="text-sm">{item.label}</p>
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={toggle}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          className="w-full flex gap-[15px] px-[22px] py-[10px] rounded-[35px] items-center text-ink/60 hover:text-ink hover:bg-surface transition active:scale-[0.98]"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <p className="text-sm">{isDark ? "Light mode" : "Dark mode"}</p>
        </button>
      </aside>

      {/* Mobile bottom tab bar — height is the shared `--app-tabbar-h` token
          (includes `env(safe-area-inset-bottom)`), so pages clear it exactly. */}
      <nav
        data-mobile-tabbar
        className="md:hidden fixed bottom-0 inset-x-0 z-30 h-[var(--app-tabbar-h)] pb-[env(safe-area-inset-bottom,0px)] bg-card/90 backdrop-blur-xl border-t border-hairline flex items-stretch"
      >
        {sidebarData.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-1 pt-1.5 pb-1 transition active:scale-95"
            >
              <span
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200",
                  isActive ? "bg-brand-tint text-brand" : "text-ink/45",
                )}
              >
                {item.icon}
              </span>
              <span
                className={cn(
                  "text-[10px] leading-none transition-colors duration-200",
                  isActive ? "font-semibold text-brand" : "text-ink/45",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
