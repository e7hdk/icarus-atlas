'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { pieceNumber, type StagePiece } from '@/features/dedication/director';
import { stage } from '@/features/dedication/stage';
import type { Dedication } from '@/features/galaxy/dedication';
import { ease } from './Sprites';

/** Two lights in a sky gone wholly dark: two eyes, each iris a ring of light
 *  round a depth that gives none back, as a black hole is seen. They open as
 *  eyes open, a line of light that parts into an almond, and now and then they
 *  close for an instant. They hang before the camera, not in the galaxy:
 *  wherever the camera turns, they are still there. */

const EYE_VERT = /* glsl */ `
varying vec2 vP;
void main() {
  vP = position.xy * 2.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const EYE_FRAG = /* glsl */ `
precision highp float;
varying vec2 vP;
uniform float uTime;
uniform float uOpen;  // 0 shut, 1 wide
uniform float uGain;
uniform float uTurn;  // which way round the ring its colours run
uniform vec2 uGaze;   // where the iris sits within the eye
uniform vec3 uFrom;
uniform vec3 uTo;

const float RING = 0.38;

float hash(float n) { return fract(sin(n) * 43758.5453123); }
float noise(float x) {
  float i = floor(x);
  float f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(hash(i), hash(i + 1.0), f);
}

void main() {
  // The lids: an almond, closed at its corners, that the opening widens.
  float lid = uOpen * 0.5 * pow(max(0.0, cos(vP.x * 1.52)), 0.7);
  float awake = step(0.004, uOpen);
  float within = smoothstep(lid + 0.03, lid - 0.03, abs(vP.y)) * awake;

  // The iris: a ring of light round a depth that gives none back, as a black
  // hole is seen, its lower arc the brighter.
  vec2 q = vP - uGaze;
  float r = length(q);
  float a = atan(q.y, q.x);
  float ring = exp(-pow((r - RING) / 0.034, 2.0));
  float echo = 0.22 * exp(-pow((r - RING * 0.78) / 0.05, 2.0));
  float spill = r > RING ? 0.2 * exp(-(r - RING) / 0.12) : 0.0;
  float lean = 0.64 + 0.36 * cos(a + 1.5708);
  float shimmer = 0.9 + 0.1 * noise(a * 5.0 + uTime * 0.5);
  float iris = (2.8 * ring + echo + spill) * lean * shimmer;

  // The white of the eye is the faintest light, gathered round the iris; the
  // edge of each lid catches more, and a little spills past it into the dark.
  float white = 0.012 + 0.03 * exp(-r * 2.2);
  float corners = smoothstep(1.0, 0.5, abs(vP.x));
  float edge = 0.42 * exp(-pow((abs(vP.y) - lid) / 0.02, 2.0)) * corners * awake;
  float aura = (1.0 - within) * 0.09 * exp(-max(0.0, abs(vP.y) - lid) / 0.11) * smoothstep(1.0, 0.7, abs(vP.x)) * awake;

  vec3 tint = mix(uFrom, uTo, 0.5 + 0.5 * sin(a * uTurn + 0.6 + uTime * 0.12));
  vec3 lidTint = mix(uFrom, uTo, 0.5 + 0.5 * vP.x * uTurn);
  gl_FragColor = vec4((tint * (iris + white) * within + lidTint * (edge + aura)) * uGain, 1.0);
}
`;

/** Seconds into the scene at which the eyes close for a moment. */
const BLINKS = [10.5, 21, 33.5];

export function Eyes({ piece, dedication }: { piece: StagePiece; dedication: Dedication }) {
  const group = useRef<THREE.Group>(null);
  const left = useRef<THREE.Mesh>(null);
  const right = useRef<THREE.Mesh>(null);
  const leftLight = useRef<THREE.ShaderMaterial>(null);
  const rightLight = useRef<THREE.ShaderMaterial>(null);
  const opening = pieceNumber(piece, 'open', 2.8);
  const closing = pieceNumber(piece, 'fade', 2.6);

  const materialArgs = useMemo(() => {
    const from = new THREE.Color(dedication.from);
    const to = new THREE.Color(dedication.to);
    const args = (turn: number): [THREE.ShaderMaterialParameters] => [
      {
        vertexShader: EYE_VERT,
        fragmentShader: EYE_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uOpen: { value: 0 },
          uGain: { value: 0 },
          uTurn: { value: turn },
          uGaze: { value: new THREE.Vector2() },
          uFrom: { value: from },
          uTo: { value: to },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      },
    ];
    // Mirrored, as a pair of eyes is.
    return { left: args(1), right: args(-1) };
  }, [dedication.from, dedication.to]);

  useFrame(({ camera, size }) => {
    const pair = group.current;
    if (!pair || !left.current || !right.current || !leftLight.current || !rightLight.current) return;
    const since = stage.time - piece.t;
    const length = piece.until - piece.t;
    const shown = stage.active && since >= 0 && since <= length;
    pair.visible = shown;
    if (!shown || !(camera instanceof THREE.PerspectiveCamera)) return;

    // Hung a little way before the camera, in the upper part of what it sees.
    pair.position.copy(camera.position);
    pair.quaternion.copy(camera.quaternion);
    const depth = 10;
    const halfHeight = depth * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const halfWidth = (halfHeight * size.width) / Math.max(1, size.height);
    // Each eye is `reach` to either side of its middle, and they stand an eye's
    // width apart, as eyes do, their outer corners a little raised.
    const reach = Math.min(halfHeight * 0.2, halfWidth * 0.2);
    const apart = reach * 1.52;
    const height = halfHeight * 0.5 + Math.sin(stage.time * 0.31) * reach * 0.03;
    const sway = Math.sin(stage.time * 0.23) * reach * 0.04;
    left.current.position.set(-apart + sway, height, -depth);
    right.current.position.set(apart + sway, height, -depth);
    left.current.rotation.z = -0.075;
    right.current.rotation.z = 0.075;
    left.current.scale.setScalar(reach * 2);
    right.current.scale.setScalar(reach * 2);
    // The gaze wanders a very little, both eyes together.
    const gazeX = 0.035 * Math.sin(stage.time * 0.41) + 0.02 * Math.sin(stage.time * 0.97 + 1.3);
    const gazeY = 0.02 * Math.sin(stage.time * 0.53 + 0.7);

    let open = ease(since / opening);
    for (const blink of BLINKS) {
      const at = since - blink;
      if (at > 0 && at < 0.5) open *= 1 - 0.94 * Math.sin((Math.PI * at) / 0.5) ** 2;
    }
    const gain = ease((length - since) / closing);
    for (const light of [leftLight.current, rightLight.current]) {
      light.uniforms.uTime.value = stage.time;
      light.uniforms.uOpen.value = open;
      light.uniforms.uGain.value = gain;
      (light.uniforms.uGaze.value as THREE.Vector2).set(gazeX, gazeY);
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={left} renderOrder={7} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial ref={leftLight} args={materialArgs.left} />
      </mesh>
      <mesh ref={right} renderOrder={7} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial ref={rightLight} args={materialArgs.right} />
      </mesh>
    </group>
  );
}
