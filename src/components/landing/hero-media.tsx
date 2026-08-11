"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { AutoVideo } from "./auto-video";

/**
 * The hero media — Notion's `HeroMedia` anatomy: the silent product demo in a
 * hairline-bordered frame (rounded, soft layered shadow) with a round
 * play/pause controller docked bottom-left (32px, black/10 + backdrop blur,
 * exactly like Notion's `HeroMedia_playPauseController`).
 *
 * The controller only renders when motion is allowed; under
 * `prefers-reduced-motion` the poster stays and the button disappears.
 */
export function HeroMedia() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  function toggle() {
    const video = videoRef.current;
    const next = !paused;
    if (video) {
      try {
        if (next) {
          const result = video.play();
          if (result && typeof result.catch === "function") result.catch(() => {});
        } else {
          video.pause();
        }
      } catch {
        // jsdom / autoplay policy — nothing to recover from
      }
    }
    setPaused(next);
  }

  return (
    <div className="relative mx-auto max-w-[960px]">
      <AutoVideo
        webm="/videos/brand.webm"
        mp4="https://9a9a9kybzrewury8.public.blob.vercel-storage.com/BudgieDemo"
        label="Budgie app walkthrough, sixty seconds, silent"
        videoRef={videoRef}
        glyphSize="w-14 h-14"
        posterClassName="bg-[#FAFAFA]"
        frameClassName="aspect-square sm:aspect-[1.6] rounded-[8px] border border-black/10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12),0_24px_60px_-20px_rgba(0,0,0,0.18)]"
      />

      {!reduced && (
        <button
          type="button"
          onClick={toggle}
          aria-label={paused ? "Play demo video" : "Pause demo video"}
          className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10 w-8 h-8 rounded-full bg-black/10 backdrop-blur-md text-white flex items-center justify-center transition-all duration-150 hover:scale-105 hover:bg-black/20 active:scale-95 motion-reduce:transition-none"
        >
          {paused ? (
            <Play className="w-3.5 h-3.5 ml-0.5" />
          ) : (
            <Pause className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </div>
  );
}
