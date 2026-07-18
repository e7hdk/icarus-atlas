'use client';

import { useEffect, useRef } from 'react';

/** Pinned, scroll-scrubbed epigraph scene (docs/NOSTOS_PLAN.md D12/D15).
 *  The station's fragment becomes a held moment: the section is two-and-a-bit
 *  viewports tall, its inner stage sticks, and the reader's scroll scrubs the
 *  choreography — the world dims behind a veil, a living aura breathes up
 *  behind the words (the Sirens' song-rings ripple outward; the underworld's
 *  pale shades drift below), the gold frame draws itself, the Greek surfaces
 *  line by line at display size, the English answers, then the voyage lets
 *  go. Scroll stays native (sticky + progress math, no hijack) and works with
 *  wheel, keys and touch alike.
 *
 *  prefers-reduced-motion: pure CSS fallback — the `motion-safe:` classes
 *  that create the tall pin, the hidden initial states and the looping aura
 *  never apply; the frame lines fall back to drawn via `motion-reduce`, and
 *  the scene renders as a normal static fragment (JS never writes styles). */

interface PinnedEpigraphProps {
  /** For the h3's `station-…` id — the section's aria-labelledby target. */
  stationId: string;
  title: string;
  kicker?: string;
  /** Apologoi register: Odysseus narrates (adds the HE TELLS IT rubric). */
  told?: boolean;
  epigraph: { grc: string; en: string; citation: string };
  /** Underworld palette (near-black veil, pale under-glow) instead of Siren violet. */
  underworld?: boolean;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

export function PinnedEpigraph({
  stationId,
  title,
  kicker,
  told,
  epigraph,
  underworld,
}: PinnedEpigraphProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const veilRef = useRef<HTMLDivElement | null>(null);
  const auraRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const lineTopRef = useRef<HTMLSpanElement | null>(null);
  const lineBottomRef = useRef<HTMLSpanElement | null>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const enRef = useRef<HTMLQuoteElement | null>(null);
  const citeRef = useRef<HTMLElement | null>(null);

  const lines = epigraph.grc.split('\n');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    const scrub = () => {
      raf = 0;
      const section = sectionRef.current;
      if (!section) return;
      const viewport = window.innerHeight;
      const rect = section.getBoundingClientRect();
      const travel = rect.height - viewport;
      if (travel <= 0) return;
      const progress = Math.min(Math.max(-rect.top / travel, 0), 1);

      const rise = smoothstep(0.02, 0.2, progress);
      const fall = 1 - smoothstep(0.86, 0.98, progress);
      const hold = rise * fall;

      const veil = veilRef.current;
      if (veil) veil.style.opacity = String(0.92 * hold);
      const aura = auraRef.current;
      if (aura) aura.style.opacity = String(hold);

      /* The title arrives first — the landfall belongs to the scene itself. */
      const head = headRef.current;
      if (head) {
        const k = smoothstep(0.04, 0.18, progress);
        head.style.opacity = String(k);
        head.style.transform = `translate3d(0, ${(1 - k) * 28}px, 0)`;
      }

      /* The gold frame draws itself open, and retracts as the voyage resumes. */
      const drawn = smoothstep(0.08, 0.3, progress) * (1 - smoothstep(0.9, 1, progress));
      const lineTop = lineTopRef.current;
      if (lineTop) lineTop.style.transform = `scaleX(${drawn})`;
      const lineBottom = lineBottomRef.current;
      if (lineBottom) lineBottom.style.transform = `scaleX(${drawn})`;

      const stage = stageRef.current;
      if (stage) {
        const settle = smoothstep(0.05, 0.5, progress);
        stage.style.transform = `translate3d(0, ${(1 - settle) * 16}px, 0) scale(${0.96 + settle * 0.04})`;
      }

      const count = Math.max(lines.length - 1, 1);
      lineRefs.current.forEach((line, index) => {
        if (!line) return;
        const start = 0.16 + (index / count) * 0.3;
        const k = smoothstep(start, start + 0.13, progress);
        line.style.opacity = String(k);
        line.style.transform = `translate3d(0, ${(1 - k) * 24}px, 0)`;
      });

      const en = enRef.current;
      if (en) {
        const k = smoothstep(0.52, 0.72, progress);
        en.style.opacity = String(k);
        en.style.transform = `translate3d(0, ${(1 - k) * 20}px, 0)`;
      }
      const cite = citeRef.current;
      if (cite) cite.style.opacity = String(smoothstep(0.7, 0.84, progress));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(scrub);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [lines.length]);

  return (
    <div ref={sectionRef} className="my-8 motion-safe:my-0 motion-safe:h-[230vh]">
      <div className="motion-safe:sticky motion-safe:top-0 motion-safe:flex motion-safe:h-screen motion-safe:items-center">
        {/* The veil: full-bleed dark that swallows the page while the moment holds.
            Penelope's knotted thread (z-20, sticky beside the column) stays lit
            above it — the thread never breaks. */}
        <div
          ref={veilRef}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -z-[1] h-full w-screen -translate-x-1/2 opacity-0"
          style={{ backgroundColor: underworld ? '#05020f' : '#0b0420' }}
        />

        {/* The living aura behind the words — only while the moment holds
            (opacity scrubbed by JS; hidden entirely under reduced motion). */}
        <div
          ref={auraRef}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-full w-screen -translate-x-1/2 overflow-hidden opacity-0"
        >
          {underworld ? (
            <>
              {/* A cold light from below — the trench the dead drink at. */}
              <div className="absolute left-1/2 top-[68%] h-[80vh] w-[95vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(96,165,250,0.10),transparent_70%)] motion-safe:[animation:voyage-aura-breathe_11s_ease-in-out_infinite]" />
              <div className="absolute left-[18%] top-[30%] h-[45vh] w-[42vw] rounded-full bg-[radial-gradient(closest-side,rgba(229,231,235,0.05),transparent_70%)] motion-safe:[animation:voyage-shade-drift_17s_ease-in-out_infinite]" />
              <div className="absolute right-[14%] top-[44%] h-[52vh] w-[46vw] rounded-full bg-[radial-gradient(closest-side,rgba(192,132,252,0.05),transparent_70%)] motion-safe:[animation:voyage-shade-drift_23s_ease-in-out_infinite_reverse]" />
            </>
          ) : (
            <>
              {/* The song made visible: a breathing violet heart and rings
                  rippling outward across the held sea. */}
              <div className="absolute left-1/2 top-1/2 h-[75vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(192,132,252,0.15),transparent_70%)] motion-safe:[animation:voyage-aura-breathe_9s_ease-in-out_infinite]" />
              <div className="absolute left-1/2 top-1/2 size-[58vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-nebula-soft/25 motion-safe:[animation:voyage-song-ring_7s_ease-out_infinite]" />
              <div className="absolute left-1/2 top-1/2 size-[58vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-star-olympian/15 motion-safe:[animation:voyage-song-ring_7s_ease-out_3.5s_infinite]" />
            </>
          )}
        </div>

        <div className="w-full">
          {/* The landfall, inside the held scene: kicker and title surface
              first, then the fragment opens beneath them. */}
          <div
            ref={headRef}
            className="mx-auto w-full max-w-3xl px-3 motion-safe:translate-y-7 motion-safe:opacity-0 sm:px-8"
          >
            {kicker && (
              <p className="font-display text-[11px] tracking-[0.32em] text-aether-faint">
                {kicker}
                {told && <span className="text-nebula-soft/80"> · HE TELLS IT</span>}
              </p>
            )}
            <h3
              id={`station-${stationId}`}
              className="mt-3 font-display text-4xl tracking-[0.04em] text-aether sm:text-6xl"
            >
              {title}
            </h3>
          </div>

          <figure
            ref={stageRef}
            className="gilded-prose relative mx-auto mt-10 w-full max-w-3xl px-3 py-12 motion-safe:will-change-transform sm:mt-12 sm:px-8 sm:py-14"
          >
          {/* The frame draws itself open as the moment takes hold. */}
          <span
            ref={lineTopRef}
            aria-hidden
            className="absolute inset-x-0 top-0 h-px origin-left bg-star-olympian/40 [transform:scaleX(0)] motion-reduce:[transform:scaleX(1)]"
          />
          <span
            ref={lineBottomRef}
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-px origin-right bg-star-olympian/40 [transform:scaleX(0)] motion-reduce:[transform:scaleX(1)]"
          />

          <blockquote
            lang="grc"
            className="font-body text-xl leading-relaxed text-aether-muted sm:text-2xl"
          >
            {lines.map((line, index) => (
              <span
                key={`${index}-${line}`}
                ref={(el) => {
                  lineRefs.current[index] = el;
                }}
                className="block motion-safe:translate-y-6 motion-safe:opacity-0"
              >
                {line}
              </span>
            ))}
          </blockquote>
          <blockquote
            ref={enRef}
            className="mt-8 font-body text-2xl italic leading-relaxed text-aether motion-safe:translate-y-5 motion-safe:opacity-0 sm:text-3xl"
          >
            {epigraph.en}
          </blockquote>
          <figcaption
            ref={citeRef}
            className="mt-7 font-display text-[11px] tracking-[0.28em] text-star-olympian/75 motion-safe:opacity-0"
          >
            {epigraph.citation} · TRANS. A. T. MURRAY, 1919
          </figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}
