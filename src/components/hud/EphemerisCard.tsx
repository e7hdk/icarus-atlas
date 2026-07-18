'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { TypeBadge } from '@/components/ui/TypeBadge';
import { KindBadge } from '@/components/ui/KindBadge';
import { ArtworkImage } from '@/components/ui/ArtworkImage';
import { pickSourced } from '@/lib/lens';
import { useGalaxyStore } from '@/features/galaxy/store';
import { atticDateFor, sacredDayFor } from '@/features/spotlight/attic';
import { isoDateAtIndex } from '@/features/spotlight/calendar';
import { nextFestival } from '@/features/spotlight/festivals';
import { selectDay } from '@/features/spotlight/selection';
import { useEphemerisStore } from '@/features/spotlight/store';
import { useEphemerisPayload } from '@/features/spotlight/usePayload';
import { TYPE_GLOW } from '@/types/character';

const doorClass =
  'rounded-xl border border-glass-border bg-glass px-3.5 py-2 text-left font-display text-[11px] uppercase tracking-[0.16em] text-aether-muted transition-colors hover:border-nebula-soft/50 hover:text-aether';

const proemDoorClass =
  'rounded-xl border border-nebula-soft/40 bg-nebula-violet/10 px-3.5 py-2 text-left font-display text-[11px] uppercase tracking-[0.16em] text-nebula-soft transition-all hover:bg-nebula-violet/25';

const oracleDoorClass =
  'rounded-xl border border-star-olympian/45 bg-star-olympian/10 px-3.5 py-2 text-left font-display text-[11px] uppercase tracking-[0.16em] text-star-olympian transition-all hover:bg-star-olympian/20';

/** The Ephemeris card — the 15-second glance at the star of the day
 *  (docs/EPHEMERIS_PLAN.md §5). The primary door stages the Proem (§6); the
 *  rest lead to the galaxy, the myth and the codex. */
export function EphemerisCard() {
  const pick = useEphemerisStore((s) => s.pick);
  const data = useEphemerisStore((s) => s.data);
  const open = useEphemerisStore((s) => s.cardOpen);
  const setCardOpen = useEphemerisStore((s) => s.setCardOpen);
  const lens = useGalaxyStore((s) => s.lens);
  const pathname = usePathname();
  const router = useRouter();

  const id = pick?.id ?? null;
  const { payload, failed } = useEphemerisPayload(id, open);

  /** Deterministic neighbors — yesterday links back, tomorrow leaks only its
   *  glow color (docs/EPHEMERIS_PLAN.md §5). */
  const neighbors = useMemo(() => {
    if (!data || !pick) return null;
    const byId = new Map(data.roster.map((entry) => [entry.id, entry]));
    const yesterday = selectDay(data, {
      isoDate: isoDateAtIndex(pick.dayIndex - 1),
      dayIndex: pick.dayIndex - 1,
    });
    const tomorrow = selectDay(data, {
      isoDate: isoDateAtIndex(pick.dayIndex + 1),
      dayIndex: pick.dayIndex + 1,
    });
    return {
      yesterday: yesterday ? (byId.get(yesterday.id) ?? null) : null,
      tomorrowType: tomorrow ? byId.get(tomorrow.id)?.type : undefined,
    };
  }, [data, pick]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCardOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, setCardOpen]);

  if (!open || !pick) return null;

  const flyToStar = () => {
    setCardOpen(false);
    if (pathname === '/') {
      useGalaxyStore.getState().select(pick.id);
      return;
    }
    router.push(`/?fly=${pick.id}`);
  };

  const beginProem = () => {
    if (pathname !== '/') {
      setCardOpen(false);
      router.push('/?proem=1');
      return;
    }
    // Reduced motion skips the camera flight; the beats still play (D13).
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      useGalaxyStore.getState().select(pick.id);
    }
    useEphemerisStore.getState().startProem();
  };

  const summary = payload ? (pickSourced(payload.summary, lens) ?? payload.summary[0]) : null;
  const greek = payload ? payload.greekName.replace(/^[^(]*\(/, '').replace(/\)$/, '') : '';
  const atticInfo = data ? atticDateFor(data.attic, pick.isoDate) : null;
  const sacred =
    atticInfo && !pick.festival && data ? sacredDayFor(data.sacredDays, atticInfo.day) : null;
  // The calendar layer stays visible between the feasts: announce the next one.
  const upcoming =
    data && !pick.festival ? nextFestival(data.festivals, pick.dayIndex, data.attic) : null;
  const upcomingAttic = data && upcoming ? atticDateFor(data.attic, upcoming.isoDate) : null;
  const festivalEntry =
    pick.festival && data
      ? (data.festivals.find((festival) => festival.id === pick.festival?.id) ?? null)
      : null;

  return (
    // Click-away closes, like the settings panel — the veil catches the
    // outside press, the card swallows its own (tenth UX review).
    <div className="fixed inset-0 z-40" onMouseDown={() => setCardOpen(false)}>
      <GlassPanel
        className="pointer-events-auto absolute inset-x-3 top-16 max-h-[calc(100svh-5rem)] w-auto overflow-y-auto break-words bg-glass-heavy px-5 py-4 sm:inset-x-auto sm:right-6 sm:w-[21rem]"
        onMouseDown={(event) => event.stopPropagation()}
      >
      <div className="flex items-center justify-between">
        <span className="font-display text-[10px] uppercase tracking-[0.22em] text-nebula-soft">
          Star of the day
        </span>
        <div className="flex items-center gap-2">
          <span className="font-body text-[12px] text-aether-faint">{pick.isoDate}</span>
          <button
            type="button"
            onClick={() => setCardOpen(false)}
            aria-label="Close the ephemeris"
            className="rounded-full px-1.5 text-aether-faint transition-colors hover:text-aether"
          >
            ✕
          </button>
        </div>
      </div>

      {failed && (
        <p className="mt-3 font-body text-[14px] text-aether-muted">
          The ephemeris is unreachable — try again in a moment.
        </p>
      )}

      {!payload && !failed && (
        <div className="mt-4 space-y-2.5" aria-hidden>
          <div className="h-4 w-44 animate-pulse rounded bg-aether-faint/20" />
          <div className="h-3 w-full animate-pulse rounded bg-aether-faint/15" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-aether-faint/15" />
        </div>
      )}

      {(atticInfo || upcoming || pick.festival) && (
        // The calendar strip — the one gold door to the Heortologion. On feast
        // days it announces the feast; between them it keeps the next one in
        // sight. Depth (summary, founding myth) lives on /festivals.
        <Link
          href={pick.festival ? `/festivals#${pick.festival.id}` : '/festivals'}
          onClick={() => setCardOpen(false)}
          className="group mt-2.5 flex items-center gap-3 rounded-lg border border-star-olympian/30 bg-star-olympian/[0.07] px-3 py-2 transition-colors hover:border-star-olympian/55 hover:bg-star-olympian/[0.13]"
        >
          <span className="min-w-0 flex-1">
            {pick.festival ? (
              <span className="block font-body text-[13px]">
                <span className="text-star-olympian">Today is the {pick.festival.name}</span>
                {festivalEntry?.greekName && (
                  <span className="italic text-aether-muted"> · {festivalEntry.greekName}</span>
                )}
                {pick.festival.of > 1 && (
                  <span className="text-aether-faint">
                    {' '}
                    — day {pick.festival.day} of {pick.festival.of}
                  </span>
                )}
              </span>
            ) : (
              upcoming && (
                <span className="block font-body text-[13px] text-aether-muted">
                  Next feast:{' '}
                  <span className="text-star-olympian">the {upcoming.context.festival.name}</span>
                  {upcomingAttic && <> · {upcomingAttic.label}</>} —{' '}
                  {upcoming.inDays === 1 ? 'tomorrow' : `in ${upcoming.inDays} days`}
                </span>
              )
            )}
            {atticInfo && (
              <span className="mt-0.5 block font-body text-[12px] text-aether-faint">
                {atticInfo.label}
                {sacred && <> — {sacred.label}</>} · reconstructed Attic calendar
              </span>
            )}
            <span className="mt-1 block font-display text-[9px] uppercase tracking-[0.22em] text-star-olympian/80 transition-colors group-hover:text-star-olympian">
              Open the Heortologion
            </span>
          </span>
          <span
            aria-hidden
            className="text-star-olympian/70 transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </Link>
      )}

      {payload && (
        <>
          <h2 className="mt-2.5 font-display text-lg tracking-[0.08em] text-aether">
            {payload.name.toUpperCase()}
            <span className="ml-2 font-body text-sm italic tracking-normal text-aether-muted">
              {greek}
            </span>
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TypeBadge type={payload.type} />
            {payload.kinds?.map((kind) => (
              <KindBadge key={kind} kind={kind} primaryType={payload.type} />
            ))}
          </div>
          {pick.week && (
            <p className="mt-2.5 font-body text-[13px] text-aether-faint">
              <span aria-hidden className="text-nebula-soft">✦ </span>
              This week:{' '}
              <Link
                href={pick.week.storyId === 'odyssey' ? '/odyssey' : `/story/${pick.week.storyId}`}
                onClick={() => setCardOpen(false)}
                className="text-aether-muted transition-colors hover:text-aether"
              >
                {pick.week.title}
              </Link>{' '}
              — day {pick.week.day} of {pick.week.of}
            </p>
          )}
          {summary && (
            <p className="mt-3 font-body text-[15px] leading-relaxed text-aether/90">
              {summary.text}
              {summary.citation && (
                <span className="ml-1.5 font-body text-[12px] text-aether-faint">
                  — {summary.citation}
                </span>
              )}
            </p>
          )}
          {payload.disputed && (
            <p className="mt-2 rounded-lg border border-nebula-soft/35 bg-nebula-violet/15 px-3 py-1.5 font-body text-[13px] text-nebula-soft">
              The sources disagree about this figure ⚖ — the codex compares the traditions.
            </p>
          )}
          {payload.artwork && (
            <div className="mt-3">
              <div className="relative h-40 w-full">
                <ArtworkImage
                  src={payload.artwork.imageUrl}
                  title={payload.artwork.title}
                  meta={`${payload.artwork.artist}, ${payload.artwork.year}`}
                  className="h-40 w-full"
                />
              </div>
              <p className="mt-1.5 font-body text-[12px] italic text-aether-faint">
                {payload.artwork.title} — {payload.artwork.artist}, {payload.artwork.year}
              </p>
            </div>
          )}
          <div className="mt-4 flex flex-col gap-1.5">
            <button type="button" onClick={beginProem} className={proemDoorClass}>
              Begin the proem
            </button>
            <button
              type="button"
              onClick={() => {
                setCardOpen(false);
                useEphemerisStore.getState().setOracleOpen(true);
              }}
              className={oracleDoorClass}
            >
              Consult the oracle
            </button>
            <button type="button" onClick={flyToStar} className={doorClass}>
              Fly to star
            </button>
            {payload.storyId && (
              <Link
                href={`/story/${payload.storyId}`}
                onClick={() => setCardOpen(false)}
                className={doorClass}
              >
                Read the myth
                <span className="ml-1.5 normal-case tracking-normal text-aether-faint">
                  · {payload.storyTitle}
                </span>
              </Link>
            )}
            <Link
              href={`/character/${payload.id}`}
              onClick={() => setCardOpen(false)}
              className={doorClass}
            >
              Open the codex
            </Link>
          </div>
          {neighbors && (neighbors.yesterday || neighbors.tomorrowType) && (
            <p className="mt-3 border-t border-glass-border pt-2.5 font-body text-[13px] text-aether-faint">
              {neighbors.yesterday && (
                <>
                  Yesterday —{' '}
                  <Link
                    href={`/character/${neighbors.yesterday.id}`}
                    onClick={() => setCardOpen(false)}
                    className="text-aether-muted transition-colors hover:text-aether"
                  >
                    {neighbors.yesterday.name}
                  </Link>
                </>
              )}
              {neighbors.yesterday && neighbors.tomorrowType && ' · '}
              {neighbors.tomorrowType && (
                <>
                  Tomorrow —{' '}
                  <span
                    aria-hidden
                    style={{
                      color: TYPE_GLOW[neighbors.tomorrowType].color,
                      textShadow: `0 0 8px ${TYPE_GLOW[neighbors.tomorrowType].color}`,
                    }}
                  >
                    ★
                  </span>{' '}
                  ?
                </>
              )}
            </p>
          )}
        </>
      )}
      </GlassPanel>
    </div>
  );
}
