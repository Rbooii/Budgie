"use client";

import { Loader2 } from "lucide-react";

export function ChatToolStatus({ running }: { running: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[20px] bg-[#F2F2F2] px-3.5 py-2.5 text-xs text-black/60 animate-[stepReveal_0.2s_ease-out]">
      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1F9B29]" />
      <span>{running}</span>
    </div>
  );
}