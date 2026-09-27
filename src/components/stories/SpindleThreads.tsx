'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { LensId } from '@/types/character';
import { isStoryAttested, type SpindleNode } from '@/features/stories/spindle';
import type { SpindleThread } from '@/features/stories/threadedSpindle';

/** Sides of each thread's tube, and how faint a trickle runs. */
const RADIAL = 6;
const TRICKLE_ALPHA = 0.4;
/** A thread's opacity, and the share it keeps where the lens does not attest
 *  the story whose reach it flows in — the Spindle's own world-line values. */
const OPACITY = 0.6;
const DIM = 0.23;

const THREAD_VERT = /* glsl */ `
attribute vec3 aColor;
attribute float aLit;
attribute float aAlpha;
varying vec3 vColor;
varying float vLit;
varying float vAlpha;
#ifdef USE_FOG
  varying float vFogDepth;
#endif
void main() {
  vColor = aColor;
  vLit = aLit;
  vAlpha = aAlpha;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #ifdef USE_FOG
    vFogDepth = -mvPosition.z;
  #endif
}
`;

const THREAD_FRAG = /* glsl */ `
uniform float uOpacity;
uniform float uDim;
varying vec3 vColor;
varying float vLit;
varying float vAlpha;
#ifdef USE_FOG
  uniform vec3 fogColor;
  uniform float fogDensity;
  varying float vFogDepth;
#endif
void main() {
  gl_FragColor = vec4(vColor, uOpacity * vAlpha * mix(uDim, 1.0, vLit));
  #ifdef USE_FOG
    // Threads far down the corridor sink into the dark, so the eye reads depth.
    float fogFactor = clamp(1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth), 0.0, 1.0);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
    gl_FragColor.a *= (1.0 - fogFactor);
  #endif
}
`;

/** The sagas as threads spun on the spindle: one continuous glowing tube per
 *  saga, as thick as its myth is dense there, merged into a single mesh. A
 *  stretch of thread dims when the lens does not attest the story it flows
 *  from. Tubes are framed by the spindle itself — each ring faces out from the
 *  axis — so they never twist along the way. */
export function SpindleThreads({
  threads,
  nodeById,
  lens,
}: {
  threads: SpindleThread[];
  nodeById: Map<string, SpindleNode>;
  lens: LensId;
}) {
  const built = useMemo(() => {
    let rings = 0;
    let quads = 0;
    for (const thread of threads) {
      rings += thread.points.length;
      quads += Math.max(0, thread.points.length - 1) * RADIAL;
    }
    const position = new Float32Array(rings * RADIAL * 3);
    const color = new Float32Array(rings * RADIAL * 3);
    const lit = new Float32Array(rings * RADIAL).fill(1);
    const alpha = new Float32Array(rings * RADIAL);
    const index = new Uint32Array(quads * 6);
    const reachOf: string[] = [];
    const tint = new THREE.Color();
    const c = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const out = new THREE.Vector3();
    const binormal = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const v = new THREE.Vector3();

    let ring = 0;
    let ix = 0;
    for (const thread of threads) {
      tint.set(thread.color);
      const pts = thread.points;
      for (let i = 0; i < pts.length; i += 1) {
        const prev = pts[Math.max(0, i - 1)];
        const next = pts[Math.min(pts.length - 1, i + 1)];
        c.set(pts[i][0], pts[i][1], pts[i][2]);
        tangent.set(next[0] - prev[0], next[1] - prev[1], next[2] - prev[2]).normalize();
        out.set(c.x, 0, c.z).normalize();
        binormal.crossVectors(tangent, out).normalize();
        normal.crossVectors(binormal, tangent).normalize();
        const r = thread.radii[i];
        for (let j = 0; j < RADIAL; j += 1) {
          const phi = (j / RADIAL) * Math.PI * 2;
          v.copy(c)
            .addScaledVector(normal, Math.cos(phi) * r)
            .addScaledVector(binormal, Math.sin(phi) * r);
          const k = ring * RADIAL + j;
          position.set([v.x, v.y, v.z], k * 3);
          color.set([tint.r, tint.g, tint.b], k * 3);
          alpha[k] = thread.trickle[i] ? TRICKLE_ALPHA : 1;
        }
        reachOf.push(thread.reach[i]);
        if (i > 0) {
          const a = (ring - 1) * RADIAL;
          const b = ring * RADIAL;
          for (let j = 0; j < RADIAL; j += 1) {
            const j1 = (j + 1) % RADIAL;
            index.set([a + j, b + j, a + j1, a + j1, b + j, b + j1], ix);
            ix += 6;
          }
        }
        ring += 1;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
    geometry.setAttribute('aLit', new THREE.BufferAttribute(lit, 1).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    geometry.setIndex(new THREE.BufferAttribute(index, 1));
    const material = new THREE.ShaderMaterial({
      vertexShader: THREAD_VERT,
      fragmentShader: THREAD_FRAG,
      transparent: true,
      depthWrite: false,
      fog: true,
      uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), {
        uOpacity: { value: OPACITY },
        uDim: { value: DIM },
      }),
    });
    return { geometry, material, lit, reachOf };
  }, [threads]);

  // The lens rewrites the dimming through a ref, as the galaxy's StarsDriver
  // writes its buffers.
  const builtRef = useRef(built);
  useLayoutEffect(() => {
    builtRef.current = built;
  }, [built]);
  useEffect(
    () => () => {
      built.geometry.dispose();
      built.material.dispose();
    },
    [built],
  );

  useLayoutEffect(() => {
    const { geometry, lit, reachOf } = builtRef.current;
    for (let ring = 0; ring < reachOf.length; ring += 1) {
      const node = nodeById.get(reachOf[ring]);
      const value = !node || isStoryAttested(node, lens) ? 1 : 0;
      for (let j = 0; j < RADIAL; j += 1) lit[ring * RADIAL + j] = value;
    }
    (geometry.getAttribute('aLit') as THREE.BufferAttribute).needsUpdate = true;
  }, [lens, nodeById, built]);

  return <mesh geometry={built.geometry} material={built.material} renderOrder={1} raycast={() => null} />;
}
