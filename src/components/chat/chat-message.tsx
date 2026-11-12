"use client";

import { useState } from "react";
import {
  isDynamicToolUIPart,
  isReasoningUIPart,
  isTextUIPart,
  isToolUIPart,
  type UIMessage,
} from "ai";
import { Check, Copy, RefreshCw } from "lucide-react";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { ChatThinking } from "@/components/chat/chat-thinking";
import { ChatToolCard } from "@/components/chat/chat-tool-card";
import { ChatToolStatus } from "@/components/chat/chat-tool-status";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — stay quiet
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy message"}
      className="flex h-7 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium text-ink/35 transition hover:bg-hover hover:text-ink/60 active:scale-95"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function ChatMessage({
  message,
  streaming = false,
  canRegenerate = false,
  onRegenerate,
}: {
  message: UIMessage;
  streaming?: boolean;
  canRegenerate?: boolean;
  onRegenerate?: () => void;
}) {
  if (message.role === "user") {
    const text = message.parts
      .filter((p) => isTextUIPart(p))
      .map((p) => p.text)
      .join("")
      .trim();

    return (
      <div className="flex justify-end animate-[stepReveal_0.18s_ease-out] motion-reduce:animate-none">
        <div className="max-w-[85%] sm:max-w-[340px] rounded-[20px] rounded-br-[6px] bg-brand px-4 py-2.5 text-[15px] leading-relaxed text-white whitespace-pre-wrap">
          {text}
        </div>
      </div>
    );
  }

  const plainText = message.parts
    .filter((p) => isTextUIPart(p))
    .map((p) => p.text)
    .join("")
    .trim();

  return (
    <div className="flex w-full flex-col gap-2.5 animate-[stepReveal_0.18s_ease-out] motion-reduce:animate-none">
      {message.parts.map((part, i) => {
        if (isTextUIPart(part)) {
          const isLastPart = i === message.parts.length - 1;
          return (
            <ChatMarkdown
              key={i}
              text={part.text}
              streaming={streaming && isLastPart}
            />
          );
        }
        if (isReasoningUIPart(part)) {
          return <ChatThinking key={i} part={part} />;
        }
        if (isDynamicToolUIPart(part)) {
          return (
            <ChatToolStatus key={i} running={`Running ${part.toolName}…`} />
          );
        }
        if (isToolUIPart(part)) {
          return <ChatToolCard key={i} part={part} />;
        }
        return null;
      })}

      {!streaming && plainText && (
        <div className="-ml-2 flex items-center gap-0.5">
          <CopyButton text={plainText} />
          {canRegenerate && onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              aria-label="Regenerate response"
              className="flex h-7 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium text-ink/35 transition hover:bg-hover hover:text-ink/60 active:scale-95"
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </button>
          )}
        </div>
      )}

      {!streaming && !plainText && message.parts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink/45">
          <span>The model stopped before answering.</span>
          {canRegenerate && onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              aria-label="Retry response"
              className="flex h-7 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium text-ink/35 transition hover:bg-hover hover:text-ink/60 active:scale-95"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
