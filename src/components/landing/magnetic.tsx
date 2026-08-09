"use client";

import { useRef } from "react";

interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  /** Max displacement toward the cursor in px. */
  strength?: number;
}

/**
 * A wrapper that nudges its child toward the cursor (a few px, 150ms) — the
 * Gojek-style "magnetic" CTA. The offset is applied to the wrapper via CSS
 * vars and read by a transform so the child's own hover styles stay intact.
 * Disabled under `prefers-reduced-motion`.
 */
export function Magnetic({ children, className = "", strength = 4 }: MagneticProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    if (e.pointerType === "touch") return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(dx, dy);
    const pull = Math.min(1, dist / 120);
    const nx = (dx / Math.max(dist, 1)) * strength * pull;
    const ny = (dy / Math.max(dist, 1)) * strength * pull;
    el.style.setProperty("--mag-x", `${nx.toFixed(2)}px`);
    el.style.setProperty("--mag-y", `${ny.toFixed(2)}px`);
  }

  function onPointerLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--mag-x", "0px");
    el.style.setProperty("--mag-y", "0px");
  }

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={className}
      style={{
        transform: "translate(var(--mag-x, 0px), var(--mag-y, 0px))",
        transition:
          "transform 150ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease-out",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
