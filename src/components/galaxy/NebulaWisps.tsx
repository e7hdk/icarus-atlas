'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { hashString, mulberry32, sampleBandPoint } from '@/features/galaxy/layout';
import { clusterTint, BACKDROP_TINTS } from './palette';
import { getNebulaAtlas } from './nebulaAtlas';
import { BILLBOARD_VERT, WISP_FRAG } from './shaders/nebula';

/** Additive nebula wisps — one InstancedMesh, one draw call.
 *  In-volume wisps live inside the same cluster bands as the character stars
 *  (tinted per region); a handful of huge backdrop wisps sit on a far shell so
 *  every orbit angle has nebula behind it. */
const IN_VOLUME: [cluster: string, count: number][] = [
  ['core', 10],
  ['titan-ring', 12],
  ['olympian-band', 14],
  ['chthonic', 10],
  ['night-court', 12],
  ['mortal-arm', 8],
];
const BACKDROP_COUNT = 8;
const COUNT = IN_VOLUME.reduce((sum, [, n]) => sum + n, 0) + BACKDROP_COUNT;

export function NebulaWisps() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const gl = useThree((s) => s.gl);

  const { geometry, offsets } = useMemo(() => {
    const tints = new Float32Array(COUNT * 3);
    const scales = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);
    const tiles = new Float32Array(COUNT * 2);
    const alphas = new Float32Array(COUNT);
    const positions: [number, number, number][] = [];

    let i = 0;
    for (const [cluster, count] of IN_VOLUME) {
      const tint = clusterTint(cluster);
      for (let n = 0; n < count; n++) {
        const rng = mulberry32(hashString(`${cluster}:wisp:${n}`));
        positions.push(sampleBandPoint(cluster, rng, 1.4));
        tints.set([tint.r, tint.g, tint.b], i * 3);
        scales[i] = 8 + rng() * 10;
        phases[i] = rng() * Math.PI * 2;
        tiles.set([rng(), rng()], i * 2);
        alphas[i] = 0.08 + rng() * 0.1;
        i += 1;
      }
    }
    for (let n = 0; n < BACKDROP_COUNT; n++) {
      const rng = mulberry32(hashString(`backdrop:wisp:${n}`));
      const u = rng() * 1.4 - 0.7; // bias toward the galaxy plane
      const phi = rng() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const radius = 100 + rng() * 50;
      positions.push([s * Math.cos(phi) * radius, u * radius, s * Math.sin(phi) * radius]);
      const tint = BACKDROP_TINTS[n % BACKDROP_TINTS.length];
      tints.set([tint.r, tint.g, tint.b], i * 3);
      scales[i] = 90 + rng() * 60;
      phases[i] = rng() * Math.PI * 2;
      tiles.set([rng(), rng()], i * 2);
      alphas[i] = 0.1 + rng() * 0.08;
      i += 1;
    }

    const geo = new THREE.PlaneGeometry(1, 1);
    geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tints, 3));
    geo.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 1));
    geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));
    geo.setAttribute('aTile', new THREE.InstancedBufferAttribute(tiles, 2));
    geo.setAttribute('aAlpha', new THREE.InstancedBufferAttribute(alphas, 1));

    return { geometry: geo, offsets: positions };
  }, []);

  const uniforms = useMemo(
    () => ({
      uAtlas: { value: null as THREE.Texture | null },
      uTime: { value: 0 },
      uGain: { value: 0.65 }, // visible wispy structure, still below a wash
      uSpin: { value: 0.015 },
    }),
    [],
  );

  useLayoutEffect(() => {
    const instanced = mesh.current;
    const material = materialRef.current;
    if (!instanced || !material) return;
    material.uniforms.uAtlas.value = getNebulaAtlas(gl);
    const m = new THREE.Matrix4();
    offsets.forEach(([x, y, z], idx) => {
      m.makeTranslation(x, y, z);
      instanced.setMatrixAt(idx, m);
    });
    instanced.instanceMatrix.needsUpdate = true;
  }, [gl, offsets]);

  useFrame(({ clock }) => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, COUNT]}
      geometry={geometry}
      frustumCulled={false}
      renderOrder={1}
    >
      <shaderMaterial
        ref={materialRef}
        vertexShader={BILLBOARD_VERT}
        fragmentShader={WISP_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}
