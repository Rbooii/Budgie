"use client";

import { useEffect, useRef } from "react";
import { Trash2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ChatThreadSummary } from "@/lib/chat-history";

type HistoryProps = {
  threads: ChatThreadSummary[];
  activeId: string | null;
  loading?: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

function bucketOf(iso: string): "Today" | "Yesterday" | "Earlier" {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  return "Earlier";
}

function timeLabel(iso: string): string {
  const date = new Date(iso);
  const bucket = bucketOf(iso);
  if (bucket === "Today") {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function HistoryList({
  threads,
  activeId,
  loading,
  onSelect,
  onDelete,
}: HistoryProps) {
  const groups = (["Today", "Yesterday", "Earlier"] as const)
    .map((label) => ({
      label,
      threads: threads.filter((thread) => bucketOf(thread.updatedAt) === label),
    }))
    .filter((group) => group.threads.length > 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center px-3 pt-4 pb-2">
        <p className="text-xs font-semibold text-ink/45">Chats</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {loading && threads.length === 0 && (
          <div className="space-y-2 px-1 pt-1" aria-hidden="true">
            <div className="h-9 w-full rounded-[12px] bg-surface" />
            <div className="h-9 w-5/6 rounded-[12px] bg-surface" />
            <div className="h-9 w-2/3 rounded-[12px] bg-surface" />
          </div>
        )}

        {!loading && threads.length === 0 && (
          <p className="px-2.5 pt-2 text-xs leading-relaxed text-ink/35">
            No chats yet. Start with a question in the composer.
          </p>
        )}

        {groups.map((group) => (
          <div key={group.label} className="mb-1">
            <p className="px-2.5 pt-2 pb-1 text-[11px] font-medium text-ink/30">
              {group.label}
            </p>
            {group.threads.map((thread) => {
              const active = thread.id === activeId;
              return (
                <div key={thread.id} className="group relative flex items-center">
                  <button
                    type="button"
                    onClick={() => onSelect(thread.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex min-w-0 flex-1 flex-col items-start rounded-[12px] px-2.5 py-2 pr-8 text-left transition active:scale-[0.99]",
                      active
                        ? "bg-surface text-ink"
                        : "text-ink/65 hover:bg-hover hover:text-ink",
                    )}
                  >
                    <span className="w-full truncate text-[13px] font-medium">
                      {thread.title}
                    </span>
                    <span className="mt-0.5 text-[11px] text-ink/35">
                      {timeLabel(thread.updatedAt)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(thread.id)}
                    aria-label={`Delete ${thread.title}`}
                    className="absolute right-1 flex h-7 w-7 items-center justify-center rounded-full text-ink/30 opacity-0 transition hover:bg-hover hover:text-expense focus:opacity-100 group-hover:opacity-100 active:scale-95"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p className="shrink-0 px-3 pb-4 pt-2 text-[11px] text-ink/30">
        History is kept for 2 days.
      </p>
    </div>
  );
}

export function ChatHistoryRail(props: HistoryProps) {
  return (
    <aside className="hidden w-[268px] shrink-0 flex-col border-l border-hairline lg:flex">
      <HistoryList {...props} />
    </aside>
  );
}

export function ChatHistorySheet({
  open,
  onClose,
  ...props
}: HistoryProps & { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeydown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeydown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close history"
        onClick={onClose}
        className="absolute inset-0 bg-scrim/40 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chat history"
        className="absolute inset-y-0 right-0 w-[86%] max-w-[320px] border-l border-hairline bg-screen shadow-2xl animate-[chatDrawerIn_0.2s_ease-out] motion-reduce:animate-none"
      >
        <style>{`
          @keyframes chatDrawerIn {
            from { opacity: 0; transform: translateX(14px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>
        <div className="flex items-center justify-end px-3 pt-3">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close history"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink/45 transition hover:bg-hover hover:text-ink active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-[calc(100%-3rem)]">
          <HistoryList {...props} />
        </div>
      </div>
    </div>
  );
}
