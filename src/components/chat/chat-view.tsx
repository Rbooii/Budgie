"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  AlertTriangle,
  ArrowDown,
  History,
  Info,
  SquarePen,
} from "lucide-react";
import {
  CUSTOM_MODEL_ID,
  isCustomModel,
  isRateLimitError,
  MODEL_CHAIN,
  modelSelectionLabel,
  resolveChatModel,
  resolveModel,
  type ChatModelSelection,
} from "@/lib/chat-models";
import type {
  ChatThreadDetail,
  ChatThreadSummary,
} from "@/lib/chat-history";
import { threadTitle } from "@/lib/chat-history";
import {
  clearActiveThreadId,
  clearChat,
  clearLegacyChatMessages,
  loadActiveThreadId,
  loadChatDraft,
  loadChatModel,
  loadLegacyChatMessages,
  saveActiveThreadId,
  saveChatDraft,
  saveChatModel,
} from "@/lib/chat-storage";
import { api } from "@/lib/api-client";
import {
  ChatHistoryRail,
  ChatHistorySheet,
} from "@/components/chat/chat-history";
import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatModelMenu } from "@/components/chat/chat-model-menu";
import { ChatProviderDialog } from "@/components/chat/chat-provider-dialog";

const SUGGESTIONS = [
  "How much did I spend this month?",
  "What's my net worth?",
  "Show my budgets",
  "Record that I bought coffee",
];

type ProviderConfig = {
  configured: boolean;
  baseUrl: string | null;
  model: string | null;
  label: string | null;
  hasKey: boolean;
};

function setThreadParam(id: string | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("thread", id);
  else url.searchParams.delete("thread");
  window.history.replaceState(null, "", url.toString());
}

function requestedThreadId(): string | null {
  if (typeof window === "undefined") return null;
  return new URL(window.location.href).searchParams.get("thread");
}

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
  const [model, setModel] = useState<ChatModelSelection>(resolveModel(undefined));
  const [providerConfig, setProviderConfig] = useState<ProviderConfig | null>(
    null,
  );
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [providerOpen, setProviderOpen] = useState(false);
  const [autoDowngraded, setAutoDowngraded] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveCountRef = useRef(0);
  const creatingRef = useRef(false);
  const refreshTimerRef = useRef<number | null>(null);

  const fetchThreads = useCallback(async () => {
    try {
      const res = await api.chat.threads.$get();
      if (!res.ok) return [];
      const data = (await res.json()) as { threads: ChatThreadSummary[] };
      setThreads(data.threads);
      return data.threads;
    } catch {
      return [];
    } finally {
      setThreadsLoading(false);
    }
  }, []);

  const fetchProvider = useCallback(async () => {
    try {
      const res = await api["chat-provider"].$get();
      if (!res.ok) return null;
      const data = (await res.json()) as ProviderConfig;
      setProviderConfig(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  const loadThread = useCallback(async (id: string) => {
    try {
      const res = await api.chat.threads[":id"].$get({ param: { id } });
      if (!res.ok) return null;
      const data = (await res.json()) as { thread: ChatThreadDetail };
      return data.thread;
    } catch {
      return null;
    }
  }, []);

  /** Restore the model a thread was last used with (per-thread selection). */
  const applyThreadModel = useCallback(
    (thread: ChatThreadDetail, provider: ProviderConfig | null) => {
      if (!thread.model) return;
      const next = resolveChatModel(thread.model);
      if (isCustomModel(next) && !provider?.configured) return;
      setModel(next);
      saveChatModel(userId, next);
    },
    [userId],
  );

  const refreshSoon = useCallback(() => {
    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;
      void fetchThreads();
    }, 500);
  }, [fetchThreads]);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(async () => {
      const savedModel = loadChatModel(userId);
      const provider = await fetchProvider();
      let nextModel = savedModel;
      if (isCustomModel(nextModel) && !provider?.configured) {
        nextModel = resolveModel(undefined);
        saveChatModel(userId, nextModel);
      }
      if (cancelled) return;

      setModel(nextModel);
      setInput(loadChatDraft(userId));

      const list = await fetchThreads();
      if (cancelled) return;
      setThreadsLoading(false);

      const target = requestedThreadId() ?? loadActiveThreadId(userId);
      if (target) {
        const thread = await loadThread(target);
        if (thread && !cancelled) {
          setMessages(thread.messages as UIMessage[]);
          saveCountRef.current = thread.messages.length;
          setActiveThreadId(thread.id);
          saveActiveThreadId(userId, thread.id);
          setThreadParam(thread.id);
          applyThreadModel(thread, provider);
          setThreads((previous) =>
            previous.some((item) => item.id === thread.id)
              ? previous
              : [
                  {
                    id: thread.id,
                    title: thread.title,
                    model: thread.model,
                    messageCount: thread.messageCount,
                    createdAt: thread.createdAt,
                    updatedAt: thread.updatedAt,
                  },
                  ...previous,
                ],
          );
        } else {
          clearActiveThreadId(userId);
          setThreadParam(null);
          if (list.length === 0) {
            const legacy = loadLegacyChatMessages(userId);
            if (legacy.length > 0) {
              setMessages(legacy);
              saveCountRef.current = legacy.length;
            }
          }
        }
      } else {
        const legacy = loadLegacyChatMessages(userId);
        if (legacy.length > 0) {
          setMessages(legacy);
          saveCountRef.current = legacy.length;
        }
      }

      setHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, [
    userId,
    fetchProvider,
    fetchThreads,
    loadThread,
    applyThreadModel,
    setMessages,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    saveChatDraft(userId, input);
  }, [input, hydrated, userId]);

  // Persist the user message immediately (and the final message after the
  // stream). The server also saves on stream finish, but this keeps the rail
  // accurate if the tab closes mid-turn.
  useEffect(() => {
    if (!hydrated || !activeThreadId || messages.length === 0) return;
    if (status !== "submitted" && status !== "ready" && status !== "error") return;
    if (messages.length === saveCountRef.current) return;
    saveCountRef.current = messages.length;

    void api.chat.threads[":id"]
      .$patch({
        param: { id: activeThreadId },
        json: { messages },
      })
      .then((res) => {
        if (res.ok) refreshSoon();
      })
      .catch(() => {
        // The server-side onFinish save remains the source of truth.
      });
  }, [messages, status, hydrated, activeThreadId, refreshSoon]);

  useEffect(() => {
    if (!hydrated || !error || status !== "error") return;
    if (isCustomModel(model)) return;
    const index = MODEL_CHAIN.indexOf(model);
    if (index === -1 || index >= MODEL_CHAIN.length - 1) return;
    if (!isRateLimitError(error)) return;

    Promise.resolve().then(() => {
      const next = MODEL_CHAIN[index + 1];
      setModel(next);
      setAutoDowngraded(true);
      saveChatModel(userId, next);
      regenerate({ body: { model: next, threadId: activeThreadId } });
    });
  }, [error, status, hydrated, model, regenerate, userId, activeThreadId]);

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

  const ensureThread = async (text: string): Promise<string | null> => {
    if (activeThreadId) return activeThreadId;
    if (creatingRef.current) return null;
    creatingRef.current = true;
    try {
      const res = await api.chat.threads.$post({
        json: { title: threadTitle(text), model },
      });
      if (!res.ok) throw new Error("Could not start a new chat");
      const data = (await res.json()) as { thread: ChatThreadSummary };
      setActiveThreadId(data.thread.id);
      saveActiveThreadId(userId, data.thread.id);
      setThreadParam(data.thread.id);
      setThreads((previous) => [
        data.thread,
        ...previous.filter((item) => item.id !== data.thread.id),
      ]);
      return data.thread.id;
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not start a new chat",
      );
      return null;
    } finally {
      creatingRef.current = false;
    }
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || creatingRef.current) return;
    if (isCustomModel(model) && !providerConfig?.configured) {
      setProviderOpen(true);
      return;
    }

    setActionError(null);
    setInput("");
    saveChatDraft(userId, "");
    setAtBottom(true);

    const threadId = await ensureThread(trimmed);
    if (!threadId) return;

    try {
      await sendMessage(
        { text: trimmed },
        { body: { model, threadId } },
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not send the message",
      );
    }
  };

  const retry = () => {
    setActionError(null);
    if (messages.length === 0) return;
    regenerate({ body: { model, threadId: activeThreadId } });
  };

  const startNewChat = () => {
    if (status === "streaming" || status === "submitted") stop();
    clearChat(userId);
    clearLegacyChatMessages(userId);
    saveCountRef.current = 0;
    setMessages([]);
    setInput("");
    setActiveThreadId(null);
    setThreadParam(null);
    setActionError(null);
    setAtBottom(true);
    setHistoryOpen(false);
  };

  const handleClear = () => {
    startNewChat();
  };

  const selectThread = async (id: string) => {
    if (id === activeThreadId) {
      setHistoryOpen(false);
      return;
    }
    if (status === "streaming" || status === "submitted") stop();

    const thread = await loadThread(id);
    if (!thread) {
      setThreads((previous) => previous.filter((item) => item.id !== id));
      startNewChat();
      return;
    }

    setMessages(thread.messages as UIMessage[]);
    saveCountRef.current = thread.messages.length;
    setActiveThreadId(thread.id);
    saveActiveThreadId(userId, thread.id);
    setThreadParam(thread.id);
    applyThreadModel(thread, providerConfig);
    setActionError(null);
    setAtBottom(true);
    setHistoryOpen(false);
  };

  const deleteThread = async (id: string) => {
    if (!window.confirm("Delete this chat?")) return;
    try {
      const res = await api.chat.threads[":id"].$delete({ param: { id } });
      if (!res.ok && res.status !== 404) {
        throw new Error("Could not delete the chat");
      }
      setThreads((previous) => previous.filter((item) => item.id !== id));
      if (id === activeThreadId) startNewChat();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not delete the chat",
      );
    }
  };

  const handleModelChange = (next: ChatModelSelection) => {
    if (isCustomModel(next) && !providerConfig?.configured) {
      setProviderOpen(true);
      return;
    }
    setModel(next);
    setAutoDowngraded(false);
    saveChatModel(userId, next);
  };

  const handleProviderChanged = async () => {
    const next = await fetchProvider();
    if (next?.configured) {
      setModel(CUSTOM_MODEL_ID);
      saveChatModel(userId, CUSTOM_MODEL_ID);
    } else if (isCustomModel(model)) {
      const fallback = resolveModel(undefined);
      setModel(fallback);
      saveChatModel(userId, fallback);
    }
    void fetchThreads();
  };

  const activeThread = activeThreadId
    ? threads.find((thread) => thread.id === activeThreadId)
    : undefined;
  const title = activeThread?.title ?? "Budgie Assistant";
  const currentLabel = modelSelectionLabel(model, providerConfig?.label);
  const visibleError = actionError ?? (error ? "Something went wrong" : null);

  return (
    <div className="flex h-[calc(100dvh-var(--app-tabbar-h))] min-h-0 w-full bg-screen md:h-[100dvh]">
      <ChatHistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        threads={threads}
        activeId={activeThreadId}
        loading={threadsLoading}
        onSelect={selectThread}
        onDelete={deleteThread}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 px-4 pb-3 pt-4 sm:px-6">
          <Image
            src="/android-chrome-192x192.png"
            alt=""
            width={30}
            height={30}
            className="rounded-[9px]"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-ink">
              {title}
            </p>
            <p className="truncate text-[11px] text-ink/40">{currentLabel}</p>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              aria-label="Open chat history"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 transition hover:bg-hover hover:text-ink active:scale-95 lg:hidden"
            >
              <History className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              aria-label="New chat"
              title="New chat"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-card text-ink/70 transition hover:bg-hover hover:text-ink active:scale-95"
            >
              <SquarePen className="h-[15px] w-[15px]" />
            </button>
          </div>
        </header>

        <div className="relative flex-1 min-h-0">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="chat-scroll h-full overflow-y-auto overflow-x-hidden"
          >
            <div
              role="log"
              aria-live="polite"
              className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-4 px-4 pb-6 pt-2 sm:px-6"
            >
              {messages.length === 0 ? (
                <ChatEmptyState
                  userName={userName}
                  suggestions={SUGGESTIONS}
                  onPick={(text) => void send(text)}
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
                      className="flex w-fit items-center rounded-[20px] rounded-tl-[6px] bg-card px-4 py-3"
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

        <div className="shrink-0 px-4 pb-3 sm:px-6">
          <div className="mx-auto w-full max-w-3xl">
            {visibleError && (
              <div
                role="alert"
                className="mb-2 flex items-center gap-2.5 rounded-[16px] bg-expense/10 px-3.5 py-2.5 text-expense"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <p className="text-[13px] font-medium">{visibleError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setActionError(null);
                    if (error) retry();
                  }}
                  className="ml-auto h-8 shrink-0 rounded-full border border-expense/50 px-3.5 text-[13px] font-semibold text-expense transition hover:bg-expense/10 active:scale-95"
                >
                  Retry
                </button>
              </div>
            )}

            {autoDowngraded && !isCustomModel(model) && (
              <p className="mb-2 flex items-center gap-1.5 text-[11px] text-ink/45">
                <Info className="w-3 h-3" />
                Switched to a lighter model to stay within free limits.
              </p>
            )}

            <ChatInput
              input={input}
              setInput={setInput}
              onSend={(text) => void send(text)}
              status={status}
              stop={stop}
              modelMenu={
                <ChatModelMenu
                  model={model}
                  customLabel={providerConfig?.label}
                  customConfigured={Boolean(providerConfig?.configured)}
                  onModelChange={handleModelChange}
                  onManageProvider={() => setProviderOpen(true)}
                />
              }
            />

            <p className="mt-2 text-center text-[11px] text-ink/35">
              Budgie can make mistakes. Double-check the important numbers.
            </p>
          </div>
        </div>
      </div>

      <ChatHistoryRail
        threads={threads}
        activeId={activeThreadId}
        loading={threadsLoading}
        onSelect={selectThread}
        onDelete={deleteThread}
      />

      <ChatProviderDialog
        open={providerOpen}
        onOpenChange={setProviderOpen}
        onChanged={() => void handleProviderChanged()}
      />
    </div>
  );
}
