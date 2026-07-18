'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { TYPE_GLOW } from '@/types/character';
import { useEphemerisStore } from '@/features/spotlight/store';

/** AtlasBar chip announcing the star of the day (docs/EPHEMERIS_PLAN.md §5).
 *  Until the day is revealed the name stays a `?` and the chip beckons with
 *  a breathing halo — clicking it opens the Sphinx's riddle (the default
 *  door, §11); once the star is named the chip wears the name and opens the
 *  card. Skeleton until the client host has computed the pick. */
export function EphemerisChip() {
  const data = useEphemerisStore((s) => s.data);
  const pick = useEphemerisStore((s) => s.pick);
  const cardOpen = useEphemerisStore((s) => s.cardOpen);
  const proemActive = useEphemerisStore((s) => s.proemActive);
  const riddleOpen = useEphemerisStore((s) => s.riddleOpen);
  const setCardOpen = useEphemerisStore((s) => s.setCardOpen);
  const setRiddleOpen = useEphemerisStore((s) => s.setRiddleOpen);
  const [seenStamp, setSeenStamp] = useState<string | null>(null);
  const [revealStamp, setRevealStamp] = useState<string | null>(null);

  // localStorage is read after paint (rAF) — the server renders no "today",
  // and the beckon only ever starts client-side once the pick is known.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setSeenStamp(localStorage.getItem('ephemeris-seen'));
      setRevealStamp(localStorage.getItem('ephemeris-riddle'));
    });
    return () => cancelAnimationFrame(frame);
  }, [pick, cardOpen, proemActive, riddleOpen]);

  const entry = useMemo(
    () =>
      pick && data
        ? (data.roster.find((candidate) => candidate.id === pick.id) ?? null)
        : null,
    [data, pick],
  );
  const glow = entry ? TYPE_GLOW[entry.type].color : undefined;
  const unrevealed = Boolean(pick && entry && revealStamp !== pick.isoDate);
  const unseen = Boolean(pick && entry && seenStamp !== pick.isoDate);

  const open = () => {
    if (!pick) return;
    try {
      localStorage.setItem('ephemeris-seen', pick.isoDate);
    } catch {
      // Private mode — the beckon simply keeps breathing.
    }
    setSeenStamp(pick.isoDate);
    if (unrevealed) {
      setRiddleOpen(true);
      return;
    }
    setCardOpen(!cardOpen);
  };

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Star of the day"
      aria-expanded={cardOpen || riddleOpen}
      className={`pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border bg-glass backdrop-blur-xl transition-colors sm:h-9 sm:w-9 lg:w-auto lg:justify-start lg:gap-2 lg:px-3 ${
        cardOpen || riddleOpen
          ? 'border-nebula-soft/60 text-nebula-soft'
          : 'border-glass-border text-aether-muted hover:border-nebula-soft/50 hover:text-aether'
      } ${unseen ? 'motion-safe:[animation:ephemeris-beckon_2.6s_ease-in-out_infinite]' : ''}`}
      style={
        unseen && glow
          ? ({ '--ephemeris-beckon-color': `${glow}73` } as CSSProperties)
          : undefined
      }
    >
      <span
        aria-hidden
        className="text-[13px] leading-none"
        style={glow ? { color: glow, textShadow: `0 0 8px ${glow}` } : undefined}
      >
        ★
      </span>
      {entry ? (
        <span className="hidden max-w-32 truncate font-display text-[11px] tracking-[0.16em] lg:inline">
          {unrevealed ? '?' : entry.name.toUpperCase()}
        </span>
      ) : (
        <span
          aria-hidden
          className="hidden h-2 w-14 animate-pulse rounded bg-aether-faint/25 lg:inline-block"
        />
      )}
    </button>
  );
}
