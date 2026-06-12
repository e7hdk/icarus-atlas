'use client';

import { useEffect, useMemo } from 'react';
import type { Character, Relation, Source } from '@/types/character';
import { computePositions } from '@/features/galaxy/layout';
import { useGalaxyStore } from '@/features/galaxy/store';
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
}) {
  const positions = useMemo(
    () => computePositions(characters, relations, { compact: layout === 'compact' }),
    [characters, relations, layout],
  );
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const store = useGalaxyStore.getState();
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        store.setSearchOpen(!store.searchOpen);
        return;
      }
      if (event.key === 'Escape') {
        if (store.searchOpen) store.setSearchOpen(false);
        else if (store.settingsOpen) store.setSettingsOpen(false);
        else store.select(null);
      }
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
      <SettingsPanel sources={sources} />
      <SearchOverlay characters={characters} />
    </div>
  );
}
