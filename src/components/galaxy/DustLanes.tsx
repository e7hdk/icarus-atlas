'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { hashString, mulberry32, sampleBandPoint } from '@/features/galaxy/layout';
import { getNebulaAtlas } from './nebulaAtlas';
import { BILLBOARD_VERT, DUST_FRAG } from './shaders/nebula';

/** Dark dust lanes — one InstancedMesh, NormalBlending: the only subtractive
 *  element in the scene. Dust that visibly deletes background light is how the
 *  eye verifies volume. Placed in the gaps between cluster bands, where the
 *  additive wisp density is near zero (wisps can't depth-interleave with us). */
const COUNT = 14;

export function DustLanes() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const gl = useThree((s) => s.gl);

  const { geometry, material, offsets } = useMemo(() => {
    const tints = new Float32Array(COUNT * 3); // unused by the dust shader, required by the shared vertex
    const scales = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);
    const tiles = new Float32Array(COUNT * 2);
    const alphas = new Float32Array(COUNT);
    const positions: [number, number, number][] = [];

    const place = (idx: number, x: number, y: number, z: number, rng: () => number) => {
      positions.push([x, y, z]);
      scales[idx] = 14 + rng() * 16;
      phases[idx] = rng() * Math.PI * 2; // static random orientation (uSpin = 0)
      tiles.set([rng(), rng()], idx * 2);
      alphas[idx] = 0.3 + rng() * 0.2;
    };

    let i = 0;
    // 5 in the core/titan gap.
    for (let n = 0; n < 5; n++, i++) {
      const rng = mulberry32(hashString(`dust:gap1:${n}`));
      const angle = rng() * Math.PI * 2;
      const radius = 15 + rng() * 2.5;
      place(i, Math.cos(angle) * radius, Math.sin(angle) * 2 + (rng() - 0.5) * 4, Math.sin(angle) * radius, rng);
    }
    // 5 hugging the olympian-band inner edge.
    for (let n = 0; n < 5; n++, i++) {
      const rng = mulberry32(hashString(`dust:gap2:${n}`));
      const angle = rng() * Math.PI * 2;
      const radius = 29 + rng() * 4;
      place(i, Math.cos(angle) * radius, 1 + Math.sin(angle + 0.5) * 4 + (rng() - 0.5) * 4, Math.sin(angle) * radius, rng);
    }
    // 4 across the night-court band.
    for (let n = 0; n < 4; n++, i++) {
      const rng = mulberry32(hashString(`dust:night:${n}`));
      const [x, y, z] = sampleBandPoint('night-court', rng, 0.5);
      place(i, x, y, z, rng);
    }

    const geo = new THREE.PlaneGeometry(1, 1);
    geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tints, 3));
    geo.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 1));
    geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));
    geo.setAttribute('aTile', new THREE.InstancedBufferAttribute(tiles, 2));
    geo.setAttribute('aAlpha', new THREE.InstancedBufferAttribute(alphas, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: BILLBOARD_VERT,
      fragmentShader: DUST_FRAG,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      uniforms: {
        uAtlas: { value: null },
        uTime: { value: 0 },
        uSpin: { value: 0 },
        uDust: { value: new THREE.Color('#0d0722') },
      },
    });
    return { geometry: geo, material: mat, offsets: positions };
  }, []);

  useLayoutEffect(() => {
    const instanced = mesh.current;
    if (!instanced) return;
    (instanced.material as THREE.ShaderMaterial).uniforms.uAtlas.value = getNebulaAtlas(gl);
    const m = new THREE.Matrix4();
    offsets.forEach(([x, y, z], idx) => {
      m.makeTranslation(x, y, z);
      instanced.setMatrixAt(idx, m);
    });
    instanced.instanceMatrix.needsUpdate = true;
  }, [gl, offsets]);

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, COUNT]}
      frustumCulled={false}
      renderOrder={0}
    />
  );
}
