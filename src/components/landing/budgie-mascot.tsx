const INK = "#141414";

/**
 * Budgie's mascot — the hand-drawn character above the hero headline, in
 * Notion's mascot language (Roman Muradov's ink faces: wobbly monoline
 * strokes, dot eyes, short brows, a hooked nose, one flat fill). Original
 * artwork drawn for Budgie — no third-party illustration assets.
 *
 * The only motion is a slow blink (every 6s, `motion-safe` only) so the hero
 * keeps one live element besides the rotating pill.
 */
export function BudgieMascot({ className }: { className?: string }) {
  return (
    <>
      <svg
        viewBox="0 0 160 176"
        role="img"
        aria-label="Budgie's mascot, a hand-drawn character"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* neck, tucked behind the head and the collar */}
        <path
          d="M73 92v18M87 92v18"
          stroke={INK}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* shirt — income pastel, V-neck collar */}
        <path
          d="M71 108 80 122 89 108c11 3 23 10 29 19 5 7 7 19 8 33H34c1-14 3-26 8-33 6-9 18-16 29-19Z"
          fill="#A0FFA8"
          stroke={INK}
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* head — white fill so the neck stays outside the jaw */}
        <path
          d="M80 18c21 0 35 14 35 36 0 14-5 30-17 42-5 5-11 8-18 8s-13-3-18-8C50 84 45 68 45 54c0-22 14-36 35-36Z"
          fill="#FFFFFF"
          stroke={INK}
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* ears */}
        <path
          d="M45 58c-5-1-7 7-2 11"
          stroke={INK}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M115 58c5-1 7 7 2 11"
          stroke={INK}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* hair — flat ink fill with a wavy fringe */}
        <path
          d="M45 52c-2-18 13-36 35-36s37 18 35 36c-3-6-7-10-13-12-6 7-16 5-22-2-6 7-16 9-22 2-6 2-10 6-13 12Z"
          fill={INK}
        />

        {/* brows */}
        <path
          d="M55 42c4-4 11-4 15-1"
          stroke={INK}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M90 41c4-3 11-3 15 1"
          stroke={INK}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* round glasses + the blink target inside them */}
        <circle cx="64" cy="59" r="13" stroke={INK} strokeWidth="3" />
        <circle cx="96" cy="59" r="13" stroke={INK} strokeWidth="3" />
        <path
          d="M77 59h6M50 57c-2-1-4-1-5 1M110 57c2-1 4-1 5 1"
          stroke={INK}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <g className="budgie-eyes">
          <circle cx="64" cy="59" r="3.4" fill={INK} />
          <circle cx="96" cy="59" r="3.4" fill={INK} />
        </g>

        {/* hooked nose + a small smile */}
        <path
          d="M80 64c3 4 4 8 0 10"
          stroke={INK}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M71 86c5 5 13 5 18 0"
          stroke={INK}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      <style>{`
        @keyframes budgieBlink {
          0%, 92%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        .budgie-eyes {
          transform-box: fill-box;
          transform-origin: center;
        }
        @media (prefers-reduced-motion: no-preference) {
          .budgie-eyes { animation: budgieBlink 6s ease-in-out infinite; }
        }
      `}</style>
    </>
  );
}
