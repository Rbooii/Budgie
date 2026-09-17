"use client";

/**
 * The copyright year lives in a Client Component on purpose: reading the
 * current time inside a prerendered Server Component is rejected by Cache
 * Components (`next-prerender-current-time`). Rendering it means it must sit
 * under a `Suspense` boundary, so the static shell keeps a year-less fallback
 * (see `footer.tsx`) and the year fills in on hydration.
 */
export function CopyrightYear() {
  return (
    <span suppressHydrationWarning>© {new Date().getFullYear()} Budgie.</span>
  );
}

/** Static-shell fallback for the copyright line (no clock access). */
export function CopyrightYearFallback() {
  return <span>© Budgie.</span>;
}
