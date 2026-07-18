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
import type { CitySkyContext } from '@/components/galaxy/GalaxyView';
import { CitySkyResidenceHints } from '@/components/city/CitySkyResidenceHints';

const GREEK_KEY_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='12' viewBox='0 0 32 12'%3E%3Cpath d='M0 11H27V1H5V8H21V4H9' fill='none' stroke='%23fcd34d' stroke-width='1' opacity='.78'/%3E%3C/svg%3E\")";

/** Compact card shown while hovering a star. The full story lives in CharacterPanel. */
export function HoverCard({
  characters,
  relations,
  cityContext,
}: {
  characters: Character[];
  relations: Relation[];
  cityContext?: CitySkyContext;
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
  const citiesById = useMemo(
    () => new Map(cityContext?.cities.map((city) => [city.id, city]) ?? []),
    [cityContext?.cities],
  );
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
    <GlassPanel
      className="pointer-events-none fixed right-5 top-16 z-30 w-80 overflow-hidden border-star-olympian/30 shadow-[0_24px_72px_rgba(5,2,15,0.88),0_0_34px_rgba(252,211,77,0.09),inset_0_0_36px_rgba(124,77,255,0.05)]"
      style={{ backgroundColor: 'rgba(5, 2, 18, 0.94)' }}
    >
      <div className="pointer-events-none absolute inset-2 rounded-xl border border-star-olympian/[0.08]" />
      <div className="pointer-events-none absolute right-3 top-3 h-5 w-5 border-r border-t border-star-olympian/40" />
      <div className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b border-l border-star-olympian/20" />
      <div
        className="pointer-events-none absolute inset-x-14 top-0 h-3 opacity-25 [mask-image:linear-gradient(to_right,transparent,black_22%,black_78%,transparent)]"
        style={{ backgroundImage: GREEK_KEY_PATTERN, backgroundRepeat: 'repeat-x' }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_50%_-18%,rgba(252,211,77,0.11),transparent_58%),radial-gradient(circle_at_18%_18%,rgba(124,77,255,0.09),transparent_48%)]" />

      <header className="relative px-5 pb-4 pt-6 text-center">
        <div className="mx-auto flex w-24 items-center gap-2" aria-hidden>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-star-olympian/50" />
          <span className="h-1.5 w-1.5 rotate-45 border border-star-olympian/65 bg-star-olympian/15 shadow-[0_0_9px_rgba(252,211,77,0.36)]" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-star-olympian/50" />
        </div>
        <h2 className="mt-3 font-display text-[17px] tracking-[0.11em] text-aether drop-shadow-[0_0_14px_rgba(252,211,77,0.12)]">
          {character.name.toUpperCase()}
        </h2>
        <p className="mt-0.5 font-body text-[15px] italic text-star-olympian/75">
          {character.greekName.replace(/^[^(]*\(/, '').replace(/\)$/, '')}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          <TypeBadge type={character.type} />
          {character.kinds?.map((kind) => (
            <KindBadge key={kind} kind={kind} primaryType={character.type} />
          ))}
        </div>
        <p className="mt-2 font-body text-[13px] italic text-aether-muted">
          {character.domains.join(' · ')}
        </p>
      </header>

      <div className="relative border-t border-star-olympian/15 px-5 py-4">
        <p className="font-body text-[15px] leading-relaxed text-aether/90">
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
          <p className="mt-3 border border-nebula-soft/25 bg-nebula-violet/10 px-3 py-2 font-body text-[13px] text-nebula-soft">
            The sources disagree about this figure — travel closer to compare traditions.
          </p>
        )}
        {bonds.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <span className="font-display text-[9px] uppercase tracking-[0.22em] text-aether-faint">
                Bonds
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-star-olympian/25 to-transparent" />
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {bonds.map((bond) => (
                <span
                  key={bond.relationId}
                  className="border border-star-olympian/15 bg-star-olympian/[0.035] px-2.5 py-1 font-body text-[13px] text-aether/85"
                >
                  {byId.get(bond.otherId)?.name ?? bond.otherId}
                  <span className="text-aether-faint"> · {bond.label}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        {cityContext && character && (
          <CitySkyResidenceHints
            character={character}
            currentCityId={cityContext.cityId}
            citiesById={citiesById}
            compact
          />
        )}
      </div>

      <div className="relative border-t border-star-olympian/20 bg-cosmos-deep/55 px-5 py-3 text-center font-display text-[9px] uppercase tracking-[0.22em] text-star-olympian/75">
        <div className="pointer-events-none absolute left-1/2 top-0 flex w-20 -translate-x-1/2 -translate-y-1/2 items-center gap-2">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-star-olympian/30" />
          <span className="h-1 w-1 rotate-45 border border-star-olympian/40 bg-cosmos-deep" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-star-olympian/30" />
        </div>
        Click to travel →
      </div>
    </GlassPanel>
  );
}
