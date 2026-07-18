'use client';

import { useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Vec3 } from '@/features/galaxy/layout';
import { weekContextFor } from '@/features/spotlight/weeks';
import { useEphemerisStore } from '@/features/spotlight/store';

/** The constellation of the week (docs/EPHEMERIS_PLAN.md §5): the week's cast
 *  drawn into the sky in day order — an accented dashed line, small node
 *  stars, and its own floating title so a curious visitor can learn what the
 *  figure IS (sixth/seventh UX reviews). Clicking the title opens the
 *  Ephemeris card, which explains the week and doors into the saga. Hidden
 *  while the Proem plays and absent from the city skies. */
export function WeekConstellation({ positions }: { positions: Map<string, Vec3> }) {
  const data = useEphemerisStore((s) => s.data);
  const pick = useEphemerisStore((s) => s.pick);
  const proemActive = useEphemerisStore((s) => s.proemActive);
  const setCardOpen = useEphemerisStore((s) => s.setCardOpen);
  const setRiddleOpen = useEphemerisStore((s) => s.setRiddleOpen);

  const constellation = useMemo(() => {
    if (!data || !pick) return null;
    const context = weekContextFor(data, pick.isoDate);
    if (!context) return null;
    const cast = context.saga.cast.slice(0, 7);
    const resolved = cast
      .map((id) => positions.get(id))
      .filter((position): position is Vec3 => Boolean(position));
    if (resolved.length < 2) return null;
    const centroid = resolved
      .reduce(
        (sum, [x, y, z]) => [sum[0] + x, sum[1] + y, sum[2] + z] as Vec3,
        [0, 0, 0] as Vec3,
      )
      .map((value) => value / resolved.length) as Vec3;
    const topY = Math.max(...resolved.map(([, y]) => y));
    return {
      points: resolved,
      nodes: new Float32Array(resolved.flat()),
      title: context.saga.title,
      labelPosition: [centroid[0], topY + 3.2, centroid[2]] as Vec3,
    };
  }, [data, pick, positions]);

  if (!constellation || proemActive) return null;

  return (
    <group>
      <Line
        points={constellation.points}
        color="#c084fc"
        lineWidth={1.5}
        dashed
        dashSize={1.4}
        gapSize={0.9}
        transparent
        opacity={0.32}
        renderOrder={2}
      />
      <points renderOrder={2}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[constellation.nodes, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.85}
          sizeAttenuation
          color="#e9d5ff"
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <Html
        position={constellation.labelPosition}
        center
        distanceFactor={34}
        className="pointer-events-none select-none"
        zIndexRange={[10, 0]}
      >
        <button
          type="button"
          onClick={() => {
            // An unrevealed day routes through the Sphinx — the card would
            // name today's star one line down (docs/EPHEMERIS_PLAN.md §11).
            if (pick && localStorage.getItem('ephemeris-riddle') !== pick.isoDate) {
              setRiddleOpen(true);
              return;
            }
            setCardOpen(true);
          }}
          className="pointer-events-auto block cursor-pointer whitespace-nowrap text-center transition-opacity hover:opacity-100"
          style={{ opacity: 0.85 }}
        >
          <span className="block font-display text-[8px] uppercase tracking-[0.3em] text-aether-faint">
            Constellation of the week
          </span>
          <span className="mt-0.5 block font-display text-[12px] uppercase tracking-[0.2em] text-nebula-soft [text-shadow:0_0_12px_rgba(192,132,252,0.45)]">
            {constellation.title}
          </span>
        </button>
      </Html>
    </group>
  );
}
