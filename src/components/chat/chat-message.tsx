"use client";

import { useState } from "react";
import {
  isDynamicToolUIPart,
  isReasoningUIPart,
  isTextUIPart,
  isToolUIPart,
  type UIMessage,
} from "ai";
import { Check, Copy, RefreshCw, Sparkles } from "lucide-react";
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
      className="flex h-7 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium text-black/35 transition hover:bg-black/[0.04] hover:text-black/60 active:scale-95"
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
        <div className="max-w-[85%] sm:max-w-[340px] rounded-[20px] rounded-br-[6px] bg-[#00C610] px-4 py-2.5 text-[15px] leading-relaxed text-white whitespace-pre-wrap">
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
    <div className="flex w-full items-start gap-3 animate-[stepReveal_0.18s_ease-out] motion-reduce:animate-none">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00C610]/10 text-[#00C610]">
        <Sparkles className="h-3.5 w-3.5" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {message.parts.map((part, i) => {
          if (isTextUIPart(part)) {
            const isLastPart = i === message.parts.length - 1;
            return (
              <div
                key={i}
                className="w-full text-[15px] leading-relaxed text-black whitespace-pre-wrap"
              >
                {part.text}
                {streaming && isLastPart && (
                  <span
                    aria-hidden="true"
                    className="chat-caret ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] rounded-full bg-[#00C610]"
                  />
                )}
              </div>
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
                className="flex h-7 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium text-black/35 transition hover:bg-black/[0.04] hover:text-black/60 active:scale-95"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
