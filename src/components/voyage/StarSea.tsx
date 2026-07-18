'use client';

import { useEffect, useRef } from 'react';

/** The star-sea behind the voyage: the wine-dark sea rendered as a night sky
 *  (docs/NOSTOS_PLAN.md §4). Two depth layers of deterministic stars drift
 *  under the scroll at different speeds — the far sky slow, the near sky a
 *  little faster — so the sea seems to move beneath the ship. Each layer is
 *  ONE canvas two viewports tall holding the same field twice, translated by
 *  `(scrollY · factor) mod viewport` so it wraps seamlessly forever. Canvases
 *  are painted only on mount/resize; scrolling writes transforms alone via a
 *  single rAF (the 60fps bar). prefers-reduced-motion gets a still sky. */

/** Deterministic PRNG — the same sky for every visitor, like the layout engine. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STAR_TINTS = ['#e5e7eb', '#e5e7eb', '#e5e7eb', '#c084fc', '#60a5fa', '#fcd34d', '#2dd4bf'];

interface LayerSpec {
  /** Scroll-parallax speed (fraction of scrollY). */
  factor: number;
  seed: number;
  /** One star per this many px² — smaller is denser. */
  density: number;
  /** Cap so huge screens stay cheap. */
  cap: number;
  /** Radius range [min, extra]. */
  radius: [number, number];
  alpha: [number, number];
}

/** Far sky: many dim small stars, barely moving. Near sky: fewer, brighter,
 *  a touch larger, drifting faster — the two speeds make the depth. */
const LAYERS: LayerSpec[] = [
  { factor: 0.05, seed: 1184, density: 5200, cap: 440, radius: [0.5, 0.7], alpha: [0.22, 0.5] },
  { factor: 0.13, seed: 1178, density: 15000, cap: 170, radius: [0.9, 1.3], alpha: [0.35, 0.55] },
];

/** Paints the layer's field twice (at y-offset 0 and `tile`) so the canvas
 *  tiles seamlessly when its translation wraps. */
function paintLayer(canvas: HTMLCanvasElement, spec: LayerSpec) {
  const context = canvas.getContext('2d');
  if (!context) return;
  // Phones cap at 1.5× — the star specks read identically and the two
  // double-viewport canvases cost ~half the memory.
  const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 1.5 : 2);
  const width = window.innerWidth;
  const tile = window.innerHeight;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(tile * 2 * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${tile * 2}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, tile * 2);

  const count = Math.min(Math.round((width * tile) / spec.density), spec.cap);
  for (const offset of [0, tile]) {
    const random = mulberry32(spec.seed);
    for (let index = 0; index < count; index++) {
      const x = random() * width;
      const y = random() * tile + offset;
      const magnitude = random();
      const radius = spec.radius[0] + random() * spec.radius[1] * (magnitude > 0.85 ? 1.8 : 1);
      const tint = STAR_TINTS[Math.floor(random() * STAR_TINTS.length)];
      context.globalAlpha = spec.alpha[0] + magnitude * spec.alpha[1];
      context.fillStyle = tint;
      if (radius > 1.5) {
        context.shadowColor = tint;
        context.shadowBlur = 6;
      } else {
        context.shadowBlur = 0;
      }
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.globalAlpha = 1;
  context.shadowBlur = 0;
}

export function StarSea() {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const paint = () => {
      LAYERS.forEach((spec, index) => {
        const canvas = canvasRefs.current[index];
        if (canvas) paintLayer(canvas, spec);
      });
    };
    paint();
    window.addEventListener('resize', paint);

    let raf = 0;
    const drift = () => {
      raf = 0;
      const tile = window.innerHeight;
      LAYERS.forEach((spec, index) => {
        const canvas = canvasRefs.current[index];
        if (!canvas || tile <= 0) return;
        const offset = (window.scrollY * spec.factor) % tile;
        canvas.style.transform = `translate3d(0, ${-offset}px, 0)`;
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(drift);
    };
    if (!reduced) {
      schedule();
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
    }
    return () => {
      window.removeEventListener('resize', paint);
      if (!reduced) {
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
        if (raf) cancelAnimationFrame(raf);
      }
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-cosmos-deep">
      {LAYERS.map((spec, index) => (
        <canvas
          key={spec.seed}
          ref={(el) => {
            canvasRefs.current[index] = el;
          }}
          className="absolute left-0 top-0 will-change-transform"
        />
      ))}
      {/* The sea-swell: two nebula washes breathing very slowly. */}
      <div className="absolute -left-1/4 top-[-10%] h-[70vh] w-[80vw] rounded-full bg-[radial-gradient(closest-side,rgba(192,132,252,0.10),transparent)] motion-safe:[animation:voyage-swell_46s_ease-in-out_infinite]" />
      <div className="absolute -right-1/4 bottom-[-15%] h-[75vh] w-[85vw] rounded-full bg-[radial-gradient(closest-side,rgba(96,165,250,0.08),transparent)] motion-safe:[animation:voyage-swell_58s_ease-in-out_infinite_reverse]" />
      {/* The horizon: below mid-screen the sky dims toward the deep — sea and night made one. */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-b from-transparent to-cosmos-deep/70" />
    </div>
  );
}
