'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Character } from '@/types/character';
import { TYPE_GLOW, IRIDESCENT_BASE_HUE } from '@/types/character';
import { hashString, type Vec3 } from '@/features/galaxy/layout';
import { useGalaxyStore } from '@/features/galaxy/store';
import { PSF_VERT, PSF_FRAG } from './shaders/psfStar';
import { useElapsedRef } from './useElapsedRef';
import { StarLabel } from './StarLabel';
import { STAR_SIZE, STAR_PULSE, STAR_RADIANCE, STAR_SPIKE } from './starLook';

const SHIMMER_SPEED = 0.06;
const SHIMMER_SAT = 0.82;
const SHIMMER_LIGHT = 0.62;
/** A 48px invisible mobile target meets touch ergonomics without making the
 *  rendered star larger. The custom raycast chooses the closest screen centre
 *  when targets overlap, instead of letting oversized world spheres compete. */
const MOBILE_STAR_HIT_RADIUS_PX = 24;
/** Per frame, how far focus and the selection ring ease toward their target. */
const EASE = 0.12;

/** GPU-instanced character stars. Every star is ONE point-spread quad
 *  (shaders/psfStar.ts): a white-hot core, a halo in its type colour, spikes
 *  while in focus. ONE driver useFrame writes pulse, radiance, focus, the ring
 *  and the Muses' travelling hue into per-instance buffers, so the whole sky is
 *  a single draw plus one invisible instanced hit volume for picking. Desktop
 *  keeps drei Html labels; mobile batches them into one Canvas2D overlay in
 *  GalaxyCanvas. */
export function StarsDriver({
  characters,
  isMobile,
  positions,
}: {
  characters: Character[];
  isMobile: boolean;
  positions: Map<string, Vec3>;
}) {
  const starRef = useRef<THREE.InstancedMesh>(null);
  const hitRef = useRef<THREE.InstancedMesh>(null);

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
    const hitScaleArr = new Float32Array(N);
    const speedArr = new Float32Array(N);
    const ampArr = new Float32Array(N);
    const phaseArr = new Float32Array(N);
    const irregularArr = new Uint8Array(N);
    const baseHueArr = new Float32Array(N); // NaN = not a Muse
    const radiance = new Float32Array(N);
    const spike = new Float32Array(N);
    const emphasis = new Float32Array(N); // eased focus, 0..1
    const ring = new Float32Array(N); // eased selection ring, 0..1
    const attested = new Uint8Array(N).fill(1); // default lens = consensus → all attested
    const posX = new Float32Array(N);
    const posY = new Float32Array(N);
    const posZ = new Float32Array(N);

    // Per-instance buffers. Colour is static except for the Muses; aDyn
    // carries scale, radiance, spike gain and the selection ring.
    const color = new Float32Array(N * 3);
    const size = new Float32Array(N);
    const dyn = new Float32Array(N * 4);

    const indexToId: string[] = [];
    const idToIndex = new Map<string, number>();
    const tmp = new THREE.Color();
    let hasMuse = false;

    for (let i = 0; i < N; i++) {
      const c = stars[i];
      const glow = TYPE_GLOW[c.type];
      const pulse = STAR_PULSE[glow.pulse];
      size[i] = STAR_SIZE[c.type];
      hitScaleArr[i] = Math.max(size[i] * 3, 1.5);
      speedArr[i] = pulse.speed;
      ampArr[i] = pulse.amp;
      phaseArr[i] = (hashString(c.id) % 6283) / 1000;
      irregularArr[i] = glow.pulse === 'irregular' ? 1 : 0;
      radiance[i] = STAR_RADIANCE[c.type];
      spike[i] = STAR_SPIKE[c.type];
      const bh = IRIDESCENT_BASE_HUE[c.id];
      baseHueArr[i] = bh === undefined ? NaN : bh;
      if (bh === undefined) {
        tmp.set(glow.color);
      } else {
        tmp.setHSL(bh, SHIMMER_SAT, SHIMMER_LIGHT);
        hasMuse = true;
      }
      color[i * 3] = tmp.r;
      color[i * 3 + 1] = tmp.g;
      color[i * 3 + 2] = tmp.b;
      dyn.set([1, radiance[i], spike[i], 0], i * 4);
      indexToId.push(c.id);
      idToIndex.set(c.id, i);
    }

    const starGeo = new THREE.PlaneGeometry(1, 1);
    starGeo.setAttribute(
      'aColor',
      new THREE.InstancedBufferAttribute(color, 3).setUsage(THREE.DynamicDrawUsage),
    );
    starGeo.setAttribute('aSize', new THREE.InstancedBufferAttribute(size, 1));
    starGeo.setAttribute(
      'aDyn',
      new THREE.InstancedBufferAttribute(dyn, 4).setUsage(THREE.DynamicDrawUsage),
    );
    // Additive light never occludes and is never occluded: the relation lines
    // run INTO a star, so its glow has to lie over them, not be cut by them.
    const starMat = new THREE.ShaderMaterial({
      vertexShader: PSF_VERT,
      fragmentShader: PSF_FRAG,
      uniforms: { uViewportHeight: { value: 1 }, uPixelRatio: { value: 1 } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const hitGeo = new THREE.SphereGeometry(1, 12, 12);
    const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    // Material visibility removes the invisible draw while preserving raycast.
    hitMat.visible = !isMobile;

    return {
      hitScaleArr, speedArr, ampArr, phaseArr, irregularArr, baseHueArr,
      radiance, spike, emphasis, ring, attested, posX, posY, posZ, color, dyn, hasMuse,
      indexToId, idToIndex,
      starGeo, starMat, hitGeo, hitMat,
    };
  }, [stars, count, isMobile]);

  const dataRef = useRef(data);
  useLayoutEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(
    () => () => {
      data.starGeo.dispose();
      data.starMat.dispose();
      data.hitGeo.dispose();
      data.hitMat.dispose();
    },
    [data],
  );

  // Position the instances; rebuild when positions (e.g. spacingScale) change.
  useLayoutEffect(() => {
    const star = starRef.current, hit = hitRef.current;
    if (!star || !hit) return;
    const currentData = dataRef.current;
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const p = positions.get(stars[i].id)!;
      currentData.posX[i] = p[0];
      currentData.posY[i] = p[1];
      currentData.posZ[i] = p[2];
      // star: translation only (its size lives in the attributes).
      m.makeTranslation(p[0], p[1], p[2]);
      star.setMatrixAt(i, m);
      // hit: translation + static oversized scale.
      m.makeScale(
        currentData.hitScaleArr[i],
        currentData.hitScaleArr[i],
        currentData.hitScaleArr[i],
      );
      m.setPosition(p[0], p[1], p[2]);
      hit.setMatrixAt(i, m);
    }
    star.instanceMatrix.needsUpdate = true;
    hit.instanceMatrix.needsUpdate = true;
  }, [data, positions, stars, count]);

  // Recompute attestation only when the lens changes (one pass, no per-frame
  // work and no per-star React re-render).
  useLayoutEffect(() => {
    const currentData = dataRef.current;
    for (let i = 0; i < count; i++) {
      const c = stars[i];
      currentData.attested[i] =
        lens === 'consensus' ||
        c.summary.some((e) => e.sources.includes(lens)) ||
        c.story.some((e) => e.sources.includes(lens))
          ? 1
          : 0;
    }
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

  useFrame(({ gl, size }) => {
    const star = starRef.current;
    if (!star) return;
    const currentData = dataRef.current;
    const t = elapsed.current;
    const st = useGalaxyStore.getState();
    const hi = st.hoveredId ? currentData.idToIndex.get(st.hoveredId) ?? -1 : -1;
    const si = st.selectedId ? currentData.idToIndex.get(st.selectedId) ?? -1 : -1;
    const { speedArr, ampArr, phaseArr, irregularArr, baseHueArr, radiance, spike,
      emphasis, ring, attested, color, dyn, hasMuse, starMat } = currentData;

    // Each role's pulse breathes LIGHT: radiance swings and the spread follows a
    // little — a variable star, not a ball changing size. Focus (hover or
    // selection) flares the star and lends it spikes; the ring answers
    // selection alone. A star off the active lens dims to a coloured ember.
    for (let i = 0; i < count; i++) {
      const sp = speedArr[i], ph = phaseArr[i];
      let osc = Math.sin(t * sp + ph);
      if (irregularArr[i]) osc = osc * 0.6 + Math.sin(t * sp * 2.7 + ph * 2) * 0.4;
      const pulse = osc * ampArr[i];
      let e = emphasis[i] + ((i === hi || i === si ? 1 : 0) - emphasis[i]) * EASE;
      if (e < 1e-3) e = 0;
      emphasis[i] = e;
      let r = ring[i] + ((i === si ? 1 : 0) - ring[i]) * EASE;
      if (r < 1e-3) r = 0;
      ring[i] = r;
      const att = attested[i];
      const o = i * 4;
      dyn[o] = (1 + pulse * 0.45) * (1 + 0.3 * e);
      dyn[o + 1] = radiance[i] * (1 + pulse * 2.2) * (1 + 0.85 * e) * (att ? 1 : 0.2);
      dyn[o + 2] = Math.max(att ? spike[i] : 0, e);
      dyn[o + 3] = r;
      const bh = baseHueArr[i];
      if (!Number.isNaN(bh)) {
        shimmer.setHSL((bh + t * SHIMMER_SPEED) % 1, SHIMMER_SAT, SHIMMER_LIGHT);
        color[i * 3] = shimmer.r;
        color[i * 3 + 1] = shimmer.g;
        color[i * 3 + 2] = shimmer.b;
      }
    }

    (star.geometry.getAttribute('aDyn') as THREE.BufferAttribute).needsUpdate = true;
    if (hasMuse) (star.geometry.getAttribute('aColor') as THREE.BufferAttribute).needsUpdate = true;
    const pixelRatio = gl.getPixelRatio();
    starMat.uniforms.uPixelRatio.value = pixelRatio;
    starMat.uniforms.uViewportHeight.value = size.height * pixelRatio;
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
      {/* Drawn after the relation lines (3) so a star's light lies over the
          bonds that run into it. */}
      <instancedMesh
        ref={starRef}
        args={[data.starGeo, data.starMat, count]}
        frustumCulled={false}
        renderOrder={5}
      />
      {!isMobile &&
        stars.map((c) => (
          <StarLabel key={c.id} character={c} position={positions.get(c.id)!} />
        ))}
    </>
  );
}
