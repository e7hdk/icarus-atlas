'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import type { LoomDoor, LoomWork } from '@/features/art/door';
import { FRINGE_ROWS, type LoomCamera } from '@/features/art/loomCamera';
import type { LoomWeb } from '@/features/art/loomWeb';
import { isDimmed, useLoomStore } from '@/features/art/store';
import { SAGA_ACCENT, SAGA_ORDER, type SagaId } from '@/features/stories/sagas';
import {
  CLOTH_FRAGMENT,
  CLOTH_VERTEX,
  STITCH_FRAGMENT,
  STITCH_VERTEX,
  WARP_FRAGMENT,
  WARP_VERTEX,
} from './loomShaders';
import { createClothTexture, createTearTexture, paintCloth } from './loomTextures';

const CELL_PIXELS = { desktop: 64, phone: 32 };
const SEGMENTS_PER_CELL = 3;
const WARP_PER_CELL = 3;
const WARP_STEPS = 34;
const FLOOR_THREADS = 5;
const REVEAL_SECONDS = 1.6;
const STITCH_STEPS = 15;

/** Brightness on a 0..1 scale that the shader reads as 0..1.6, so a tile can burn
 *  brighter than its image while hovered. */
const LIT = 0.625;
const HELD = 0.86;
const DIMMED = 0.1;
/** While a web is pulled: lifted works leave a hollow, their threads' works stay lit. */
const LIFTED = 0.03;
const NEAR = 0.6;
const AWAY = 0.085;

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

/** One ribbon per stitch: a strip along `t`, instanced with the two works it joins. */
function stitchGeometry(door: LoomDoor): THREE.InstancedBufferGeometry {
  const strip: number[] = [];
  for (let i = 0; i <= STITCH_STEPS; i++) strip.push(i / STITCH_STEPS, -1, 0, i / STITCH_STEPS, 1, 0);
  const index: number[] = [];
  for (let i = 0; i < STITCH_STEPS; i++) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  const ends: number[] = [];
  const ids: number[] = [];
  const colors: number[] = [];
  for (const thread of door.threads) {
    const [r, g, b] = hexRgb(SAGA_ACCENT[thread.saga]).map((value) => value / 255);
    for (let i = 1; i < thread.works.length; i++) {
      const from = door.works[thread.works[i - 1]];
      const to = door.works[thread.works[i]];
      const seed = Math.abs(Math.sin(thread.index * 12.9898 + i * 78.233) * 43758.5453) % 1;
      ends.push(from.x + from.w / 2, from.row + from.h / 2, to.x + to.w / 2, to.row + to.h / 2);
      ids.push(from.index, to.index, thread.index, i - 1);
      colors.push(r, g, b, seed);
    }
  }
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(strip, 3));
  geometry.setIndex(index);
  geometry.setAttribute('aEnds', new THREE.InstancedBufferAttribute(new Float32Array(ends), 4));
  geometry.setAttribute('aIds', new THREE.InstancedBufferAttribute(new Float32Array(ids), 4));
  geometry.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(colors), 4));
  geometry.instanceCount = ids.length / 4;
  return geometry;
}

function rowTexture(data: Float32Array | Uint8Array, width: number): THREE.DataTexture {
  const texture = new THREE.DataTexture(
    data,
    width,
    1,
    THREE.RGBAFormat,
    data instanceof Float32Array ? THREE.FloatType : THREE.UnsignedByteType,
  );
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  return texture;
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

function createClothScene(door: LoomDoor, web: LoomWeb, cellPixels: number, reveal: boolean) {
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
    side: THREE.DoubleSide,
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
  const lift = rowTexture(web.lift, door.works.length);
  const threadState = rowTexture(web.state, Math.max(1, door.threads.length));
  const stitchMaterial = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: STITCH_VERTEX,
    fragmentShader: STITCH_FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    // Light adds to colour and leaves alpha alone, so a ribbon over the sky adds onto
    // the sky painted behind this transparent canvas.
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
    uniforms: {
      uGrid: { value: new THREE.Vector2(width, height) },
      uTime: { value: 0 },
      uAmp: { value: 1 },
      uEye: { value: new THREE.Vector3() },
      uLift: { value: lift },
      uState: { value: threadState },
      uPx: { value: 1 / 16 },
      uFace: { value: 1 },
    },
  });
  return {
    cellData,
    cells,
    cloth,
    tear,
    lift,
    threadState,
    clothMaterial,
    warpMaterial,
    stitchMaterial,
    clothGeometry: clothGeometry(width, height),
    warpGeometry: warpGeometry(door),
    stitchGeometry: stitchGeometry(door),
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
 *  ripple give way as the view closes in, the reveal runs once the image is in, and
 *  the web's threads and lifted works ease to where they are going. */
function advanceCloth(
  scene: ClothScene,
  door: LoomDoor,
  web: LoomWeb,
  now: FrameState,
  view: { px: number; phone: boolean; dt: number; painted: boolean; yaw: number; eye: THREE.Vector3 },
) {
  const { width, height } = door.layout;
  const { px, phone, dt, painted } = view;
  const { hover: hoverState, face } = useLoomStore.getState();
  const hovered = hoverState?.index ?? -1;
  const rate = 1 - Math.exp(-dt * 9);
  let dirty = false;
  // A lifted work hovered in the air leaves its hollow in the cloth dark.
  const liftedHover = web.items.get(hovered);
  const hoverOnCloth = hovered >= 0 && !(liftedHover && !liftedHover.leaving);
  for (const work of door.works) {
    const goal = hoverOnCloth && work.index === hovered ? Math.max(now.target[work.index], HELD) : now.target[work.index];
    const step = goal - now.level[work.index];
    if (Math.abs(step) < 0.004) continue;
    now.level[work.index] += step * rate;
    writeBrightness(scene.cellData, work, width, now.level[work.index]);
    dirty = true;
  }
  if (dirty) scene.cells.needsUpdate = true;

  const amp = phone ? 0 : 1 - smooth(26, 62, px);
  const weave = 1 - smooth(30, 84, px);
  // On the back a hovered work lights its threads but does not rise toward the eye.
  const hover = hoverOnCloth && !face ? door.works[hovered] : null;
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

  const moved = web.advance(dt);
  if (moved.lift) scene.lift.needsUpdate = true;
  if (moved.state) scene.threadState.needsUpdate = true;
  const stitch = scene.stitchMaterial.uniforms;
  stitch.uTime.value = now.time;
  stitch.uAmp.value = amp;
  stitch.uPx.value = 1 / px;
  stitch.uFace.value = Math.cos(view.yaw);
  stitch.uEye.value.copy(view.eye);
}

interface LoomSceneProps {
  door: LoomDoor;
  web: LoomWeb;
  rig: LoomCamera;
  pointer: RefObject<{ x: number; y: number }>;
  phone: boolean;
  reveal: boolean;
  /** Called every frame once the view is solved, so the 2D layers can follow it. */
  onFrame: () => void;
}

export function LoomScene({ door, web, rig, pointer, phone, reveal, onFrame }: LoomSceneProps) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const { height } = door.layout;
  const cellPixels = phone ? CELL_PIXELS.phone : CELL_PIXELS.desktop;

  const scene = useMemo(() => createClothScene(door, web, cellPixels, reveal), [door, web, cellPixels, reveal]);

  useEffect(
    () => () => {
      scene.cells.dispose();
      scene.cloth.dispose();
      scene.tear.dispose();
      scene.lift.dispose();
      scene.threadState.dispose();
      scene.clothMaterial.dispose();
      scene.warpMaterial.dispose();
      scene.stitchMaterial.dispose();
      scene.clothGeometry.dispose();
      scene.warpGeometry.dispose();
      scene.stitchGeometry.dispose();
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
      const near = web.near(filters.peekThread);
      for (const work of door.works) {
        if (!near) {
          target[work.index] = isDimmed(work, filters) ? DIMMED : LIT;
          continue;
        }
        const lifted = web.items.get(work.index);
        target[work.index] = lifted && !lifted.leaving ? LIFTED : near.has(work.index) ? NEAR : AWAY;
      }
      web.aim({
        hover: filters.hover?.index ?? null,
        face: filters.face,
        saga: filters.peekSaga ?? filters.saga,
        peek: filters.peekThread,
        sparse: phone,
      });
    };
    refresh();
    return useLoomStore.subscribe(refresh);
  }, [door, web, phone]);

  useFrame((_, delta) => {
    const dt = Math.min(0.05, delta);
    const now = state.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) now.time += dt;

    const { focus } = useLoomStore.getState();
    rig.tick(dt, pointer.current.x, pointer.current.y, reduced || phone ? 'still' : focus !== null ? 'web' : 'cloth');
    rig.apply(camera);
    advanceCloth(scene, door, web, now, {
      px: rig.s,
      phone,
      dt,
      painted: painted.current,
      yaw: rig.yaw,
      eye: camera.position,
    });
    onFrame();
  });

  return (
    <>
      <lineSegments geometry={scene.warpGeometry} material={scene.warpMaterial} frustumCulled={false} renderOrder={1} />
      <mesh geometry={scene.clothGeometry} material={scene.clothMaterial} frustumCulled={false} />
      <mesh geometry={scene.stitchGeometry} material={scene.stitchMaterial} frustumCulled={false} renderOrder={2} />
    </>
  );
}
