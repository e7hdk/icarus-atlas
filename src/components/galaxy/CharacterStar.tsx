'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Character, CharacterType } from '@/types/character';
import { TYPE_GLOW, IRIDESCENT_BASE_HUE } from '@/types/character';
import { hashString, type Vec3 } from '@/features/galaxy/layout';
import { useGalaxyStore } from '@/features/galaxy/store';

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

const PULSE: Record<'slow' | 'steady' | 'quick' | 'irregular', { speed: number; amp: number }> = {
  slow: { speed: 0.7, amp: 0.1 },
  steady: { speed: 1.4, amp: 0.06 },
  quick: { speed: 3.2, amp: 0.1 },
  irregular: { speed: 2.1, amp: 0.12 },
};

/** Iridescent (Muse) shimmer: a slow, seamless hue cycle. Hue wraps 360°→0° with
 *  no seam, so the loop is flawless; the rate is gentle (full spectrum ~17s). */
const SHIMMER_SPEED = 0.06; // hue revolutions per second
const SHIMMER_SAT = 0.82;
const SHIMMER_LIGHT = 0.62;

let sharedGlowTexture: THREE.CanvasTexture | null = null;

/** Soft radial halo texture, generated once per session and tinted per star. */
function glowTexture(): THREE.CanvasTexture {
  if (sharedGlowTexture) return sharedGlowTexture;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,0.85)');
  gradient.addColorStop(0.25, 'rgba(255,255,255,0.28)');
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.07)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  sharedGlowTexture = new THREE.CanvasTexture(canvas);
  return sharedGlowTexture;
}

export function CharacterStar({ character, position }: { character: Character; position: Vec3 }) {
  const pulseGroup = useRef<THREE.Group>(null);
  const coreMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const glowMaterial = useRef<THREE.SpriteMaterial>(null);
  const glow = TYPE_GLOW[character.type];
  const size = SIZE[character.type];
  const pulse = PULSE[glow.pulse];

  const hovered = useGalaxyStore((s) => s.hoveredId === character.id);
  const selected = useGalaxyStore((s) => s.selectedId === character.id);
  const lens = useGalaxyStore((s) => s.lens);
  const setHovered = useGalaxyStore((s) => s.setHovered);
  const select = useGalaxyStore((s) => s.select);
  const attested =
    lens === 'consensus' ||
    [...character.summary, ...character.story].some((entry) => entry.sources.includes(lens));

  // The nine Muses carry the "iridescent" tag: a seamless rainbow hue-cycle.
  // (undefined for every other star — the `!== undefined` checks below also
  // narrow baseHue to a number for TypeScript.)
  const baseHue = IRIDESCENT_BASE_HUE[character.id];
  const baseColor = useMemo(() => new THREE.Color(glow.color), [glow.color]);
  // Scratch colour mutated each frame for Muses (avoids per-frame allocation).
  const shimmerColor = useMemo(() => new THREE.Color(), []);
  // A representative static tint for the lens-independent bits (label, ring,
  // initial halo) so they read as "a Muse" without per-frame React churn.
  const displayColor = useMemo(
    () =>
      baseHue !== undefined
        ? `#${new THREE.Color().setHSL(baseHue, SHIMMER_SAT, SHIMMER_LIGHT).getHexString()}`
        : glow.color,
    [baseHue, glow.color],
  );
  const phase = useMemo(() => (hashString(character.id) % 6283) / 1000, [character.id]);
  const texture = useMemo(() => glowTexture(), []);

  useFrame(({ clock }) => {
    if (!pulseGroup.current || !coreMaterial.current) return;
    const t = clock.elapsedTime;
    let osc = Math.sin(t * pulse.speed + phase);
    if (glow.pulse === 'irregular') {
      osc = osc * 0.6 + Math.sin(t * pulse.speed * 2.7 + phase * 2) * 0.4;
    }
    const emphasis = hovered || selected ? 1.45 : 1;
    const target = emphasis * (1 + osc * pulse.amp);
    const current = pulseGroup.current.scale.x;
    pulseGroup.current.scale.setScalar(THREE.MathUtils.lerp(current, target, 0.12));
    const brightness = ((hovered || selected ? 2.7 : 1.85) + osc * 0.35) * (attested ? 1 : 0.28);
    if (baseHue !== undefined) {
      // Seamless hue cycle (wraps at 1.0 → 0.0 with no discontinuity).
      const hue = (baseHue + t * SHIMMER_SPEED) % 1;
      shimmerColor.setHSL(hue, SHIMMER_SAT, SHIMMER_LIGHT);
      coreMaterial.current.color.copy(shimmerColor).multiplyScalar(brightness);
      if (glowMaterial.current) glowMaterial.current.color.copy(shimmerColor);
    } else {
      coreMaterial.current.color.copy(baseColor).multiplyScalar(brightness);
    }
  });

  return (
    <group position={position}>
      <group ref={pulseGroup}>
        {/* Invisible oversized hit volume — fingers are not cursors. The
            separation floor (3.6 world units) keeps neighbours unambiguous. */}
        <mesh
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(character.id);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(null);
            document.body.style.cursor = 'auto';
          }}
          onClick={(e) => {
            e.stopPropagation();
            select(character.id);
          }}
        >
          <sphereGeometry args={[Math.max(size * 3, 1.5), 12, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[size, 24, 24]} />
          <meshBasicMaterial ref={coreMaterial} toneMapped={false} transparent opacity={attested ? 1 : 0.45} />
        </mesh>
        <sprite scale={[size * 7, size * 7, 1]}>
          <spriteMaterial
            ref={glowMaterial}
            map={texture}
            color={displayColor}
            blending={THREE.AdditiveBlending}
            opacity={attested ? (selected ? 0.7 : hovered ? 0.85 : 0.55) : hovered ? 0.3 : 0.14}
            depthWrite={false}
            transparent
          />
        </sprite>
        {selected && (
          <Billboard>
            <mesh>
              <ringGeometry args={[size * 1.55, size * 1.68, 64]} />
              <meshBasicMaterial
                color={displayColor}
                toneMapped={false}
                transparent
                opacity={0.85}
                side={THREE.DoubleSide}
              />
            </mesh>
          </Billboard>
        )}
      </group>
      {!selected && (
        <Html
          position={[0, -size - 1.2, 0]}
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
      )}
    </group>
  );
}
