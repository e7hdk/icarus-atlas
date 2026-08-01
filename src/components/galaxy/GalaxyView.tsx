'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { Character, Relation, Source } from '@/types/character';
import { computePositions, type Vec3 } from '@/features/galaxy/layout';
import { layoutSignature } from '@/features/galaxy/layoutSignature';
import type { BakedLayout } from '@/features/characters/load';
import { useGalaxyStore } from '@/features/galaxy/store';
import { useEphemerisStore } from '@/features/spotlight/store';
import { useAtlasSearchHotkey } from '@/components/hud/useAtlasSearchHotkey';
import { GalaxyCanvas } from './GalaxyCanvas';
import { Legend } from '@/components/hud/Legend';
import { SearchOverlay } from '@/components/hud/SearchOverlay';
import { SettingsPanel } from '@/components/hud/SettingsPanel';
import { HoverCard } from '@/components/panels/HoverCard';
import { CharacterPanel } from '@/components/panels/CharacterPanel';
import { BackArrow } from '@/components/ui/BackArrow';
import type { GeoCity } from '@/types/geo';

export type CitySkyContext = {
  cityId: string;
  cities: Pick<GeoCity, 'id' | 'name' | 'greekName'>[];
};

export function GalaxyView({
  characters,
  relations,
  sources,
  layout = 'galaxy',
  back,
  bakedLayout = null,
  cityContext,
  cameraIntro = false,
}: {
  characters: Character[];
  relations: Relation[];
  sources: Source[];
  /** 'compact' remaps generations to start at zero — for the small city skies. */
  layout?: 'galaxy' | 'compact';
  /** When set, a floating back affordance rides under the AtlasBar (city skies). */
  back?: { href: string; label: string };
  /** Build-time-baked galaxy positions; used instead of the ~5s runtime solve when
   *  the content signature matches. Only the full galaxy is baked — compact city
   *  skies are tiny, so they always solve at runtime. */
  bakedLayout?: BakedLayout | null;
  /** When set, panels surface cross-residence links for other city skies. */
  cityContext?: CitySkyContext;
  /** Drift-in overview on mount — used for city skies. */
  cameraIntro?: boolean;
}) {
  const positions = useMemo(() => {
    if (
      layout === 'galaxy' &&
      bakedLayout &&
      bakedLayout.signature === layoutSignature(characters, relations)
    ) {
      const map = new Map<string, Vec3>();
      for (const id in bakedLayout.positions) map.set(id, bakedLayout.positions[id]);
      return map;
    }
    return computePositions(characters, relations, { compact: layout === 'compact' });
  }, [characters, relations, layout, bakedLayout]);
  const spacingScale = useGalaxyStore((s) => s.spacingScale);
  const setDiving = useGalaxyStore((s) => s.setDiving);
  const setSearchOpen = useGalaxyStore((s) => s.setSearchOpen);

  const scaledPositions = useMemo(() => {
    if (spacingScale === 1.0) return positions;
    const scaled = new Map<string, typeof positions extends Map<string, infer V> ? V : never>();
    for (const [id, [x, y, z]] of positions) {
      scaled.set(id, [x * spacingScale, y * spacingScale, z * spacingScale]);
    }
    return scaled;
  }, [positions, spacingScale]);

  useAtlasSearchHotkey();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const store = useGalaxyStore.getState();
      if (store.searchOpen || store.settingsOpen) return;
      store.select(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    setDiving(false);
  }, [setDiving]);

  useEffect(() => {
    // Debug/testing handle (used by automated UI checks).
    (window as unknown as { __icarus?: unknown }).__icarus = { store: useGalaxyStore };
  }, []);

  useEffect(() => {
    // ?fly=<id> — the Ephemeris (and any shared link) lands here: select the
    // star so the CameraRig flies to it, then strip the param so refreshes
    // and later navigation don't re-fly.
    const params = new URLSearchParams(window.location.search);
    const fly = params.get('fly');
    if (!fly || !positions.has(fly)) return;
    useGalaxyStore.getState().select(fly);
    params.delete('fly');
    const query = params.toString();
    window.history.replaceState(
      null,
      '',
      query ? `${window.location.pathname}?${query}` : window.location.pathname,
    );
  }, [positions]);

  const ephemerisPick = useEphemerisStore((s) => s.pick);
  const proemHandled = useRef(false);
  useEffect(() => {
    // ?proem=1 — begin the day's telling once the pick and the sky are ready.
    // Full-galaxy only; the city skies never stage the proem.
    if (proemHandled.current || layout !== 'galaxy') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('proem') !== '1') {
      proemHandled.current = true;
      return;
    }
    if (!ephemerisPick || !positions.has(ephemerisPick.id)) return;
    proemHandled.current = true;
    // The riddle gates the stage (docs/EPHEMERIS_PLAN.md §11): an unrevealed
    // day opens the Sphinx instead of a proem that would name the star in
    // its first beat.
    if (localStorage.getItem('ephemeris-riddle') !== ephemerisPick.isoDate) {
      useEphemerisStore.getState().setRiddleOpen(true);
    } else {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        useGalaxyStore.getState().select(ephemerisPick.id);
      }
      useEphemerisStore.getState().startProem();
    }
    params.delete('proem');
    const query = params.toString();
    window.history.replaceState(
      null,
      '',
      query ? `${window.location.pathname}?${query}` : window.location.pathname,
    );
  }, [ephemerisPick, positions, layout]);

  return (
    <div className="fixed inset-0">
      <GalaxyCanvas
        characters={characters}
        relations={relations}
        positions={scaledPositions}
        cameraIntro={cameraIntro}
        ephemerisBeacon={layout === 'galaxy'}
      />
      {back && (
        <div className="pointer-events-auto fixed left-4 top-[4.25rem] z-20 sm:left-6">
          <BackArrow href={back.href} label={back.label} />
        </div>
      )}
      <Legend />
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        aria-label="Search the galaxy"
        className="pointer-events-auto fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] right-3.5 z-30 grid h-11 w-11 place-items-center rounded-full border border-glass-border bg-glass text-aether-muted shadow-[0_10px_30px_rgba(5,2,15,0.55),0_0_18px_rgba(124,77,255,0.1)] backdrop-blur-xl transition-colors active:border-nebula-soft/60 active:text-nebula-soft sm:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
      </button>
      <HoverCard characters={characters} relations={relations} cityContext={cityContext} />
      <CharacterPanel
        characters={characters}
        relations={relations}
        sources={sources}
        cityContext={cityContext}
      />
      <SettingsPanel sources={sources} starCount={characters.length} />
      <SearchOverlay characters={characters} />
    </div>
  );
}
