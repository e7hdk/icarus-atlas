'use client';

import { useCallback, useMemo, useRef } from 'react';
import type { RootState } from '@react-three/fiber';
import * as THREE from 'three';
import { heave, pieceNumber, type StagePiece } from '@/features/dedication/director';
import { stage } from '@/features/dedication/stage';
import type { Dedication } from '@/features/galaxy/dedication';
import type { Vec3 } from '@/features/galaxy/layout';
import { Sprites, ease, type SpriteBuffers } from './Sprites';

/** A chain of light let down from the piece's star, link after link, straight
 *  toward the underworld; then hauled on from below: with every heave it draws
 *  taut and a shudder runs up it, and the star it hangs from does not move.
 *
 *  `length`: world units it hangs. `drop`: seconds it takes to fall.
 *  `heaveAt`, `heaveUntil`: seconds from the start between which it is hauled,
 *  `heaveRate` heaves a second (the score beats the hauling stars to the same
 *  measure). `tone`: 'gold', or 'gift' for the dedication's own two colours. */

const LINK = 2.3;

export function Chain({ piece, positions, dedication }: { piece: StagePiece; positions: Map<string, Vec3>; dedication: Dedication }) {
  const length = pieceNumber(piece, 'length', 190);
  const drop = pieceNumber(piece, 'drop', 3);
  const heaveAt = pieceNumber(piece, 'heaveAt', drop + 0.5);
  const heaveUntil = pieceNumber(piece, 'heaveUntil', piece.until - piece.t - 1.6);
  const heaveRate = pieceNumber(piece, 'heaveRate', 0.5);
  const links = Math.max(8, Math.ceil(length / LINK));

  const scene = useMemo(() => {
    const [x, y, z] = positions.get(piece.ids[0]) ?? [0, 0, 0];
    const gift = piece.params?.tone === 'gift';
    return { anchor: new THREE.Vector3(x, y, z), top: new THREE.Color(gift ? dedication.from : '#fde68a'), foot: new THREE.Color(gift ? dedication.to : '#f7c873') };
  }, [piece, positions, dedication.from, dedication.to]);
  const across = useRef(new THREE.Vector3());

  const write = useCallback(
    (buffers: SpriteBuffers, { camera }: RootState): boolean => {
      const since = stage.time - piece.t;
      if (!stage.active || since < 0 || stage.time > piece.until) return false;
      const right = across.current.set(1, 0, 0).applyQuaternion(camera.quaternion);
      const fallen = ease(since / drop);
      const leaving = ease((piece.until - stage.time) / 1.4);
      const hauled = since >= heaveAt && since <= heaveUntil ? heave((since - heaveAt) * heaveRate) : 0;
      // A glint that travels down the chain, so the links read as links.
      const glint = (since * 0.22) % 1;

      for (let index = 0; index < links; index++) {
        const along = index / (links - 1);
        const at = index * 3;
        if (along > fallen) {
          buffers.size[index] = 0;
          buffers.color[at] = buffers.color[at + 1] = buffers.color[at + 2] = 0;
          continue;
        }
        // Still at the star it hangs from; free to swing and shudder further down.
        const sway = 0.9 * along * Math.sin(since * 0.7 + along * 2.6);
        const shudder = 3.2 * hauled * along * Math.sin(along * 26 - since * 13);
        const side = sway + shudder;
        buffers.position[at] = scene.anchor.x + right.x * side;
        buffers.position[at + 1] = scene.anchor.y - along * length - 1.8 * hauled * along + right.y * side;
        buffers.position[at + 2] = scene.anchor.z + right.z * side;
        const fromHead = ((fallen - along) * links) / 3;
        const fromGlint = ((along - glint) * links) / 2.4;
        const head = Math.exp(-fromHead * fromHead) * (1 - fallen);
        const spark = Math.exp(-fromGlint * fromGlint);
        const light = (1.25 + 1.5 * hauled + 2.2 * head + 0.9 * spark) * leaving;
        buffers.color[at] = (scene.top.r + (scene.foot.r - scene.top.r) * along) * light;
        buffers.color[at + 1] = (scene.top.g + (scene.foot.g - scene.top.g) * along) * light;
        buffers.color[at + 2] = (scene.top.b + (scene.foot.b - scene.top.b) * along) * light;
        buffers.size[index] = 1.25 + 0.5 * hauled + 0.9 * head;
      }
      return true;
    },
    [piece, scene, links, length, drop, heaveAt, heaveUntil, heaveRate],
  );

  return <Sprites count={links} order={4} write={write} />;
}
