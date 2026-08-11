"use client";

import { useEffect, useRef, useState } from "react";

interface AutoVideoProps {
  mp4?: string;
  webm?: string;
  /** Tailwind classes for the outer frame (size, radius, shadow, border). */
  frameClassName?: string;
  /** Tailwind classes for the inner poster layer background tint. */
  posterClassName?: string;
  /** Optional poster content rendered above the tint (e.g. a caption strip). */
  posterContent?: React.ReactNode;
  /** Size of the centered play glyph tile. Default `w-16 h-16`. */
  glyphSize?: string;
  /** Accessible label describing the silent video (since it carries no audio). */
  label: string;
  /** Optional ref to the underlying <video> — lets a parent play/pause controller drive it. */
  videoRef?: React.Ref<HTMLVideoElement>;
}

/**
 * A silent, autoplaying, looping product video that:
 *  - shows a tinted "poster" + play glyph until the media can actually play
 *    (so the page never renders a broken/empty black video box);
 *  - only mounts its <source> tags once it scrolls into view (true lazy load);
 *  - never autoplays under `prefers-reduced-motion`, keeping the poster.
 * The video fades in over the poster once it is ready.
 */
export function AutoVideo({
  mp4,
  webm,
  frameClassName = "",
  posterClassName = "bg-[#F2F2F2]",
  posterContent,
  glyphSize = "w-16 h-16",
  label,
  videoRef: forwardedVideoRef,
}: AutoVideoProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [ready, setReady] = useState(false);
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
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -5% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const shouldPlay = inView && !reduced && Boolean(mp4 || webm);

  return (
    <div ref={wrapRef} className={`relative overflow-hidden ${frameClassName}`}>
      {/* Poster layer — visible until the video fades in (or permanently under reduced motion). */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center ${posterClassName}`}
        aria-hidden={shouldPlay && ready ? "true" : undefined}
      >
        <span
          className={`${glyphSize} rounded-full bg-white/90 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)] flex items-center justify-center transition-transform duration-200 ease-out motion-safe:group-hover:scale-110 motion-safe:group-hover:shadow-[0_12px_28px_-8px_rgba(0,0,0,0.24)]`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="w-1/2 h-1/2 text-black/70" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        {posterContent}
      </div>

      {shouldPlay && (
        <video
          ref={forwardedVideoRef}
          aria-hidden="true"
          aria-label={label}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          onCanPlay={(e) => {
            setReady(true);
            e.currentTarget.play().catch(() => {});
          }}
          className={`absolute inset-0 w-full h-full object-cover motion-reduce:opacity-0 transition-opacity duration-700 ease-out ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        >
          {webm && <source src={webm} type="video/webm" />}
          {mp4 && <source src={mp4} type="video/mp4" />}
        </video>
      )}
    </div>
  );
}