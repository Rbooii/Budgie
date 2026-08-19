"use client";

import { useRef } from "react";
import { ArrowUp, ChevronDown, Sparkles, Square } from "lucide-react";
import type { ChatStatus } from "ai";
import { modelLabel, MODEL_CHAIN, type ChatModelId } from "@/lib/chat-models";

type Props = {
  input: string;
  setInput: (value: string) => void;
  onSend: (text: string) => void;
  status: ChatStatus;
  stop: () => void;
  model: ChatModelId;
  onModelChange: (model: ChatModelId) => void;
};

export function ChatInput({
  input,
  setInput,
  onSend,
  status,
  stop,
  model,
  onModelChange,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const busy = status === "submitted" || status === "streaming";
  const isLite = model !== MODEL_CHAIN[0];

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
    <div className="w-full">
      <div className="rounded-[20px] border border-transparent bg-[#F4F4F4]/70 backdrop-blur-md shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_4px_20px_-12px_rgba(0,0,0,0.1)] px-4 pt-3.5 pb-2 transition focus-within:bg-white/85 focus-within:shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_6px_24px_-12px_rgba(0,0,0,0.15)]">
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
          placeholder="Write a message…"
          className="w-full min-h-[1.5rem] max-h-96 resize-none bg-transparent py-1 text-base leading-relaxed text-black placeholder:text-black/40 outline-none disabled:opacity-60"
        />
        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-1.5 text-xs text-black/45 select-none cursor-pointer">
            <Sparkles
              className={`w-3.5 h-3.5 ${isLite ? "text-[#1F9B29]" : "text-black/30"}`}
            />
            <select
              value={model}
              onChange={(e) => onModelChange(e.target.value as ChatModelId)}
              aria-label="Select model"
              className="bg-transparent text-xs text-black/45 outline-none cursor-pointer appearance-none"
            >
              {MODEL_CHAIN.map((m) => (
                <option key={m} value={m}>
                  {modelLabel(m)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-black/30" />
          </label>
          {busy ? (
            <button
              type="button"
              onClick={stop}
              aria-label="Stop generating"
              className="w-9 h-9 shrink-0 rounded-full bg-white border border-black/10 text-black flex items-center justify-center hover:bg-[#F2F2F2] transition active:scale-95"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || status !== "ready"}
              aria-label="Send message"
              className="w-9 h-9 shrink-0 rounded-full bg-[#00C610] text-white flex items-center justify-center transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <p className="text-center text-[11px] text-black/35 mt-2">
        Budgie can make mistakes. Double-check the important numbers.
      </p>
    </div>
  );
}