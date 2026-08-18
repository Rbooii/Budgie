"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Sparkles } from "lucide-react";
import type { ReasoningUIPart } from "ai";

export function ChatThinking({ part }: { part: ReasoningUIPart }) {
  const [open, setOpen] = useState(false);
  const streaming = part.state === "streaming";

  return (
    <div className="w-full max-w-[85%] sm:max-w-[70%]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={streaming}
        className="flex items-center gap-2 text-xs text-black/45 transition hover:text-black/70 disabled:cursor-default disabled:hover:text-black/45"
      >
        {streaming ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
        <span>{streaming ? "Thinking…" : "Thought for a moment"}</span>
        {!streaming && (
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>
      {open && part.text && (
        <div className="mt-1.5 rounded-[14px] bg-[#F9F9F8] border border-black/5 px-3 py-2.5 text-xs text-black/55 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
          {part.text}
        </div>
      )}
    </div>
  );
}