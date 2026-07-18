'use client';

import { useMemo } from 'react';
import { festivalOn, nextOccurrenceOf } from '@/features/spotlight/festivals';
import { useEphemerisStore } from '@/features/spotlight/store';

/** Live countdown chip for one Heortologion row — gold "today" while the
 *  feast runs, otherwise the next reconstructed opening day. Client-only:
 *  "today" never exists on the server, so the static page cannot go stale. */
export function FestivalCountdown({ festivalId }: { festivalId: string }) {
  const data = useEphemerisStore((s) => s.data);
  const pick = useEphemerisStore((s) => s.pick);

  const info = useMemo(() => {
    if (!data || !pick) return null;
    const festival = data.festivals.find((entry) => entry.id === festivalId);
    if (!festival) return null;
    const running = festivalOn([festival], pick.isoDate, data.attic);
    if (running) {
      return {
        now: true,
        label: running.of > 1 ? `today — day ${running.day} of ${running.of}` : 'today',
      };
    }
    const next = nextOccurrenceOf(festival, pick.dayIndex, data.attic);
    if (!next) return null;
    return {
      now: false,
      label: `${next.isoDate} · in ${next.inDays} ${next.inDays === 1 ? 'day' : 'days'}`,
    };
  }, [data, pick, festivalId]);

  if (!info) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-display text-[9px] uppercase tracking-[0.18em] ${
        info.now
          ? 'border-star-olympian/50 bg-star-olympian/15 text-star-olympian'
          : 'border-glass-border bg-glass text-aether-muted'
      }`}
    >
      {info.now && <span aria-hidden>★</span>}
      {info.label}
    </span>
  );
}
