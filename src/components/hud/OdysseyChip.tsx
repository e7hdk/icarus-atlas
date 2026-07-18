'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

/** AtlasBar beacon for the Odyssey voyage (docs/NOSTOS_PLAN.md §6, D8).
 *  Sits to the LEFT of the star of the day — the Bear kept on the left hand,
 *  as Calypso instructed (Od. 5.276–277). The icon is the Wain itself, and
 *  the chip breathes with the gold beckon until the voyage is first opened. */

const SEEN_KEY = 'odyssey-voyage-seen';
const BECKON_GOLD = '#fcd34d';

/** The Wain / Big Dipper — seven stars and the line between them. */
function WainGlyph() {
  return (
    <svg
      aria-hidden
      width="19"
      height="14"
      viewBox="0 0 20 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path
        d="M1.5 3.5 L5.5 5 L9 6.5 L12 8 L17.5 7 L18 12 L12.8 12.2 L12 8"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeOpacity="0.5"
      />
      {[
        [1.5, 3.5],
        [5.5, 5],
        [9, 6.5],
        [12, 8],
        [17.5, 7],
        [18, 12],
        [12.8, 12.2],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.15" fill="currentColor" />
      ))}
    </svg>
  );
}

export function OdysseyChip({ active }: { active: boolean }) {
  const [seen, setSeen] = useState(true);

  // localStorage after paint — the server renders a quiet chip, and the
  // beckon only starts client-side (the EphemerisChip pattern).
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setSeen(Boolean(localStorage.getItem(SEEN_KEY)) || active);
    });
    return () => cancelAnimationFrame(frame);
  }, [active]);

  const markSeen = () => {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Private mode — the beckon simply keeps breathing.
    }
    setSeen(true);
  };

  return (
    <Link
      href="/odyssey"
      onClick={markSeen}
      aria-label="The Odyssey — a voyage home, told by the stars"
      aria-current={active ? 'page' : undefined}
      className={`pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border bg-glass backdrop-blur-xl transition-colors sm:h-9 sm:w-9 lg:w-auto lg:justify-start lg:gap-2 lg:px-3 ${
        active
          ? 'border-star-olympian/60 text-star-olympian'
          : 'border-glass-border text-aether-muted hover:border-star-olympian/50 hover:text-star-olympian'
      } ${!seen ? 'motion-safe:[animation:ephemeris-beckon_2.6s_ease-in-out_infinite]' : ''}`}
      style={
        !seen
          ? ({ '--ephemeris-beckon-color': `${BECKON_GOLD}73` } as CSSProperties)
          : undefined
      }
    >
      <span
        aria-hidden
        className="leading-none text-star-olympian"
        style={{ textShadow: `0 0 8px ${BECKON_GOLD}` }}
      >
        <WainGlyph />
      </span>
      <span className="hidden font-display text-[11px] tracking-[0.16em] lg:inline">ODYSSEY</span>
    </Link>
  );
}
