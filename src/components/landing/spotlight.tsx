"use client";

import { useRef } from "react";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  /** Radius of the highlight circle in px. */
  radius?: number;
}

/**
 * A card that follows the cursor with a soft brand-green radial highlight.
 * The glow position is tracked via CSS vars (--spot-x / --spot-y) so the
 * highlight can be painted with a pure CSS radial-gradient — no re-renders.
 * Under `prefers-reduced-motion` the spotlight falls back to a static faint
 * sheen in the top-left corner (content stays fully visible).
 */
export function SpotlightCard({
  children,
  className = "",
  radius = 340,
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    if (e.pointerType === "touch") return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      className={`group/spot relative overflow-hidden ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-200 ease-out group-hover/spot:opacity-100 motion-reduce:opacity-100 motion-reduce:group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(" +
            `${radius}px circle at var(--spot-x, 12%) var(--spot-y, 0%), ` +
            "rgba(0,198,16,0.07), transparent 70%)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
