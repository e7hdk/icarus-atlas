'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Character, Relation, Source, SourceId } from '@/types/character';
import { TypeBadge } from '@/components/ui/TypeBadge';
import { bondsFor } from '@/features/characters/relations';
import { useGalaxyStore } from '@/features/galaxy/store';
import { filterRelations, filterSourced } from '@/lib/lens';

/** Full story panel, opened by clicking a star. Every paragraph carries its sources. */
export function CharacterPanel({
  characters,
  relations,
  sources,
}: {
  characters: Character[];
  relations: Relation[];
  sources: Source[];
}) {
  const selectedId = useGalaxyStore((s) => s.selectedId);
  const select = useGalaxyStore((s) => s.select);
  const lens = useGalaxyStore((s) => s.lens);
  const setDiving = useGalaxyStore((s) => s.setDiving);
  const router = useRouter();
  const panelRef = useRef<HTMLElement>(null);

  const byId = useMemo(() => new Map(characters.map((c) => [c.id, c])), [characters]);
  const sourceName = useMemo(
    () => new Map<SourceId, string>(sources.map((s) => [s.id, s.name])),
    [sources],
  );

  const character = selectedId ? byId.get(selectedId) : undefined;

  useEffect(() => {
    if (selectedId) panelRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [selectedId]);

  if (!character) return null;

  const story = filterSourced(character.story, lens);
  const bonds = bondsFor(character.id, filterRelations(relations, lens));
  const citeOf = (entrySources: SourceId[], citation?: string) => {
    const names = entrySources.map((id) => sourceName.get(id) ?? id).join(' · ');
    return citation ? `${names} — ${citation}` : names;
  };

  return (
    <aside
      ref={panelRef}
      className="fixed bottom-0 right-0 top-0 z-30 w-[400px] max-w-full overflow-y-auto border-l border-glass-border bg-glass-heavy backdrop-blur-2xl"
    >
      <div className="px-7 py-6">
        <button
          type="button"
          onClick={() => select(null)}
          className="absolute right-5 top-5 rounded-full border border-glass-border bg-glass px-2.5 py-1 font-display text-[11px] tracking-[0.1em] text-aether-muted transition-colors hover:text-aether"
        >
          ✕
        </button>

        <h2 className="pr-16 font-display text-2xl tracking-[0.14em] text-aether">
          {character.name.toUpperCase()}
        </h2>
        <p className="mt-1 font-body text-lg italic text-aether-muted">
          {character.greekName}
          {character.romanName ? ` · Roman ${character.romanName}` : ''}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <TypeBadge type={character.type} />
          <span className="font-body text-sm italic text-aether-muted">{character.domains.join(' · ')}</span>
        </div>
        {character.epithets && character.epithets.length > 0 && (
          <p className="mt-2 font-body text-sm italic text-aether-faint">
            {character.epithets.join(' · ')}
          </p>
        )}

        <div className="mt-6 space-y-5">
          {story.map((paragraph, index) => (
            <div key={index}>
              {lens === 'consensus' && paragraph.topic && (
                <div className="mb-1 inline-block rounded-full border border-nebula-soft/40 bg-nebula-violet/15 px-2.5 py-0.5 font-display text-[10px] uppercase tracking-[0.16em] text-nebula-soft">
                  Disputed tradition
                </div>
              )}
              <p className="font-body text-[16px] leading-relaxed text-aether/90">{paragraph.text}</p>
              <p className="mt-1 font-body text-[13px] italic text-aether-faint">
                — {citeOf(paragraph.sources, paragraph.citation)}
              </p>
            </div>
          ))}
          {story.length === 0 && (
            <p className="rounded-xl border border-glass-border bg-glass px-4 py-3 font-body text-[15px] italic leading-relaxed text-aether-muted">
              No surviving account for this figure is included under the active source lens.
            </p>
          )}
        </div>

        {bonds.length > 0 && (
          <div className="mt-7 border-t border-glass-border pt-5">
            <div className="font-display text-[11px] uppercase tracking-[0.22em] text-aether-faint">Bonds</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {bonds.map((bond) => {
                const other = byId.get(bond.otherId);
                if (!other) return null;
                return (
                  <button
                    key={bond.relationId}
                    type="button"
                    onClick={() => select(other.id)}
                    className="rounded-full border border-glass-border bg-glass px-3 py-1 text-left font-body text-[14px] text-aether/90 transition-colors hover:border-nebula-soft/50 hover:text-aether"
                  >
                    {other.name}
                    <span className="text-aether-faint"> · {bond.label}</span>
                    {lens === 'consensus' && bond.topic && <span className="text-nebula-soft"> ⚖</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 pb-4">
          <button
            type="button"
            onClick={() => {
              setDiving(true);
              setTimeout(() => {
                router.push(`/character/${character.id}`);
              }, 600); // Wait for the dive animation (smoothTime 0.5s + small buffer)
            }}
            className="w-full rounded-xl border border-nebula-soft/40 bg-nebula-violet/10 px-5 py-3 font-display text-[13px] uppercase tracking-[0.15em] text-nebula-soft shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all hover:bg-nebula-violet/25 hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]"
          >
            Open the character page
          </button>
        </div>
      </div>
    </aside>
  );
}
