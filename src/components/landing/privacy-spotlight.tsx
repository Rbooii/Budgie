import { Eye, EyeOff } from "lucide-react";
import { Reveal } from "./reveal";
import { formatRupiah } from "@/lib/format";

export function PrivacySpotlight() {
  return (
    <section className="mx-auto max-w-screen-xl px-5 sm:px-8 py-20 sm:py-24">
      <Reveal>
        <div className="rounded-[35px] border border-black/[0.06] bg-[#FAFAFA] p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-[#00C610]">Privacy by default</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-black mt-2">
                Your balance stays private
              </h2>
              <p className="text-base text-black/45 mt-3 leading-relaxed">
                Balances hide behind bullets the moment you open the app. Tap the
                eye to reveal each character with a gentle, per-digit blur-in. Hide
                it again in a single tap whenever someone glances over your shoulder.
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {[
                  "Hidden by default on every device",
                  "Per-character reveal capped at 260ms",
                  "Honors your reduced-motion setting",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span
                      className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-[#1F9B29]"
                      aria-hidden="true"
                    />
                    <span className="text-sm text-black/70 leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pointer-events-none select-none rounded-[28px] bg-white border border-black/[0.06] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] p-6 sm:p-8">
              <div className="flex items-center gap-2">
                <p className="text-sm text-black/50">Your Net Worth</p>
                <span className="text-black/40">
                  <EyeOff className="w-4 h-4" />
                </span>
              </div>
              <p className="text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums mt-1 text-black">
                {"Rp\u00A0••••••••"}
              </p>
              <p className="text-sm font-medium tabular-nums text-[#00C610] mt-1">
                •••• From last Month
              </p>

              <div className="mt-6 flex items-center gap-2 rounded-[20px] bg-[#F2F2F2] px-5 py-4">
                <Eye className="w-4 h-4 text-black/40" />
                <p className="text-sm text-black/60">Tap to reveal — tap again to hide</p>
              </div>

              <div className="mt-4 flex items-baseline gap-2 tabular-nums">
                <span className="text-xs text-black/40">Revealed:</span>
                <span className="text-sm font-semibold text-black">
                  {formatRupiah(18_650_000)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}