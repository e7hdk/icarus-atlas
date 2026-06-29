'use client';

import { useMemo } from 'react';
import type { Character, Relation } from '@/types/character';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { TypeBadge } from '@/components/ui/TypeBadge';
import { KindBadge } from '@/components/ui/KindBadge';
import { filterRelations, pickSourced, isDisputed } from '@/lib/lens';
import { bondsFor } from '@/features/characters/relations';
import { getBakedLinkedProse, resolveCharacterProseSegments } from '@/features/linking/load-baked';
import { buildLinkingContext } from '@/features/linking/name-index';
import { LinkedProse } from '@/features/linking/LinkedProse';
import { useGalaxyStore } from '@/features/galaxy/store';

/** Compact card shown while hovering a star. The full story lives in CharacterPanel. */
export function HoverCard({
  characters,
  relations,
}: {
  characters: Character[];
  relations: Relation[];
}) {
  const hoveredId = useGalaxyStore((s) => s.hoveredId);
  const selectedId = useGalaxyStore((s) => s.selectedId);
  const lens = useGalaxyStore((s) => s.lens);

  const byId = useMemo(() => new Map(characters.map((c) => [c.id, c])), [characters]);
  const bakedProse = useMemo(() => getBakedLinkedProse(), []);
  const linkingContext = useMemo(
    () => (bakedProse ? null : buildLinkingContext(characters)),
    [characters, bakedProse],
  );
  const character = hoveredId && hoveredId !== selectedId ? byId.get(hoveredId) : undefined;
  const visibleRelations = filterRelations(relations, lens);
  const scopeIds = useMemo(() => {
    if (!character) return [];
    const ids = new Set<string>([character.id]);
    for (const bond of bondsFor(character.id, visibleRelations)) {
      ids.add(bond.otherId);
    }
    return [...ids];
  }, [character, visibleRelations]);
  if (!character) return null;

  const summary = pickSourced(character.summary, lens) ?? pickSourced(character.story, lens);
  const disputed = lens === 'consensus' && isDisputed(character, relations);
  const bonds = bondsFor(character.id, visibleRelations).slice(0, 6);

  return (
    <GlassPanel className="pointer-events-none fixed right-5 top-16 z-30 w-72 bg-glass-heavy px-5 py-4">
      <h2 className="font-display text-base tracking-[0.08em] text-aether">
        {character.name.toUpperCase()}
        <span className="ml-2 font-body text-sm italic tracking-normal text-aether-muted">
          {character.greekName.replace(/^[^(]*\(/, '').replace(/\)$/, '')}
        </span>
      </h2>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <TypeBadge type={character.type} />
        {character.kinds?.map((kind) => (
          <KindBadge key={kind} kind={kind} primaryType={character.type} />
        ))}
        <span className="font-body text-sm italic text-aether-muted">{character.domains.join(' · ')}</span>
      </div>
      <p className="mt-3 font-body text-[15px] leading-relaxed text-aether/90">
        {summary ? (
          <LinkedProse
            text={summary.text}
            segments={
              bakedProse ? resolveCharacterProseSegments(bakedProse, character, summary.text) : undefined
            }
            characterIndex={linkingContext?.characterIndex}
            nameIndex={linkingContext?.nameIndex}
            sortedNames={linkingContext?.sortedNames}
            scopeIds={scopeIds}
          />
        ) : (
          'No surviving account for this figure is included under the active source lens.'
        )}
      </p>
      {disputed && (
        <p className="mt-2 rounded-lg border border-nebula-soft/35 bg-nebula-violet/15 px-3 py-1.5 font-body text-[13px] text-nebula-soft">
          The sources disagree about this figure — travel closer to compare traditions.
        </p>
      )}
      {bonds.length > 0 && (
        <div className="mt-3">
          <div className="font-display text-[10px] uppercase tracking-[0.2em] text-aether-faint">Bonds</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {bonds.map((bond) => (
              <span
                key={bond.relationId}
                className="rounded-full border border-glass-border bg-glass px-2.5 py-0.5 font-body text-[13px] text-aether/85"
              >
                {byId.get(bond.otherId)?.name ?? bond.otherId}
                <span className="text-aether-faint"> · {bond.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="mt-3 border-t border-glass-border pt-2 font-display text-[10px] uppercase tracking-[0.2em] text-nebula-soft">
        Click to travel
      </div>
    </GlassPanel>
  );
}
