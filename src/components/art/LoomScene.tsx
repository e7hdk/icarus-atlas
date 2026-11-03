'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import type { LoomDoor, LoomWork } from '@/features/art/door';
import { FRINGE_ROWS, type LoomCamera } from '@/features/art/loomCamera';
import { isDimmed, useLoomStore } from '@/features/art/store';
import { SAGA_ACCENT, SAGA_ORDER, type SagaId } from '@/features/stories/sagas';
import { CLOTH_FRAGMENT, CLOTH_VERTEX, WARP_FRAGMENT, WARP_VERTEX } from './loomShaders';
import { createClothTexture, createTearTexture, paintCloth } from './loomTextures';

const CELL_PIXELS = { desktop: 64, phone: 32 };
const SEGMENTS_PER_CELL = 3;
const WARP_PER_CELL = 3;
const WARP_STEPS = 34;
const FLOOR_THREADS = 5;
const REVEAL_SECONDS = 1.6;

/** Brightness on a 0..1 scale that the shader reads as 0..1.6, so a tile can burn
 *  brighter than its image while hovered. */
const LIT = 0.625;
const HELD = 0.86;
const DIMMED = 0.1;

const hexRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const smooth = (from: number, to: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
};

/** One weight per saga, evenly across the cloth, in cells. */
export function weightPositions(width: number): number[] {
  return SAGA_ORDER.map((_, index) => 1.5 + ((index + 0.5) * (width - 3)) / SAGA_ORDER.length);
}

function clothGeometry(width: number, height: number): THREE.BufferGeometry {
  // Extended up and out to carry the beam.
  const columns = (width + 3) * SEGMENTS_PER_CELL;
  const rows = (height + 2) * SEGMENTS_PER_CELL;
  const positions = new Float32Array((columns + 1) * (rows + 1) * 3);
  let cursor = 0;
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= columns; i++) {
      positions[cursor++] = -1.5 + i / SEGMENTS_PER_CELL;
      positions[cursor++] = -2 + j / SEGMENTS_PER_CELL;
      positions[cursor++] = 0;
    }
  }
  const indices = new Uint32Array(columns * rows * 6);
  cursor = 0;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < columns; i++) {
      const a = j * (columns + 1) + i;
      const b = a + 1;
      const c = a + columns + 1;
      const d = c + 1;
      indices.set([a, c, b, b, c, d], cursor);
      cursor += 6;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  return geometry;
}

/** Warp threads: straight down the cloth, gathering to one weight per saga below it. */
function warpGeometry(door: LoomDoor): THREE.BufferGeometry {
  const { width } = door.layout;
  const total = width * WARP_PER_CELL;
  const counts = new Map<SagaId, number>(SAGA_ORDER.map((saga) => [saga, 0]));
  for (const work of door.works) counts.set(work.saga, (counts.get(work.saga) ?? 0) + 1);
  const spare = total - FLOOR_THREADS * SAGA_ORDER.length;
  const threads = SAGA_ORDER.map((saga) => FLOOR_THREADS + Math.round((spare * (counts.get(saga) ?? 0)) / door.works.length));
  const largest = threads.indexOf(Math.max(...threads));
  threads[largest] += total - threads.reduce((sum, n) => sum + n, 0);

  const ordered = threads.flatMap((n, saga) => new Array<number>(n).fill(saga));
  const weights = weightPositions(width);
  const positions = new Float32Array(ordered.length * WARP_STEPS * 2 * 3);
  const colors = new Float32Array(positions.length);
  let cursor = 0;
  ordered.forEach((saga, index) => {
    const x = (index + 0.5) / WARP_PER_CELL;
    const end = weights[saga] + Math.sin(index * 12.9898) * 0.25;
    const color = hexRgb(SAGA_ACCENT[SAGA_ORDER[saga]]).map((value) => (value / 255) * 0.9);
    for (let step = 0; step < WARP_STEPS; step++) {
      for (const t of [step / WARP_STEPS, (step + 1) / WARP_STEPS]) {
        positions.set([x, end, t], cursor);
        colors.set(color, cursor);
        cursor += 3;
      }
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function createCellData(door: LoomDoor): Uint8Array<ArrayBuffer> {
  const { width, height } = door.layout;
  const data = new Uint8Array(width * height * 4);
  for (let row = 0; row < height; row++) {
    for (let x = 0; x < width; x++) {
      const at = door.cellOf[row * width + x];
      let saga = at >= 0 ? door.works[at].saga : null;
      for (let up = row; !saga && up >= 0; up--) {
        const k = door.cellOf[up * width + x];
        if (k >= 0) saga = door.works[k].saga;
      }
      for (let down = row; !saga && down < height; down++) {
        const k = door.cellOf[down * width + x];
        if (k >= 0) saga = door.works[k].saga;
      }
      const [r, g, b] = hexRgb(SAGA_ACCENT[saga ?? 'heroic']);
      const cell = (row * width + x) * 4;
      // The low bit of red marks an anchor: the warp never crosses one.
      data[cell] = (r & 254) | (at >= 0 && door.works[at].w > 1 ? 1 : 0);
      data[cell + 1] = g;
      data[cell + 2] = b;
      data[cell + 3] = at >= 0 ? 0 : Math.round(LIT * 255);
    }
  }
  return data;
}

function writeBrightness(cells: Uint8Array, work: LoomWork, width: number, level: number) {
  const value = Math.round(level * 255);
  for (let dy = 0; dy < work.h; dy++) {
    for (let dx = 0; dx < work.w; dx++) cells[((work.row + dy) * width + work.x + dx) * 4 + 3] = value;
  }
}

function loadBitmap(url: string): Promise<ImageBitmap> {
  return fetch(url)
    .then((response) => response.blob())
    .then((blob) => createImageBitmap(blob));
}

function createClothScene(door: LoomDoor, cellPixels: number, reveal: boolean) {
  const { width, height } = door.layout;
  const cellData = createCellData(door);
  const cells = new THREE.DataTexture(cellData, width, height, THREE.RGBAFormat);
  cells.magFilter = THREE.NearestFilter;
  cells.minFilter = THREE.NearestFilter;
  cells.needsUpdate = true;
  const cloth = createClothTexture(door, cellPixels);
  const tear = createTearTexture(door);
  const clothMaterial = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: CLOTH_VERTEX,
    fragmentShader: CLOTH_FRAGMENT,
    uniforms: {
      uTex: { value: cloth },
      uCells: { value: cells },
      uCrack: { value: tear },
      uGrid: { value: new THREE.Vector2(width, height) },
      uTime: { value: 0 },
      uAmp: { value: 1 },
      uHover: { value: new THREE.Vector3() },
      uWeave: { value: 1 },
      uThreads: { value: 8 },
      uFell: { value: reveal ? 0 : height + 1 },
    },
  });
  const warpMaterial = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: WARP_VERTEX,
    fragmentShader: WARP_FRAGMENT,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uGrid: { value: new THREE.Vector2(width, height) },
      uTime: { value: 0 },
      uAmp: { value: 1 },
      uTop: { value: -1.05 },
      uBottom: { value: height + FRINGE_ROWS + 0.35 },
      uRows: { value: height },
      uAlpha: { value: 0.5 },
    },
  });
  return {
    cellData,
    cells,
    cloth,
    tear,
    clothMaterial,
    warpMaterial,
    clothGeometry: clothGeometry(width, height),
    warpGeometry: warpGeometry(door),
  };
}

type ClothScene = ReturnType<typeof createClothScene>;

interface FrameState {
  level: Float32Array;
  target: Float32Array;
  time: number;
  lift: number;
  fell: number;
}

/** One frame of the cloth: brightness eases toward its targets, the weave and the
 *  ripple give way as the view closes in, and the reveal runs once the image is in. */
function advanceCloth(scene: ClothScene, door: LoomDoor, now: FrameState, view: { px: number; phone: boolean; dt: number; painted: boolean }) {
  const { width, height } = door.layout;
  const { px, phone, dt, painted } = view;
  const hovered = useLoomStore.getState().hover?.index ?? -1;
  const rate = 1 - Math.exp(-dt * 9);
  let dirty = false;
  for (const work of door.works) {
    const goal = work.index === hovered ? Math.max(now.target[work.index], HELD) : now.target[work.index];
    const step = goal - now.level[work.index];
    if (Math.abs(step) < 0.004) continue;
    now.level[work.index] += step * rate;
    writeBrightness(scene.cellData, work, width, now.level[work.index]);
    dirty = true;
  }
  if (dirty) scene.cells.needsUpdate = true;

  const amp = phone ? 0 : 1 - smooth(26, 62, px);
  const weave = 1 - smooth(30, 84, px);
  const hover = hovered >= 0 ? door.works[hovered] : null;
  now.lift += ((hover ? 1 : 0) - now.lift) * (1 - Math.exp(-dt * 14));
  if (painted && now.fell <= height) now.fell += (dt / REVEAL_SECONDS) * (height + 1);

  const cloth = scene.clothMaterial.uniforms;
  cloth.uTime.value = now.time;
  cloth.uAmp.value = amp;
  cloth.uWeave.value = weave;
  cloth.uFell.value = now.fell;
  if (hover) cloth.uHover.value.set(hover.x + hover.w / 2, hover.row + hover.h / 2, now.lift * amp);
  else cloth.uHover.value.z = now.lift * amp;
  const warp = scene.warpMaterial.uniforms;
  warp.uTime.value = now.time;
  warp.uAmp.value = amp;
}

interface LoomSceneProps {
  door: LoomDoor;
  rig: LoomCamera;
  pointer: RefObject<{ x: number; y: number }>;
  phone: boolean;
  reveal: boolean;
  /** Called every frame once the view is solved, so the 2D layers can follow it. */
  onFrame: () => void;
}

export function LoomScene({ door, rig, pointer, phone, reveal, onFrame }: LoomSceneProps) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const { height } = door.layout;
  const cellPixels = phone ? CELL_PIXELS.phone : CELL_PIXELS.desktop;

  const scene = useMemo(() => createClothScene(door, cellPixels, reveal), [door, cellPixels, reveal]);

  useEffect(
    () => () => {
      scene.cells.dispose();
      scene.cloth.dispose();
      scene.tear.dispose();
      scene.clothMaterial.dispose();
      scene.warpMaterial.dispose();
      scene.clothGeometry.dispose();
      scene.warpGeometry.dispose();
    },
    [scene],
  );

  const state = useRef<FrameState>({
    level: new Float32Array(door.works.length),
    target: new Float32Array(door.works.length).fill(LIT),
    time: 0,
    lift: 0,
    fell: reveal ? 0 : height + 1,
  });

  // The low-quality sheet paints at once; the full sheets replace it when they land.
  const painted = useRef(false);
  useEffect(() => {
    let cancelled = false;
    const { cell, lqCell } = door.sheet;
    loadBitmap('/art/sheet-lq.webp').then((bitmap) => {
      if (cancelled || painted.current) return;
      paintCloth(scene.cloth, door, cellPixels, bitmap, lqCell, null);
      painted.current = true;
    });
    Promise.all([loadBitmap('/art/sheet.webp'), loadBitmap('/art/anchors.webp')]).then(([sheet, anchors]) => {
      // Repainting costs a long frame, so it waits for the cloth to finish falling.
      const upgrade = () => {
        if (cancelled) return;
        if (painted.current && state.current.fell <= height) {
          window.requestAnimationFrame(upgrade);
          return;
        }
        paintCloth(scene.cloth, door, cellPixels, sheet, cell, anchors);
        painted.current = true;
      };
      upgrade();
    });
    return () => {
      cancelled = true;
      painted.current = false;
    };
  }, [door, scene, cellPixels, height]);

  useEffect(() => {
    const refresh = () => {
      const filters = useLoomStore.getState();
      const { target } = state.current;
      for (const work of door.works) target[work.index] = isDimmed(work, filters) ? DIMMED : LIT;
    };
    refresh();
    return useLoomStore.subscribe(refresh);
  }, [door]);

  useFrame((_, delta) => {
    const dt = Math.min(0.05, delta);
    const now = state.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) now.time += dt;

    rig.tick(dt, pointer.current.x, pointer.current.y, reduced || phone);
    rig.apply(camera);
    advanceCloth(scene, door, now, { px: rig.s, phone, dt, painted: painted.current });
    onFrame();
  });

  return (
    <>
      <lineSegments geometry={scene.warpGeometry} material={scene.warpMaterial} frustumCulled={false} />
      <mesh geometry={scene.clothGeometry} material={scene.clothMaterial} frustumCulled={false} />
    </>
  );
}
