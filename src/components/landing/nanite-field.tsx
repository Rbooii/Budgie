"use client";

import { useEffect, useRef, useState } from "react";

type Particle = {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  bright: boolean;
  alpha: number;
};

type Search = { x: number; y: number; key: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * A roaming field of nanites. Each dot wanders on its own smooth phase and
 * keeps a minimum distance from its neighbors, so the field never merges into
 * one blob. A short search pull toward a new card fades before dispersing.
 * There is no orbit and no fixed ring. The loop pauses offscreen; reduced
 * motion gets a single static field.
 */
export function NaniteField({
  className,
  search,
}: {
  className?: string;
  search?: Search;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const searchRef = useRef<Search | undefined>(search);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const styles = getComputedStyle(canvas);
    const brand = styles.getPropertyValue("--brand").trim() || "rgb(90, 187, 55)";
    const dot =
      styles.getPropertyValue("--nanite-dot").trim() || "rgb(20, 20, 19)";

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let raf = 0;
    let running = false;
    let last = 0;
    let time = 0;
    let searchKey = -1;
    let searchUntil = 0;

    const init = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(clamp((width * height) / 1900, 100, 140));
      particles = Array.from({ length: count }, () => {
        const x = Math.random() * width;
        const y = Math.random() * height;
        return {
          x,
          y,
          prevX: x,
          prevY: y,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          size: 0.8 + Math.random() * 1.2,
          phase: Math.random() * Math.PI * 2,
          bright: Math.random() < 0.22,
          alpha: 0.3 + Math.random() * 0.4,
        };
      });
    };

    const step = (dt: number) => {
      time += dt;

      const target = searchRef.current;
      if (target && target.key !== searchKey) {
        searchKey = target.key;
        searchUntil = time + 1.8;
      }

      const searchX = target ? target.x * width : 0;
      const searchY = target ? target.y * height : 0;
      const searchStrength =
        target && time < searchUntil
          ? 0.009 * Math.max(0, (searchUntil - time) / 1.8)
          : 0;

      for (const p of particles) {
        p.prevX = p.x;
        p.prevY = p.y;

        // Each nanite wanders on its own smooth phase.
        p.vx += Math.cos(time * 0.22 + p.phase) * 0.004;
        p.vy += Math.sin(time * 0.2 + p.phase * 1.3) * 0.004;

        // Separation only: no cohesion or alignment, so the swarm never merges.
        let sepX = 0;
        let sepY = 0;
        for (const q of particles) {
          if (q === p) continue;
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq > 30 * 30) continue;

          const distance = Math.sqrt(distanceSq) || 1;
          if (distance < 26) {
            sepX += (dx / distance) * ((26 - distance) / 26);
            sepY += (dy / distance) * ((26 - distance) / 26);
          }
        }

        p.vx += sepX * 0.02;
        p.vy += sepY * 0.02;

        if (searchStrength > 0) {
          const dx = searchX - p.x;
          const dy = searchY - p.y;
          const distance = Math.hypot(dx, dy) || 1;
          p.vx += (dx / distance) * searchStrength;
          p.vy += (dy / distance) * searchStrength;
        }

        p.vx *= 0.99;
        p.vy *= 0.99;

        const speed = Math.hypot(p.vx, p.vy);
        if (speed > 0.7) {
          p.vx = (p.vx / speed) * 0.7;
          p.vy = (p.vy / speed) * 0.7;
        }

        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;

        if (p.x < -8) p.x = width + 8;
        if (p.x > width + 8) p.x = -8;
        if (p.y < -8) p.y = height + 8;
        if (p.y > height + 8) p.y = -8;
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = dot;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 58) continue;

          ctx.globalAlpha = (1 - distance / 58) * 0.05;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const p of particles) {
        const color = p.bright ? brand : dot;

        if (p.bright) {
          ctx.strokeStyle = brand;
          ctx.globalAlpha = 0.18;
          ctx.beginPath();
          ctx.moveTo(p.prevX, p.prevY);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }

        ctx.fillStyle = color;
        ctx.globalAlpha = p.bright
          ? Math.min(0.95, p.alpha + 0.35)
          : p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 0.6;
        ctx.globalAlpha = Math.min(0.55, p.alpha * 0.8);
        ctx.stroke();
      }

      ctx.lineWidth = 1;
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      if (!running) return;
      if (!last) last = now;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      step(dt);
      draw();
      raf = window.requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      last = 0;
      raf = window.requestAnimationFrame(frame);
    };

    const stop = () => {
      running = false;
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
    };

    init();
    draw();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            init();
            draw();
            if (!reduced) {
              stop();
              start();
            }
          })
        : null;
    resizeObserver?.observe(canvas);

    const onWindowResize = () => {
      init();
      draw();
      if (!reduced) {
        stop();
        start();
      }
    };
    if (!resizeObserver) {
      window.addEventListener("resize", onWindowResize, { passive: true });
    }

    let intersectionObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) start();
            else stop();
          }
        },
        { threshold: 0.05 },
      );
      intersectionObserver.observe(canvas);
    } else {
      start();
    }

    if (reduced) draw();

    return () => {
      stop();
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      if (!resizeObserver) {
        window.removeEventListener("resize", onWindowResize);
      }
    };
  }, [reduced]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
