"use client";

import { useRef } from "react";
import { ArrowUp, Square } from "lucide-react";
import type { ChatStatus } from "ai";

type Props = {
  input: string;
  setInput: (value: string) => void;
  onSend: (text: string) => void;
  status: ChatStatus;
  stop: () => void;
};

export function ChatInput({
  input,
  setInput,
  onSend,
  status,
  stop,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const busy = status === "submitted" || status === "streaming";

  const autoGrow = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const submit = () => {
    const text = input.trim();
    if (!text || status !== "ready") return;
    onSend(text);
    setInput("");
    const el = ref.current;
    if (el) el.style.height = "auto";
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-end gap-2"
    >
      <textarea
        ref={ref}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          autoGrow();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={1}
        disabled={status === "error"}
        placeholder="Ask about your money…"
        className="flex-1 min-h-11 max-h-40 resize-none rounded-[22px] bg-[#F2F2F2] px-5 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/15 transition disabled:opacity-60"
      />
      {busy ? (
        <button
          type="button"
          onClick={stop}
          aria-label="Stop generating"
          className="h-11 w-11 shrink-0 rounded-full bg-white border border-black/10 text-black flex items-center justify-center hover:bg-[#F2F2F2] transition active:scale-95"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={!input.trim() || status !== "ready"}
          aria-label="Send message"
          className="h-11 w-11 shrink-0 rounded-full bg-[#00C610] text-white flex items-center justify-center transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </form>
  );
}