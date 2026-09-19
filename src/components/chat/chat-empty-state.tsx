"use client";

import { useEffect, useState } from "react";

function timeOfDayPhrase(hour: number): string {
  if (hour >= 5 && hour < 12) return "this morning";
  if (hour >= 12 && hour < 17) return "this afternoon";
  if (hour >= 17 && hour < 22) return "this evening";
  return "this late night";
}

export function ChatEmptyState({
  suggestions,
  onPick,
}: {
  suggestions: string[];
  onPick: (text: string) => void;
}) {
  const [phrase, setPhrase] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    Promise.resolve().then(() => setPhrase(timeOfDayPhrase(hour)));
  }, []);

  return (
    <div className="flex flex-col items-center text-center px-4 pt-16 pb-6">
      <p className="font-serif text-[34px] leading-tight text-black max-w-md">
        How can I help you{phrase ? ` ${phrase}` : ""}?
      </p>

      <div className="mt-7 flex flex-col items-center gap-2.5">
        {suggestions.slice(0, 3).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="h-10 rounded-full border border-black/10 bg-white px-[18px] text-sm font-medium text-black/60 transition hover:bg-[#FAFAFA] active:scale-[0.98]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
