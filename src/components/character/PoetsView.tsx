'use client';

import { useMemo } from 'react';
import type { Character, Relation, Source, SourceId } from '@/types/character';
import { SOURCE_IDS } from '@/types/character';
import { filterSourced } from '@/lib/lens';
import { useGalaxyStore } from '@/features/galaxy/store';
import { RelationOrrery } from './RelationOrrery';

/** The Poets tab: the ONE place where the source lens lives.
 *  Switching the teller re-writes the story and re-wires the orrery. */
export function PoetsView({
  character,
  characters,
  relations,
  sources,
}: {
  character: Character;
  characters: Character[];
  relations: Relation[];
  sources: Source[];
}) {
  const lens = useGalaxyStore((s) => s.lens);
  const setLens = useGalaxyStore((s) => s.setLens);

  const sourceName = useMemo(
    () => new Map<SourceId, string>(sources.map((s) => [s.id, s.name])),
    [sources],
  );
  const story = filterSourced(character.story, lens);

  // Compact labels for the lens bar; full names stay in citations.
  const SHORT_NAMES: Partial<Record<SourceId, string>> = {
    apollodorus: 'Apollodorus',
    apollonius: 'Apollonius',
  };

  return (
    <div>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <span className="font-body text-base italic text-aether-faint">told after</span>
        <div className="flex flex-wrap justify-center gap-1 rounded-full border border-glass-border bg-glass p-1 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setLens('consensus')}
            className={`rounded-full border px-4 py-1.5 font-display text-[11.5px] tracking-[0.08em] transition-colors ${
              lens === 'consensus'
                ? 'border-nebula-soft/50 bg-nebula-violet/20 text-[#e9d5ff]'
                : 'border-transparent text-aether-muted hover:text-aether'
            }`}
          >
            ALL TELLERS
          </button>
          {SOURCE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setLens(id)}
              className={`rounded-full border px-4 py-1.5 font-display text-[11.5px] tracking-[0.08em] transition-colors ${
                lens === id
                  ? 'border-nebula-soft/50 bg-nebula-violet/20 text-[#e9d5ff]'
                  : 'border-transparent text-aether-muted hover:text-aether'
              }`}
            >
              {(SHORT_NAMES[id] ?? sourceName.get(id) ?? id).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[auto_1fr]">
        <div className="lg:sticky lg:top-6 lg:self-start">
          <RelationOrrery character={character} characters={characters} relations={relations} />
        </div>

        <div className="min-w-0">
          <h2 className="font-display text-[12px] tracking-[0.26em] text-aether-faint">THE STORY</h2>
          <div className="mt-4 space-y-5">
            {story.length === 0 && (
              <p className="font-body text-lg italic text-aether-faint">
                Nothing of this figure survives under this teller — choose another lens above.
              </p>
            )}
            {story.map((paragraph, index) => (
              <p key={index} className="font-body text-lg leading-relaxed text-aether/90">
                {paragraph.text}{' '}
                <span className="group relative cursor-default align-super font-body text-[13px] text-aether-faint">
                  {index + 1}
                  <span className="pointer-events-none absolute bottom-full left-0 z-10 mb-1.5 hidden whitespace-nowrap rounded-lg border border-nebula-soft/40 bg-cosmos-raised px-2.5 py-1 font-body text-sm not-italic text-aether group-hover:block">
                    {paragraph.sources.map((id) => sourceName.get(id) ?? id).join(' · ')}
                    {paragraph.citation ? ` — ${paragraph.citation}` : ''}
                  </span>
                </span>
                {paragraph.topic && lens === 'consensus' && (
                  <span className="group relative ml-1 cursor-default text-nebula-soft">
                    ⚖
                    <span className="pointer-events-none absolute bottom-full left-0 z-10 mb-1.5 hidden whitespace-nowrap rounded-lg border border-nebula-soft/40 bg-cosmos-raised px-2.5 py-1 font-body text-sm text-aether group-hover:block">
                      Told differently in other tellings — change the lens above
                    </span>
                  </span>
                )}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
