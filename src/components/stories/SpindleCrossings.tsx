'use client';

import { memo, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { LensId } from '@/types/character';
import type { StoryCrossing } from '@/types/story';
import { isStoryAttested, type SpindleNode } from '@/features/stories/spindle';

/** Piecewise-linear curve — same recipe as world-lines, never overshoots. */
class PolylineCurve extends THREE.Curve<THREE.Vector3> {
  private pts: THREE.Vector3[];
  constructor(pts: THREE.Vector3[]) {
    super();
    this.pts = pts;
  }
  getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const pts = this.pts;
    if (pts.length === 1) return target.copy(pts[0]);
    const d = t * (pts.length - 1);
    const i = Math.min(Math.floor(d), pts.length - 2);
    return target.copy(pts[i]).lerp(pts[i + 1], d - i);
  }
}

function angleDelta(from: number, to: number): number {
  let delta = to - from;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  return delta;
}

/** Route a crossing along the inner wall — helical interpolation, never a bow
 *  through the open space at the axis. */
function wallFilamentPoints(
  pa: THREE.Vector3,
  pb: THREE.Vector3,
  radius: number,
): THREE.Vector3[] {
  const a0 = Math.atan2(pa.x, pa.z);
  const a1 = Math.atan2(pb.x, pb.z);
  const delta = angleDelta(a0, a1);
  const y0 = pa.y;
  const y1 = pb.y;
  const steps = Math.max(
    16,
    Math.ceil(Math.abs(delta) / 0.055) + Math.ceil(Math.abs(y0 - y1) / 10),
  );
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const y = y0 + (y1 - y0) * t;
    const a = a0 + delta * t;
    pts.push(new THREE.Vector3(radius * Math.sin(a), y, radius * Math.cos(a)));
  }
  return pts;
}

/** A crossing filament glows along its length with story A's color bleeding into
 *  story B's — a thread of fate that belongs to neither arm alone. It brightens
 *  to a hot core when either of its two myths is hovered or selected. */
const XING_VERT = /* glsl */ `
varying vec2 vUv;
#ifdef USE_FOG
  varying float vFogDepth;
#endif
void main() {
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #ifdef USE_FOG
    vFogDepth = -mvPosition.z;
  #endif
}
`;
const XING_FRAG = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uOpacity;
varying vec2 vUv;
#ifdef USE_FOG
  uniform float fogDensity;
  varying float vFogDepth;
#endif
void main() {
  // Gradient from A (uv.x=0) to B (uv.x=1); a soft golden core swells at the
  // midpoint so the knot reads as a tied ligament, not a flat wire.
  vec3 col = mix(uColorA, uColorB, smoothstep(0.0, 1.0, vUv.x));
  float core = 1.0 - smoothstep(0.0, 0.5, abs(vUv.x - 0.5));
  col = mix(col, vec3(1.0, 0.93, 0.72), core * 0.5);
  float op = uOpacity;
  #ifdef USE_FOG
    // Additive ligament: a distant tie simply adds less light and fades away.
    float fogFactor = clamp(1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth), 0.0, 1.0);
    op *= (1.0 - fogFactor);
  #endif
  gl_FragColor = vec4(col, op);
}
`;

/** A crossing is tied star-to-star: from one myth's spark to the other's, so the
 *  filament visibly leaves the glowing node (not a blank mid-thread point) — a
 *  clean fan of threads when one myth, like Aristaeus, ties to several arms. */
function starPair(a: SpindleNode, b: SpindleNode): [THREE.Vector3, THREE.Vector3] {
  return [
    new THREE.Vector3(a.pos[0], a.pos[1], a.pos[2]),
    new THREE.Vector3(b.pos[0], b.pos[1], b.pos[2]),
  ];
}

const Filament = memo(function Filament({
  a,
  b,
  radius,
  attested,
  emphasized,
}: {
  a: SpindleNode;
  b: SpindleNode;
  radius: number;
  attested: boolean;
  emphasized: boolean;
}) {
  const { geometry, material } = useMemo(() => {
    const [pa, pb] = starPair(a, b);
    const wallPts = wallFilamentPoints(pa, pb, radius);
    const curve = new PolylineCurve(wallPts);
    const geometry = new THREE.TubeGeometry(curve, Math.max(24, wallPts.length * 2), 0.12, 6, false);
    const material = new THREE.ShaderMaterial({
      vertexShader: XING_VERT,
      fragmentShader: XING_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: true,
      uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), {
        uColorA: { value: new THREE.Color(a.color) },
        uColorB: { value: new THREE.Color(b.color) },
        uOpacity: { value: 0.5 },
      }),
    });
    return { geometry, material };
  }, [a, b, radius]);

  // Drive opacity from a frame callback (not during render) so we never mutate
  // the memoized material in render — the target reflects the latest focus/lens.
  // Crossings are now focus-gated: near-invisible until one of their two myths
  // is hovered/selected, so they read as "select a myth to reveal its ties"
  // instead of stray wires shooting across the tube. (The emergent, axis-true
  // crossing — world-lines that actually meet on a shared BC-year ring — replaces
  // these drawn filaments once the chronology axis lands; see docs/CHRONOLOGY.md.)
  const target = emphasized ? 0.92 : attested ? 0.05 : 0.0;
  useFrame(() => {
    const u = material.uniforms.uOpacity;
    u.value += (target - u.value) * 0.2; // ease for a soft fade-in/out
  });

  return <mesh geometry={geometry} material={material} renderOrder={emphasized ? 4 : 2} raycast={() => null} />;
});

/** All curated crossings as glowing knots tying the saga-arms together. A
 *  crossing is a sourced fact, so it dims like a world-line when the active lens
 *  does not attest it, and lights up when either of its myths is in focus. */
export function SpindleCrossings({
  crossings,
  byId,
  radius,
  lens,
  hoveredId,
  selectedId,
}: {
  crossings: StoryCrossing[];
  byId: Map<string, SpindleNode>;
  radius: number;
  lens: LensId;
  hoveredId: string | null;
  selectedId: string | null;
}) {
  return (
    <group>
      {crossings.map((x, i) => {
        const a = byId.get(x.a);
        const b = byId.get(x.b);
        if (!a || !b) return null;
        const attested = lens === 'consensus' || x.sources.includes(lens);
        const focus = hoveredId === x.a || hoveredId === x.b || selectedId === x.a || selectedId === x.b;
        return (
          <Filament
            key={`${x.a}-${x.b}-${i}`}
            a={a}
            b={b}
            radius={radius}
            attested={attested && (isStoryAttested(a, lens) || isStoryAttested(b, lens))}
            emphasized={focus}
          />
        );
      })}
    </group>
  );
}
