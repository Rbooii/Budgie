"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { MODEL_CHAIN, modelLabel, type ChatModelId } from "@/lib/chat-models";
import { cn } from "@/lib/cn";

export function ChatModelMenu({
  model,
  onModelChange,
}: {
  model: ChatModelId;
  onModelChange: (model: ChatModelId) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  return (
    <div ref={ref} className="relative flex justify-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Select model. Current: ${modelLabel(model)}`}
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-full border border-hairline bg-surface px-2.5 text-[11px] font-medium text-ink/60 transition hover:bg-surface hover:text-ink active:scale-95",
          open && "bg-surface text-ink",
        )}
      >
        {modelLabel(model)}
        <ChevronDown
          className={cn(
            "h-3 w-3 text-ink/40 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Opens upward — the menu lives in the composer, not the header. */}
      {open && (
        <div className="absolute bottom-full mb-2 z-50 w-48 rounded-2xl border border-hairline bg-card p-1 shadow-xl">
          {MODEL_CHAIN.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                onModelChange(m);
                setOpen(false);
              }}
              className="flex h-8 w-full items-center justify-between rounded-xl px-2.5 text-left text-xs font-medium text-ink/80 transition hover:bg-surface active:scale-[0.98]"
            >
              <span>{modelLabel(m)}</span>
              {m === model && <Check className="w-3.5 h-3.5 text-brand" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
