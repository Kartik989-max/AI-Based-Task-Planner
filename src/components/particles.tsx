"use client";

import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 10;
const COLORS = [
  "rgba(107, 158, 125, 0.12)",
  "rgba(125, 175, 201, 0.1)",
  "rgba(230, 210, 175, 0.09)",
];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: "sq" | "tri";
  rotation: number;
  rotSpeed: number;
};

type Ripple = { x: number; y: number; strength: number; age: number };

function isInteractive(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest(
    "a, button, input, select, textarea, label, [role='button'], [role='link'], [contenteditable='true']",
  );
}

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = !document.hidden;
    const particles: Particle[] = [];
    let ripples: Ripple[] = [];

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };

    const seed = () => {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.06,
          vy: (Math.random() - 0.5) * 0.06,
          size: 2 + Math.random() * 2.5,
          color: COLORS[i % COLORS.length]!,
          shape: i % 2 === 0 ? "sq" : "tri",
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.0015,
        });
      }
    };

    const drawParticle = (p: Particle) => {
      const s = p.size;
      if (p.shape === "tri") {
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.9, s * 0.8);
        ctx.lineTo(-s * 0.9, s * 0.8);
        ctx.closePath();
        ctx.fill();
        return;
      }
      ctx.fillRect(-s / 2, -s / 2, s, s);
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;

      ctx.clearRect(0, 0, w, h);
      ripples = ripples.filter((r) => {
        r.age += 1;
        r.strength *= 0.94;
        return r.age < 36 && r.strength > 0.4;
      });

      for (const p of particles) {
        for (const r of ripples) {
          const dx = p.x - r.x;
          const dy = p.y - r.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 80 && dist > 1) {
            const push = (r.strength * (80 - dist)) / 80;
            p.vx += (dx / dist) * push * 0.035;
            p.vy += (dy / dist) * push * 0.035;
          }
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.996;
        p.vy *= 0.996;
        p.rotation += p.rotSpeed;

        if (p.x < -12) p.x = w + 12;
        else if (p.x > w + 12) p.x = -12;
        if (p.y < -12) p.y = h + 12;
        else if (p.y > h + 12) p.y = -12;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        drawParticle(p);
        ctx.restore();
      }
    };

    const onClick = (e: MouseEvent) => {
      if (isInteractive(e.target)) return;
      ripples.push({ x: e.clientX, y: e.clientY, strength: 4, age: 0 });
    };

    const onVisibility = () => {
      visible = !document.hidden;
    };

    resize();
    seed();
    window.addEventListener("resize", resize);
    document.addEventListener("click", onClick);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden />;
}
