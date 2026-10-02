"use client";

import type { ReactNode } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/components/theme-provider";
import { cn } from "@/lib/cn";

const OPTIONS: { value: Theme; label: string; icon: ReactNode }[] = [
  { value: "system", label: "System", icon: <Monitor className="h-3.5 w-3.5" /> },
  { value: "light", label: "Light", icon: <Sun className="h-3.5 w-3.5" /> },
  { value: "dark", label: "Dark", icon: <Moon className="h-3.5 w-3.5" /> },
];

export function ThemePicker() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className="flex w-full gap-1 rounded-full bg-surface p-1 sm:w-auto"
    >
      {OPTIONS.map((option) => {
        const active = option.value === theme;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-medium transition active:scale-[0.98] sm:flex-none",
              active
                ? "bg-card text-ink shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                : "text-ink/45 hover:text-ink/70",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
