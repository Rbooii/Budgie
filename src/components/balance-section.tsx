"use client";

import { Eye, EyeOff } from "lucide-react";
import { useBalanceVisibility, MaskedBalance } from "@/components/balance-visibility";
import { formatRupiah } from "@/lib/format";

interface BalanceSectionProps {
  value: number;
  deltaPct: number | null;
  deltaAbsolute: number;
}

export function BalanceSection({ value, deltaPct, deltaAbsolute }: BalanceSectionProps) {
  const { hidden, toggle, toggleCount } = useBalanceVisibility();
  const deltaText = deltaPct !== null
    ? `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}% From last Month`
    : `${deltaAbsolute >= 0 ? "+" : "-"}${formatRupiah(Math.abs(deltaAbsolute))} this month`;
  const deltaColor = deltaAbsolute >= 0 ? "text-[#00C610]" : "text-[#D8000C]";

  return (
    <div className="w-full h-fit mt-8 md:mt-10">
      <div className="flex items-center gap-2">
        <p className="text-sm text-black/50">Your Net Worth</p>
        <button
          type="button"
          onClick={toggle}
          aria-label={hidden ? "Show balance" : "Hide balance"}
          className="text-black/40 hover:text-black/70 active:scale-95 transition [perspective:300px]"
        >
          <span
            key={toggleCount}
            className={`inline-flex ${toggleCount > 0 ? "animate-[eyeFlip_0.25s_ease-out] motion-reduce:animate-none" : ""}`}
          >
            {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </span>
        </button>
      </div>

      <div className="flex flex-col items-start gap-1 md:flex-row md:items-baseline md:gap-3 w-fit h-fit mt-1">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          <MaskedBalance value={value} mask="long" />
        </h1>
        <p className={`text-sm font-medium tabular-nums ${deltaColor}`}>
          {hidden ? "•••• From last Month" : deltaText}
        </p>
      </div>
    </div>
  );
}