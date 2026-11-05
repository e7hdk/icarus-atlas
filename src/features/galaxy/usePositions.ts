'use client';

import { useMemo } from 'react';
import type { BakedLayout } from '@/features/characters/load';
import type { Relation, SkyCharacter } from '@/types/character';
import { computePositions, type Vec3 } from './layout';
import { layoutSignature } from './layoutSignature';
import { useGalaxyStore } from './store';

/** Where every star stands, scaled by the spacing setting: the baked layout when
 *  its signature still matches the data, else the ~5 s runtime solve. 'compact'
 *  remaps generations to start at zero, for the small city skies, which are never
 *  baked. Shared by the galaxy and the readings of the sky. */
export function useGalaxyPositions(
  characters: SkyCharacter[],
  relations: Relation[],
  bakedLayout: BakedLayout | null,
  layout: 'galaxy' | 'compact' = 'galaxy',
): Map<string, Vec3> {
  const positions = useMemo(() => {
    if (layout === 'galaxy' && bakedLayout && bakedLayout.signature === layoutSignature(characters, relations)) {
      const map = new Map<string, Vec3>();
      for (const id in bakedLayout.positions) map.set(id, bakedLayout.positions[id]);
      return map;
    }
    return computePositions(characters, relations, { compact: layout === 'compact' });
  }, [characters, relations, layout, bakedLayout]);
  const spacingScale = useGalaxyStore((s) => s.spacingScale);
  return useMemo(() => {
    if (spacingScale === 1.0) return positions;
    const scaled = new Map<string, Vec3>();
    for (const [id, [x, y, z]] of positions) scaled.set(id, [x * spacingScale, y * spacingScale, z * spacingScale]);
    return scaled;
  }, [positions, spacingScale]);
}
