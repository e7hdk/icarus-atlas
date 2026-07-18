'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FestivalCountdown } from './FestivalCountdown';
import { FestivalWheel } from './FestivalWheel';
import { festivalOn, nextFestival } from '@/features/spotlight/festivals';
import { useEphemerisStore } from '@/features/spotlight/store';
import type { AtticMonth } from '@/types/spotlight';

/** One feast, fully resolved server-side into plain display data. */
export interface FeastEntry {
  id: string;
  name: string;
  greekName?: string;
  /** e.g. "≈ 7–15 Metageitnion" — the honest reconstructed date line. */
  dateLabel: string;
  month: AtticMonth;
  day: number | null;
  deities: { id: string; name: string; color: string }[];
  place: { id: string; name: string; isCity: boolean } | null;
  gamesNote: string | null;
  summary: string;
  aition: { id: string; title: string } | null;
  testimonia: string[];
}

const arrowClass =
  'pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-glass-border text-[17px] text-aether-muted transition-colors hover:border-star-olympian/50 hover:text-star-olympian';

/** The Heortologion as an instrument: the year wheel selects, the alidade
 *  swings, and ONE feast at a time lies on the plaque beneath — a museum
 *  vitrine, not a catalog. Deep links (#feast-id, the card's feast-day door)
 *  pre-aim the wheel; with no hash it opens on today's or the next feast. */
export function HeortologionView({ entries }: { entries: FeastEntry[] }) {
  const data = useEphemerisStore((s) => s.data);
  const pick = useEphemerisStore((s) => s.pick);
  const [chosen, setChosen] = useState<string | null>(null);

  // The URL hash pre-aims the wheel. Deferred a frame so hydration compares
  // against the server markup first (the codebase's rAF-read pattern).
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const hash = window.location.hash.slice(1);
      if (hash && entries.some((entry) => entry.id === hash)) setChosen(hash);
    });
    return () => cancelAnimationFrame(raf);
  }, [entries]);

  // With nothing chosen, the instrument aims itself: today's feast when one
  // runs, otherwise the next opening of the year.
  const autoId = useMemo(() => {
    if (!data || !pick) return null;
    const running = festivalOn(data.festivals, pick.isoDate, data.attic);
    if (running) return running.festival.id;
    return nextFestival(data.festivals, pick.dayIndex, data.attic)?.context.festival.id ?? null;
  }, [data, pick]);

  const selectedId = chosen ?? (entries.some((e) => e.id === autoId) ? autoId : null);
  const entry = entries.find((e) => e.id === selectedId) ?? null;

  const select = (id: string) => {
    setChosen(id);
    window.history.replaceState(null, '', `#${id}`);
  };

  const step = useCallback(
    (delta: number) => {
      if (!entries.length) return;
      const index = selectedId ? entries.findIndex((e) => e.id === selectedId) : 0;
      const next = entries[(index + delta + entries.length) % entries.length].id;
      setChosen(next);
      window.history.replaceState(null, '', `#${next}`);
    },
    [entries, selectedId],
  );

  // The whole year under two keys — ← and → walk the feasts like the ‹ ›
  // arrows, unless the reader is typing somewhere (search overlay, forms).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight'))
        return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      )
        return;
      event.preventDefault();
      step(event.key === 'ArrowLeft' ? -1 : 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [step]);

  return (
    <div>
      <FestivalWheel feasts={entries} selectedId={entry?.id ?? null} onSelect={select} />

      <div className="relative mx-auto mt-8 min-h-[19rem] max-w-2xl px-11 sm:px-12">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
          <button type="button" onClick={() => step(-1)} aria-label="Previous feast" className={arrowClass}>
            ‹
          </button>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
          <button type="button" onClick={() => step(1)} aria-label="Next feast" className={arrowClass}>
            ›
          </button>
        </div>

        {entry ? (
          // Re-keyed per feast so the plaque rises anew with each aim.
          <article key={entry.id} className="text-center motion-safe:[animation:proem-fade-up_500ms_ease_both]">
            <p className="font-display text-[11px] uppercase tracking-[0.3em] text-star-olympian">
              {entry.dateLabel}
            </p>
            <h2 className="mt-2.5 font-display text-3xl tracking-[0.1em] text-aether sm:text-4xl">
              {entry.name}
              {entry.greekName && (
                <span className="ml-3 font-body text-xl italic tracking-normal text-aether-muted sm:text-2xl">
                  {entry.greekName}
                </span>
              )}
            </h2>

            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-display text-[10px] uppercase tracking-[0.2em] text-aether-faint">
              <span>
                For{' '}
                {entry.deities.map((deity, index) => (
                  <span key={deity.id}>
                    {index > 0 && ' & '}
                    <Link
                      href={`/character/${deity.id}`}
                      className="transition-opacity hover:opacity-80"
                      style={{ color: deity.color }}
                    >
                      {deity.name}
                    </Link>
                  </span>
                ))}
              </span>
              {entry.place && (
                <span>
                  · At{' '}
                  {entry.place.isCity ? (
                    <Link
                      href={`/city/${entry.place.id}`}
                      className="text-aether-muted underline decoration-glass-border underline-offset-4 transition-colors hover:text-aether"
                    >
                      {entry.place.name}
                    </Link>
                  ) : (
                    <span className="text-aether-muted">{entry.place.name}</span>
                  )}
                </span>
              )}
              {entry.gamesNote && <span>· {entry.gamesNote}</span>}
              <FestivalCountdown festivalId={entry.id} />
            </div>

            <p className="mx-auto mt-5 max-w-xl font-body text-lg leading-relaxed text-aether/90">
              {entry.summary}
            </p>
            {entry.aition && (
              <Link
                href={`/story/${entry.aition.id}`}
                className="mt-3.5 inline-block font-display text-[10px] uppercase tracking-[0.2em] text-star-olympian/90 transition-colors hover:text-star-olympian"
              >
                The founding myth · {entry.aition.title} →
              </Link>
            )}
            <p className="mx-auto mt-5 max-w-xl font-body text-[12px] italic leading-relaxed text-aether-faint">
              {entry.testimonia.join(' · ')}
            </p>
          </article>
        ) : (
          <p className="pt-16 text-center font-body text-[15px] italic text-aether-muted" aria-hidden>
            Aim the wheel — choose a star.
          </p>
        )}
      </div>
    </div>
  );
}
