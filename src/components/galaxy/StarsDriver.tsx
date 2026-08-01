'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Character } from '@/types/character';
import { TYPE_GLOW, IRIDESCENT_BASE_HUE } from '@/types/character';
import { hashString, type Vec3 } from '@/features/galaxy/layout';
import { useGalaxyStore } from '@/features/galaxy/store';
import {
  CORE_VERT,
  CORE_FRAG,
  GLOW_VERT,
  GLOW_FRAG,
  MOBILE_CORE_VERT,
} from './shaders/starInstanced';
import { useElapsedRef } from './useElapsedRef';
import { StarLabel } from './StarLabel';
import { STAR_SIZE, STAR_PULSE, starGlowTexture } from './starLook';

/** Per-type sizes and pulses — identical to the old CharacterStar (and
 *  StarLabel), now shared with the week's catasterism via starLook. */
const SIZE = STAR_SIZE;
const PULSE = STAR_PULSE;

const SHIMMER_SPEED = 0.06;
const SHIMMER_SAT = 0.82;
const SHIMMER_LIGHT = 0.62;
/** A 48px invisible mobile target meets touch ergonomics without making the
 *  rendered star larger. The custom raycast chooses the closest screen centre
 *  when targets overlap, instead of letting oversized world spheres compete. */
const MOBILE_STAR_HIT_RADIUS_PX = 24;

/** GPU-instanced replacement for the individual <CharacterStar> meshes.
 *  ONE driver useFrame writes pulse/brightness/Muse-hue/emphasis into per-instance
 *  buffers; two instanced draws (core spheres + glow billboards) plus one invisible
 *  instanced hit-volume and a single shared selection ring replace thousands of
 *  draws and frame callbacks. The animation math is byte-identical to the old
 *  per-star path (same sin/lerp/PULSE/SHIMMER/emphasis/attested formulas), so the
 *  result is visually unchanged. Desktop keeps drei Html labels; mobile batches
 *  them into one Canvas2D overlay in GalaxyCanvas. */
export function StarsDriver({
  characters,
  isMobile,
  positions,
}: {
  characters: Character[];
  isMobile: boolean;
  positions: Map<string, Vec3>;
}) {
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);
  const hitRef = useRef<THREE.InstancedMesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const prevSelected = useRef<number>(-1);
  const prevHoveredIndex = useRef<number>(-1);
  const prevSelectedIndex = useRef<number>(-1);
  const opacityDirty = useRef(true);

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
    const coreScale = new Float32Array(N);
    const posX = new Float32Array(N);
    const posY = new Float32Array(N);
    const posZ = new Float32Array(N);

    const indexToId: string[] = [];
    const idToIndex = new Map<string, number>();
    const tmp = new THREE.Color();

    for (let i = 0; i < N; i++) {
      const c = stars[i];
      const glow = TYPE_GLOW[c.type];
      const pulse = PULSE[glow.pulse];
      const size = SIZE[c.type];
      sizeArr[i] = size;
      coreScale[i] = size;
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
    const coreColorAttribute = new THREE.InstancedBufferAttribute(coreColor, 3);
    const glowColorAttribute = new THREE.InstancedBufferAttribute(glowColor, 3);
    const glowScaleAttribute = new THREE.InstancedBufferAttribute(glowScale, 1);
    const glowOpacityAttribute = new THREE.InstancedBufferAttribute(glowOpacity, 1);
    if (isMobile) {
      coreColorAttribute.setUsage(THREE.DynamicDrawUsage);
      glowColorAttribute.setUsage(THREE.DynamicDrawUsage);
      glowScaleAttribute.setUsage(THREE.DynamicDrawUsage);
      glowOpacityAttribute.setUsage(THREE.DynamicDrawUsage);
    }
    coreGeo.setAttribute('aColor', coreColorAttribute);
    coreGeo.setAttribute('aAlpha', new THREE.InstancedBufferAttribute(coreAlpha, 1));
    if (isMobile) {
      coreGeo.setAttribute(
        'aScale',
        new THREE.InstancedBufferAttribute(coreScale, 1).setUsage(THREE.DynamicDrawUsage),
      );
    }
    const glowGeo = new THREE.PlaneGeometry(1, 1);
    glowGeo.setAttribute('aColor', glowColorAttribute);
    glowGeo.setAttribute('aScale', glowScaleAttribute);
    glowGeo.setAttribute('aOpacity', glowOpacityAttribute);
    const hitGeo = new THREE.SphereGeometry(1, 12, 12);

    const coreMat = new THREE.ShaderMaterial({
      vertexShader: isMobile ? MOBILE_CORE_VERT : CORE_VERT,
      fragmentShader: CORE_FRAG,
      transparent: true,
    });
    const glowTexture = starGlowTexture();
    const glowMat = new THREE.ShaderMaterial({
      vertexShader: GLOW_VERT,
      fragmentShader: GLOW_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uMap: { value: glowTexture } },
    });
    const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    // Material visibility removes the invisible draw while preserving raycast.
    hitMat.visible = !isMobile;

    return {
      N, sizeArr, hitScaleArr, speedArr, ampArr, phaseArr, irregularArr, baseHueArr,
      baseR, baseG, baseB, displayColors, groupCur, attested,
      coreColor, coreAlpha, coreScale, glowColor, glowScale, glowOpacity, posX, posY, posZ,
      indexToId, idToIndex,
      coreGeo, glowGeo, hitGeo, coreMat, glowMat, hitMat, glowTexture,
    };
  }, [stars, count, isMobile]);

  const dataRef = useRef(data);
  useLayoutEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(
    () => () => {
      data.coreGeo.dispose();
      data.glowGeo.dispose();
      data.hitGeo.dispose();
      data.coreMat.dispose();
      data.glowMat.dispose();
      data.hitMat.dispose();
    },
    [data],
  );

  // Position the instances; rebuild when positions (e.g. spacingScale) change.
  useLayoutEffect(() => {
    const core = coreRef.current, glow = glowRef.current, hit = hitRef.current;
    if (!core || !glow || !hit) return;
    const currentData = dataRef.current;
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const p = positions.get(stars[i].id)!;
      currentData.posX[i] = p[0];
      currentData.posY[i] = p[1];
      currentData.posZ[i] = p[2];
      // Mobile keeps the matrix static; its compact aScale attribute pulses.
      if (isMobile) {
        m.makeTranslation(p[0], p[1], p[2]);
      } else {
        m.makeScale(currentData.sizeArr[i], currentData.sizeArr[i], currentData.sizeArr[i]);
        m.setPosition(p[0], p[1], p[2]);
      }
      core.setMatrixAt(i, m);
      // glow: translation only (size lives in aScale).
      m.makeTranslation(p[0], p[1], p[2]);
      glow.setMatrixAt(i, m);
      // hit: translation + static oversized scale.
      m.makeScale(
        currentData.hitScaleArr[i],
        currentData.hitScaleArr[i],
        currentData.hitScaleArr[i],
      );
      m.setPosition(p[0], p[1], p[2]);
      hit.setMatrixAt(i, m);
    }
    core.instanceMatrix.needsUpdate = true;
    glow.instanceMatrix.needsUpdate = true;
    hit.instanceMatrix.needsUpdate = true;
  }, [data, positions, stars, count, isMobile]);

  // Recompute attested + core alpha only when the lens changes (one pass, no
  // per-frame work and no per-star React re-render).
  useLayoutEffect(() => {
    const currentData = dataRef.current;
    for (let i = 0; i < count; i++) {
      const c = stars[i];
      const att =
        lens === 'consensus' ||
        c.summary.some((e) => e.sources.includes(lens)) ||
        c.story.some((e) => e.sources.includes(lens))
          ? 1
          : 0;
      currentData.attested[i] = att;
      currentData.coreAlpha[i] = att ? 1 : 0.45;
    }
    if (coreRef.current) {
      (coreRef.current.geometry.getAttribute('aAlpha') as THREE.BufferAttribute).needsUpdate = true;
    }
    opacityDirty.current = true;
  }, [lens, data, stars, count]);

  useEffect(() => {
    if (!isMobile) return;
    setHovered(null);
    document.body.style.cursor = 'auto';
  }, [isMobile, setHovered]);

  const shimmer = useMemo(() => new THREE.Color(), []);
  const elapsed = useElapsedRef();
  const camera = useThree((state) => state.camera);
  const viewportHeight = useThree((state) => state.size.height);

  const mobileHitRaycast = useCallback(
    (raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) => {
      const object = hitRef.current;
      if (
        !object ||
        !(camera instanceof THREE.PerspectiveCamera) ||
        viewportHeight <= 0
      ) {
        return;
      }

      const currentData = dataRef.current;
      const ray = raycaster.ray;
      const angularRadius =
        (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5) *
          MOBILE_STAR_HIT_RADIUS_PX) /
        viewportHeight;
      const angularRadiusSq = angularRadius * angularRadius;
      let bestIndex = -1;
      let bestDistance = Infinity;
      let bestAngularDistanceSq = Infinity;

      for (let index = 0; index < count; index++) {
        const dx = currentData.posX[index] - ray.origin.x;
        const dy = currentData.posY[index] - ray.origin.y;
        const dz = currentData.posZ[index] - ray.origin.z;
        const distance = dx * ray.direction.x + dy * ray.direction.y + dz * ray.direction.z;
        if (distance <= raycaster.near || distance >= raycaster.far) continue;

        const perpendicularSq = Math.max(
          0,
          dx * dx + dy * dy + dz * dz - distance * distance,
        );
        const angularDistanceSq = perpendicularSq / (distance * distance);
        if (
          angularDistanceSq <= angularRadiusSq &&
          (angularDistanceSq < bestAngularDistanceSq ||
            (angularDistanceSq === bestAngularDistanceSq && distance < bestDistance))
        ) {
          bestIndex = index;
          bestDistance = distance;
          bestAngularDistanceSq = angularDistanceSq;
        }
      }

      if (bestIndex < 0) return;
      intersects.push({
        distance: bestDistance,
        instanceId: bestIndex,
        object,
        point: ray.at(bestDistance, new THREE.Vector3()),
      });
    },
    [camera, count, viewportHeight],
  );

  useFrame(({ camera }) => {
    const core = coreRef.current, glow = glowRef.current;
    if (!core || !glow) return;
    const currentData = dataRef.current;
    const t = elapsed.current;
    const st = useGalaxyStore.getState();
    const hi = st.hoveredId ? currentData.idToIndex.get(st.hoveredId) ?? -1 : -1;
    const si = st.selectedId ? currentData.idToIndex.get(st.selectedId) ?? -1 : -1;

    const cm = core.instanceMatrix.array as Float32Array;
    const { coreColor, coreScale, glowColor, glowScale, glowOpacity, groupCur, attested,
      sizeArr, speedArr, ampArr, phaseArr, irregularArr, baseHueArr, baseR, baseG, baseB,
      posX, posY, posZ } = currentData;
    const updateGlowOpacity =
      !isMobile ||
      opacityDirty.current ||
      hi !== prevHoveredIndex.current ||
      si !== prevSelectedIndex.current;

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
      if (isMobile) {
        coreScale[i] = s;
      } else {
        const o = i * 16;
        cm[o] = s; cm[o + 5] = s; cm[o + 10] = s;
      }

      glowScale[i] = sizeArr[i] * 7 * cur;
      if (updateGlowOpacity) {
        glowOpacity[i] = att
          ? i === si
            ? 0.7
            : i === hi
              ? 0.85
              : 0.55
          : i === hi
            ? 0.3
            : 0.14;
      }
    }

    if (isMobile) {
      (core.geometry.getAttribute('aScale') as THREE.BufferAttribute).needsUpdate = true;
    } else {
      core.instanceMatrix.needsUpdate = true;
    }
    (core.geometry.getAttribute('aColor') as THREE.BufferAttribute).needsUpdate = true;
    (glow.geometry.getAttribute('aColor') as THREE.BufferAttribute).needsUpdate = true;
    (glow.geometry.getAttribute('aScale') as THREE.BufferAttribute).needsUpdate = true;
    if (updateGlowOpacity) {
      (glow.geometry.getAttribute('aOpacity') as THREE.BufferAttribute).needsUpdate = true;
      opacityDirty.current = false;
      prevHoveredIndex.current = hi;
      prevSelectedIndex.current = si;
    }

    const ring = ringRef.current;
    if (ring) {
      if (si >= 0) {
        ring.visible = true;
        ring.position.set(posX[si], posY[si], posZ[si]);
        ring.scale.setScalar(sizeArr[si] * groupCur[si]);
        ring.quaternion.copy(camera.quaternion);
        if (si !== prevSelected.current) {
          (ring.material as THREE.MeshBasicMaterial).color.copy(currentData.displayColors[si]);
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
        raycast={isMobile ? mobileHitRaycast : THREE.InstancedMesh.prototype.raycast}
        onPointerMove={
          isMobile
            ? undefined
            : (e) => {
                e.stopPropagation();
                const id =
                  e.instanceId !== undefined ? data.indexToId[e.instanceId] : undefined;
                if (id && useGalaxyStore.getState().hoveredId !== id) setHovered(id);
              }
        }
        onPointerOver={
          isMobile
            ? undefined
            : (e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }
        }
        onPointerOut={
          isMobile
            ? undefined
            : () => {
                setHovered(null);
                document.body.style.cursor = 'auto';
              }
        }
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
      {!isMobile &&
        stars.map((c) => (
          <StarLabel key={c.id} character={c} position={positions.get(c.id)!} />
        ))}
    </>
  );
}
