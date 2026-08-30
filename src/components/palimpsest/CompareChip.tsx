'use client';

import { useGalaxyStore } from '@/features/galaxy/store';
import type { Source } from '@/types/character';

/** The AtlasBar's paired-lens chip: present only while two tellers are held
 *  together, and deliberately quiet — the three doors stay the loudest thing
 *  in the bar (docs/PALIMPSEST_PLAN.md §6.1). Swap reverses the pair; the ×
 *  drops back to reading after the primary teller alone. */
export function CompareChip({ sources }: { sources: Source[] }) {
  const lens = useGalaxyStore((state) => state.lens);
  const compareWith = useGalaxyStore((state) => state.compareWith);
  const swapComparison = useGalaxyStore((state) => state.swapComparison);
  const clearComparison = useGalaxyStore((state) => state.clearComparison);

  if (!compareWith || lens === 'consensus') return null;
  const name = (id: string) => sources.find((source) => source.id === id)?.name ?? id;
  const short = (id: string) => name(id).split(' ').pop() ?? id;
  const initial = (id: string) => short(id).charAt(0);

  return (
    <span className="pointer-events-auto flex h-9 items-center gap-1 rounded-full border border-nebula-soft/45 bg-glass px-1.5 backdrop-blur-xl sm:px-2">
      <button
        type="button"
        onClick={swapComparison}
        title={`Swap — read ${name(compareWith)} first`}
        aria-label={`Comparing ${name(lens)} with ${name(compareWith)}. Swap the tellers.`}
        className="flex items-center gap-1.5 rounded-full px-1.5 py-1 font-display text-[10px] tracking-[0.14em] text-nebula-soft transition-colors hover:text-aether"
      >
        <span aria-hidden className="uppercase sm:hidden">{initial(lens)}</span>
        <span aria-hidden className="hidden max-w-[5.5rem] truncate uppercase sm:inline">
          {short(lens)}
        </span>
        <span aria-hidden className="text-aether-faint">
          ⇄
        </span>
        <span aria-hidden className="uppercase sm:hidden">{initial(compareWith)}</span>
        <span aria-hidden className="hidden max-w-[5.5rem] truncate uppercase sm:inline">
          {short(compareWith)}
        </span>
      </button>
      <button
        type="button"
        onClick={clearComparison}
        title={`Stop comparing — keep reading ${name(lens)}`}
        aria-label={`Stop comparing and keep reading ${name(lens)}`}
        className="flex h-5 w-5 items-center justify-center rounded-full text-aether-faint transition-colors hover:bg-white/10 hover:text-aether"
      >
        <span aria-hidden>×</span>
      </button>
    </span>
  );
}
