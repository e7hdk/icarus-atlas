'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { DOME_VERT, DOME_FRAG } from './shaders/nebula';

/** Inward-facing gradient dome (radiance ~0.03-0.06): kills the flat-void
 *  background and gives the vignette and grain something to grip.
 *  Radius 300 stays inside camera far=500 at maxDistance=190 (190+300 < 500). */
export function BackgroundDome() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: DOME_VERT,
        fragmentShader: DOME_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uBottom: { value: new THREE.Color('#05020f') },
          uTop: { value: new THREE.Color('#10082e') },
        },
      }),
    [],
  );

  return (
    <mesh material={material} renderOrder={-4} frustumCulled={false}>
      <sphereGeometry args={[300, 32, 24]} />
    </mesh>
  );
}
