"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { ChatStatus } from "ai";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  input: string;
  setInput: (value: string) => void;
  onSend: (text: string) => void;
  status: ChatStatus;
  stop: () => void;
  /** Model picker rendered in the composer's bottom row. */
  modelMenu?: ReactNode;
};

export function ChatInput({
  input,
  setInput,
  onSend,
  status,
  stop,
  modelMenu,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const busy = status === "submitted" || status === "streaming";
  const hasValue = input.trim() !== "";
  const canSend = busy || hasValue;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(Math.max(el.scrollHeight, 24), 160);
    el.style.height = `${next}px`;
  }, [input]);

  const submit = () => {
    if (busy || !hasValue) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="rounded-[24px] border border-black/10 bg-white shadow-[0_10px_30px_-16px_rgba(0,0,0,0.25)] transition focus-within:border-black/20 focus-within:ring-4 focus-within:ring-black/[0.04]">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Ask about your money…"
        aria-label="Prompt"
        rows={1}
        disabled={status === "error"}
        className="w-full max-h-[160px] resize-none overflow-y-auto bg-transparent px-4 pt-3.5 text-[15px] leading-6 text-black outline-none placeholder:text-black/35 disabled:opacity-60"
      />
      <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5 pt-1">
        {modelMenu ?? <span />}
        <button
          type="button"
          onClick={() => (busy ? stop() : submit())}
          disabled={status === "error" || !canSend}
          aria-label={busy ? "Stop generating" : "Send message"}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full transition active:scale-95",
            busy
              ? "bg-[#171717] text-white hover:opacity-90"
              : canSend
                ? "bg-[#00C610] text-white hover:opacity-90"
                : "bg-black/[0.06] text-black/30",
          )}
        >
          {busy ? (
            <Square className="w-[13px] h-[13px] fill-current" />
          ) : (
            <ArrowUp className="w-[16px] h-[16px]" strokeWidth={2.5} />
          )}
        </button>
      </div>
    </div>
  );
}
