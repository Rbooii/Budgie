"use client";

import { useEffect, useState } from "react";

function timeOfDayPhrase(hour: number): string {
  if (hour >= 5 && hour < 12) return "this morning";
  if (hour >= 12 && hour < 17) return "this afternoon";
  if (hour >= 17 && hour < 22) return "this evening";
  return "this late night";
}

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
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        {firstName ? `Hi ${firstName}, how` : "How"} can I help
        {phrase ? ` you ${phrase}` : " you"}?
      </h1>
      <p className="mt-1.5 max-w-sm text-sm text-ink/45">
        Ask about your balances, spending and budgets — or record a transaction
        in plain words.
      </p>

      <div className="mt-7 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
        {suggestions.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPick(prompt)}
            className="rounded-[20px] border border-hairline bg-card p-4 text-left text-sm font-medium leading-snug text-ink/70 transition hover:bg-hover hover:text-ink active:scale-[0.99]"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
