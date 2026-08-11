"use client";

import { useEffect, useState } from "react";

/**
 * A plain count-up tick for the live bento previews. Advances every
 * `intervalMs`; stays at 0 forever under `prefers-reduced-motion` (the
 * previews then render their stable first frame — no timers, no motion).
 * Components derive their state deterministically from `tick`, so the mock
 * feeds are testable with fake timers.
 */
export function useLiveTick(intervalMs: number): number {
  const [tick, setTick] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [reduced, intervalMs]);

  return tick;
}
