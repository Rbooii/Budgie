"use client";

/**
 * The hero H1 with a staggered line-mask reveal. Each line sits in an
 * `overflow-hidden` track and its inner span animates from blurred + lowered
 * to settled (300ms, `ease-out`, 80ms stagger). Pure CSS — no state, no
 * hydration risk. Under `prefers-reduced-motion` the animation is disabled and
 * the final state renders immediately.
 */
export function HeroHeadline() {
  return (
    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-black leading-[1.05]">
      <span className="block overflow-hidden">
        <span className="block animate-[headlineReveal_0.3s_ease-out_backwards] motion-reduce:animate-none">
          Your money,
        </span>
      </span>
      <span className="block overflow-hidden">
        <span
          className="block animate-[headlineReveal_0.3s_ease-out_0.08s_backwards] motion-reduce:animate-none"
        >
          Your{" "}
          <span className="text-[#00C610]">Control</span>
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
