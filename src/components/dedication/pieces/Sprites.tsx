'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, type RootState } from '@react-three/fiber';
import * as THREE from 'three';

/** Round points of light for the stage's set pieces: each a hot core and a
 *  soft halo, sized in world units and drawn additively in HDR, so the bloom
 *  takes the bright ones as it takes the atlas's stars. A point too far to
 *  keep its size holds a pixel floor and dims instead, as the stars do. */

const SPRITE_VERT = /* glsl */ `
attribute vec3 aColor;  // linear, may exceed 1
attribute float aSize;  // world diameter
uniform float uViewportHeight; // drawing-buffer height in device px
uniform float uPixelRatio;
varying vec3 vColor;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float depth = max(-mv.z, 1e-3);
  float px = aSize * 0.5 * uViewportHeight * projectionMatrix[1][1] / depth;
  float floorPx = 1.7 * uPixelRatio;
  float fade = px < floorPx ? max(px / floorPx, 0.22) : 1.0;
  gl_PointSize = max(px, floorPx);
  vColor = aColor * fade;
  gl_Position = projectionMatrix * mv;
}
`;

const SPRITE_FRAG = /* glsl */ `
precision highp float;
varying vec3 vColor;

void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(p, p);
  if (r2 > 1.0) discard;
  float light = exp(-7.0 * r2) + 0.28 * exp(-2.4 * r2);
  gl_FragColor = vec4(vColor * light * smoothstep(1.0, 0.55, r2), 1.0);
}
`;

/** What a piece writes each frame: `count` points, three floats a position and a colour. */
export interface SpriteBuffers {
  position: Float32Array;
  color: Float32Array;
  size: Float32Array;
  count: number;
}

/** `write` fills the buffers for this frame and says whether anything is to be drawn. */
export function Sprites({
  count,
  order = 6,
  write,
}: {
  count: number;
  order?: number;
  write: (buffers: SpriteBuffers, state: RootState) => boolean;
}) {
  const points = useRef<THREE.Points>(null);
  const data = useMemo(() => {
    const buffers: SpriteBuffers = { position: new Float32Array(count * 3), color: new Float32Array(count * 3), size: new Float32Array(count), count };
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(buffers.position, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(buffers.color, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(buffers.size, 1).setUsage(THREE.DynamicDrawUsage));
    const material = new THREE.ShaderMaterial({
      vertexShader: SPRITE_VERT,
      fragmentShader: SPRITE_FRAG,
      uniforms: { uViewportHeight: { value: 1 }, uPixelRatio: { value: 1 } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    return { buffers, geometry, material };
  }, [count]);
  const dataRef = useRef(data);
  useLayoutEffect(() => {
    dataRef.current = data;
  }, [data]);
  useEffect(
    () => () => {
      data.geometry.dispose();
      data.material.dispose();
    },
    [data],
  );

  useFrame((state) => {
    const drawn = points.current;
    if (!drawn) return;
    const current = dataRef.current;
    const shown = write(current.buffers, state);
    drawn.visible = shown;
    if (!shown) return;
    current.geometry.attributes.position.needsUpdate = true;
    current.geometry.attributes.aColor.needsUpdate = true;
    current.geometry.attributes.aSize.needsUpdate = true;
    const ratio = state.gl.getPixelRatio();
    current.material.uniforms.uPixelRatio.value = ratio;
    current.material.uniforms.uViewportHeight.value = state.size.height * ratio;
  });

  return <points ref={points} geometry={data.geometry} material={data.material} renderOrder={order} frustumCulled={false} visible={false} />;
}

/** 0 to 1, eased at both ends; clamped outside. */
export const ease = (value: number): number => {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
};

/** A deterministic scatter: the same seed always gives the same numbers in [0, 1). */
export function scatter(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
