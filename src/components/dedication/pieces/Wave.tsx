'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { pieceNumber, type StagePiece } from '@/features/dedication/director';
import { stage } from '@/features/dedication/stage';
import type { Dedication } from '@/features/galaxy/dedication';
import type { Vec3 } from '@/features/galaxy/layout';

/** Rings of light that run outward from the piece's star across the plane of
 *  the disc, as the stars catch behind them: the dawn's front, made visible.
 *  `over`: seconds the first ring takes to reach the farthest star, the same
 *  the score gives the stars to kindle in. */

const WAVE_VERT = /* glsl */ `
varying vec2 vP;
void main() {
  vP = position.xy * 2.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const WAVE_FRAG = /* glsl */ `
precision highp float;
varying vec2 vP;
uniform float uFront; // the first ring's radius, 1 at the farthest star
uniform float uGain;
uniform vec3 uFrom;
uniform vec3 uTo;
void main() {
  float r = length(vP);
  float a = atan(vP.y, vP.x);
  float light = 0.0;
  for (int k = 0; k < 3; k++) {
    float radius = uFront - float(k) * 0.09;
    if (radius > 0.0 && radius < 1.0) {
      float width = 0.003 + 0.006 * radius;
      light += (1.0 - 0.33 * float(k)) * exp(-pow((r - radius) / width, 2.0)) * pow(1.0 - radius, 1.2);
    }
  }
  vec3 tint = mix(uFrom, uTo, 0.5 + 0.5 * sin(a * 2.0 + 0.8));
  gl_FragColor = vec4(tint * light * uGain, 1.0);
}
`;

export function Wave({ piece, positions, dedication }: { piece: StagePiece; positions: Map<string, Vec3>; dedication: Dedication }) {
  const mesh = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.ShaderMaterial>(null);
  const over = pieceNumber(piece, 'over', 11);

  const scene = useMemo(() => {
    const [x, y, z] = positions.get(piece.ids[0]) ?? [0, 0, 0];
    let reach = 1;
    for (const [px, py, pz] of positions.values()) reach = Math.max(reach, Math.hypot(px - x, py - y, pz - z));
    return { centre: new THREE.Vector3(x, y, z), reach };
  }, [piece, positions]);

  const args = useMemo(
    (): [THREE.ShaderMaterialParameters] => [
      {
        vertexShader: WAVE_VERT,
        fragmentShader: WAVE_FRAG,
        uniforms: { uFront: { value: 0 }, uGain: { value: 0 }, uFrom: { value: new THREE.Color(dedication.from) }, uTo: { value: new THREE.Color(dedication.to) } },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      },
    ],
    [dedication.from, dedication.to],
  );

  useFrame(() => {
    const plane = mesh.current;
    if (!plane || !light.current) return;
    const since = stage.time - piece.t;
    const shown = stage.active && since >= 0 && stage.time <= piece.until;
    plane.visible = shown;
    if (!shown) return;
    light.current.uniforms.uFront.value = since / over;
    light.current.uniforms.uGain.value = 0.85 * Math.min(1, since / 0.6);
  });

  return (
    <mesh ref={mesh} position={scene.centre} rotation={[-Math.PI / 2, 0, 0]} scale={scene.reach * 2} renderOrder={4} frustumCulled={false} visible={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial ref={light} args={args} />
    </mesh>
  );
}
