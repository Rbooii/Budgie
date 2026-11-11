"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AlertTriangle, ArrowDown, Info, SquarePen } from "lucide-react";
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

export function ChatView({
  userId,
  userName,
}: {
  userId: string;
  userName?: string;
}) {
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
  const [atBottom, setAtBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    setAtBottom(true);
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
    if (!el || !atBottom) return;
    el.scrollTop = el.scrollHeight;
  }, [lastId, lastParts, status, messages.length, atBottom]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAtBottom(distance < 56);
  };

  const jumpToLatest = () => {
    const el = scrollRef.current;
    if (!el) return;
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof el.scrollTo === "function") {
      el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  };

  const handleClear = () => {
    clearChat(userId);
    setMessages([]);
    setInput("");
    setModelIndex(0);
    setAutoDowngraded(false);
    setAtBottom(true);
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col bg-chat">
      {/* Header — brand + one action (New chat). The model lives in the composer. */}
      <header className="flex shrink-0 items-center gap-3 px-4 pt-4 pb-3 sm:px-6">
        <Image
          src="/android-chrome-192x192.png"
          alt=""
          width={30}
          height={30}
          className="rounded-[9px]"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-ink">
            Budgie Assistant
          </p>
          <p className="truncate text-[11px] text-ink/40">
            Ask about your money or log a transaction
          </p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          aria-label="New chat"
          title="New chat"
          className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hairline bg-card text-ink/70 shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition hover:bg-hover hover:text-ink active:scale-95"
        >
          <SquarePen className="w-[15px] h-[15px]" />
        </button>
      </header>

      {/* Thread — the only scroll area. */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="chat-scroll h-full overflow-y-auto overflow-x-hidden"
        >
          <div
            role="log"
            aria-live="polite"
            className="flex min-h-full w-full flex-col gap-4 px-4 pt-2 pb-6 sm:px-6"
          >
            {messages.length === 0 ? (
              <ChatEmptyState
                userName={userName}
                suggestions={SUGGESTIONS}
                onPick={send}
              />
            ) : (
              <>
                {messages.map((m, i) => (
                  <ChatMessage
                    key={m.id}
                    message={m}
                    streaming={
                      status === "streaming" && i === messages.length - 1
                    }
                    canRegenerate={
                      i === messages.length - 1 &&
                      m.role === "assistant" &&
                      status !== "streaming"
                    }
                    onRegenerate={retry}
                  />
                ))}
                {status === "submitted" && (
                  <div
                    role="status"
                    aria-label="Budgie is thinking"
                    className="flex w-fit items-center rounded-[20px] rounded-tl-[6px] bg-card px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                  >
                    <span className="text-sm text-ink/40">Thinking</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {!atBottom && messages.length > 0 && (
          <button
            type="button"
            onClick={jumpToLatest}
            className="absolute bottom-4 left-1/2 z-10 flex h-9 -translate-x-1/2 items-center gap-1.5 rounded-full border border-hairline bg-card px-3.5 text-xs font-semibold text-ink/70 shadow-[0_6px_20px_-8px_rgba(0,0,0,0.25)] transition hover:text-ink active:scale-95 animate-[stepReveal_0.2s_ease-out] motion-reduce:animate-none"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            Latest
          </button>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 px-4 pb-3 sm:px-6">
        {error && (
          <div
            role="alert"
            className="mb-2 flex items-center gap-2.5 rounded-[16px] bg-expense/10 px-3.5 py-2.5 text-expense"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <p className="text-[13px] font-medium">Something went wrong</p>
            <button
              type="button"
              onClick={retry}
              className="ml-auto h-8 shrink-0 rounded-full border border-expense/50 px-3.5 text-[13px] font-semibold text-expense transition hover:bg-expense/10 active:scale-95"
            >
              Retry
            </button>
          </div>
        )}

        {autoDowngraded && modelIndex > 0 && (
          <p className="mb-2 flex items-center gap-1.5 text-[11px] text-ink/45">
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
          modelMenu={
            <ChatModelMenu model={currentModel} onModelChange={handleModelChange} />
          }
        />

        <p className="mt-2 text-center text-[11px] text-ink/35">
          Budgie can make mistakes. Double-check the important numbers.
        </p>
      </div>
    </div>
  );
}
