'use client';

import { useMemo, useRef, useSyncExternalStore } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vec3 } from '@/features/galaxy/layout';
import { TYPE_GLOW } from '@/types/character';
import { useEphemerisStore } from '@/features/spotlight/store';

/** Beacon of the star of the day (docs/EPHEMERIS_PLAN.md §5): one
 *  camera-facing ring that slowly swells and fades around the star, colored
 *  from the star's own TYPE_GLOW. A single additive mesh — no extra passes,
 *  no postprocessing changes; prefers-reduced-motion holds it steady. */
export function EphemerisBeacon({ positions }: { positions: Map<string, Vec3> }) {
  const pick = useEphemerisStore((s) => s.pick);
  const data = useEphemerisStore((s) => s.data);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const reducedMotion = useSyncExternalStore(
    (onStoreChange) => {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      media.addEventListener('change', onStoreChange);
      return () => media.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );

  const entry = useMemo(
    () =>
      pick && data
        ? (data.roster.find((candidate) => candidate.id === pick.id) ?? null)
        : null,
    [data, pick],
  );
  const color = useMemo(
    () => (entry ? new THREE.Color(TYPE_GLOW[entry.type].color) : null),
    [entry],
  );
  const position = pick ? positions.get(pick.id) : undefined;

  useFrame(({ camera, clock }) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;
    mesh.quaternion.copy(camera.quaternion);
    if (reducedMotion) {
      mesh.scale.setScalar(1.35);
      material.opacity = 0.4;
      return;
    }
    // A lighthouse breath: swell outward and fade, ~3s per beat.
    const phase = (clock.elapsedTime % 3.2) / 3.2;
    const eased = 1 - (1 - phase) * (1 - phase);
    mesh.scale.setScalar(1 + eased * 1.4);
    material.opacity = 0.5 * (1 - phase);
  });

  if (!position || !color) return null;

  return (
    <mesh ref={meshRef} position={position} renderOrder={2}>
      <ringGeometry args={[1.55, 1.8, 48]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
