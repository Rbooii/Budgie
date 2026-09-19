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

  return (
    <div className="w-full h-fit mt-8 md:mt-10 rounded-[35px] bg-[#00C610] p-6 text-white">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-white/95">Balance</p>

        <span className="ml-auto text-xs font-semibold tabular-nums text-white/95 whitespace-nowrap">
          {hidden ? "•••• From last Month" : deltaText}
        </span>

        <button
          type="button"
          onClick={toggle}
          aria-label={hidden ? "Show balance" : "Hide balance"}
          className="flex items-center justify-center w-7 h-7 shrink-0 rounded-full text-white/90 hover:text-white active:scale-95 transition [perspective:300px]"
        >
          <span
            key={toggleCount}
            className={`inline-flex ${toggleCount > 0 ? "animate-[eyeFlip_0.25s_ease-out] motion-reduce:animate-none" : ""}`}
          >
            {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </span>
        </button>
      </div>

      <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-white">
        <MaskedBalance value={value} mask="long" />
      </h1>
    </div>
  );
}
