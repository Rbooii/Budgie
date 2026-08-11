import { HeroPill } from "./hero-pill";

/**
 * The hero H1, typed exactly like Notion's homepage title:
 * `font: sans-700-semibold` (600) at `clamp(2.625rem, 11.25vw - 25.5px, 6rem)`,
 * line-height `clamp(3rem, 10.83vw - 17px, 6.25rem)`, letter-spacing
 * `clamp(-0.2875rem, -0.6458vw + 2.375px, -0.09375rem)`.
 *
 * "Where your money {works}." — the verb sits in Notion's rotating
 * `productPillAnimation` (see `hero-pill.tsx`). Each line keeps the staggered
 * mask reveal (300ms ease-out, 80ms stagger, `motion-reduce` → final state).
 */
export function HeroHeadline() {
  return (
    <h1 className="text-[clamp(2.625rem,11.25vw-25.5px,6rem)] font-semibold leading-[clamp(3rem,10.83vw-17px,6.25rem)] tracking-[clamp(-0.2875rem,-0.6458vw+2.375px,-0.09375rem)] text-black">
      <span className="block overflow-hidden">
        <span className="block animate-[headlineReveal_0.3s_ease-out_backwards] motion-reduce:animate-none">
          Where your money
        </span>
      </span>
      <span className="block overflow-hidden">
        <span className="block animate-[headlineReveal_0.3s_ease-out_0.08s_backwards] motion-reduce:animate-none">
          <HeroPill />.
        </span>
      </span>
      <style>{`
        @keyframes headlineReveal {
          from { opacity: 0; transform: translateY(0.45em); filter: blur(6px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>
    </h1>
  );
}
