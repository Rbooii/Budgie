"use client";

import { Loader2 } from "lucide-react";

export function ChatToolStatus({ running }: { running: string }) {
  return (
    <div className="flex w-fit items-center gap-2.5 rounded-[16px] border border-black/[0.06] bg-white px-3.5 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] animate-[stepReveal_0.2s_ease-out]">
      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1F9B29]" />
      <span className="text-[13px] font-medium text-black/50">{running}</span>
    </div>
  );
}
