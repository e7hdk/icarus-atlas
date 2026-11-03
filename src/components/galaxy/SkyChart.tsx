'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vec3 } from '@/features/galaxy/layout';
import { PSF_VERT, PSF_FRAG } from './shaders/psfStar';
import { SKY_THREAD_VERT, SKY_THREAD_FRAG } from './shaders/skyThreads';
import { kelvinToRGB } from './blackbody';

/** The drawing primitives of the Greek sky: catalogue stars in the galaxy's own
 *  point-spread language, and the threads the ancients drew between them. */

/** A catalogue star placed on the celestial sphere. */
export interface SkyPoint {
  at: Vec3;
  /** Visual magnitude — the smaller, the brighter. */
  mag: number;
  /** Effective temperature in kelvin; the star is drawn in its blackbody colour. */
  k?: number;
}

/** One line of a figure, between two of its stars. */
export interface SkyThread {
  from: SkyPoint;
  to: SkyPoint;
}

/** Point-spread size at the sphere, in world units: from the galaxy overview a
 *  first-magnitude star draws just under the PSF knee, the faintest on the floor. */
const SKY_STAR_SIZE = 8;
/** Resting diffraction spikes for the sky's brightest stars only. */
const SKY_SPIKE = 0.3;
/** Star colour is real but gentle: a naked-eye sky, not a false-colour plate. */
const COLOUR_TO_WHITE = 0.3;
const WHITE = new THREE.Color(1, 1, 1);

export function skyStarSize(mag: number): number {
  return SKY_STAR_SIZE * Math.pow(10, -0.08 * mag);
}

/** Pogson's flux ratio, softened, so the sky keeps its hierarchy without the
 *  sixth magnitude vanishing. */
function skyStarRadiance(mag: number): number {
  return Math.min(1.6, Math.max(0.12, 1.4 * Math.pow(10, -0.2 * (mag - 0.5))));
}

/** Both shaders size in device pixels: hand them the drawing buffer each frame. */
function applyDrawingBuffer(
  material: THREE.ShaderMaterial,
  pixelRatio: number,
  size: { width: number; height: number },
) {
  material.uniforms.uPixelRatio.value = pixelRatio;
  if (material.uniforms.uViewportHeight) {
    material.uniforms.uViewportHeight.value = size.height * pixelRatio;
  }
  if (material.uniforms.uResolution) {
    (material.uniforms.uResolution.value as THREE.Vector2).set(
      size.width * pixelRatio,
      size.height * pixelRatio,
    );
  }
}

/** Catalogue stars as point-spread lights, sized and lit by magnitude and
 *  coloured by temperature. `scale` and `brightness` lift a whole figure (the
 *  week's); its threads take the same `starScale` so their clearings match. */
export function SkyStars({
  stars,
  scale = 1,
  brightness = 1,
  spikeBelow = 1,
  discRadius,
  behindDisc,
}: {
  stars: SkyPoint[];
  scale?: number;
  brightness?: number;
  /** Stars brighter than this magnitude carry resting spikes. */
  spikeBelow?: number;
  /** World radius of the galaxy disc the stars recede behind. */
  discRadius: number;
  /** What is left of a star seen through the disc, 0..1. */
  behindDisc: number;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const { geometry, material } = useMemo(() => {
    const n = stars.length;
    const color = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const dyn = new Float32Array(n * 4);
    const tint = new THREE.Color();
    stars.forEach((star, i) => {
      const [r, g, b] = kelvinToRGB(star.k ?? 7000);
      tint.setRGB(r, g, b).convertSRGBToLinear().lerp(WHITE, COLOUR_TO_WHITE);
      color[i * 3] = tint.r;
      color[i * 3 + 1] = tint.g;
      color[i * 3 + 2] = tint.b;
      size[i] = skyStarSize(star.mag) * scale;
      dyn.set([1, skyStarRadiance(star.mag) * brightness, star.mag < spikeBelow ? SKY_SPIKE : 0, 0], i * 4);
    });
    const geometry = new THREE.PlaneGeometry(1, 1);
    geometry.setAttribute('aColor', new THREE.InstancedBufferAttribute(color, 3));
    geometry.setAttribute('aSize', new THREE.InstancedBufferAttribute(size, 1));
    geometry.setAttribute('aDyn', new THREE.InstancedBufferAttribute(dyn, 4));
    const material = new THREE.ShaderMaterial({
      vertexShader: PSF_VERT,
      fragmentShader: PSF_FRAG,
      uniforms: {
        uViewportHeight: { value: 1 },
        uPixelRatio: { value: 1 },
        uDiscRadius: { value: discRadius },
        uBehindDisc: { value: behindDisc },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry, material };
  }, [stars, scale, brightness, spikeBelow, discRadius, behindDisc]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useLayoutEffect(() => {
    const instanced = mesh.current;
    if (!instanced) return;
    const m = new THREE.Matrix4();
    stars.forEach((star, i) => {
      m.makeTranslation(star.at[0], star.at[1], star.at[2]);
      instanced.setMatrixAt(i, m);
    });
    instanced.instanceMatrix.needsUpdate = true;
  }, [stars, geometry]);

  useFrame(({ gl, size }) => {
    const current = mesh.current;
    if (current) applyDrawingBuffer(current.material as THREE.ShaderMaterial, gl.getPixelRatio(), size);
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, stars.length]}
      frustumCulled={false}
      raycast={() => null}
    />
  );
}

/** The figure's lines as soft threads that leave each star a clearing and
 *  recede where the galaxy's disc stands in front of them. */
export function SkyThreads({
  threads,
  starScale = 1,
  color,
  opacity,
  width,
  glow = 0,
  glowGain = 0,
  discRadius,
  behindDisc,
}: {
  threads: SkyThread[];
  /** The scale the figure's stars are drawn at, so each clearing fits its star. */
  starScale?: number;
  /** sRGB hex; drawn in linear light. */
  color: string;
  opacity: number;
  /** Core width in CSS px. */
  width: number;
  /** Halo width in CSS px, and how bright it is against the core. */
  glow?: number;
  glowGain?: number;
  /** World radius of the galaxy disc the threads recede behind. */
  discRadius: number;
  /** What is left of a thread seen through the disc, 0..1. */
  behindDisc: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const { geometry, material } = useMemo(() => {
    const n = threads.length;
    const start = new Float32Array(n * 12);
    const end = new Float32Array(n * 12);
    const size = new Float32Array(n * 8);
    const at = new Float32Array(n * 4);
    const side = new Float32Array(n * 4);
    const index: number[] = [];
    threads.forEach((thread, i) => {
      const sizeFrom = skyStarSize(thread.from.mag) * starScale;
      const sizeTo = skyStarSize(thread.to.mag) * starScale;
      for (let corner = 0; corner < 4; corner++) {
        const v = i * 4 + corner;
        start.set(thread.from.at, v * 3);
        end.set(thread.to.at, v * 3);
        size[v * 2] = sizeFrom;
        size[v * 2 + 1] = sizeTo;
        at[v] = corner < 2 ? 0 : 1;
        side[v] = corner % 2 === 0 ? -1 : 1;
      }
      const o = i * 4;
      index.push(o, o + 1, o + 2, o + 2, o + 1, o + 3);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(start, 3));
    geometry.setAttribute('aEnd', new THREE.BufferAttribute(end, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 2));
    geometry.setAttribute('aAt', new THREE.BufferAttribute(at, 1));
    geometry.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
    geometry.setIndex(index);
    const material = new THREE.ShaderMaterial({
      vertexShader: SKY_THREAD_VERT,
      fragmentShader: SKY_THREAD_FRAG,
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uPixelRatio: { value: 1 },
        uWidth: { value: width },
        uGlow: { value: glow },
        uGlowGain: { value: glowGain },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
        uDiscRadius: { value: discRadius },
        uBehindDisc: { value: behindDisc },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    return { geometry, material };
  }, [threads, starScale, color, opacity, width, glow, glowGain, discRadius, behindDisc]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(({ gl, size }) => {
    const current = mesh.current;
    if (current) applyDrawingBuffer(current.material as THREE.ShaderMaterial, gl.getPixelRatio(), size);
  });

  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      raycast={() => null}
    />
  );
}
