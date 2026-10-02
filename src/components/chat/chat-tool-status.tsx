"use client";

import { Loader2 } from "lucide-react";

export function ChatToolStatus({ running }: { running: string }) {
  return (
    <div className="flex items-center gap-2 text-[13px] font-medium text-ink/45">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-ink/30" />
      <span>{running}</span>
    </div>
  );
}
