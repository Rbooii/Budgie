"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import type { ReasoningUIPart } from "ai";

export function ChatThinking({ part }: { part: ReasoningUIPart }) {
  const [open, setOpen] = useState(false);
  const streaming = part.state === "streaming";

  if (streaming) {
    return (
      <div className="flex items-center gap-2 text-[13px] font-medium text-ink/45">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-ink/30" />
        <span>Thinking…</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[12px] font-medium text-ink/40 transition hover:text-ink/70"
      >
        {open ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <span>Thought for a moment</span>
      </button>
      {open && part.text && (
        <p className="mt-2 text-[13px] leading-relaxed text-ink/45 whitespace-pre-wrap">
          {part.text}
        </p>
      )}
    </div>
  );
}
