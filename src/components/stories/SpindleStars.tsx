'use client';

import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { LensId } from '@/types/character';
import { hashString } from '@/features/galaxy/layout';
import { isStoryAttested, type SpindleNode } from '@/features/stories/spindle';
import { useElapsedRef } from '@/components/galaxy/useElapsedRef';
import { CORE_VERT, CORE_FRAG, GLOW_VERT, GLOW_FRAG } from '@/components/galaxy/shaders/starInstanced';

/** Stars are only the spark where a world-line begins — keep them small so the
 *  lines, not the glows, carry the picture. */
const STAR_SCALE = 0.45;

/** Scratch quaternion for billboarding the selection ring under a rotated parent. */
const parentQuat = new THREE.Quaternion();

/** Soft radial halo, shared by every glow billboard — same recipe as the galaxy. */
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

/** GPU-instanced story stars for the spindle — core spheres + additive glow
 *  billboards + an invisible hit volume, reusing the galaxy's star shaders and
 *  pulse/emphasis math so the myths glow exactly like the galaxy. Hover and
 *  selection come in through props (the parent owns the spindle state); the
 *  per-frame loop reads them through refs to avoid re-instancing on hover. */
export function SpindleStars({
  nodes,
  lens,
  hoveredId,
  selectedId,
  onHover,
  onSelect,
  hitRef,
  draggedRef,
}: {
  nodes: SpindleNode[];
  lens: LensId;
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
  /** Forwarded so the camera controller can raycast the same hit volume. */
  hitRef: MutableRefObject<THREE.InstancedMesh | null>;
  /** True while the rig is being dragged — suppresses click-to-select. */
  draggedRef?: MutableRefObject<boolean>;
}) {
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const prevSelected = useRef<number>(-1);

  const count = nodes.length;

  const data = useMemo(() => {
    const N = count;
    const sizeArr = new Float32Array(N);
    const hitScaleArr = new Float32Array(N);
    const speedArr = new Float32Array(N);
    const ampArr = new Float32Array(N);
    const phaseArr = new Float32Array(N);
    const baseR = new Float32Array(N);
    const baseG = new Float32Array(N);
    const baseB = new Float32Array(N);
    const attested = new Uint8Array(N).fill(1);
    const displayColors: THREE.Color[] = [];

    const coreColor = new Float32Array(N * 3);
    const coreAlpha = new Float32Array(N).fill(1);
    const glowColor = new Float32Array(N * 3);
    const glowScale = new Float32Array(N);
    const glowOpacity = new Float32Array(N).fill(0.55);

    const indexToId: string[] = [];
    const idToIndex = new Map<string, number>();
    const tmp = new THREE.Color();

    for (let i = 0; i < N; i++) {
      const node = nodes[i];
      const size = node.size * STAR_SCALE;
      sizeArr[i] = size;
      hitScaleArr[i] = Math.max(node.size * 2.6, 1.5);
      // Saga roots breathe slow and wide; episodes flicker quick and small.
      speedArr[i] = node.isSagaRoot ? 0.9 : 1.6;
      ampArr[i] = node.isSagaRoot ? 0.1 : 0.06;
      phaseArr[i] = (hashString(node.id) % 6283) / 1000;
      tmp.set(node.color);
      baseR[i] = tmp.r;
      baseG[i] = tmp.g;
      baseB[i] = tmp.b;
      displayColors.push(new THREE.Color(node.color));
      indexToId.push(node.id);
      idToIndex.set(node.id, i);
    }

    const coreGeo = new THREE.SphereGeometry(1, 20, 20);
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
      N, sizeArr, hitScaleArr, speedArr, ampArr, phaseArr, baseR, baseG, baseB,
      attested, displayColors, coreColor, coreAlpha, glowColor, glowScale, glowOpacity,
      indexToId, idToIndex, coreGeo, glowGeo, hitGeo, coreMat, glowMat, hitMat, glowTexture,
    };
  }, [nodes, count]);

  const posX = useMemo(() => new Float32Array(count), [count]);
  const posY = useMemo(() => new Float32Array(count), [count]);
  const posZ = useMemo(() => new Float32Array(count), [count]);

  useLayoutEffect(() => {
    const core = coreRef.current, glow = glowRef.current, hit = hitRef.current;
    if (!core || !glow || !hit) return;
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const [x, y, z] = nodes[i].pos;
      posX[i] = x; posY[i] = y; posZ[i] = z;
      m.makeScale(data.sizeArr[i], data.sizeArr[i], data.sizeArr[i]);
      m.setPosition(x, y, z);
      core.setMatrixAt(i, m);
      m.makeTranslation(x, y, z);
      glow.setMatrixAt(i, m);
      m.makeScale(data.hitScaleArr[i], data.hitScaleArr[i], data.hitScaleArr[i]);
      m.setPosition(x, y, z);
      hit.setMatrixAt(i, m);
    }
    core.instanceMatrix.needsUpdate = true;
    glow.instanceMatrix.needsUpdate = true;
    hit.instanceMatrix.needsUpdate = true;
  }, [data, nodes, count, posX, posY, posZ, hitRef]);

  // Lens gate — recompute attested + core alpha only when the lens changes.
  useLayoutEffect(() => {
    for (let i = 0; i < count; i++) {
      const att = isStoryAttested(nodes[i], lens) ? 1 : 0;
      data.attested[i] = att;
      data.coreAlpha[i] = att ? 1 : 0.4;
    }
    if (coreRef.current) {
      (coreRef.current.geometry.getAttribute('aAlpha') as THREE.BufferAttribute).needsUpdate = true;
    }
  }, [lens, data, nodes, count]);

  const elapsed = useElapsedRef();

  useFrame(({ camera }) => {
    const core = coreRef.current, glow = glowRef.current;
    if (!core || !glow) return;
    const t = elapsed.current;
    const hi = hoveredId ? data.idToIndex.get(hoveredId) ?? -1 : -1;
    const si = selectedId ? data.idToIndex.get(selectedId) ?? -1 : -1;

    const cm = core.instanceMatrix.array as Float32Array;
    const { coreColor, glowColor, glowScale, glowOpacity, attested,
      sizeArr, speedArr, ampArr, phaseArr, baseR, baseG, baseB } = data;

    for (let i = 0; i < count; i++) {
      const osc = Math.sin(t * speedArr[i] + phaseArr[i]);
      const emphasized = i === hi || i === si;
      const target = (emphasized ? 1.5 : 1) * (1 + osc * ampArr[i]);
      const att = attested[i];
      const brightness = ((emphasized ? 2.8 : 1.85) + osc * 0.35) * (att ? 1 : 0.26);

      const j = i * 3;
      coreColor[j] = baseR[i] * brightness;
      coreColor[j + 1] = baseG[i] * brightness;
      coreColor[j + 2] = baseB[i] * brightness;
      glowColor[j] = baseR[i];
      glowColor[j + 1] = baseG[i];
      glowColor[j + 2] = baseB[i];

      const s = sizeArr[i] * target;
      const o = i * 16;
      cm[o] = s; cm[o + 5] = s; cm[o + 10] = s;

      glowScale[i] = sizeArr[i] * 5 * target;
      glowOpacity[i] = att ? (i === si ? 0.75 : i === hi ? 0.9 : 0.55) : i === hi ? 0.32 : 0.13;
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
        ring.scale.setScalar(sizeArr[si] * 1.3);
        // Face the camera in world space, compensating for any rotation of the
      // parent group (the spindle is laid on its side into a tunnel).
      if (ring.parent) {
        ring.parent.getWorldQuaternion(parentQuat).invert();
        ring.quaternion.copy(parentQuat).multiply(camera.quaternion);
      } else {
        ring.quaternion.copy(camera.quaternion);
      }
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
          if (id && hoveredId !== id) onHover(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (draggedRef?.current) return; // a roll-drag, not a selection
          const id = e.instanceId !== undefined ? data.indexToId[e.instanceId] : undefined;
          if (id) onSelect(id);
        }}
      />
      <instancedMesh ref={coreRef} args={[data.coreGeo, data.coreMat, count]} frustumCulled={false} />
      <instancedMesh ref={glowRef} args={[data.glowGeo, data.glowMat, count]} frustumCulled={false} renderOrder={1} />
      <mesh ref={ringRef} visible={false} renderOrder={2}>
        <ringGeometry args={[1.55, 1.7, 64]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}
