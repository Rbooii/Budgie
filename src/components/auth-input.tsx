import type { ComponentProps } from "react";

export function AuthInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={`w-full h-11 text-lg bg-card text-ink px-[17px] py-[6px] rounded-[20px] border border-hairline focus:outline-none focus:ring-2 focus:ring-ink/20 focus:scale-[1.015] focus:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.25)] focus:placeholder:text-ink/30 hover:border-ink/20 placeholder:text-ink/40 transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-hairline ${className ?? ""}`}
      {...props}
    />
  );
}