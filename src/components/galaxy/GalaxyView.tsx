'use client';

import { useEffect, useMemo } from 'react';
import type { Character, Relation, Source } from '@/types/character';
import { computePositions } from '@/features/galaxy/layout';
import { useGalaxyStore } from '@/features/galaxy/store';
import { GalaxyCanvas } from './GalaxyCanvas';
import { TopBar } from '@/components/hud/TopBar';
import { Legend } from '@/components/hud/Legend';
import { HoverCard } from '@/components/panels/HoverCard';
import { CharacterPanel } from '@/components/panels/CharacterPanel';

export function GalaxyView({
  characters,
  relations,
  sources,
}: {
  characters: Character[];
  relations: Relation[];
  sources: Source[];
}) {
  const positions = useMemo(() => computePositions(characters), [characters]);
  const select = useGalaxyStore((s) => s.select);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') select(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [select]);

  useEffect(() => {
    // Debug/testing handle (used by automated UI checks).
    (window as unknown as { __icarus?: unknown }).__icarus = { store: useGalaxyStore };
  }, []);

  return (
    <div className="fixed inset-0">
      <GalaxyCanvas characters={characters} relations={relations} positions={positions} />
      <TopBar />
      <Legend />
      <HoverCard characters={characters} relations={relations} />
      <CharacterPanel characters={characters} relations={relations} sources={sources} />
    </div>
  );
}
