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
import { useEphemerisStore } from '@/features/spotlight/store';
import { filterRelations, filterSourced } from '@/lib/lens';
import { useIsMobile } from '@/lib/useIsMobile';
import type { CitySkyContext } from '@/components/galaxy/GalaxyView';
import { CitySkyResidenceHints } from '@/components/city/CitySkyResidenceHints';

/** How many bonds to show inline before the overflow opens the full list. */
const INLINE_BONDS = 8;
/** Story paragraphs shown before "Read more" expands the rest — keeps the panel
 *  compact and scroll-free by default even for long, multi-chapter figures. */
const STORY_PREVIEW = 2;

const GREEK_KEY_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='12' viewBox='0 0 32 12'%3E%3Cpath d='M0 11H27V1H5V8H21V4H9' fill='none' stroke='%23fcd34d' stroke-width='1' opacity='.78'/%3E%3C/svg%3E\")";

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
  const proemActive = useEphemerisStore((s) => s.proemActive);
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
  // While the Proem plays, the stage belongs to the beats — the full panel
  // would wash the sky it narrates (docs/EPHEMERIS_PLAN.md §6).
  if (proemActive) return null;

  const openCharacterPage = () => {
    setDiving(true);
    setTimeout(() => {
      router.push(`/character/${character.id}`);
    }, 600); // Wait for the dive animation (smoothTime 0.5s + small buffer)
  };

  // Mobile: a slim card at the BOTTOM (the atlas-wide sheet grammar) so the
  // star stays visible above and the codex CTA lands in the thumb zone — the
  // old top anchor collided with the fixed bar. Name, a couple of facts, and
  // a jump to the codex.
  if (isMobile) {
    const summary = filterSourced(character.summary, lens)[0] ?? filterSourced(character.story, lens)[0];
    return (
      <div className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30">
        <GlassPanel
          className="relative overflow-hidden border-star-olympian/30 px-4 py-4 shadow-[0_18px_60px_rgba(5,2,15,0.85),0_0_34px_rgba(252,211,77,0.09)] animate-[search-panel-in_180ms_cubic-bezier(0.2,0.8,0.2,1)]"
          style={{ backgroundColor: 'rgba(5, 2, 18, 0.94)' }}
        >
          <div
            className="pointer-events-none absolute inset-x-12 top-0 h-3 opacity-25 [mask-image:linear-gradient(to_right,transparent,black_22%,black_78%,transparent)]"
            style={{ backgroundImage: GREEK_KEY_PATTERN, backgroundRepeat: 'repeat-x' }}
          />
          {/* ✕ floats out of flow so the name centres on the CARD's axis —
              sharing a flex row shifted the title left of the rows below. */}
          <button
            type="button"
            onClick={() => select(null)}
            aria-label="Close"
            className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full border border-transparent text-aether-faint transition-all hover:border-glass-border hover:bg-white/5 hover:text-aether"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.25" />
            </svg>
          </button>
          <div className="relative min-w-0 px-8 text-center">
            <h2 className="truncate font-display text-lg tracking-[0.1em] text-aether">
              {character.name.toUpperCase()}
            </h2>
            <p className="truncate font-body text-[14px] italic text-star-olympian/75">
              {character.greekName}
            </p>
          </div>
          <div className="relative mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <TypeBadge type={character.type} />
            {character.kinds?.map((kind) => (
              <KindBadge key={kind} kind={kind} primaryType={character.type} />
            ))}
            <span className="min-w-0 truncate font-body text-[12.5px] italic text-aether-muted">
              {character.domains.join(' · ')}
            </span>
          </div>
          {summary && (
            <p className="relative mt-3 border-t border-star-olympian/15 pt-3 font-body text-[14px] leading-snug text-aether/85 line-clamp-2">
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
            className="relative mt-3 w-full border border-star-olympian/35 bg-star-olympian/[0.06] px-4 py-2.5 font-display text-[11px] uppercase tracking-[0.18em] text-star-olympian transition-all hover:border-star-olympian/60 hover:bg-star-olympian/[0.12] hover:text-aether"
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
        className="border border-star-olympian/15 bg-star-olympian/[0.035] px-3 py-1.5 text-left font-body text-[14px] text-aether/90 transition-all hover:border-star-olympian/40 hover:bg-star-olympian/[0.08] hover:text-aether"
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
      className="fixed bottom-0 right-0 top-14 z-30 w-[400px] max-w-full overflow-y-auto border-l border-t border-star-olympian/30 shadow-[-18px_24px_80px_rgba(5,2,15,0.88),0_0_34px_rgba(252,211,77,0.08),inset_0_0_42px_rgba(124,77,255,0.05)] backdrop-blur-2xl"
      style={{ backgroundColor: 'rgba(5, 2, 18, 0.94)' }}
    >
      <div className="pointer-events-none absolute inset-2 border border-star-olympian/[0.07]" />
      <div className="pointer-events-none absolute right-3 top-3 h-6 w-6 border-r border-t border-star-olympian/40" />
      <div className="pointer-events-none absolute bottom-3 left-3 h-6 w-6 border-b border-l border-star-olympian/20" />
      <div
        className="pointer-events-none absolute inset-x-16 top-0 h-3 opacity-25 [mask-image:linear-gradient(to_right,transparent,black_22%,black_78%,transparent)]"
        style={{ backgroundImage: GREEK_KEY_PATTERN, backgroundRepeat: 'repeat-x' }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_50%_-15%,rgba(252,211,77,0.1),transparent_56%),radial-gradient(circle_at_18%_18%,rgba(124,77,255,0.08),transparent_48%)]" />
      {/* The AtlasBar owns the top 3.5rem strip on every route — the panel
          starts entirely below it (top-14), so bar and panel never share
          pixels (tenth UX review). */}
      <div className="relative px-7 py-6">
        <button
          type="button"
          onClick={() => select(null)}
          aria-label="Close"
          className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full border border-transparent text-aether-faint transition-all hover:border-glass-border hover:bg-white/5 hover:text-aether"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
            <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.25" />
          </svg>
        </button>

        <div className="mx-auto flex w-28 items-center gap-2" aria-hidden>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-star-olympian/50" />
          <span className="h-1.5 w-1.5 rotate-45 border border-star-olympian/65 bg-star-olympian/15 shadow-[0_0_9px_rgba(252,211,77,0.36)]" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-star-olympian/50" />
        </div>

        <h2 className="mt-4 text-center font-display text-2xl tracking-[0.14em] text-aether drop-shadow-[0_0_16px_rgba(252,211,77,0.12)]">
          {character.name.toUpperCase()}
        </h2>
        <p className="mt-1 text-center font-body text-lg italic text-star-olympian/75">
          {character.greekName}
          {character.romanName ? ` · Roman ${character.romanName}` : ''}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <TypeBadge type={character.type} />
          {character.kinds?.map((kind) => (
            <KindBadge key={kind} kind={kind} primaryType={character.type} />
          ))}
          <span className="font-body text-sm italic text-aether-muted">{character.domains.join(' · ')}</span>
        </div>
        {character.epithets && character.epithets.length > 0 && (
          <p className="mt-2 text-center font-body text-sm italic text-aether-faint">
            {character.epithets.join(' · ')}
          </p>
        )}

        <div className="mt-6 space-y-5 border-t border-star-olympian/15 pt-5">
          {(storyOpen ? story : story.slice(0, STORY_PREVIEW)).map((paragraph, index) => {
            const originalIndex = character.story.findIndex((p) => p.text === paragraph.text);
            const segments =
              bakedProse && originalIndex >= 0
                ? getCharacterStorySegments(bakedProse, character.id, originalIndex)
                : undefined;
            return (
            <div key={index}>
              {lens === 'consensus' && paragraph.topic && (
                <div className="mb-1 inline-block border border-nebula-soft/30 bg-nebula-violet/10 px-2.5 py-0.5 font-display text-[10px] uppercase tracking-[0.16em] text-nebula-soft">
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
            <p className="border border-star-olympian/15 bg-star-olympian/[0.03] px-4 py-3 font-body text-[15px] italic leading-relaxed text-aether-muted">
              No surviving account for this figure is included under the active source lens.
            </p>
          )}
          {story.length > STORY_PREVIEW && (
            <button
              type="button"
              onClick={() => setStoryOpen((value) => !value)}
              className="font-display text-[10px] uppercase tracking-[0.18em] text-star-olympian/75 transition-colors hover:text-star-olympian"
            >
              {storyOpen ? '— Read less' : `Read more · ${story.length - STORY_PREVIEW} →`}
            </button>
          )}
        </div>

        {bonds.length > 0 && (
          <div className="mt-7 border-t border-star-olympian/15 pt-5">
            <div className="flex items-center gap-3">
              <div className="font-display text-[10px] uppercase tracking-[0.22em] text-aether-faint">Bonds</div>
              <span className="h-px flex-1 bg-gradient-to-r from-star-olympian/25 to-transparent" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {bonds.slice(0, INLINE_BONDS).map(renderBond)}
              {bonds.length > INLINE_BONDS && (
                <button
                  type="button"
                  onClick={() => setBondsOpen(true)}
                  className="border border-nebula-soft/30 bg-nebula-violet/10 px-3 py-1.5 font-body text-[14px] text-nebula-soft transition-colors hover:border-nebula-soft/60 hover:bg-nebula-violet/20"
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

        <div className="relative mt-8 border-t border-star-olympian/20 pb-4 pt-5">
          <div className="pointer-events-none absolute left-1/2 top-0 flex w-24 -translate-x-1/2 -translate-y-1/2 items-center gap-2">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-star-olympian/35" />
            <span className="h-1.5 w-1.5 rotate-45 border border-star-olympian/45 bg-cosmos-deep" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-star-olympian/35" />
          </div>
          <button
            type="button"
            onClick={openCharacterPage}
            className="w-full border border-star-olympian/35 bg-star-olympian/[0.06] px-5 py-3 font-display text-[11px] uppercase tracking-[0.2em] text-star-olympian transition-all hover:border-star-olympian/65 hover:bg-star-olympian/[0.12] hover:text-aether hover:shadow-[0_0_26px_rgba(252,211,77,0.12)]"
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
          className="relative flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden border-star-olympian/30 shadow-[0_24px_80px_rgba(5,2,15,0.88),0_0_36px_rgba(252,211,77,0.1)] animate-[search-panel-in_200ms_cubic-bezier(0.2,0.8,0.2,1)]"
          style={{ backgroundColor: 'rgba(5, 2, 18, 0.96)' }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div
            className="pointer-events-none absolute inset-x-14 top-0 h-3 opacity-25 [mask-image:linear-gradient(to_right,transparent,black_22%,black_78%,transparent)]"
            style={{ backgroundImage: GREEK_KEY_PATTERN, backgroundRepeat: 'repeat-x' }}
          />
          <div className="relative flex items-center justify-between border-b border-star-olympian/15 px-5 py-5">
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
              className="grid h-8 w-8 place-items-center rounded-full border border-transparent text-aether-faint transition-all hover:border-glass-border hover:bg-white/5 hover:text-aether"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.25" />
              </svg>
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
