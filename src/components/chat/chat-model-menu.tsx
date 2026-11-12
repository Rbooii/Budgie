"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Settings2 } from "lucide-react";
import {
  CUSTOM_MODEL_ID,
  MODEL_CHAIN,
  isCustomModel,
  modelLabel,
  modelSelectionLabel,
  type ChatModelSelection,
} from "@/lib/chat-models";
import { cn } from "@/lib/cn";

export function ChatModelMenu({
  model,
  customLabel,
  customConfigured,
  onModelChange,
  onManageProvider,
}: {
  model: ChatModelSelection;
  customLabel?: string | null;
  customConfigured: boolean;
  onModelChange: (model: ChatModelSelection) => void;
  onManageProvider: () => void;
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

  const label = modelSelectionLabel(model, customLabel);

  return (
    <div ref={ref} className="relative flex justify-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Select model. Current: ${label}`}
        className={cn(
          "flex h-7 max-w-[180px] items-center gap-1.5 rounded-full border border-hairline bg-surface px-2.5 text-[11px] font-medium text-ink/60 transition hover:text-ink active:scale-95",
          open && "text-ink",
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 text-ink/40 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Opens upward — the menu lives in the composer, not the header. */}
      {open && (
        <div className="absolute bottom-full mb-2 z-50 w-56 rounded-2xl border border-hairline bg-card p-1 shadow-xl">
          {MODEL_CHAIN.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                onModelChange(m);
                setOpen(false);
              }}
              className="flex h-8 w-full items-center justify-between gap-2 rounded-[10px] px-2.5 text-left text-xs font-medium text-ink/80 transition hover:bg-surface active:scale-[0.98]"
            >
              <span className="truncate">{modelLabel(m)}</span>
              {m === model && <Check className="h-3.5 w-3.5 text-brand" />}
            </button>
          ))}

          <div className="my-1 h-px bg-hairline" />

          {customConfigured ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onModelChange(CUSTOM_MODEL_ID);
                  setOpen(false);
                }}
                className="flex h-8 w-full items-center justify-between gap-2 rounded-[10px] px-2.5 text-left text-xs font-medium text-ink/80 transition hover:bg-surface active:scale-[0.98]"
              >
                <span className="truncate">{customLabel?.trim() || "Your model"}</span>
                {isCustomModel(model) && (
                  <Check className="h-3.5 w-3.5 text-brand" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onManageProvider();
                }}
                className="flex h-8 w-full items-center gap-2 rounded-[10px] px-2.5 text-left text-xs font-medium text-ink/50 transition hover:bg-surface hover:text-ink/80 active:scale-[0.98]"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Manage model
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onManageProvider();
              }}
              className="flex h-8 w-full items-center gap-2 rounded-[10px] px-2.5 text-left text-xs font-medium text-ink/60 transition hover:bg-surface hover:text-ink active:scale-[0.98]"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Connect a model
            </button>
          )}
        </div>
      )}
    </div>
  );
}
