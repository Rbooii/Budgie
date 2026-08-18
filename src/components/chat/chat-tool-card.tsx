"use client";

import type { ToolUIPart } from "ai";
import { ChatToolResult } from "@/components/chat/chat-tool-result";
import { ChatToolStatus } from "@/components/chat/chat-tool-status";

const TOOL_META: Record<string, { label: string; running: string }> = {
  get_balance_accounts: {
    label: "Accounts",
    running: "Looking up your accounts…",
  },
  get_transactions: {
    label: "Transactions",
    running: "Searching your transactions…",
  },
  get_budgets: { label: "Budgets", running: "Checking your budgets…" },
  get_subscriptions: {
    label: "Subscriptions",
    running: "Fetching your subscriptions…",
  },
  get_insights: { label: "Insights", running: "Crunching your numbers…" },
  create_transaction: {
    label: "Transaction",
    running: "Adding the transaction…",
  },
};

export function ChatToolCard({ part }: { part: ToolUIPart }) {
  const toolName = part.type.replace(/^tool-/, "");
  const meta = TOOL_META[toolName] ?? {
    label: toolName,
    running: `Running ${toolName}…`,
  };

  if (part.state === "output-available") {
    return <ChatToolResult toolName={toolName} output={part.output} />;
  }

  if (part.state === "output-error") {
    return (
      <div className="max-w-[85%] sm:max-w-[70%] rounded-[20px] border border-[#FFBABA] bg-[#FFBABA]/30 px-4 py-3 animate-[stepReveal_0.2s_ease-out]">
        <p className="text-xs font-semibold text-[#D8000C]">
          {meta.label} failed
        </p>
        <p className="text-xs text-[#D8000C]/80 mt-0.5">
          {part.errorText ?? "The tool could not complete."}
        </p>
      </div>
    );
  }

  return <ChatToolStatus running={meta.running} />;
}