'use client';

import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Character, CharacterType } from '@/types/character';
import { TYPE_GLOW, IRIDESCENT_BASE_HUE } from '@/types/character';
import type { Vec3 } from '@/features/galaxy/layout';
import { useGalaxyStore } from '@/features/galaxy/store';

/** Star sizes per type — must match SIZE in StarsDriver (label sits below the core). */
const SIZE: Record<CharacterType, number> = {
  primordial: 0.85,
  titan: 0.78,
  olympian: 0.95,
  god: 0.8,
  hero: 0.7,
  mortal: 0.6,
  nymph: 0.65,
  creature: 0.75,
};

const SHIMMER_SAT = 0.82;
const SHIMMER_LIGHT = 0.62;

/** The floating name label for one star. Extracted verbatim from the old
 *  CharacterStar so label behaviour is unchanged while the star visuals move to
 *  GPU instancing (StarsDriver). Optimising these to GPU SDF text is a later
 *  phase; today they remain drei <Html> with the same hover/lens behaviour. */
export function StarLabel({ character, position }: { character: Character; position: Vec3 }) {
  const glow = TYPE_GLOW[character.type];
  const size = SIZE[character.type];
  const baseHue = IRIDESCENT_BASE_HUE[character.id];
  const displayColor = useMemo(
    () =>
      baseHue !== undefined
        ? `#${new THREE.Color().setHSL(baseHue, SHIMMER_SAT, SHIMMER_LIGHT).getHexString()}`
        : glow.color,
    [baseHue, glow.color],
  );

  const hovered = useGalaxyStore((s) => s.hoveredId === character.id);
  const selected = useGalaxyStore((s) => s.selectedId === character.id);
  const lens = useGalaxyStore((s) => s.lens);
  // Two short-circuiting scans, memoized per lens — no combined-array allocation.
  const attested = useMemo(
    () =>
      lens === 'consensus' ||
      character.summary.some((e) => e.sources.includes(lens)) ||
      character.story.some((e) => e.sources.includes(lens)),
    [lens, character],
  );

  if (selected) return null;

  return (
    <Html
      position={[position[0], position[1] - size - 1.2, position[2]]}
      center
      distanceFactor={28}
      className="pointer-events-none select-none"
      zIndexRange={[10, 0]}
    >
      <div
        className="whitespace-nowrap font-display text-[11px] uppercase tracking-[0.22em]"
        style={{
          color: hovered ? displayColor : attested ? 'rgb(241 245 249 / 0.62)' : 'rgb(241 245 249 / 0.25)',
        }}
      >
        {character.name}
      </div>
    </Html>
  );
}
