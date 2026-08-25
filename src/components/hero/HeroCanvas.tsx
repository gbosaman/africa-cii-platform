"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient particle-constellation banner behind the hero.
 *
 * Drifting nodes joined by lines that fade with distance — an abstract read on
 * a connected continent, which is what the platform is actually about.
 *
 * Three things it does properly rather than naively:
 *   • Honours `prefers-reduced-motion`: renders one static frame, no loop.
 *   • Pauses entirely when scrolled out of view (IntersectionObserver), so it
 *     is not burning a rAF loop and battery on a page nobody is looking at.
 *   • Scales to devicePixelRatio so it is not blurry on retina displays, and
 *     caps DPR at 2 so it does not melt a 3x phone.
 */
export function HeroCanvas({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let raf = 0;
    let visible = true;

    const COUNT = 46;
    const LINK_DIST = 132;
    const nodes: { x: number; y: number; vx: number; vy: number; r: number; hue: string }[] = [];

    // Accent hues drawn from the palette; mostly emerald with blue/violet spice.
    const HUES = ["#22c55e", "#22c55e", "#22c55e", "#38bdf8", "#38bdf8", "#a855f7"];

    function seed() {
      nodes.length = 0;
      for (let i = 0; i < COUNT; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.8 + 0.9,
          hue: HUES[Math.floor(Math.random() * HUES.length)]!,
        });
      }
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);

      // Links first, so nodes sit on top.
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]!;
          const b = nodes[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d > LINK_DIST) continue;
          const alpha = (1 - d / LINK_DIST) * 0.22;
          ctx!.strokeStyle = `rgba(125, 211, 252, ${alpha})`;
          ctx!.lineWidth = 0.7;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }

      for (const n of nodes) {
        ctx!.fillStyle = n.hue;
        ctx!.globalAlpha = 0.75;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fill();
        // soft halo
        ctx!.globalAlpha = 0.14;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r * 3.4, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.globalAlpha = 1;
      }
    }

    function step() {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = width + 20;
        if (n.x > width + 20) n.x = -20;
        if (n.y < -20) n.y = height + 20;
        if (n.y > height + 20) n.y = -20;
      }
      draw();
      raf = requestAnimationFrame(step);
    }

    resize();

    if (reduced) {
      draw(); // one static frame, no loop
    } else {
      raf = requestAnimationFrame(step);
    }

    const onResize = () => {
      resize();
      if (reduced) draw();
    };
    window.addEventListener("resize", onResize);

    // Stop the loop when the banner is off-screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = entry?.isIntersecting ?? true;
        if (nowVisible === visible) return;
        visible = nowVisible;
        if (reduced) return;
        if (visible) raf = requestAnimationFrame(step);
        else cancelAnimationFrame(raf);
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      io.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
