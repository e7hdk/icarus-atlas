'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Character, CharacterType } from '@/types/character';
import { TYPE_GLOW, IRIDESCENT_BASE_HUE } from '@/types/character';
import { hashString, type Vec3 } from '@/features/galaxy/layout';
import { useGalaxyStore } from '@/features/galaxy/store';
import { CORE_VERT, CORE_FRAG, GLOW_VERT, GLOW_FRAG } from './shaders/starInstanced';
import { useElapsedRef } from './useElapsedRef';
import { StarLabel } from './StarLabel';

/** Per-type sizes — identical to the old CharacterStar (and StarLabel). */
const SIZE: Record<CharacterType, number> = {
  primordial: 0.85,
  titan: 0.78,
  olympian: 0.95,
  god: 0.8,
  hero: 0.7,
  mortal: 0.6,
  nymph: 0.65,
  creature: 0.75,
};

const PULSE: Record<'slow' | 'steady' | 'quick' | 'irregular', { speed: number; amp: number }> = {
  slow: { speed: 0.7, amp: 0.1 },
  steady: { speed: 1.4, amp: 0.06 },
  quick: { speed: 3.2, amp: 0.1 },
  irregular: { speed: 2.1, amp: 0.12 },
};

const SHIMMER_SPEED = 0.06;
const SHIMMER_SAT = 0.82;
const SHIMMER_LIGHT = 0.62;

/** Soft radial halo texture, generated once and shared by every glow instance. */
function makeGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,0.85)');
  gradient.addColorStop(0.25, 'rgba(255,255,255,0.28)');
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.07)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

/** GPU-instanced replacement for the 521 individual <CharacterStar> meshes.
 *  ONE driver useFrame writes pulse/brightness/Muse-hue/emphasis into per-instance
 *  buffers; two instanced draws (core spheres + glow billboards) plus one invisible
 *  instanced hit-volume and a single shared selection ring replace ~1,563 draw
 *  calls and 521 frame callbacks. The animation math is byte-identical to the old
 *  per-star path (same sin/lerp/PULSE/SHIMMER/emphasis/attested formulas), so the
 *  result is visually unchanged. Labels stay as drei <Html> (StarLabel) for now. */
export function StarsDriver({
  characters,
  positions,
}: {
  characters: Character[];
  positions: Map<string, Vec3>;
}) {
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);
  const hitRef = useRef<THREE.InstancedMesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const prevSelected = useRef<number>(-1);

  const setHovered = useGalaxyStore((s) => s.setHovered);
  const select = useGalaxyStore((s) => s.select);
  const lens = useGalaxyStore((s) => s.lens);

  // Only the stars that actually have a position participate (matches the old
  // map, which skipped position-less characters).
  const stars = useMemo(
    () => characters.filter((c) => positions.has(c.id)),
    [characters, positions],
  );
  const count = stars.length;

  const data = useMemo(() => {
    const N = count;
    const sizeArr = new Float32Array(N);
    const hitScaleArr = new Float32Array(N);
    const speedArr = new Float32Array(N);
    const ampArr = new Float32Array(N);
    const phaseArr = new Float32Array(N);
    const irregularArr = new Uint8Array(N);
    const baseHueArr = new Float32Array(N); // NaN = not a Muse
    const baseR = new Float32Array(N);
    const baseG = new Float32Array(N);
    const baseB = new Float32Array(N);
    const displayColors: THREE.Color[] = []; // static label/ring tint (linear)
    const groupCur = new Float32Array(N).fill(1);
    const attested = new Uint8Array(N).fill(1); // default lens = consensus → all attested

    // Per-instance dynamic buffers
    const coreColor = new Float32Array(N * 3);
    const coreAlpha = new Float32Array(N).fill(1);
    const glowColor = new Float32Array(N * 3);
    const glowScale = new Float32Array(N);
    const glowOpacity = new Float32Array(N).fill(0.55);

    const indexToId: string[] = [];
    const idToIndex = new Map<string, number>();
    const tmp = new THREE.Color();

    for (let i = 0; i < N; i++) {
      const c = stars[i];
      const glow = TYPE_GLOW[c.type];
      const pulse = PULSE[glow.pulse];
      const size = SIZE[c.type];
      sizeArr[i] = size;
      hitScaleArr[i] = Math.max(size * 3, 1.5);
      speedArr[i] = pulse.speed;
      ampArr[i] = pulse.amp;
      phaseArr[i] = (hashString(c.id) % 6283) / 1000;
      irregularArr[i] = glow.pulse === 'irregular' ? 1 : 0;
      const bh = IRIDESCENT_BASE_HUE[c.id];
      baseHueArr[i] = bh === undefined ? NaN : bh;
      // Base (non-Muse) tint, linear — identical to `new THREE.Color(glow.color)`.
      tmp.set(glow.color);
      baseR[i] = tmp.r;
      baseG[i] = tmp.g;
      baseB[i] = tmp.b;
      // Static display colour (label hover + ring): Muse hue or the type glow.
      displayColors.push(
        bh === undefined
          ? new THREE.Color(glow.color)
          : new THREE.Color().setHSL(bh, SHIMMER_SAT, SHIMMER_LIGHT),
      );
      indexToId.push(c.id);
      idToIndex.set(c.id, i);
    }

    const coreGeo = new THREE.SphereGeometry(1, 24, 24);
    coreGeo.setAttribute('aColor', new THREE.InstancedBufferAttribute(coreColor, 3));
    coreGeo.setAttribute('aAlpha', new THREE.InstancedBufferAttribute(coreAlpha, 1));
    const glowGeo = new THREE.PlaneGeometry(1, 1);
    glowGeo.setAttribute('aColor', new THREE.InstancedBufferAttribute(glowColor, 3));
    glowGeo.setAttribute('aScale', new THREE.InstancedBufferAttribute(glowScale, 1));
    glowGeo.setAttribute('aOpacity', new THREE.InstancedBufferAttribute(glowOpacity, 1));
    const hitGeo = new THREE.SphereGeometry(1, 12, 12);

    const coreMat = new THREE.ShaderMaterial({
      vertexShader: CORE_VERT,
      fragmentShader: CORE_FRAG,
      transparent: true,
    });
    const glowTexture = makeGlowTexture();
    const glowMat = new THREE.ShaderMaterial({
      vertexShader: GLOW_VERT,
      fragmentShader: GLOW_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uMap: { value: glowTexture } },
    });
    const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

    return {
      N, sizeArr, hitScaleArr, speedArr, ampArr, phaseArr, irregularArr, baseHueArr,
      baseR, baseG, baseB, displayColors, groupCur, attested,
      coreColor, coreAlpha, glowColor, glowScale, glowOpacity,
      indexToId, idToIndex,
      coreGeo, glowGeo, hitGeo, coreMat, glowMat, hitMat, glowTexture,
    };
  }, [stars, count]);

  // Position the instances; rebuild when positions (e.g. spacingScale) change.
  const posX = useMemo(() => new Float32Array(count), [count]);
  const posY = useMemo(() => new Float32Array(count), [count]);
  const posZ = useMemo(() => new Float32Array(count), [count]);
  useLayoutEffect(() => {
    const core = coreRef.current, glow = glowRef.current, hit = hitRef.current;
    if (!core || !glow || !hit) return;
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const p = positions.get(stars[i].id)!;
      posX[i] = p[0]; posY[i] = p[1]; posZ[i] = p[2];
      // core: translation + (size × current=1) scale; the loop rewrites the scale.
      m.makeScale(data.sizeArr[i], data.sizeArr[i], data.sizeArr[i]);
      m.setPosition(p[0], p[1], p[2]);
      core.setMatrixAt(i, m);
      // glow: translation only (size lives in aScale).
      m.makeTranslation(p[0], p[1], p[2]);
      glow.setMatrixAt(i, m);
      // hit: translation + static oversized scale.
      m.makeScale(data.hitScaleArr[i], data.hitScaleArr[i], data.hitScaleArr[i]);
      m.setPosition(p[0], p[1], p[2]);
      hit.setMatrixAt(i, m);
    }
    core.instanceMatrix.needsUpdate = true;
    glow.instanceMatrix.needsUpdate = true;
    hit.instanceMatrix.needsUpdate = true;
  }, [data, positions, stars, count, posX, posY, posZ]);

  // Recompute attested + core alpha only when the lens changes (one pass, no
  // per-frame work and no per-star React re-render).
  useLayoutEffect(() => {
    for (let i = 0; i < count; i++) {
      const c = stars[i];
      const att =
        lens === 'consensus' ||
        c.summary.some((e) => e.sources.includes(lens)) ||
        c.story.some((e) => e.sources.includes(lens))
          ? 1
          : 0;
      data.attested[i] = att;
      data.coreAlpha[i] = att ? 1 : 0.45;
    }
    if (coreRef.current) {
      (coreRef.current.geometry.getAttribute('aAlpha') as THREE.BufferAttribute).needsUpdate = true;
    }
  }, [lens, data, stars, count]);

  const shimmer = useMemo(() => new THREE.Color(), []);
  const elapsed = useElapsedRef();

  useFrame(({ camera }) => {
    const core = coreRef.current, glow = glowRef.current;
    if (!core || !glow) return;
    const t = elapsed.current;
    const st = useGalaxyStore.getState();
    const hi = st.hoveredId ? data.idToIndex.get(st.hoveredId) ?? -1 : -1;
    const si = st.selectedId ? data.idToIndex.get(st.selectedId) ?? -1 : -1;

    const cm = core.instanceMatrix.array as Float32Array;
    const { coreColor, glowColor, glowScale, glowOpacity, groupCur, attested,
      sizeArr, speedArr, ampArr, phaseArr, irregularArr, baseHueArr, baseR, baseG, baseB } = data;

    for (let i = 0; i < count; i++) {
      const sp = speedArr[i], am = ampArr[i], ph = phaseArr[i];
      let osc = Math.sin(t * sp + ph);
      if (irregularArr[i]) osc = osc * 0.6 + Math.sin(t * sp * 2.7 + ph * 2) * 0.4;
      const emphasized = i === hi || i === si;
      const target = (emphasized ? 1.45 : 1) * (1 + osc * am);
      const cur = groupCur[i] + (target - groupCur[i]) * 0.12;
      groupCur[i] = cur;
      const att = attested[i];
      const brightness = ((emphasized ? 2.7 : 1.85) + osc * 0.35) * (att ? 1 : 0.28);

      let cr: number, cg: number, cb: number;
      const bh = baseHueArr[i];
      if (!Number.isNaN(bh)) {
        const hue = (bh + t * SHIMMER_SPEED) % 1;
        shimmer.setHSL(hue, SHIMMER_SAT, SHIMMER_LIGHT);
        cr = shimmer.r; cg = shimmer.g; cb = shimmer.b;
      } else {
        cr = baseR[i]; cg = baseG[i]; cb = baseB[i];
      }
      const j = i * 3;
      coreColor[j] = cr * brightness; coreColor[j + 1] = cg * brightness; coreColor[j + 2] = cb * brightness;
      glowColor[j] = cr; glowColor[j + 1] = cg; glowColor[j + 2] = cb;

      const s = sizeArr[i] * cur;
      const o = i * 16;
      cm[o] = s; cm[o + 5] = s; cm[o + 10] = s;

      glowScale[i] = sizeArr[i] * 7 * cur;
      glowOpacity[i] = att ? (i === si ? 0.7 : i === hi ? 0.85 : 0.55) : i === hi ? 0.3 : 0.14;
    }

    core.instanceMatrix.needsUpdate = true;
    (core.geometry.getAttribute('aColor') as THREE.BufferAttribute).needsUpdate = true;
    (glow.geometry.getAttribute('aColor') as THREE.BufferAttribute).needsUpdate = true;
    (glow.geometry.getAttribute('aScale') as THREE.BufferAttribute).needsUpdate = true;
    (glow.geometry.getAttribute('aOpacity') as THREE.BufferAttribute).needsUpdate = true;

    const ring = ringRef.current;
    if (ring) {
      if (si >= 0) {
        ring.visible = true;
        ring.position.set(posX[si], posY[si], posZ[si]);
        ring.scale.setScalar(sizeArr[si] * groupCur[si]);
        ring.quaternion.copy(camera.quaternion);
        if (si !== prevSelected.current) {
          (ring.material as THREE.MeshBasicMaterial).color.copy(data.displayColors[si]);
          prevSelected.current = si;
        }
      } else {
        ring.visible = false;
        prevSelected.current = -1;
      }
    }
  });

  return (
    <>
      <instancedMesh
        ref={hitRef}
        args={[data.hitGeo, data.hitMat, count]}
        frustumCulled={false}
        onPointerMove={(e) => {
          e.stopPropagation();
          const id = e.instanceId !== undefined ? data.indexToId[e.instanceId] : undefined;
          if (id && useGalaxyStore.getState().hoveredId !== id) setHovered(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(null);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          const id = e.instanceId !== undefined ? data.indexToId[e.instanceId] : undefined;
          if (id) select(id);
        }}
      />
      <instancedMesh
        ref={coreRef}
        args={[data.coreGeo, data.coreMat, count]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={glowRef}
        args={[data.glowGeo, data.glowMat, count]}
        frustumCulled={false}
        renderOrder={1}
      />
      <mesh ref={ringRef} visible={false} renderOrder={2}>
        <ringGeometry args={[1.55, 1.68, 64]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      {stars.map((c) => (
        <StarLabel key={c.id} character={c} position={positions.get(c.id)!} />
      ))}
    </>
  );
}
