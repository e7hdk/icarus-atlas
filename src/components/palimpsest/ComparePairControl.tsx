'use client';

import { useGalaxyStore } from '@/features/galaxy/store';
import type { Source, SourceId } from '@/types/character';

/** The second layer of the source-lens section in Atlas Settings: read after
 *  one teller, then — if you want — hold a second beside them
 *  (docs/PALIMPSEST_PLAN.md §6.1).
 *
 *  It is progressive on purpose. Consensus is already the union of every
 *  teller, so it can never be one side of a comparison; until a concrete
 *  teller is chosen there is nothing to compare against, and the control says
 *  so rather than offering a dead pair. */
export function ComparePairControl({ sources }: { sources: Source[] }) {
  const lens = useGalaxyStore((state) => state.lens);
  const compareWith = useGalaxyStore((state) => state.compareWith);
  const setComparison = useGalaxyStore((state) => state.setComparison);
  const clearComparison = useGalaxyStore((state) => state.clearComparison);

  const heading = (
    <h3 className="font-display text-[10px] uppercase tracking-[0.24em] text-aether-faint">
      Compare two tellers
    </h3>
  );

  if (lens === 'consensus') {
    return (
      <section className="border-t border-glass-border px-5 py-4">
        {heading}
        <p className="mt-2 font-body text-xs italic leading-relaxed text-aether-faint">
          Consensus already holds every teller at once. Choose one above, and a second can be
          held beside them.
        </p>
      </section>
    );
  }

  const primary = sources.find((source) => source.id === lens);
  const others = sources.filter((source) => source.id !== lens);

  return (
    <section className="border-t border-glass-border px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        {heading}
        {compareWith && (
          <button
            type="button"
            onClick={clearComparison}
            className="font-display text-[9px] uppercase tracking-[0.18em] text-nebula-soft/90 transition-colors hover:text-nebula-soft hover:underline"
          >
            Stop comparing
          </button>
        )}
      </div>
      <p className="mt-2 font-body text-xs italic leading-relaxed text-aether-faint">
        Reading after <span className="not-italic text-aether-muted">{primary?.name ?? lens}</span>.
        Hold a second teller beside them to see where the two agree, where they part, and where
        the atlas has nothing from one of them.
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {others.map((source) => {
          const active = compareWith === source.id;
          return (
            <button
              key={source.id}
              type="button"
              aria-pressed={active}
              onClick={() =>
                active ? clearComparison() : setComparison(lens as SourceId, source.id)
              }
              className={`rounded-full border px-3 py-1.5 font-display text-[10px] tracking-[0.14em] transition-colors ${
                active
                  ? 'border-nebula-soft/55 bg-nebula-violet/20 text-aether'
                  : 'border-glass-border bg-white/[0.025] text-aether-muted hover:border-nebula-soft/40 hover:text-aether'
              }`}
            >
              {source.name.toUpperCase()}
            </button>
          );
        })}
      </div>
      <p className="mt-3 font-body text-[11px] italic leading-relaxed text-aether-faint">
        Silence is not denial: when a teller has no passage here, the atlas says so — it never
        says they denied it.
      </p>
    </section>
  );
}
