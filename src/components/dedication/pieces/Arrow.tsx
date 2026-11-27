'use client';

import { useCallback, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { pieceNumber, type StagePiece } from '@/features/dedication/director';
import { stage } from '@/features/dedication/stage';
import type { Vec3 } from '@/features/galaxy/layout';
import { Sprites, ease, scatter, type SpriteBuffers } from './Sprites';

/** An arrow of light loosed from the piece's first star at its second: a head
 *  and the trail it leaves, flying an arc over the disc, and a ring that opens
 *  where it lands. `tone` 'gold' is bright and scatters sparks behind it;
 *  'lead' is dull and leaves little.
 *
 *  `loose`: seconds from the start at which it leaves the string (a point of
 *  light gathers at the bow until then). `flight`: seconds it flies. */

const PULSE_VERT = /* glsl */ `
varying vec2 vP;
void main() {
  vP = position.xy * 2.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const PULSE_FRAG = /* glsl */ `
precision highp float;
varying vec2 vP;
uniform float uRadius;
uniform float uWidth;
uniform float uGain;
uniform vec3 uColor;
void main() {
  float r = length(vP);
  float ring = exp(-pow((r - uRadius) / uWidth, 2.0));
  gl_FragColor = vec4(uColor * ring * uGain * smoothstep(1.0, 0.9, r), 1.0);
}
`;

const TRAIL = 56;

export function Arrow({ piece, positions }: { piece: StagePiece; positions: Map<string, Vec3> }) {
  const ring = useRef<THREE.Mesh>(null);
  const ringLight = useRef<THREE.ShaderMaterial>(null);
  const gold = piece.params?.tone !== 'lead';
  const loose = pieceNumber(piece, 'loose', 0.8);
  const flight = pieceNumber(piece, 'flight', 3);

  const scene = useMemo(() => {
    const from = new THREE.Vector3(...(positions.get(piece.ids[0]) ?? [0, 0, 0]));
    const to = new THREE.Vector3(...(positions.get(piece.ids[1]) ?? [0, 0, 0]));
    const along = to.clone().sub(from);
    const side = new THREE.Vector3().crossVectors(along, new THREE.Vector3(0, 1, 0)).normalize();
    const crest = from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, along.length() * 0.2, 0)).addScaledVector(side, along.length() * 0.07);
    const random = scatter(Math.round(from.x * 31 + to.z * 17));
    const jitter = new Float32Array(TRAIL * 3);
    for (let index = 0; index < jitter.length; index++) jitter[index] = random() - 0.5;
    return {
      from,
      to,
      curve: new THREE.QuadraticBezierCurve3(from, crest, to),
      jitter,
      head: new THREE.Color(gold ? '#fff3c4' : '#aab4c8'),
      tail: new THREE.Color(gold ? '#f7c873' : '#6b7488'),
    };
  }, [piece, positions, gold]);
  const point = useRef(new THREE.Vector3());

  const ringArgs = useMemo(
    (): [THREE.ShaderMaterialParameters] => [
      {
        vertexShader: PULSE_VERT,
        fragmentShader: PULSE_FRAG,
        uniforms: { uRadius: { value: 0 }, uWidth: { value: 0.05 }, uGain: { value: 0 }, uColor: { value: new THREE.Color(gold ? '#f7c873' : '#8a94a8') } },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      },
    ],
    [gold],
  );

  const write = useCallback(
    (buffers: SpriteBuffers): boolean => {
      const since = stage.time - piece.t;
      if (!stage.active || since < 0 || stage.time > piece.until) return false;
      const flown = (since - loose) / flight;
      const reach = gold ? 0.26 : 0.15;
      // It gathers speed off the string and does not slow before it lands.
      const head = flown <= 0 ? 0 : Math.min(1.4, flown) ** 1.7;
      let any = false;
      for (let index = 0; index < TRAIL; index++) {
        const back = index / (TRAIL - 1);
        const at = index * 3;
        const along = head - back * reach;
        const drawing = flown <= 0 && index === 0;
        if (!drawing && (flown <= 0 || along < 0 || along >= 1)) {
          buffers.size[index] = 0;
          buffers.color[at] = buffers.color[at + 1] = buffers.color[at + 2] = 0;
          continue;
        }
        const place = scene.curve.getPoint(Math.max(0, along), point.current);
        // Gold sheds sparks: the trail spreads as it falls behind.
        const spread = gold ? 2.6 * back : 0.5 * back;
        buffers.position[at] = place.x + scene.jitter[at] * spread;
        buffers.position[at + 1] = place.y + scene.jitter[at + 1] * spread;
        buffers.position[at + 2] = place.z + scene.jitter[at + 2] * spread;
        const light = drawing ? (gold ? 2.6 : 0.9) * ease(since / loose) : (gold ? 3 : 1.15) * (1 - back) ** 1.6;
        buffers.color[at] = (scene.head.r + (scene.tail.r - scene.head.r) * back) * light;
        buffers.color[at + 1] = (scene.head.g + (scene.tail.g - scene.head.g) * back) * light;
        buffers.color[at + 2] = (scene.head.b + (scene.tail.b - scene.head.b) * back) * light;
        buffers.size[index] = (gold ? 3.2 : 2.4) * (1 - 0.72 * back);
        any = true;
      }
      return any;
    },
    [piece, scene, gold, loose, flight],
  );

  // Where it lands, a ring opens and is gone.
  useFrame(({ camera }) => {
    const mesh = ring.current;
    if (!mesh || !ringLight.current) return;
    const landed = stage.time - piece.t - loose - flight;
    const lasts = gold ? 1.7 : 0.9;
    const shown = stage.active && landed >= 0 && landed <= lasts;
    mesh.visible = shown;
    if (!shown) return;
    mesh.position.copy(scene.to);
    mesh.quaternion.copy(camera.quaternion);
    mesh.scale.setScalar(gold ? 64 : 22);
    const opened = landed / lasts;
    ringLight.current.uniforms.uRadius.value = 0.08 + 0.86 * ease(opened) ** 0.7;
    ringLight.current.uniforms.uWidth.value = 0.02 + 0.03 * opened;
    ringLight.current.uniforms.uGain.value = (gold ? 2.4 : 0.6) * (1 - opened) ** 1.5;
  });

  return (
    <>
      <Sprites count={TRAIL} write={write} />
      <mesh ref={ring} renderOrder={6} frustumCulled={false} visible={false}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial ref={ringLight} args={ringArgs} />
      </mesh>
    </>
  );
}
