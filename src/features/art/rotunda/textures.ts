import * as THREE from 'three';
import { loadBitmap } from '@/features/art/bitmap';
import type { LoomDoor, LoomWork } from '@/features/art/door';
import { TEAR_FROM, TEAR_TO } from '@/features/art/loom';
import { ATLAS_FILES } from '@/features/atlas/files';
import { SAGA_ACCENT, SAGA_ORDER } from '@/features/stories/sagas';
import { clamp, type Drum } from './drum';

/** The cloth's textures (docs/LOOM_PLAN.md §12): every work drawn into one canvas from
 *  the baked sheets, the tear's mask, and each cell's saga and brightness. */

export type SheetImage = HTMLImageElement | ImageBitmap;
/** The full sheets: 64 px a cell, and the anchors' own slots. */
export interface FullSheets {
  full: SheetImage;
  anchors: SheetImage;
}
/** The low-quality sheet at once, the full ones once they land. */
export interface Sheets {
  lq: SheetImage;
  full: FullSheets | null;
}

export const imageWidth = (image: SheetImage) => (image instanceof HTMLImageElement ? image.naturalWidth : image.width);
export const imageHeight = (image: SheetImage) =>
  image instanceof HTMLImageElement ? image.naturalHeight : image.height;

/** An image decoded before it is used, so cutting it later does not stall a frame. A
 *  hidden page may hold a decode back until it shows, so the wait for one is short. */
export function loadImage(src: string, cors = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (cors) image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => {
      const done = () => resolve(image);
      Promise.race([image.decode(), new Promise((wait) => window.setTimeout(wait, 1000))]).then(done, done);
    };
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

/** The low-quality sheet, 24 px a cell: the first cloth is woven from it. The export
 *  preloads it with the door's HTML (scripts/finish-export.ts). */
export function loadPreviewSheet(): Promise<SheetImage> {
  return loadBitmap(ATLAS_FILES.loomPreview);
}

/** The full sheets, which replace the first cloth once the opening fall is over. */
export async function loadFullSheets(): Promise<FullSheets> {
  const [full, anchors] = await Promise.all([loadBitmap('/art/sheet.webp'), loadBitmap('/art/anchors.webp')]);
  return { full, anchors };
}

/** Where a work's picture sits in the sheets: its anchor slot once the full sheets
 *  have landed, otherwise its one sprite cell, stretched over its tile. */
export function spriteOf(work: LoomWork, door: LoomDoor, sheets: Sheets): [SheetImage, number, number, number, number] {
  const { sheet } = door;
  if (sheets.full && work.anchor >= 0) {
    const slot = sheet.anchorSlot;
    return [
      sheets.full.anchors,
      (work.anchor % sheet.anchorColumns) * slot,
      Math.floor(work.anchor / sheet.anchorColumns) * slot,
      work.w * sheet.cell,
      work.h * sheet.cell,
    ];
  }
  const image = sheets.full?.full ?? sheets.lq;
  const cell = sheets.full ? sheet.cell : sheet.lqCell;
  return [image, (work.sprite % sheet.columns) * cell, Math.floor(work.sprite / sheet.columns) * cell, cell, cell];
}

/** Each saga's colour in SAGA_ORDER, as bytes and as 0–1 channels. */
export const SAGA_BYTES = SAGA_ORDER.map((saga) => {
  const hex = SAGA_ACCENT[saga];
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
});
export const SAGA_RGB = SAGA_BYTES.map((bytes) => bytes.map((byte) => byte / 255) as [number, number, number]);
export const SAGA_COLOR = SAGA_ORDER.map((saga) => new THREE.Color(SAGA_ACCENT[saga]));

export interface ClothBands {
  /** Saga index per work. */
  sagaOf: Int8Array;
  /** Saga index under each cell, empty ones included, so the bare warp keeps its colour. */
  cellSaga: Int16Array;
  /** Where the warp leaves the cloth and gathers on one clay weight per saga. */
  bands: { saga: number; x0: number; x1: number }[];
}

export function clothBands(door: LoomDoor): ClothBands {
  const { width: W, height: H } = door.layout;
  const sagaOf = Int8Array.from(door.works, (work) => SAGA_ORDER.indexOf(work.saga));
  const cellSaga = new Int16Array(W * H);
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) {
      let saga = 0;
      for (let d = 0; d < H; d++) {
        const hit = [y - d, y + d].find((yy) => yy >= 0 && yy < H && door.cellOf[yy * W + x] >= 0);
        if (hit !== undefined) {
          saga = sagaOf[door.cellOf[hit * W + x]];
          break;
        }
      }
      cellSaga[y * W + x] = saga;
    }
  }
  // The warp leaves the cloth at its last full row.
  let fullRow = H - 1;
  for (let row = H - 1; row >= 0; row--) {
    let n = 0;
    for (let x = 0; x < W; x++) if (door.cellOf[row * W + x] >= 0) n++;
    if (n >= W * 0.9) {
      fullRow = row;
      break;
    }
  }
  const bands: ClothBands['bands'] = [];
  for (let x = 0; x < W; x++) {
    const saga = cellSaga[fullRow * W + x];
    const last = bands[bands.length - 1];
    if (last && last.saga === saga) last.x1 = x + 1;
    else bands.push({ saga, x0: x, x1: x + 1 });
  }
  return { sagaOf, cellSaga, bands };
}

/** The cloth's own canvas: `cell` pixels a cell. The sprites arrive at 64, and the
 *  woven Commons images fill it out. */
export function createClothTexture(drum: Drum, cell: number, anisotropy: number) {
  const canvas = document.createElement('canvas');
  canvas.width = drum.W * cell;
  canvas.height = drum.H * cell;
  const texture = new THREE.CanvasTexture(canvas);
  Object.assign(texture, {
    flipY: false,
    colorSpace: THREE.NoColorSpace,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    anisotropy: Math.min(8, anisotropy),
  });
  return { canvas, texture };
}

/** A gold hairline round an anchor, as the door draws it. */
export function strokeAnchor(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cell: number) {
  const line = Math.max(1, cell * 0.04);
  context.strokeStyle = 'rgba(252,211,77,.72)';
  context.lineWidth = line;
  context.strokeRect(x + line / 2, y + line / 2, w - line, h - line);
}

/** Every work drawn into the cloth from the sheets there are, except those already woven. */
export function paintCloth(
  canvas: HTMLCanvasElement,
  texture: THREE.Texture,
  door: LoomDoor,
  cell: number,
  sheets: Sheets,
  skip: Set<number>,
) {
  const { width: W, tearTop, tearRows } = door.layout;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.imageSmoothingQuality = 'high';
  context.fillStyle = '#05020f';
  for (let row = Math.max(0, tearTop - 2); row < tearTop + tearRows; row++) {
    for (let x = 0; x < W; x++) if (door.cellOf[row * W + x] < 0) context.fillRect(x * cell, row * cell, cell, cell);
  }
  for (const work of door.works) {
    if (skip.has(work.index)) continue;
    const dx = work.x * cell;
    const dy = work.row * cell;
    const dw = work.w * cell;
    const dh = work.h * cell;
    context.drawImage(...spriteOf(work, door, sheets), dx, dy, dw, dh);
    if (work.w > 1) strokeAnchor(context, dx, dy, dw, dh, cell);
  }
  texture.needsUpdate = true;
}

/** The tear: red marks the gold mend, green the bare gap. Seeded, so it always tears alike. */
export function createTearTexture(door: LoomDoor, drum: Drum): THREE.CanvasTexture {
  const { tearTop, tearRows } = door.layout;
  const { W, H } = drum;
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const canvasWidth = 2560;
  const scale = canvasWidth / W;
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = Math.round(H * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No 2D context for the tear');
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const edge = (base: number, amplitude: number) => {
    const points: [number, number][] = [];
    let y = 0;
    let velocity = 0;
    for (let i = 0; i <= W * 2; i++) {
      velocity = velocity * 0.72 + (random() - 0.5) * 0.62;
      y = (y + velocity) * 0.86;
      points.push([(i / 2) * scale, (base + clamp(y, -amplitude, amplitude)) * scale]);
    }
    return points;
  };
  const top = edge(tearTop - 0.1, 0.5);
  const bottom = edge(tearTop + tearRows + 0.1, 0.5);
  context.fillStyle = '#0f0';
  context.beginPath();
  top.forEach(([x, y], i) => (i ? context.lineTo(x, y) : context.moveTo(x, y)));
  [...bottom].reverse().forEach(([x, y]) => context.lineTo(x, y));
  context.closePath();
  context.fill();
  for (let row = Math.max(0, tearTop - 2); row < tearTop; row++) {
    for (let x = 0; x < W; x++) {
      if (door.cellOf[row * W + x] < 0) context.fillRect(x * scale, row * scale, scale + 1, scale + 1);
    }
  }
  context.fillStyle = '#000';
  for (const work of door.works) {
    if (work.sortYear >= TEAR_FROM && work.sortYear < TEAR_TO) context.fillRect(work.x * scale, work.row * scale, scale, scale);
  }
  context.globalCompositeOperation = 'lighter';
  const stroke = (points: [number, number][], lineWidth: number, alpha: number, blur: number) => {
    context.strokeStyle = `rgba(255,0,0,${alpha})`;
    context.shadowColor = 'rgba(255,0,0,.9)';
    context.shadowBlur = blur;
    context.lineWidth = lineWidth;
    context.lineJoin = 'round';
    context.beginPath();
    points.forEach(([x, y], i) => (i ? context.lineTo(x, y) : context.moveTo(x, y)));
    context.stroke();
  };
  for (const line of [top, bottom]) {
    stroke(line, 2.2, 0.95, 9);
    for (let n = 0; n < 7; n++) {
      const start = line[2 + Math.floor(random() * (line.length - 4))];
      const direction = line === top ? -1 : 1;
      const vein: [number, number][] = [start];
      let [x, y] = start;
      let bend = (random() - 0.5) * 1.1;
      const length = 2 + Math.floor(random() * 4);
      for (let i = 0; i < length; i++) {
        bend += (random() - 0.5) * 0.9;
        x += Math.sin(bend) * scale * 0.55;
        y += direction * Math.cos(bend) * scale * 0.5;
        vein.push([x, y]);
      }
      stroke(vein, 1.1, 0.6, 4);
    }
  }
  for (let i = 3; i < W; i += 6) stroke([top[i * 2], bottom[i * 2 + 1]], 1.2, 0.7, 4);
  const texture = new THREE.CanvasTexture(canvas);
  Object.assign(texture, { flipY: false, colorSpace: THREE.NoColorSpace, minFilter: THREE.LinearMipmapLinearFilter });
  return texture;
}

/** Per cell: the saga colour (its lowest red bit flags an anchor) and the brightness. */
export function createCellTexture(door: LoomDoor, bands: ClothBands) {
  const { width: W, height: H } = door.layout;
  const bytes = new Uint8Array(W * H * 4);
  const texture = new THREE.DataTexture(bytes, W, H, THREE.RGBAFormat);
  Object.assign(texture, {
    magFilter: THREE.NearestFilter,
    minFilter: THREE.NearestFilter,
    colorSpace: THREE.NoColorSpace,
  });
  const write = (bright: Float32Array) => {
    for (let i = 0; i < W * H; i++) {
      const index = door.cellOf[i];
      const [r, g, b] = SAGA_BYTES[index >= 0 ? bands.sagaOf[index] : bands.cellSaga[i]];
      bytes[i * 4] = (r & 254) | (index >= 0 && door.works[index].w > 1 ? 1 : 0);
      bytes[i * 4 + 1] = g;
      bytes[i * 4 + 2] = b;
      bytes[i * 4 + 3] = Math.round(clamp((index >= 0 ? bright[index] : 1) / 1.6, 0, 1) * 255);
    }
    texture.needsUpdate = true;
  };
  return { texture, write };
}
