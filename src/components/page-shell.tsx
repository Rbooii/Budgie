"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";

export function PageShell({
  children,
  flush = false,
}: {
  children: ReactNode;
  /** Full-viewport content column (no page scroll) — used by `/chat`, which
   *  owns its own internal scroll area and clears the mobile tab bar itself. */
  flush?: boolean;
}) {
  return (
    <main className="w-full max-w-screen-2xl mx-auto min-h-screen flex flex-col md:flex-row bg-white text-black">
      <Sidebar />
      <div
        className={
          flush
            ? "flex-1 min-w-0 h-[100dvh] overflow-hidden pb-[var(--app-tabbar-h)] md:pb-0"
            : "flex-1 min-h-screen py-6 md:py-10 px-4 sm:px-8 md:px-12 lg:px-20 pb-[calc(var(--app-tabbar-h)_+_1.5rem)] md:pb-10"
        }
      >
        {children}
      </div>
    </main>
  );
}
