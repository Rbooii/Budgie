"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Sparkles, Trash2 } from "lucide-react";
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
import { Button } from "@/components/button";

const SUGGESTIONS = [
  "How much did I spend on Food & Drink this month?",
  "What's my net worth right now?",
  "Which subscriptions are due soon?",
  "Add a Rp 45.000 lunch expense",
];

export function ChatView({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
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
      <div className="flex items-center justify-between gap-2 min-h-[18px] mt-2">
        {autoDowngraded && modelIndex > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-black/40">
            <Sparkles className="w-3.5 h-3.5 text-[#1F9B29]" />
            Switched to a lighter model to stay within free limits.
          </p>
        )}
        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear chat"
            title="Clear chat"
            className="w-9 h-9 ml-auto shrink-0 rounded-full flex items-center justify-center text-black/40 hover:text-black hover:bg-[#F2F2F2] transition active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="chat-scroll relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
      >
        <div className="relative w-full min-h-full flex flex-col">
          <div className="mx-auto flex w-full flex-1 flex-col max-w-3xl">
            <div className="flex-1 flex flex-col gap-5 pt-1">
              {messages.length === 0 ? (
                <ChatEmptyState
                  userName={userName}
                  suggestions={SUGGESTIONS}
                  onPick={send}
                />
              ) : (
                <>
                  {messages.map((m) => (
                    <ChatMessage key={m.id} message={m} />
                  ))}
                  {status === "submitted" && (
                    <div
                      role="status"
                      aria-label="Budgie is typing"
                      className="flex items-center gap-1.5 rounded-[20px] bg-[#F2F2F2] px-4 py-3 w-fit"
                    >
                <span
                  className="w-1.5 h-1.5 rounded-full bg-black/30 animate-[typingPulse_1s_ease-in-out_infinite]"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-black/30 animate-[typingPulse_1s_ease-in-out_infinite]"
                  style={{ animationDelay: "200ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-black/30 animate-[typingPulse_1s_ease-in-out_infinite]"
                  style={{ animationDelay: "400ms" }}
                />
              </div>
            )}
          </>
        )}

        {error && (
          <div className="rounded-[20px] border border-[#FFBABA] bg-[#FFBABA]/30 p-4 flex flex-col gap-2 items-start">
            <p className="text-sm font-semibold text-[#D8000C]">
              Something went wrong
            </p>
            <p className="text-xs text-[#D8000C]/80">
              The assistant couldn&apos;t respond. Make sure the Gemini API key
              is set, then try again.
            </p>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={retry}
            >
              Retry
            </Button>
          </div>
        )}
            </div>
            <div className="grow min-h-6" />
          </div>

          <div className="sticky bottom-0 z-[5] pt-4">
            <ChatInput
              input={input}
              setInput={setInput}
              onSend={send}
              status={status}
              stop={stop}
              model={currentModel}
              onModelChange={handleModelChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}