'use client';

import { useEffect, useMemo } from 'react';
import type { Character, Relation, Source } from '@/types/character';
import { computePositions, type Vec3 } from '@/features/galaxy/layout';
import { layoutSignature } from '@/features/galaxy/layoutSignature';
import type { BakedLayout } from '@/features/characters/load';
import { useGalaxyStore } from '@/features/galaxy/store';
import { useAtlasSearchHotkey } from '@/components/hud/useAtlasSearchHotkey';
import { GalaxyCanvas } from './GalaxyCanvas';
import { TopBar } from '@/components/hud/TopBar';
import { Legend } from '@/components/hud/Legend';
import { SearchOverlay } from '@/components/hud/SearchOverlay';
import { SettingsPanel } from '@/components/hud/SettingsPanel';
import { HoverCard } from '@/components/panels/HoverCard';
import { CharacterPanel } from '@/components/panels/CharacterPanel';
import type { MainTab } from '@/components/hud/MainNav';

export function GalaxyView({
  characters,
  relations,
  sources,
  layout = 'galaxy',
  activeMainTab = 'galaxy',
  back,
  bakedLayout = null,
}: {
  characters: Character[];
  relations: Relation[];
  sources: Source[];
  /** 'compact' remaps generations to start at zero — for the small city skies. */
  layout?: 'galaxy' | 'compact';
  /** City skies belong to Lands even though they reuse the galaxy renderer. */
  activeMainTab?: MainTab;
  /** When set, the top bar shows this back affordance in place of the brand on mobile. */
  back?: { href: string; label: string };
  /** Build-time-baked galaxy positions; used instead of the ~5s runtime solve when
   *  the content signature matches. Only the full galaxy is baked — compact city
   *  skies are tiny, so they always solve at runtime. */
  bakedLayout?: BakedLayout | null;
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

  return (
    <div className="fixed inset-0">
      <GalaxyCanvas characters={characters} relations={relations} positions={scaledPositions} />
      <TopBar active={activeMainTab} back={back} />
      <Legend />
      <HoverCard characters={characters} relations={relations} />
      <CharacterPanel characters={characters} relations={relations} sources={sources} />
      <SettingsPanel sources={sources} starCount={characters.length} />
      <SearchOverlay characters={characters} />
    </div>
  );
}
