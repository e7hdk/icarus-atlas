'use client';

import { useMemo } from 'react';
import type { Character, Relation, Source, SourceId } from '@/types/character';
import { filterSourced } from '@/lib/lens';
import { useGalaxyStore } from '@/features/galaxy/store';
import { LinkedProse } from '@/features/linking/LinkedProse';
import { getBakedLinkedProse, getCharacterStorySegments } from '@/features/linking/load-baked';
import type { LinkingContext } from '@/features/linking/name-index';
import { LensDropdown } from './LensDropdown';
import { RelationOrrery } from './RelationOrrery';

/** The Poets tab: the ONE place where the source lens lives.
 *  Switching the teller re-writes the story and re-wires the orrery. */
export function PoetsView({
  character,
  characters,
  relations,
  sources,
  linkingContext,
}: {
  character: Character;
  characters: Pick<Character, 'id' | 'name' | 'type'>[];
  relations: Relation[];
  sources: Source[];
  linkingContext?: LinkingContext;
}) {
  const lens = useGalaxyStore((s) => s.lens);
  const bakedProse = useMemo(() => getBakedLinkedProse(), []);

  const sourceName = useMemo(
    () => new Map<SourceId, string>(sources.map((s) => [s.id, s.name])),
    [sources],
  );
  const scopeIds = useMemo(() => {
    const ids = new Set<string>([character.id]);
    for (const relation of relations) {
      if (relation.from === character.id) ids.add(relation.to);
      if (relation.to === character.id) ids.add(relation.from);
    }
    return [...ids];
  }, [character.id, relations]);
  const story = filterSourced(character.story, lens);

  return (
    <div>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <span className="font-body text-base italic text-aether-faint">told after</span>
        <LensDropdown sources={sources} />
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
            {story.map((paragraph, index) => {
              const originalIndex = character.story.findIndex((p) => p.text === paragraph.text);
              const segments =
                bakedProse && originalIndex >= 0
                  ? getCharacterStorySegments(bakedProse, character.id, originalIndex)
                  : undefined;
              return (
                <p key={index} className="font-body text-lg leading-relaxed text-aether/90">
                  <LinkedProse
                    text={paragraph.text}
                    segments={segments}
                    characterIndex={linkingContext?.characterIndex}
                    nameIndex={linkingContext?.nameIndex}
                    sortedNames={linkingContext?.sortedNames}
                    scopeIds={scopeIds}
                  />{' '}
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
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
