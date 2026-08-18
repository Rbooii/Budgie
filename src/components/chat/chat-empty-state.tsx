"use client";

import { MessageCircle } from "lucide-react";

export function ChatEmptyState({
  userName,
  suggestions,
  onPick,
}: {
  userName: string;
  suggestions: string[];
  onPick: (text: string) => void;
}) {
  return (
    <div className="flex flex-col items-center text-center pt-12 pb-6 px-4">
      <div className="w-12 h-12 rounded-full bg-[#F2F2F2] flex items-center justify-center text-black/30 mb-4">
        <MessageCircle className="w-6 h-6" />
      </div>
      <p className="text-lg font-semibold tracking-tight">
        Hi {userName}, ask me anything about your money
      </p>
      <p className="text-sm text-black/40 mt-1 max-w-sm">
        I can summarize your accounts, transactions, budgets, and
        subscriptions — or record a transaction for you.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-md">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="text-sm text-black/70 bg-[#F2F2F2] hover:bg-[#E9E9E9] rounded-full px-4 py-2 transition active:scale-[0.98]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}