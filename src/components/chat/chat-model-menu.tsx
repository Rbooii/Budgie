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
        className="flex items-center gap-1 text-[15px] font-semibold text-black/80 transition hover:text-black"
      >
        {modelLabel(model)}
        <ChevronDown
          className={cn(
            "w-3 h-3 text-black/60 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full mt-2 z-50 w-44 rounded-2xl border border-black/10 bg-white p-1 shadow-xl">
          {MODEL_CHAIN.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                onModelChange(m);
                setOpen(false);
              }}
              className="flex h-8 w-full items-center justify-between rounded-xl px-2.5 text-left text-xs font-medium text-black/80 transition hover:bg-[#F2F2F2] active:scale-[0.98]"
            >
              <span>{modelLabel(m)}</span>
              {m === model && <Check className="w-3.5 h-3.5 text-[#00C610]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
