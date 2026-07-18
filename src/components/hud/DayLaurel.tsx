'use client';

import { useEffect, useState } from 'react';
import { useEphemerisStore } from '@/features/spotlight/store';

/** The day laurel (docs/EPHEMERIS_PLAN.md §5): a quiet crown by the codex
 *  breadcrumb when this figure is the star of the day. Client-only — "today"
 *  is always computed on the client — and it stays hidden until the day has
 *  been revealed, so browsing to the codex never spoils the Sphinx's riddle
 *  (§11). Renders nothing on every other day. */
export function DayLaurel({ characterId }: { characterId: string }) {
  const pick = useEphemerisStore((s) => s.pick);
  const riddleOpen = useEphemerisStore((s) => s.riddleOpen);
  const [revealStamp, setRevealStamp] = useState<string | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      setRevealStamp(localStorage.getItem('ephemeris-riddle')),
    );
    return () => cancelAnimationFrame(frame);
  }, [pick, riddleOpen]);

  if (pick?.id !== characterId || revealStamp !== pick.isoDate) return null;
  return (
    <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-star-olympian/40 bg-star-olympian/10 px-2.5 py-0.5 font-display text-[9px] uppercase tracking-[0.2em] text-star-olympian">
      ★ Star of the day
    </span>
  );
}
