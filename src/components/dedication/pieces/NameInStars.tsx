'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RootState } from '@react-three/fiber';
import * as THREE from 'three';
import { pieceNumber, type StagePiece } from '@/features/dedication/director';
import { stage } from '@/features/dedication/stage';
import type { Dedication } from '@/features/galaxy/dedication';
import type { Vec3 } from '@/features/galaxy/layout';
import { Sprites, ease, scatter, type SpriteBuffers } from './Sprites';

/** A word written in stars above the piece's star: a cloud of light gathers out
 *  of the star's own glow into the letters; one letter (`drop`, its index)
 *  flares and falls away as sparks; the rest close over the gap; then the word
 *  goes back into the star. The letters are the atlas's own display face,
 *  sampled once from a canvas; the word always faces the camera.
 *
 *  `burn`: seconds from the start at which the dropped letter catches. */

interface Glyphs {
  count: number;
  /** Where each point belongs, in units of the word's width, the word centred. */
  x: Float32Array;
  y: Float32Array;
  /** How far across it moves once the dropped letter is gone. */
  shift: Float32Array;
  dropped: Uint8Array;
  /** Four numbers in [0, 1) a point: its own delay, fall, size and phase. */
  seed: Float32Array;
}

const SIZE = 150;
const STEP = 3;

async function sampleWord(word: string, drop: number): Promise<Glyphs> {
  const family = getComputedStyle(document.documentElement).getPropertyValue('--font-cinzel').trim() || 'serif';
  const font = `600 ${SIZE}px ${family}, serif`;
  try {
    await document.fonts.load(font, word);
  } catch {
    // An unloaded face is drawn in the fallback serif: still a word.
  }
  const canvas = document.createElement('canvas');
  const measure = canvas.getContext('2d')!;
  measure.font = font;
  const letters = [...word];
  const widths = letters.map((letter) => measure.measureText(letter).width);
  const tracking = SIZE * 0.14;
  const total = widths.reduce((sum, width) => sum + width, 0) + tracking * (letters.length - 1);
  const pad = 16;
  canvas.width = Math.ceil(total + pad * 2);
  canvas.height = Math.ceil(SIZE * 1.3);
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.font = font;
  context.textBaseline = 'alphabetic';
  context.fillStyle = '#ffffff';
  const starts: number[] = [];
  let pen = pad;
  letters.forEach((letter, index) => {
    starts.push(pen);
    context.fillText(letter, pen, SIZE * 1.02);
    pen += widths[index] + tracking;
  });
  const image = context.getImageData(0, 0, canvas.width, canvas.height).data;

  const random = scatter(word.length * 7919 + drop);
  const gap = drop >= 0 && drop < letters.length ? (widths[drop] + tracking) / total : 0;
  const xs: number[] = [];
  const ys: number[] = [];
  const shifts: number[] = [];
  const dropped: number[] = [];
  for (let row = 0; row < canvas.height; row += STEP) {
    for (let column = 0; column < canvas.width; column += STEP) {
      if (image[(row * canvas.width + column) * 4 + 3] < 110) continue;
      let letter = 0;
      for (let index = 0; index < letters.length; index++) if (column >= starts[index] - tracking / 2) letter = index;
      xs.push((column + (random() - 0.5) * 1.6 - canvas.width / 2) / total);
      ys.push((SIZE * 0.66 - row + (random() - 0.5) * 1.6) / total);
      shifts.push(letter === drop ? 0 : letter < drop ? gap / 2 : -gap / 2);
      dropped.push(letter === drop ? 1 : 0);
    }
  }
  const count = xs.length;
  const seed = new Float32Array(count * 4);
  for (let index = 0; index < seed.length; index++) seed[index] = random();
  return { count, x: Float32Array.from(xs), y: Float32Array.from(ys), shift: Float32Array.from(shifts), dropped: Uint8Array.from(dropped), seed };
}

export function NameInStars({ piece, positions, dedication }: { piece: StagePiece; positions: Map<string, Vec3>; dedication: Dedication }) {
  const word = typeof piece.params?.word === 'string' ? piece.params.word : '';
  const drop = pieceNumber(piece, 'drop', -1);
  const burnAt = pieceNumber(piece, 'burn', 3);
  const [glyphs, setGlyphs] = useState<Glyphs | null>(null);

  useEffect(() => {
    if (!word) return;
    let live = true;
    void sampleWord(word, drop).then((sampled) => {
      if (live) setGlyphs(sampled);
    });
    return () => {
      live = false;
    };
  }, [word, drop]);

  const scene = useMemo(() => {
    const [x, y, z] = positions.get(piece.ids[0]) ?? [0, 0, 0];
    return { anchor: new THREE.Vector3(x, y, z), from: new THREE.Color(dedication.from), to: new THREE.Color(dedication.to) };
  }, [piece, positions, dedication.from, dedication.to]);
  // The camera's axes, worked out afresh each frame.
  const axes = useRef({ right: new THREE.Vector3(), up: new THREE.Vector3(), forward: new THREE.Vector3() });
  const offset = useRef(new THREE.Vector3());

  const write = useCallback(
    (buffers: SpriteBuffers, { camera, size }: RootState): boolean => {
      if (!glyphs) return false;
      const since = stage.time - piece.t;
      const length = piece.until - piece.t;
      if (!stage.active || since < 0 || since > length || !(camera instanceof THREE.PerspectiveCamera)) return false;

      const right = axes.current.right.set(1, 0, 0).applyQuaternion(camera.quaternion);
      const up = axes.current.up.set(0, 1, 0).applyQuaternion(camera.quaternion);
      const forward = axes.current.forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
      // The star as the camera sees it: across, up, and how deep.
      const toStar = offset.current.copy(scene.anchor).sub(camera.position);
      const depth = Math.max(1, toStar.dot(forward));
      const starX = toStar.dot(right);
      const starY = toStar.dot(up);
      const aspect = size.width / Math.max(1, size.height);
      const halfHeight = depth * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
      // The word's width in the world, and how far above its star it is written:
      // never so high that the letterbox takes the tops of its letters.
      const width = Math.min(2 * halfHeight * aspect * 0.8, depth * 0.62);
      const bar = Math.max(0.065, 44 / Math.max(1, size.height));
      const ceiling = halfHeight * (1 - 2 * bar) - width * 0.13;
      const wordY = Math.min(starY + depth * (aspect < 1 ? 0.17 : 0.19), ceiling);
      const lift = wordY - starY;
      const closed = ease((since - burnAt - 1.1) / 1.3);
      const leaving = ease((since - (length - 1.5)) / 1.4);

      for (let index = 0; index < glyphs.count; index++) {
        const delay = glyphs.seed[index * 4];
        const fall = glyphs.seed[index * 4 + 1];
        const grain = glyphs.seed[index * 4 + 2];
        const phase = glyphs.seed[index * 4 + 3];
        const gathered = ease((since - delay * 0.9) / 1.5);
        // Out of a cloud round the star, which hangs `lift` below the word.
        const turn = phase * Math.PI * 2;
        const reach = width * (0.1 + 0.42 * fall);
        const startX = Math.cos(turn) * reach;
        const startY = -lift + Math.sin(turn) * reach * 0.7;
        const startZ = (grain - 0.5) * width * 0.6;
        let px = startX + ((glyphs.x[index] + glyphs.shift[index] * closed) * width - startX) * gathered;
        let py = startY + (glyphs.y[index] * width - startY) * gathered;
        const pz = startZ * (1 - gathered);
        let light = gathered * (0.82 + 0.18 * Math.sin(since * 4.2 + phase * 40));
        let hot = 0;
        if (glyphs.dropped[index]) {
          // The letter that is not hers: it flares, and falls as sparks.
          const burnt = Math.min(1, Math.max(0, (since - burnAt - phase * 0.35) / 1.5));
          hot = Math.sin(Math.PI * Math.min(1, burnt * 2.4));
          px += (grain - 0.5) * width * 0.22 * burnt * burnt;
          py -= width * (0.03 + 0.3 * fall) * burnt * burnt;
          light *= (1 + 3.4 * hot) * (1 - ease((burnt - 0.3) / 0.7));
        }
        if (leaving > 0) {
          const drawn = leaving * leaving;
          px += (0 - px) * drawn;
          py += (-lift - py) * drawn;
          light *= 1 - leaving;
        }
        const at = index * 3;
        const across = starX + px;
        const above = starY + py + lift;
        const deep = depth + pz;
        buffers.position[at] = camera.position.x + right.x * across + up.x * above + forward.x * deep;
        buffers.position[at + 1] = camera.position.y + right.y * across + up.y * above + forward.y * deep;
        buffers.position[at + 2] = camera.position.z + right.z * across + up.z * above + forward.z * deep;
        // Rose at the word's left, gold at its right; white while a spark is hot.
        const blend = Math.min(1, Math.max(0, glyphs.x[index] + 0.5));
        const power = 1.75 * light;
        buffers.color[at] = (scene.from.r + (scene.to.r - scene.from.r) * blend + hot * 0.5) * power;
        buffers.color[at + 1] = (scene.from.g + (scene.to.g - scene.from.g) * blend + hot * 0.5) * power;
        buffers.color[at + 2] = (scene.from.b + (scene.to.b - scene.from.b) * blend + hot * 0.35) * power;
        buffers.size[index] = width * 0.0086 * (0.75 + 0.6 * grain);
      }
      return true;
    },
    [glyphs, piece, scene, burnAt],
  );

  if (!glyphs) return null;
  return <Sprites key={glyphs.count} count={glyphs.count} write={write} />;
}
