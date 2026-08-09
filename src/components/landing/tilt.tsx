"use client";

import { useRef } from "react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  /** Max tilt in degrees. */
  maxTilt?: number;
  /** Scale applied while the pointer is over the card. */
  hoverScale?: number;
}

/**
 * A subtle 3D perspective tilt that follows the cursor (Cashapp-style hero
 * card). Rotation is applied through CSS vars consumed by a transform with a
 * `perspective()` wrapper — the card itself stays GPU-composited. Disabled
 * under `prefers-reduced-motion` and for touch pointers (tilt is a
 * pointer-device flourish, not an accessibility feature).
 */
export function TiltCard({
  children,
  className = "",
  maxTilt = 6,
  hoverScale = 1.015,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    if (e.pointerType === "touch") return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (0.5 - py) * maxTilt * 2;
    const ry = (px - 0.5) * maxTilt * 2;
    el.style.setProperty("--tilt-x", `${rx.toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${ry.toFixed(2)}deg`);
    el.style.setProperty("--tilt-scale", `${hoverScale}`);
  }

  function onPointerLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
    el.style.setProperty("--tilt-scale", "1");
  }

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={className}
      style={{
        perspective: "1200px",
      }}
    >
      <div
        className="will-change-transform transition-transform duration-150 ease-out motion-reduce:transition-none"
        style={{
          transform:
            "rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)) " +
            "scale(var(--tilt-scale, 1))",
        }}
      >
        {children}
      </div>
    </div>
  );
}
