"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/** Offset so anchored sections never hide under the sticky nav. */
const NAV_OFFSET = -88;

/**
 * Buttery-smooth scrolling for the landing page (Lenis).
 *
 * - Instantiates a Lenis instance with an eased rAF loop (expo-out feel).
 * - Intercepts in-page hash clicks (`#section` and `/#section` while on `/`)
 *   and glides to the target instead of jumping.
 * - On mount it settles any `/#hash` in the URL (deep links from other pages)
 *   with the same smooth glide, then strips the hash from the address bar.
 * - Fully disabled under `prefers-reduced-motion` — native anchor behavior.
 * Renders nothing; it is a pure behavior layer.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ duration: 1.15 });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    function scrollToHash(hash: string) {
      const target = document.getElementById(hash);
      if (!target) return false;
      lenis.scrollTo(target, { offset: NAV_OFFSET });
      return true;
    }

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = (e.target as HTMLElement | null)?.closest?.("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      const hash = href.split("#")[1];
      if (!hash) return;
      if (scrollToHash(hash)) e.preventDefault();
    };
    document.addEventListener("click", onClick);

    let settleFrame = 0;
    const settle = () => {
      cancelAnimationFrame(settleFrame);
      settleFrame = requestAnimationFrame(() => {
        const hash = window.location.hash;
        if (!hash) return;
        if (scrollToHash(hash.slice(1))) {
          history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      });
    };
    settle();

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(settleFrame);
      document.removeEventListener("click", onClick);
      lenis.destroy();
    };
  }, []);

  return null;
}
