'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { hashString, mulberry32, sampleBandPoint } from '@/features/galaxy/layout';
import { clusterTint, WISP_CLUSTERS } from './palette';
import { POINTS_VERT, POINTS_FRAG } from './shaders/points';
import { useElapsedRef } from './useElapsedRef';

/** Background starfield — one Points draw call, three seeded populations:
 *  a disc-flattened milky band (agrees with the GalacticDisc about where the
 *  galaxy is), an isotropic far shell, and faint in-volume dust stars scattered
 *  through the cluster bands for parallax between the character stars. */
const BAND_COUNT = 4200;
const SHELL_COUNT = 1800;
const VOLUME_COUNT = 1500;
const TOTAL = BAND_COUNT + SHELL_COUNT + VOLUME_COUNT;

/** ~2% giants cross the bloom threshold — a few naturally blooming field stars. */
const GIANT_CHANCE = 0.02;

/** Tanner-Helland blackbody fit; returns sRGB 0..1 (convert to linear before use). */
function kelvinToRGB(kelvin: number): [number, number, number] {
  const t = kelvin / 100;
  let r: number, g: number, b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  const clamp = (x: number) => Math.min(255, Math.max(0, x)) / 255;
  return [clamp(r), clamp(g), clamp(b)];
}

function spherePoint(rng: () => number): THREE.Vector3 {
  const u = rng() * 2 - 1;
  const phi = rng() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return new THREE.Vector3(s * Math.cos(phi), u, s * Math.sin(phi));
}

export function StarField() {
  const points = useRef<THREE.Points>(null);
  const { geometry, material } = useMemo(() => {
    const rng = mulberry32(hashString('starfield'));
    const positions = new Float32Array(TOTAL * 3);
    const colors = new Float32Array(TOTAL * 3);
    const sizes = new Float32Array(TOTAL);
    const phases = new Float32Array(TOTAL);
    const speeds = new Float32Array(TOTAL);
    const color = new THREE.Color();

    let index = 0;
    const push = (x: number, y: number, z: number, brightness: number, size: number, tintToward?: THREE.Color) => {
      // Warm-weighted blackbody draw: ~60% in the 3000-5500K orange/yellow range.
      const kelvin = 3000 + Math.pow(rng(), 1.8) * 9000;
      const [r, g, b] = kelvinToRGB(kelvin);
      color.setRGB(r, g, b).convertSRGBToLinear();
      if (tintToward) color.lerp(tintToward, 0.3);
      positions[index * 3] = x;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = z;
      colors[index * 3] = color.r * brightness;
      colors[index * 3 + 1] = color.g * brightness;
      colors[index * 3 + 2] = color.b * brightness;
      sizes[index] = size;
      phases[index] = rng() * Math.PI * 2;
      speeds[index] = 0.5 + rng() * 1.5;
      index += 1;
    };

    const fieldStar = (place: () => THREE.Vector3) => {
      const p = place();
      const giant = rng() < GIANT_CHANCE;
      const brightness = giant ? 1.3 + rng() * 1.2 : 0.25 + rng() * 0.65;
      const size = giant ? 2.5 + rng() : 0.7 + rng() * 0.9;
      push(p.x, p.y, p.z, brightness, size);
    };

    for (let n = 0; n < BAND_COUNT; n++) {
      fieldStar(() => {
        const dir = spherePoint(rng);
        dir.y *= 0.3; // flatten into the milky band
        dir.normalize();
        return dir.multiplyScalar(140 + rng() * 120);
      });
    }
    for (let n = 0; n < SHELL_COUNT; n++) {
      fieldStar(() => spherePoint(rng).multiplyScalar(160 + rng() * 120));
    }
    for (let n = 0; n < VOLUME_COUNT; n++) {
      const cluster = WISP_CLUSTERS[n % WISP_CLUSTERS.length];
      const [x, y, z] = sampleBandPoint(cluster, rng, 1.4);
      push(x, y, z, 0.15 + rng() * 0.35, 0.7 + rng() * 0.7, clusterTint(cluster));
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: POINTS_VERT,
      fragmentShader: POINTS_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1.75 },
      },
    });
    return { geometry: geo, material: mat };
  }, []);

  const elapsed = useElapsedRef();
  useFrame(({ gl }) => {
    const mat = points.current?.material as THREE.ShaderMaterial | undefined;
    if (!mat) return;
    mat.uniforms.uTime.value = elapsed.current;
    mat.uniforms.uPixelRatio.value = gl.getPixelRatio();
  });

  return (
    <points ref={points} geometry={geometry} material={material} renderOrder={-2} frustumCulled={false} />
  );
}
