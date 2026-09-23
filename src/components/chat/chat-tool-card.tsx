"use client";

import { AlertTriangle } from "lucide-react";
import type { ToolUIPart } from "ai";
import { ChatToolResult } from "@/components/chat/chat-tool-result";
import { ChatToolStatus } from "@/components/chat/chat-tool-status";

const TOOL_META: Record<string, { running: string }> = {
  get_balance_accounts: { running: "Looking up your accounts…" },
  get_transactions: { running: "Fetching your transactions…" },
  get_budgets: { running: "Checking your budgets…" },
  get_subscriptions: { running: "Looking up your subscriptions…" },
  get_insights: { running: "Analyzing your money…" },
  create_transaction: { running: "Adding the transaction…" },
};

export function ChatToolCard({ part }: { part: ToolUIPart }) {
  const toolName = part.type.replace(/^tool-/, "");
  const meta = TOOL_META[toolName] ?? { running: "Working…" };

  if (part.state === "output-available") {
    return <ChatToolResult toolName={toolName} output={part.output} />;
  }

  if (part.state === "output-error") {
    return (
      <div className="flex max-w-[440px] items-start gap-2 rounded-[16px] bg-[#D8000C]/10 px-3.5 py-2.5 text-[#D8000C] animate-[stepReveal_0.2s_ease-out]">
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <p className="text-[13px] font-medium">
          {part.errorText ?? "Something went wrong"}
        </p>
      </div>
    );
  }

  return <ChatToolStatus running={meta.running} />;
}
