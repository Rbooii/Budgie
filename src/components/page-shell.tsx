"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="w-full max-w-screen-2xl mx-auto min-h-screen flex flex-col md:flex-row bg-white text-black">
      <Sidebar />
      <div className="flex-1 min-h-screen py-6 md:py-10 px-4 sm:px-8 md:px-12 lg:px-20 pb-20 md:pb-10">
        {children}
      </div>
    </main>
  );
}
