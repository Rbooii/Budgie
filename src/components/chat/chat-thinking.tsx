"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import type { ReasoningUIPart } from "ai";

export function ChatThinking({ part }: { part: ReasoningUIPart }) {
  const [open, setOpen] = useState(false);
  const streaming = part.state === "streaming";

  if (streaming) {
    return (
      <div className="flex items-center gap-2 text-[13px] font-medium text-black/45">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1F9B29]" />
        <span>Thinking…</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full bg-black/[0.03] px-2.5 py-1 text-[12px] font-medium text-black/45 transition hover:bg-black/[0.06] hover:text-black/70"
      >
        {open ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <span>Thought for a moment</span>
      </button>
      {open && part.text && (
        <p className="mt-2 text-[13px] font-mono text-black/45 whitespace-pre-wrap">
          {part.text}
        </p>
      )}
    </div>
  );
}
