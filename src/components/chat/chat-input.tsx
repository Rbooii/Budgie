"use client";

import { useEffect, useRef } from "react";
import type { ChatStatus } from "ai";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  input: string;
  setInput: (value: string) => void;
  onSend: (text: string) => void;
  status: ChatStatus;
  stop: () => void;
};

export function ChatInput({ input, setInput, onSend, status, stop }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const busy = status === "submitted" || status === "streaming";
  const hasValue = input.trim() !== "";
  const canSend = busy || hasValue;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(Math.max(el.scrollHeight, 24), 120);
    el.style.height = `${next}px`;
  }, [input]);

  const submit = () => {
    if (busy || !hasValue) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="rounded-[26px] bg-white shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
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
        placeholder="Message Budgie…"
        aria-label="Prompt"
        rows={1}
        disabled={status === "error"}
        className="w-full max-h-[120px] resize-none overflow-y-auto bg-transparent px-[18px] pt-3.5 text-base leading-6 text-black outline-none placeholder:text-black/40 disabled:opacity-60"
      />
      <div className="flex justify-end px-3 pb-3 pt-1">
        <button
          type="button"
          onClick={() => (busy ? stop() : submit())}
          disabled={status === "error" || !canSend}
          aria-label={busy ? "Stop generating" : "Send message"}
          className={cn(
            "flex h-[38px] w-[38px] items-center justify-center rounded-full text-white transition active:scale-95",
            canSend ? "bg-[#171717] hover:opacity-90" : "bg-[#171717]/20",
          )}
        >
          {busy ? (
            <Square className="w-[15px] h-[15px] fill-current" />
          ) : (
            <ArrowUp className="w-[15px] h-[15px]" strokeWidth={2.5} />
          )}
        </button>
      </div>
    </div>
  );
}
