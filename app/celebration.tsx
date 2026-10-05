"use client";
import { useEffect, useRef } from "react";

export default function Celebration({ burst }: { burst: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!burst) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const element = canvas.current;
    if (motion.matches || !element) return;
    const ctx = element.getContext("2d");
    if (!ctx) return;
    const width = window.innerWidth, height = window.innerHeight, scale = Math.min(window.devicePixelRatio || 1, 2);
    element.width = width * scale;
    element.height = height * scale;
    ctx.scale(scale, scale);
    const styles=getComputedStyle(document.documentElement);
    const colors = ["--brand", "--brand-soft", "--wordmark", "--foreground"].map(token=>styles.getPropertyValue(token).trim());
    const particles = Array.from({ length: 85 }, () => ({
      x: width / 2, y: height * .55,
      vx: (Math.random() - .5) * Math.min(width * .025, 17), vy: -5 - Math.random() * 12,
      rotation: Math.random() * Math.PI, spin: (Math.random() - .5) * .15,
      size: 4 + Math.random() * 4, color: colors[Math.floor(Math.random() * colors.length)],
    }));
    let frame = 0, last = performance.now(), start = last;
    const clear = () => { cancelAnimationFrame(frame); ctx.clearRect(0, 0, width, height); };
    const draw = (now: number) => {
      if (motion.matches || now - start > 2400) { clear(); return; }
      const step = Math.min((now - last) / 16.67, 2); last = now;
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = Math.max(0, Math.min(1, (2400 - (now - start)) / 600));
      for (const p of particles) {
        p.x += p.vx * step; p.y += p.vy * step; p.vy += .24 * step; p.vx *= Math.pow(.99, step); p.rotation += p.spin * step;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation); ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .6); ctx.restore();
      }
      frame = requestAnimationFrame(draw);
    };
    motion.addEventListener("change", clear);
    frame = requestAnimationFrame(draw);
    return () => { clear(); motion.removeEventListener("change", clear); };
  }, [burst]);
  return <canvas ref={canvas} className="celebration" aria-hidden="true" />;
}
