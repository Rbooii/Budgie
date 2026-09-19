"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AlertTriangle, Info, SquarePen, Trash2 } from "lucide-react";
import { isRateLimitError, MODEL_CHAIN, type ChatModelId } from "@/lib/chat-models";
import {
  clearChat,
  loadChatDraft,
  loadChatMessages,
  loadChatModel,
  saveChatDraft,
  saveChatMessages,
  saveChatModel,
} from "@/lib/chat-storage";
import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatModelMenu } from "@/components/chat/chat-model-menu";

const SUGGESTIONS = [
  "How much did I spend this month?",
  "What's my net worth?",
  "Show my budgets",
  "Record that I bought coffee",
];

export function ChatView({ userId }: { userId: string }) {
  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
    regenerate,
    setMessages,
  } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [modelIndex, setModelIndex] = useState(0);
  const [autoDowngraded, setAutoDowngraded] = useState(false);
  const [columnHeight, setColumnHeight] = useState<string | undefined>(
    undefined,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      const top = Math.max(0, Math.ceil(root.getBoundingClientRect().top));
      const desktop =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(min-width: 768px)").matches;
      const bottomPad = desktop ? 56 : 96;
      setColumnHeight(`calc(100dvh - ${top}px - ${bottomPad}px)`);
    };
    measure();
    if (typeof ResizeObserver === "function") {
      const ro = new ResizeObserver(measure);
      ro.observe(root);
      window.addEventListener("resize", measure);
      return () => {
        ro.disconnect();
        window.removeEventListener("resize", measure);
      };
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      const saved = loadChatMessages(userId);
      if (saved.length > 0) setMessages(saved);
      setInput(loadChatDraft(userId));
      const savedModel = loadChatModel(userId);
      const savedIndex = Math.max(0, MODEL_CHAIN.indexOf(savedModel));
      setModelIndex(savedIndex);
      setAutoDowngraded(savedIndex > 0);
      setHydrated(true);
    });
  }, [userId, setMessages]);

  useEffect(() => {
    if (!hydrated) return;
    saveChatMessages(userId, messages);
  }, [messages, hydrated, userId]);

  useEffect(() => {
    if (!hydrated) return;
    saveChatDraft(userId, input);
  }, [input, hydrated, userId]);

  const currentModel = MODEL_CHAIN[modelIndex];

  const send = (text: string) => {
    setInput("");
    sendMessage({ text }, { body: { model: currentModel } });
  };

  const retry = () => {
    regenerate({ body: { model: currentModel } });
  };

  const handleModelChange = (model: ChatModelId) => {
    const idx = MODEL_CHAIN.indexOf(model);
    if (idx === -1) return;
    setModelIndex(idx);
    setAutoDowngraded(false);
    saveChatModel(userId, model);
  };

  useEffect(() => {
    if (!hydrated || !error || status !== "error") return;
    if (modelIndex >= MODEL_CHAIN.length - 1) return;
    if (!isRateLimitError(error)) return;

    Promise.resolve().then(() => {
      const next = MODEL_CHAIN[modelIndex + 1];
      setModelIndex(modelIndex + 1);
      setAutoDowngraded(true);
      saveChatModel(userId, next);
      regenerate({ body: { model: next } });
    });
  }, [error, status, hydrated, modelIndex, regenerate, userId]);

  const last = messages[messages.length - 1];
  const lastId = last?.id ?? "";
  const lastParts = last?.parts.length ?? 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastId, lastParts, status, messages.length]);

  const handleClear = () => {
    clearChat(userId);
    setMessages([]);
    setInput("");
    setModelIndex(0);
    setAutoDowngraded(false);
  };

  return (
    <div
      ref={rootRef}
      style={columnHeight ? { height: columnHeight } : undefined}
      className="mx-auto w-full max-w-3xl flex flex-col"
    >
      <div className="grid grid-cols-[40px_1fr_40px] items-center mt-2 shrink-0">
        <button
          type="button"
          onClick={handleClear}
          aria-label="New chat"
          title="New chat"
          className="w-10 h-10 rounded-full bg-white border border-black/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex items-center justify-center text-black/80 transition hover:bg-[#FAFAFA] active:scale-95"
        >
          <SquarePen className="w-[15px] h-[15px]" />
        </button>

        <ChatModelMenu model={currentModel} onModelChange={handleModelChange} />

        {messages.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear chat"
            title="Clear chat"
            className="justify-self-end w-10 h-10 rounded-full bg-white border border-black/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex items-center justify-center text-black/80 transition hover:bg-[#FAFAFA] active:scale-95"
          >
            <Trash2 className="w-[15px] h-[15px]" />
          </button>
        ) : (
          <span />
        )}
      </div>

      <div
        ref={scrollRef}
        className="chat-scroll relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
      >
        <div className="flex w-full flex-col gap-3.5 pt-4 pb-4">
          {messages.length === 0 ? (
            <ChatEmptyState suggestions={SUGGESTIONS} onPick={send} />
          ) : (
            <>
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
              {status === "submitted" && (
                <div
                  role="status"
                  aria-label="Budgie is typing"
                  className="flex items-center gap-1.5 rounded-[20px] rounded-tl-[6px] bg-white px-4 py-3 w-fit shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                >
                  <span
                    className="w-[7px] h-[7px] rounded-full bg-black/30 animate-[typingPulse_1s_ease-in-out_infinite]"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-[7px] h-[7px] rounded-full bg-black/30 animate-[typingPulse_1s_ease-in-out_infinite]"
                    style={{ animationDelay: "200ms" }}
                  />
                  <span
                    className="w-[7px] h-[7px] rounded-full bg-black/30 animate-[typingPulse_1s_ease-in-out_infinite]"
                    style={{ animationDelay: "400ms" }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-2.5 rounded-[16px] bg-[#D8000C]/10 px-3.5 py-2.5 text-[#D8000C] shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <p className="text-[13px] font-medium">Something went wrong</p>
          <button
            type="button"
            onClick={retry}
            className="ml-auto h-8 shrink-0 rounded-full border border-[#D8000C]/50 px-3.5 text-[13px] font-semibold text-[#D8000C] transition hover:bg-[#D8000C]/10 active:scale-95"
          >
            Retry
          </button>
        </div>
      )}

      <div className="pt-2 pb-2 shrink-0">
        {autoDowngraded && modelIndex > 0 && (
          <p className="mb-2 flex items-center gap-1.5 text-[11px] text-black/45">
            <Info className="w-3 h-3" />
            Switched to a lighter model to stay within free limits.
          </p>
        )}
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={send}
          status={status}
          stop={stop}
        />
      </div>
    </div>
  );
}
