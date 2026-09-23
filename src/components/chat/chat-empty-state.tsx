"use client";

import { useEffect, useState } from "react";
import {
  PiggyBank,
  Plus,
  Sparkles,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

function timeOfDayPhrase(hour: number): string {
  if (hour >= 5 && hour < 12) return "this morning";
  if (hour >= 12 && hour < 17) return "this afternoon";
  if (hour >= 17 && hour < 22) return "this evening";
  return "this late night";
}

const PROMPT_META: { icon: LucideIcon; hint: string; tint: string }[] = [
  {
    icon: TrendingUp,
    hint: "See where your money went",
    tint: "bg-[#FFBABA]/40 text-[#D8000C]",
  },
  {
    icon: Wallet,
    hint: "Accounts and totals",
    tint: "bg-[#A0FFA8]/50 text-[#1F9B29]",
  },
  {
    icon: PiggyBank,
    hint: "How much is left to spend",
    tint: "bg-[#FFD9A0]/50 text-[#B25B00]",
  },
  {
    icon: Plus,
    hint: "Log an expense in plain words",
    tint: "bg-[#00C610]/10 text-[#1F9B29]",
  },
];

export function ChatEmptyState({
  userName,
  suggestions,
  onPick,
}: {
  userName?: string;
  suggestions: string[];
  onPick: (text: string) => void;
}) {
  const [phrase, setPhrase] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    Promise.resolve().then(() => setPhrase(timeOfDayPhrase(hour)));
  }, []);

  const firstName = userName?.trim().split(/\s+/)[0];

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-2 py-8 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00C610]/10 text-[#00C610]">
        <Sparkles className="h-5 w-5" />
      </span>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-black">
        {firstName ? `Hi ${firstName}, how` : "How"} can I help
        {phrase ? ` you ${phrase}` : " you"}?
      </h1>
      <p className="mt-1.5 max-w-sm text-sm text-black/45">
        Ask about your balances, spending and budgets — or record a transaction
        in plain words.
      </p>

      <div className="mt-7 grid w-full max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2">
        {suggestions.map((prompt, i) => {
          const meta = PROMPT_META[i] ?? PROMPT_META[PROMPT_META.length - 1];
          const Icon = meta.icon;
          return (
            <button
              key={prompt}
              type="button"
              onClick={() => onPick(prompt)}
              className="group flex items-start gap-3 rounded-[20px] border border-black/[0.07] bg-white p-3.5 text-left transition hover:border-black/[0.12] hover:shadow-[0_6px_20px_-12px_rgba(0,0,0,0.25)] active:scale-[0.99]"
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] transition-transform duration-200 group-hover:scale-105",
                  meta.tint,
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-black">
                  {prompt}
                </span>
                <span className="mt-0.5 block text-xs text-black/40">
                  {meta.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
