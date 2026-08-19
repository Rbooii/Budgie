"use client";

import {
  isDynamicToolUIPart,
  isReasoningUIPart,
  isTextUIPart,
  isToolUIPart,
  type UIMessage,
} from "ai";
import { ChatThinking } from "@/components/chat/chat-thinking";
import { ChatToolCard } from "@/components/chat/chat-tool-card";
import { ChatToolStatus } from "@/components/chat/chat-tool-status";

export function ChatMessage({ message }: { message: UIMessage }) {
  if (message.role === "user") {
    const text = message.parts
      .filter((p) => isTextUIPart(p))
      .map((p) => p.text)
      .join("")
      .trim();

    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-[20px] bg-[#F2F2F2] px-4 py-2.5 text-[15px] leading-relaxed text-black whitespace-pre-wrap">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 items-start w-full">
      {message.parts.map((part, i) => {
        if (isTextUIPart(part)) {
          return (
            <div
              key={i}
              className="w-full text-[15px] leading-relaxed text-black whitespace-pre-wrap"
            >
              {part.text}
            </div>
          );
        }
        if (isReasoningUIPart(part)) {
          return <ChatThinking key={i} part={part} />;
        }
        if (isDynamicToolUIPart(part)) {
          return (
            <ChatToolStatus
              key={i}
              running={`Running ${part.toolName}…`}
            />
          );
        }
        if (isToolUIPart(part)) {
          return <ChatToolCard key={i} part={part} />;
        }
        return null;
      })}
    </div>
  );
}