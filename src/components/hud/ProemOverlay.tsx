'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { pickSourced } from '@/lib/lens';
import { useGalaxyStore } from '@/features/galaxy/store';
import { atticDateFor, sacredDayFor } from '@/features/spotlight/attic';
import { isoDateAtIndex } from '@/features/spotlight/calendar';
import { buildProemScript, spotlightAt } from '@/features/spotlight/proem';
import { selectDay } from '@/features/spotlight/selection';
import { useEphemerisStore } from '@/features/spotlight/store';
import { useEphemerisPayload } from '@/features/spotlight/usePayload';
import { TYPE_GLOW } from '@/types/character';
import type { ProemBeat } from '@/types/spotlight';

const BEAT_LABEL: Record<ProemBeat['kind'], string> = {
  invocation: 'Invocation',
  thread: 'The thread',
  telling: 'The telling',
  quarrel: 'The quarrel',
  trace: 'The trace',
};

const doorClass =
  'pointer-events-auto rounded-xl border border-glass-border bg-glass px-6 py-3 text-center font-display text-[12px] uppercase tracking-[0.18em] text-aether-muted backdrop-blur-xl transition-colors hover:border-nebula-soft/50 hover:text-aether';

const primaryDoorClass =
  'pointer-events-auto rounded-xl border border-nebula-soft/45 bg-nebula-violet/15 px-6 py-3 text-center font-display text-[12px] uppercase tracking-[0.18em] text-nebula-soft backdrop-blur-xl transition-all hover:bg-nebula-violet/30';

/** Dark halo under long prose — ink, not glow, so the serif body stays legible
 *  where the star's bloom still leaks through the reading veil. */
const PROSE_INK = '0 2px 22px rgba(5, 2, 15, 0.95), 0 0 8px rgba(5, 2, 15, 0.85)';

/** Greek-key hairline for the letterbox inner edges — the frame the ancients
 *  would have painted on it. Gold at whisper opacity. */
const MEANDER =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='10' viewBox='0 0 20 10'%3E%3Cpath d='M0 9 H16 V1 H4 V6 H10' fill='none' stroke='%23fcd34d' stroke-width='1.4'/%3E%3C/svg%3E\")";

/** A deterministic scatter of stage sparks — over the upper stage, clear of
 *  the text floor, each on its own phase so the field never reads as a loop. */
const TWINKLES = [
  { left: '12%', top: '18%', size: 10, delay: 0, duration: 3.6 },
  { left: '22%', top: '38%', size: 7, delay: 1.2, duration: 4.4 },
  { left: '31%', top: '12%', size: 8, delay: 2.1, duration: 3.9 },
  { left: '44%', top: '30%', size: 6, delay: 0.7, duration: 4.8 },
  { left: '58%', top: '14%', size: 9, delay: 1.7, duration: 3.4 },
  { left: '67%', top: '36%', size: 7, delay: 0.3, duration: 4.1 },
  { left: '76%', top: '20%', size: 10, delay: 2.6, duration: 3.7 },
  { left: '86%', top: '42%', size: 6, delay: 1.0, duration: 4.6 },
  { left: '50%', top: '8%', size: 7, delay: 3.1, duration: 5.2 },
] as const;

/** The Proem stage (docs/EPHEMERIS_PLAN.md §6), staged like a title sequence:
 *  letterbox bars carry the chrome (progress segments, skip, continue), the
 *  beats play as full-bleed classical type over the living galaxy, tinted by
 *  the star's own glow. Click/tap advances — the left edge steps back — Skip
 *  stays visible throughout, ESC closes back to the card. Reduced motion gets
 *  the same monumental composition, just still. */
export function ProemOverlay() {
  const pick = useEphemerisStore((s) => s.pick);
  const data = useEphemerisStore((s) => s.data);
  const active = useEphemerisStore((s) => s.proemActive);
  const beatIndex = useEphemerisStore((s) => s.proemBeat);
  const step = useEphemerisStore((s) => s.proemStep);
  const setProemProgress = useEphemerisStore((s) => s.setProemProgress);
  const closeProem = useEphemerisStore((s) => s.closeProem);
  const setCardOpen = useEphemerisStore((s) => s.setCardOpen);
  const lens = useGalaxyStore((s) => s.lens);
  const pathname = usePathname();

  const { payload } = useEphemerisPayload(active ? (pick?.id ?? null) : null, active);
  const script = useMemo(() => (payload ? buildProemScript(payload) : null), [payload]);

  // The stage is the galaxy — if the route changes mid-proem, fold the stage.
  useEffect(() => {
    if (active && pathname !== '/') closeProem();
  }, [active, pathname, closeProem]);

  // Opening the telling quiets the chip's beckon for the rest of the day.
  useEffect(() => {
    if (active && pick) localStorage.setItem('ephemeris-seen', pick.isoDate);
  }, [active, pick]);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      closeProem();
      useGalaxyStore.getState().select(null);
      setCardOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, closeProem, setCardOpen]);

  if (!active || !pick || pathname !== '/') return null;

  const atDoors = script !== null && beatIndex >= script.beats.length;
  const beat = script && !atDoors ? script.beats[beatIndex] : null;
  const glow = payload ? TYPE_GLOW[payload.type].color : '#c084fc';
  // Long serif prose can climb well past the stage floor — on those beats the
  // house lights go down so the words own the stage. Display-type beats
  // (invocation, thread) keep the galaxy at full burn: there the star performs.
  const proseBeat = beat?.kind === 'telling' || beat?.kind === 'quarrel';

  const advance = () => {
    if (!script || atDoors) return;
    const current = script.beats[beatIndex];
    if (current.kind === 'thread' && step < current.steps.length - 1) {
      setProemProgress(beatIndex, step + 1, spotlightAt(script, beatIndex, step + 1));
      return;
    }
    const next = beatIndex + 1;
    setProemProgress(next, 0, spotlightAt(script, next, 0));
  };

  const retreat = () => {
    if (!script || (beatIndex === 0 && step === 0)) return;
    const current = script.beats[beatIndex];
    if (current?.kind === 'thread' && step > 0) {
      setProemProgress(beatIndex, step - 1, spotlightAt(script, beatIndex, step - 1));
      return;
    }
    const prev = beatIndex - 1;
    if (prev < 0) return;
    const prevBeat = script.beats[prev];
    const prevStep = prevBeat.kind === 'thread' ? prevBeat.steps.length - 1 : 0;
    setProemProgress(prev, prevStep, spotlightAt(script, prev, prevStep));
  };

  const handleStageClick = (event: React.MouseEvent) => {
    if (!script) return;
    const back = event.clientX < window.innerWidth * 0.18;
    if (back) {
      retreat();
      return;
    }
    if (!atDoors) advance();
  };

  const leaveStage = () => {
    closeProem();
    useGalaxyStore.getState().select(null);
  };

  const tomorrow =
    data && pick
      ? selectDay(data, { isoDate: isoDateAtIndex(pick.dayIndex + 1), dayIndex: pick.dayIndex + 1 })
      : null;
  const festivalEntry =
    pick?.festival && data
      ? (data.festivals.find((festival) => festival.id === pick.festival?.id) ?? null)
      : null;
  const festivalPlace = festivalEntry?.place ?? null;
  const tomorrowType = tomorrow ? data?.roster.find((entry) => entry.id === tomorrow.id)?.type : undefined;
  // Continuity: yesterday's star, when it walked the same saga (D4).
  const yesterday =
    data && pick && pick.week
      ? selectDay(data, { isoDate: isoDateAtIndex(pick.dayIndex - 1), dayIndex: pick.dayIndex - 1 })
      : null;
  const yesterdayName =
    yesterday && yesterday.week?.storyId === pick?.week?.storyId
      ? (data?.roster.find((entry) => entry.id === yesterday.id)?.name ?? null)
      : null;

  const telling = beat?.kind === 'telling' ? (pickSourced(beat.summary, lens) ?? beat.summary[0]) : null;
  const flourish =
    beat?.kind === 'invocation' ? (beat.line.split(' — ')[1]?.replace(/\.$/, '') ?? '') : '';

  return (
    <div
      className="fixed inset-0 z-40 cursor-pointer select-none overflow-hidden"
      onClick={handleStageClick}
      role="presentation"
    >
      {/* Edge scrim + stage floor: the star stays lit center-stage, the type gets a dark house. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_28%,rgba(5,2,15,0.62)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46vh] bg-gradient-to-t from-cosmos-deep/95 via-cosmos-deep/45 to-transparent" />
      {/* Reading veil — house lights down while long prose speaks. Bottom-weighted
          so the text floor goes near-black and the star dims to an ember instead
          of washing out the words. Pure opacity transition: compositor-only. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(5,2,15,0.94)_0%,rgba(5,2,15,0.82)_42%,rgba(5,2,15,0.5)_72%,rgba(5,2,15,0.18)_100%)] transition-opacity duration-700 ${
          proseBeat ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Stage sparks — the sky glitters a little more tonight. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {TWINKLES.map((spark, index) => (
          <span
            key={index}
            className="absolute select-none leading-none text-aether opacity-30 motion-safe:[animation:proem-twinkle_4s_ease-in-out_infinite]"
            style={{
              left: spark.left,
              top: spark.top,
              fontSize: spark.size,
              animationDelay: `${spark.delay}s`,
              animationDuration: `${spark.duration}s`,
              ...(index % 3 === 0
                ? { color: glow, textShadow: `0 0 8px ${glow}` }
                : {}),
            }}
          >
            ✦
          </span>
        ))}
      </div>

      {/* Letterbox — the chrome lives in the bars, the stage stays clean. */}
      <div className="absolute inset-x-0 top-0 z-10 flex h-16 origin-top items-center justify-between bg-[#050211]/95 px-5 shadow-[0_10px_40px_rgba(5,2,15,0.6)] motion-safe:[animation:proem-bar-in_450ms_cubic-bezier(0.2,0.8,0.2,1)_both] sm:h-20 sm:px-8">
        <span className="font-display text-[10px] uppercase tracking-[0.3em] text-aether-faint">
          The Proem
          <span className="text-aether/30"> · </span>
          <span className="text-aether-muted">
            {beat ? BEAT_LABEL[beat.kind] : atDoors ? 'The doors' : '…'}
          </span>
        </span>
        {script && (
          <span aria-hidden className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1.5 sm:flex">
            {[...script.beats.map((entry, index) => index <= beatIndex), atDoors].map(
              (lit, index) => (
                <span
                  key={index}
                  className={`h-[3px] w-8 rounded-full transition-colors duration-500 ${
                    lit ? 'bg-nebula-soft shadow-[0_0_8px_#c084fc]' : 'bg-white/15'
                  }`}
                />
              ),
            )}
          </span>
        )}
        <Link
          href={`/character/${pick.id}`}
          onClick={(event) => {
            event.stopPropagation();
            leaveStage();
          }}
          className="pointer-events-auto font-display text-[10px] uppercase tracking-[0.24em] text-aether-muted transition-colors hover:text-aether"
        >
          Skip to codex →
        </Link>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0.5 h-[10px] opacity-20"
          style={{ backgroundImage: MEANDER, backgroundRepeat: 'repeat-x' }}
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 flex h-14 origin-bottom items-center justify-between bg-[#050211]/95 px-5 shadow-[0_-10px_40px_rgba(5,2,15,0.6)] motion-safe:[animation:proem-bar-in_450ms_cubic-bezier(0.2,0.8,0.2,1)_both] sm:h-16 sm:px-8">
        <span className="font-display text-[10px] uppercase tracking-[0.26em] text-aether-faint">
          {(() => {
            const atticInfo = data ? atticDateFor(data.attic, pick.isoDate) : null;
            const sacred =
              atticInfo && !pick.festival && data
                ? sacredDayFor(data.sacredDays, atticInfo.day)
                : null;
            const dateLabel = atticInfo ? `${atticInfo.label} · reconstructed` : pick.isoDate;
            const context = pick.festival
              ? ` · The ${pick.festival.name}${
                  pick.festival.of > 1 ? ` — day ${pick.festival.day} of ${pick.festival.of}` : ''
                }`
              : sacred
                ? ` · ${sacred.label}`
                : pick.week
                  ? ` · Day ${pick.week.day} of 7 — ${pick.week.title}`
                  : ' · Star of the day';
            return `${dateLabel}${context}`;
          })()}
        </span>
        {!atDoors && (
          <span className="font-display text-[10px] uppercase tracking-[0.26em] text-aether-muted">
            continue ▸
          </span>
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0.5 h-[10px] opacity-20"
          style={{ backgroundImage: MEANDER, backgroundRepeat: 'repeat-x', transform: 'scaleY(-1)' }}
        />
      </div>

      {/* Back zone affordance. */}
      {script && (beatIndex > 0 || step > 0) && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 font-display text-2xl text-aether-faint/40"
        >
          ‹
        </span>
      )}

      {/* The stage. */}
      <div className="absolute inset-x-0 bottom-20 top-20 flex flex-col items-center justify-end px-6 pb-[7vh] sm:bottom-24">
        {!script && (
          <div className="flex items-center gap-2" aria-hidden>
            <span className="h-2 w-2 animate-pulse rounded-full bg-aether-faint/40" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-aether-faint/40 [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-aether-faint/40 [animation-delay:300ms]" />
          </div>
        )}

        {script && (
          <div key={atDoors ? 'doors' : beatIndex} className="w-full">
            {beat?.kind === 'invocation' && (
              <div className="text-center">
                <p className="font-display text-[11px] uppercase tracking-[0.34em] text-aether-muted motion-safe:[animation:proem-fade-up_600ms_ease_both]">
                  {pick.festival ? (
                    <span className="text-star-olympian">Today is the {pick.festival.name}</span>
                  ) : (
                    <>Of {script.name} we sing</>
                  )}
                </p>
                <h1
                  className="mt-4 font-display text-5xl uppercase leading-none tracking-[0.14em] sm:text-7xl motion-safe:[animation:proem-title-in_950ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
                  style={{ color: glow, textShadow: `0 0 24px ${glow}66, 0 0 90px ${glow}40` }}
                >
                  {script.name.toUpperCase()}
                </h1>
                <div
                  aria-hidden
                  className="mx-auto mt-5 flex w-full max-w-xs items-center gap-3 motion-safe:[animation:proem-fade-up_700ms_ease_150ms_both]"
                >
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent to-aether/40" />
                  <span
                    className="text-[11px] leading-none"
                    style={{ color: glow, textShadow: `0 0 8px ${glow}` }}
                  >
                    ✦
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent to-aether/40" />
                </div>
                {flourish && (
                  <p className="mt-4 font-body text-xl italic text-aether/90 sm:text-2xl motion-safe:[animation:proem-fade-up_700ms_ease_260ms_both]">
                    {flourish}
                  </p>
                )}
              </div>
            )}

            {beat?.kind === 'thread' && (
              <div className="space-y-4 text-center sm:space-y-5">
                {beat.steps.slice(0, step + 1).map((bond, index) => (
                  <p
                    key={bond.relationId}
                    className={`transition-opacity duration-500 ${
                      index === step
                        ? 'opacity-100 motion-safe:[animation:proem-fade-up_550ms_ease_both]'
                        : 'opacity-40'
                    }`}
                  >
                    <span className="font-body text-lg italic text-aether-muted sm:text-xl">
                      {bond.label}{' '}
                    </span>
                    <span
                      className="font-display text-3xl tracking-[0.12em] text-aether sm:text-4xl"
                      style={{ textShadow: '0 0 18px rgba(233, 213, 255, 0.35)' }}
                    >
                      {bond.otherName.toUpperCase()}
                    </span>
                  </p>
                ))}
              </div>
            )}

            {beat?.kind === 'telling' && telling && (
              <div className="mx-auto max-w-3xl text-center motion-safe:[animation:proem-fade-up_650ms_ease_both]">
                <p
                  className="font-body text-2xl leading-relaxed text-aether/95 sm:text-[28px] sm:leading-relaxed"
                  style={{ textShadow: PROSE_INK }}
                >
                  {telling.text}
                </p>
                {telling.citation && (
                  <p className="mt-5 font-display text-[10px] uppercase tracking-[0.3em] text-aether-faint">
                    — {telling.citation}
                  </p>
                )}
              </div>
            )}

            {beat?.kind === 'quarrel' && (
              <div className="relative mx-auto max-w-3xl text-center">
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 font-body text-[120px] leading-none text-nebula-soft opacity-[0.08]"
                >
                  ⚖
                </span>
                <p
                  className="font-display text-[11px] uppercase tracking-[0.34em] text-nebula-soft motion-safe:[animation:proem-fade-up_500ms_ease_both]"
                  style={{ textShadow: PROSE_INK }}
                >
                  The tellers disagree
                </p>
                <div className="mt-6 space-y-5">
                  {beat.variants.map((variant, index) => (
                    <p
                      key={variant.sourceLabel + variant.text.slice(0, 24)}
                      className="font-body text-lg leading-relaxed text-aether/90 sm:text-xl motion-safe:[animation:proem-fade-up_600ms_ease_both]"
                      style={{ animationDelay: `${150 + index * 200}ms`, textShadow: PROSE_INK }}
                    >
                      <span className="font-display text-[12px] uppercase tracking-[0.24em] text-nebula-soft">
                        {variant.sourceLabel}
                      </span>
                      <span className="text-aether-faint"> — </span>
                      {variant.text}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {beat?.kind === 'trace' && (
              <figure className="mx-auto w-full max-w-4xl text-center motion-safe:[animation:proem-fade-up_650ms_ease_both]">
                <div
                  className="relative mx-auto h-[40vh] w-full overflow-hidden rounded-2xl border border-glass-border sm:h-[46vh]"
                  style={{ boxShadow: `0 30px 90px rgba(5, 2, 15, 0.8), 0 0 60px ${glow}22` }}
                >
                  <Image
                    src={beat.artwork.imageUrl}
                    alt={beat.artwork.title}
                    fill
                    unoptimized
                    className="object-cover motion-safe:[animation:proem-kenburns_9s_ease-out_both]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(5,2,15,0.5)_100%)]" />
                </div>
                <figcaption className="mt-4 font-body text-lg italic text-aether-muted">
                  {beat.artwork.title} — {beat.artwork.artist}, {beat.artwork.year}
                </figcaption>
              </figure>
            )}

            {atDoors && (
              <div className="mx-auto w-full max-w-md text-center">
                {pick.week && (
                  <p className="mb-3 font-body text-[15px] italic text-aether-muted motion-safe:[animation:proem-fade-up_450ms_ease_both]">
                    Day {pick.week.day} of {pick.week.title}
                    {yesterdayName && <> — yesterday, {yesterdayName}</>}
                  </p>
                )}
                <p className="font-display text-[11px] uppercase tracking-[0.34em] text-aether-muted motion-safe:[animation:proem-fade-up_500ms_ease_both]">
                  The doors
                </p>
                <div className="mt-5 flex flex-col gap-2 motion-safe:[animation:proem-fade-up_600ms_ease_120ms_both]">
                  <Link
                    href={`/character/${script.characterId}`}
                    onClick={leaveStage}
                    className={primaryDoorClass}
                  >
                    Descend into the codex
                  </Link>
                  {script.doors.storyId && (
                    <Link
                      href={`/story/${script.doors.storyId}`}
                      onClick={leaveStage}
                      className={doorClass}
                    >
                      Read the myth
                      <span className="ml-1.5 normal-case tracking-normal text-aether-faint">
                        · {script.doors.storyTitle}
                      </span>
                    </Link>
                  )}
                  {script.doors.city && (
                    <Link
                      href={`/city/${script.doors.city.id}/sky`}
                      onClick={leaveStage}
                      className={doorClass}
                    >
                      Visit the city sky
                      <span className="ml-1.5 normal-case tracking-normal text-aether-faint">
                        · {script.doors.city.name}
                      </span>
                    </Link>
                  )}
                  {festivalPlace?.isCity && festivalPlace.id !== script.doors.city?.id && (
                    <Link
                      href={`/city/${festivalPlace.id}`}
                      onClick={leaveStage}
                      className={doorClass}
                    >
                      The festival&apos;s seat
                      <span className="ml-1.5 normal-case tracking-normal text-aether-faint">
                        · {festivalPlace.name}
                      </span>
                    </Link>
                  )}
                  {festivalEntry?.aition && festivalEntry.aition.id !== script.doors.storyId && (
                    <Link
                      href={`/story/${festivalEntry.aition.id}`}
                      onClick={leaveStage}
                      className={doorClass}
                    >
                      The founding myth
                      <span className="ml-1.5 normal-case tracking-normal text-aether-faint">
                        · {festivalEntry.aition.title}
                      </span>
                    </Link>
                  )}
                  <button type="button" onClick={leaveStage} className={doorClass}>
                    Return to the sky
                  </button>
                </div>
                {tomorrowType && (
                  <p className="mt-5 font-body text-[15px] text-aether-faint motion-safe:[animation:proem-fade-up_600ms_ease_260ms_both]">
                    Tomorrow:{' '}
                    <span
                      aria-hidden
                      style={{
                        color: TYPE_GLOW[tomorrowType].color,
                        textShadow: `0 0 10px ${TYPE_GLOW[tomorrowType].color}`,
                      }}
                    >
                      ★
                    </span>{' '}
                    ?
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
