"use client";

import { useEffect, useState } from "react";

const LEAD = "Money, made clearer.";
const STATEMENT =
  "See what you have, what you're saving for, and where the month actually went.";

function words(text: string) {
  return text.split(" ").map((word, index) => ({ word, index }));
}

/**
 * Anthropic's hero typography: one large paragraph, a sans lead at 600 and a
 * serif statement at 400. The reveal is a quiet word-by-word fade, not a
 * per-section scroll effect. Reduced motion renders the final state.
 */
export function HeroStatement() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  const leadWords = words(LEAD);
  const statementWords = words(STATEMENT);
  const offset = leadWords.length;

  return (
    <h1
      className="max-w-[1000px] font-serif text-[clamp(1.5625rem,3vw,3rem)] font-normal leading-[1.3] tracking-[-0.01em] text-ink"
      aria-label={`${LEAD} ${STATEMENT}`}
    >
      <span aria-hidden="true">
        {leadWords.map(({ word, index }) => (
          <span
            key={`lead-${index}`}
            className={`inline-block ${reduced ? "" : "hero-word"}`}
            style={{ animationDelay: `${index * 18}ms` }}
          >
            <span className="font-sans font-semibold">{word}</span>
            {index < leadWords.length - 1 ? "\u00A0" : "\u00A0"}
          </span>
        ))}
        {statementWords.map(({ word, index }) => (
          <span
            key={`statement-${index}`}
            className={`inline-block ${reduced ? "" : "hero-word"}`}
            style={{ animationDelay: `${(offset + index) * 18}ms` }}
          >
            <span className="font-serif font-normal">{word}</span>
            {index < statementWords.length - 1 ? "\u00A0" : ""}
          </span>
        ))}
      </span>

      <style>{`
        @keyframes heroWordIn {
          from { opacity: 0; transform: translateY(0.35em); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-word {
          animation: heroWordIn 0.6s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-word { opacity: 1; animation: none; }
        }
      `}</style>
    </h1>
  );
}
