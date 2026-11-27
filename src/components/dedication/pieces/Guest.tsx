'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PSF_FRAG, PSF_VERT } from '@/components/galaxy/shaders/psfStar';
import { heartbeat, pieceNumber, type StagePiece } from '@/features/dedication/director';
import { stage } from '@/features/dedication/stage';
import type { Vec3 } from '@/features/galaxy/layout';
import { TYPE_GLOW } from '@/types/character';
import { ease } from './Sprites';

/** A star that is in no data: it stands in the sky only while a performance
 *  wants it there, drawn as the atlas draws a mortal's star, at a place given
 *  from one of the atlas's own stars. It can be given a heart to beat. */

/** Where a guest stands: `dx`, `dy`, `dz` from the piece's first star. */
export function guestPlace(piece: StagePiece, positions: Map<string, Vec3>): THREE.Vector3 {
  const [x, y, z] = positions.get(piece.ids[0]) ?? [0, 0, 0];
  return new THREE.Vector3(x + pieceNumber(piece, 'dx', 0), y + pieceNumber(piece, 'dy', 0), z + pieceNumber(piece, 'dz', 0));
}

export function Guest({ piece, positions }: { piece: StagePiece; positions: Map<string, Vec3> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const tint = new THREE.Color(TYPE_GLOW.mortal.color);
    const dyn = new Float32Array(4);
    const geometry = new THREE.PlaneGeometry(1, 1);
    geometry.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array([tint.r, tint.g, tint.b]), 3));
    geometry.setAttribute('aSize', new THREE.InstancedBufferAttribute(new Float32Array([0.78]), 1));
    geometry.setAttribute('aDyn', new THREE.InstancedBufferAttribute(dyn, 4).setUsage(THREE.DynamicDrawUsage));
    const material = new THREE.ShaderMaterial({
      vertexShader: PSF_VERT,
      fragmentShader: PSF_FRAG,
      uniforms: { uViewportHeight: { value: 1 }, uPixelRatio: { value: 1 } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { dyn, geometry, material };
  }, []);
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

  const place = useMemo(() => guestPlace(piece, positions), [piece, positions]);
  useLayoutEffect(() => {
    const star = mesh.current;
    if (!star) return;
    star.setMatrixAt(0, new THREE.Matrix4().makeTranslation(place.x, place.y, place.z));
    star.instanceMatrix.needsUpdate = true;
  }, [place]);

  const rises = pieceNumber(piece, 'rise', 2.4);
  const sets = pieceNumber(piece, 'set', 1.6);
  const light = pieceNumber(piece, 'light', 1);
  const beatFrom = pieceNumber(piece, 'beatFrom', -1);
  const beatTo = pieceNumber(piece, 'beatTo', -1);
  const beatRate = pieceNumber(piece, 'beatRate', 1.4);
  const beatDepth = pieceNumber(piece, 'beatDepth', 0.6);

  useFrame(({ gl, size }) => {
    const star = mesh.current;
    if (!star) return;
    const shown = stage.active && stage.time >= piece.t && stage.time <= piece.until;
    star.visible = shown;
    if (!shown) return;
    const current = dataRef.current;
    const presence = ease((stage.time - piece.t) / rises) * ease((piece.until - stage.time) / sets);
    let beat = 1;
    if (stage.time >= beatFrom && stage.time <= beatTo) {
      const swell = Math.min(1, (stage.time - beatFrom) / 0.5, (beatTo - stage.time) / 0.5);
      beat = 1 + beatDepth * swell * heartbeat((stage.time - beatFrom) * beatRate);
    }
    const breath = 1 + 0.07 * Math.sin(stage.time * 1.4);
    current.dyn[0] = (0.6 + 0.4 * presence) * (1 + (beat - 1) * 0.4);
    current.dyn[1] = light * presence * breath * beat;
    current.dyn[2] = 0;
    current.dyn[3] = 0;
    (current.geometry.getAttribute('aDyn') as THREE.BufferAttribute).needsUpdate = true;
    const ratio = gl.getPixelRatio();
    current.material.uniforms.uPixelRatio.value = ratio;
    current.material.uniforms.uViewportHeight.value = size.height * ratio;
  });

  return <instancedMesh ref={mesh} args={[data.geometry, data.material, 1]} frustumCulled={false} renderOrder={5} visible={false} />;
}
