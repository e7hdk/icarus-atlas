'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Character, Relation, Source, SourceId } from '@/types/character';
import { TypeBadge } from '@/components/ui/TypeBadge';
import { KindBadge } from '@/components/ui/KindBadge';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { bondsFor } from '@/features/characters/relations';
import { getBakedLinkedProse, getCharacterStorySegments, resolveCharacterProseSegments } from '@/features/linking/load-baked';
import { buildLinkingContext } from '@/features/linking/name-index';
import { LinkedProse } from '@/features/linking/LinkedProse';
import { useGalaxyStore } from '@/features/galaxy/store';
import { filterRelations, filterSourced } from '@/lib/lens';
import { useIsMobile } from '@/lib/useIsMobile';
import type { CitySkyContext } from '@/components/galaxy/GalaxyView';
import { CitySkyResidenceHints } from '@/components/city/CitySkyResidenceHints';

/** How many bonds to show inline before the overflow opens the full list. */
const INLINE_BONDS = 8;
/** Story paragraphs shown before "Read more" expands the rest — keeps the panel
 *  compact and scroll-free by default even for long, multi-chapter figures. */
const STORY_PREVIEW = 2;

/** Full story panel, opened by clicking a star. Every paragraph carries its sources. */
export function CharacterPanel({
  characters,
  relations,
  sources,
  cityContext,
}: {
  characters: Character[];
  relations: Relation[];
  sources: Source[];
  cityContext?: CitySkyContext;
}) {
  const selectedId = useGalaxyStore((s) => s.selectedId);
  const select = useGalaxyStore((s) => s.select);
  const lens = useGalaxyStore((s) => s.lens);
  const setDiving = useGalaxyStore((s) => s.setDiving);
  const router = useRouter();
  const isMobile = useIsMobile();
  const panelRef = useRef<HTMLElement>(null);
  const [bondsOpen, setBondsOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  // Reset the expanded bonds list and collapsed story whenever the panel shows a
  // new figure (React's official "adjust state on prop change during render").
  const [shownFor, setShownFor] = useState(selectedId);
  if (selectedId !== shownFor) {
    setShownFor(selectedId);
    setBondsOpen(false);
    setStoryOpen(false);
  }

  const byId = useMemo(() => new Map(characters.map((c) => [c.id, c])), [characters]);
  const bakedProse = useMemo(() => getBakedLinkedProse(), []);
  const linkingContext = useMemo(
    () => (bakedProse ? null : buildLinkingContext(characters)),
    [characters, bakedProse],
  );
  const sourceName = useMemo(
    () => new Map<SourceId, string>(sources.map((s) => [s.id, s.name])),
    [sources],
  );
  const citiesById = useMemo(
    () => new Map(cityContext?.cities.map((city) => [city.id, city]) ?? []),
    [cityContext?.cities],
  );

  const character = selectedId ? byId.get(selectedId) : undefined;
  const scopeIds = useMemo(() => {
    if (!character) return [];
    const ids = new Set<string>([character.id]);
    for (const bond of bondsFor(character.id, filterRelations(relations, lens))) {
      ids.add(bond.otherId);
    }
    return [...ids];
  }, [character, relations, lens]);

  useEffect(() => {
    if (selectedId) panelRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [selectedId]);

  // While the bonds modal is open, Escape closes it first (capture phase so it
  // pre-empts the galaxy's deselect handler).
  useEffect(() => {
    if (!bondsOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setBondsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [bondsOpen]);

  if (!character) return null;

  const openCharacterPage = () => {
    setDiving(true);
    setTimeout(() => {
      router.push(`/character/${character.id}`);
    }, 600); // Wait for the dive animation (smoothTime 0.5s + small buffer)
  };

  // Mobile: a slim card up top instead of a full-screen panel, so the star
  // stays visible below. Name, a couple of facts, and a jump to the codex.
  if (isMobile) {
    const summary = filterSourced(character.summary, lens)[0] ?? filterSourced(character.story, lens)[0];
    return (
      <div className="fixed inset-x-3 top-3 z-30">
        <GlassPanel className="bg-glass-heavy px-4 py-3.5 shadow-[0_18px_60px_rgba(5,2,15,0.8),0_0_40px_rgba(124,77,255,0.14)] animate-[search-panel-in_180ms_cubic-bezier(0.2,0.8,0.2,1)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate font-display text-lg tracking-[0.08em] text-aether">
                {character.name.toUpperCase()}
              </h2>
              <p className="truncate font-body text-[13px] italic text-aether-muted">
                {character.greekName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => select(null)}
              aria-label="Close"
              className="-mr-1 -mt-1 shrink-0 rounded-full px-2 py-1 font-display text-sm text-aether-faint transition-colors hover:text-aether"
            >
              ✕
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <TypeBadge type={character.type} />
            {character.kinds?.map((kind) => (
              <KindBadge key={kind} kind={kind} primaryType={character.type} />
            ))}
            <span className="min-w-0 truncate font-body text-[12.5px] italic text-aether-muted">
              {character.domains.join(' · ')}
            </span>
          </div>
          {summary && (
            <p className="mt-2 line-clamp-2 font-body text-[14px] leading-snug text-aether/85">
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
            </p>
          )}
          {cityContext && (
            <CitySkyResidenceHints
              character={character}
              currentCityId={cityContext.cityId}
              citiesById={citiesById}
              compact
            />
          )}
          <button
            type="button"
            onClick={openCharacterPage}
            className="mt-3 w-full rounded-xl border border-nebula-soft/40 bg-nebula-violet/15 px-4 py-2.5 font-display text-[12px] uppercase tracking-[0.14em] text-nebula-soft transition-colors hover:bg-nebula-violet/25"
          >
            Step into the star →
          </button>
        </GlassPanel>
      </div>
    );
  }

  const story = filterSourced(character.story, lens);
  const bonds = bondsFor(character.id, filterRelations(relations, lens));
  const citeOf = (entrySources: SourceId[], citation?: string) => {
    const names = entrySources.map((id) => sourceName.get(id) ?? id).join(' · ');
    return citation ? `${names} — ${citation}` : names;
  };

  const renderBond = (bond: (typeof bonds)[number]) => {
    const other = byId.get(bond.otherId);
    if (!other) return null;
    return (
      <button
        key={bond.relationId}
        type="button"
        onClick={() => {
          select(other.id);
          setBondsOpen(false);
        }}
        className="rounded-full border border-glass-border bg-glass px-3 py-1 text-left font-body text-[14px] text-aether/90 transition-colors hover:border-nebula-soft/50 hover:text-aether"
      >
        {other.name}
        <span className="text-aether-faint"> · {bond.label}</span>
        {lens === 'consensus' && bond.topic && <span className="text-nebula-soft"> ⚖</span>}
      </button>
    );
  };

  return (
    <>
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
          {character.kinds?.map((kind) => (
            <KindBadge key={kind} kind={kind} primaryType={character.type} />
          ))}
          <span className="font-body text-sm italic text-aether-muted">{character.domains.join(' · ')}</span>
        </div>
        {character.epithets && character.epithets.length > 0 && (
          <p className="mt-2 font-body text-sm italic text-aether-faint">
            {character.epithets.join(' · ')}
          </p>
        )}

        <div className="mt-6 space-y-5">
          {(storyOpen ? story : story.slice(0, STORY_PREVIEW)).map((paragraph, index) => {
            const originalIndex = character.story.findIndex((p) => p.text === paragraph.text);
            const segments =
              bakedProse && originalIndex >= 0
                ? getCharacterStorySegments(bakedProse, character.id, originalIndex)
                : undefined;
            return (
            <div key={index}>
              {lens === 'consensus' && paragraph.topic && (
                <div className="mb-1 inline-block rounded-full border border-nebula-soft/40 bg-nebula-violet/15 px-2.5 py-0.5 font-display text-[10px] uppercase tracking-[0.16em] text-nebula-soft">
                  Disputed tradition
                </div>
              )}
              <p className="font-body text-[16px] leading-relaxed text-aether/90">
                <LinkedProse
                  text={paragraph.text}
                  segments={segments}
                  characterIndex={linkingContext?.characterIndex}
                  nameIndex={linkingContext?.nameIndex}
                  sortedNames={linkingContext?.sortedNames}
                  scopeIds={scopeIds}
                />
              </p>
              <p className="mt-1 font-body text-[13px] italic text-aether-faint">
                — {citeOf(paragraph.sources, paragraph.citation)}
              </p>
            </div>
            );
          })}
          {story.length === 0 && (
            <p className="rounded-xl border border-glass-border bg-glass px-4 py-3 font-body text-[15px] italic leading-relaxed text-aether-muted">
              No surviving account for this figure is included under the active source lens.
            </p>
          )}
          {story.length > STORY_PREVIEW && (
            <button
              type="button"
              onClick={() => setStoryOpen((value) => !value)}
              className="font-display text-[11px] uppercase tracking-[0.16em] text-nebula-soft transition-colors hover:text-aether"
            >
              {storyOpen ? '— Read less' : `Read more · ${story.length - STORY_PREVIEW} →`}
            </button>
          )}
        </div>

        {bonds.length > 0 && (
          <div className="mt-7 border-t border-glass-border pt-5">
            <div className="font-display text-[11px] uppercase tracking-[0.22em] text-aether-faint">Bonds</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {bonds.slice(0, INLINE_BONDS).map(renderBond)}
              {bonds.length > INLINE_BONDS && (
                <button
                  type="button"
                  onClick={() => setBondsOpen(true)}
                  className="rounded-full border border-nebula-soft/40 bg-nebula-violet/15 px-3 py-1 font-body text-[14px] text-nebula-soft transition-colors hover:border-nebula-soft/70 hover:bg-nebula-violet/25"
                >
                  ··· {bonds.length - INLINE_BONDS} more
                </button>
              )}
            </div>
          </div>
        )}

        {cityContext && (
          <CitySkyResidenceHints
            character={character}
            currentCityId={cityContext.cityId}
            citiesById={citiesById}
          />
        )}

        <div className="mt-8 pb-4">
          <button
            type="button"
            onClick={openCharacterPage}
            className="w-full rounded-xl border border-nebula-soft/40 bg-nebula-violet/10 px-5 py-3 font-display text-[13px] uppercase tracking-[0.15em] text-nebula-soft shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all hover:bg-nebula-violet/25 hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]"
          >
            Step into the star
          </button>
        </div>
      </div>
    </aside>

    {bondsOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-cosmos-deep/60 px-4 backdrop-blur-[6px] animate-[search-veil-in_160ms_ease-out]"
        onMouseDown={() => setBondsOpen(false)}
      >
        <GlassPanel
          role="dialog"
          aria-modal="true"
          className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden bg-glass-heavy shadow-[0_24px_80px_rgba(5,2,15,0.85),0_0_48px_rgba(124,77,255,0.16)] animate-[search-panel-in_200ms_cubic-bezier(0.2,0.8,0.2,1)]"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-glass-border px-5 py-4">
            <h3 className="font-display text-sm tracking-[0.16em] text-aether">
              {character.name.toUpperCase()}
              <span className="ml-2 font-body text-sm italic tracking-normal text-aether-faint">
                {bonds.length} bonds
              </span>
            </h3>
            <button
              type="button"
              onClick={() => setBondsOpen(false)}
              aria-label="Close bonds list"
              className="rounded-full px-2 py-0.5 font-display text-sm text-aether-faint transition-colors hover:text-aether"
            >
              ✕
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="flex flex-wrap gap-2">{bonds.map(renderBond)}</div>
          </div>
        </GlassPanel>
      </div>
    )}
    </>
  );
}
