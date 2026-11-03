import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace, ClampToEdgeWrapping } from 'three';
import type { LoomDoor } from '@/features/art/door';
import { TEAR_FROM, TEAR_TO } from '@/features/art/loom';

/** The cloth's textures: the tiles composed into one image, and the tear. The cloth is
 *  drawn as a single texture so mipmaps average real neighbours; sampling the sprite
 *  sheets directly would bleed unrelated works through the mips (LOOM_PLAN §6). */

const GAP = '#05020f';
/** Empty cells this far above the tear read as wear on its torn rim. */
const RIM_ROWS = 2;

function asTexture(canvas: HTMLCanvasElement): CanvasTexture {
  const texture = new CanvasTexture(canvas);
  texture.flipY = false;
  texture.colorSpace = NoColorSpace;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  return texture;
}

export function createClothTexture(door: LoomDoor, cellPixels: number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = door.layout.width * cellPixels;
  canvas.height = door.layout.height * cellPixels;
  const texture = asTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

/** Draw every work into the cloth, from the low-quality sheet alone or from the full
 *  sheets. Anchors keep a gold hairline: gold is jewelry, and these are the jewels. */
export function paintCloth(
  texture: CanvasTexture,
  door: LoomDoor,
  cellPixels: number,
  sheet: CanvasImageSource,
  sheetCell: number,
  anchors: CanvasImageSource | null,
) {
  const canvas = texture.image as HTMLCanvasElement;
  const context = canvas.getContext('2d');
  if (!context) return;
  const { layout, sheet: atlas } = door;
  context.imageSmoothingQuality = 'high';

  context.fillStyle = GAP;
  for (let row = Math.max(0, layout.tearTop - RIM_ROWS); row < layout.tearTop + layout.tearRows; row++) {
    for (let x = 0; x < layout.width; x++) {
      if (door.cellOf[row * layout.width + x] < 0) {
        context.fillRect(x * cellPixels, row * cellPixels, cellPixels, cellPixels);
      }
    }
  }

  for (const work of door.works) {
    const dx = work.x * cellPixels;
    const dy = work.row * cellPixels;
    const dw = work.w * cellPixels;
    const dh = work.h * cellPixels;
    if (anchors && work.anchor >= 0) {
      const slot = atlas.anchorSlot;
      const sx = (work.anchor % atlas.anchorColumns) * slot;
      const sy = Math.floor(work.anchor / atlas.anchorColumns) * slot;
      context.drawImage(anchors, sx, sy, work.w * atlas.cell, work.h * atlas.cell, dx, dy, dw, dh);
    } else {
      const sx = (work.sprite % atlas.columns) * sheetCell;
      const sy = Math.floor(work.sprite / atlas.columns) * sheetCell;
      context.drawImage(sheet, sx, sy, sheetCell, sheetCell, dx, dy, dw, dh);
    }
    if (work.w > 1) {
      const line = Math.max(1, cellPixels * 0.04);
      context.strokeStyle = 'rgba(252,211,77,.72)';
      context.lineWidth = line;
      context.strokeRect(dx + line / 2, dy + line / 2, dw - line, dh - line);
    }
  }
  texture.needsUpdate = true;
}

/** The tear: red marks the gold mend, green the bare gap. Seeded, so the cloth always
 *  tears the same way. */
export function createTearTexture(door: LoomDoor): CanvasTexture {
  const { width, height, tearTop, tearRows } = door.layout;
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const canvasWidth = 2560;
  const scale = canvasWidth / width;
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext('2d');
  if (!context) return asTexture(canvas);
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const edge = (base: number, amplitude: number) => {
    const points: [number, number][] = [];
    let y = 0;
    let velocity = 0;
    for (let i = 0; i <= width * 2; i++) {
      velocity = velocity * 0.72 + (random() - 0.5) * 0.62;
      y = (y + velocity) * 0.86;
      points.push([(i / 2) * scale, (base + Math.max(-amplitude, Math.min(amplitude, y))) * scale]);
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
  for (let row = Math.max(0, tearTop - RIM_ROWS); row < tearTop; row++) {
    for (let x = 0; x < width; x++) {
      if (door.cellOf[row * width + x] < 0) context.fillRect(x * scale, row * scale, scale + 1, scale + 1);
    }
  }
  // The survivors of the gap are not torn.
  context.fillStyle = '#000';
  for (const work of door.works) {
    if (work.sortYear >= TEAR_FROM && work.sortYear < TEAR_TO) {
      context.fillRect(work.x * scale, work.row * scale, scale, scale);
    }
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
    // Kintsugi veins running off the rim into the cloth.
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
  // Sutures: the gold stitches holding the two halves together.
  for (let i = 3; i < width; i += 6) stroke([top[i * 2], bottom[i * 2 + 1]], 1.2, 0.7, 4);
  return asTexture(canvas);
}

/** The night behind the cloth, painted once per view size. */
export function paintSky(canvas: HTMLCanvasElement, width: number, height: number, pixelRatio: number) {
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  const context = canvas.getContext('2d');
  if (!context) return;
  context.scale(pixelRatio, pixelRatio);
  const ground = context.createRadialGradient(width * 0.5, height * 0.46, 40, width * 0.5, height * 0.5, Math.max(width, height) * 0.72);
  ground.addColorStop(0, '#191036');
  ground.addColorStop(0.42, '#0c0624');
  ground.addColorStop(1, '#05020f');
  context.fillStyle = ground;
  context.fillRect(0, 0, width, height);
  const haze = (x: number, y: number, radius: number, color: string) => {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  };
  haze(width * 0.2, height * 0.28, width * 0.34, 'rgba(124,77,255,.10)');
  haze(width * 0.84, height * 0.72, width * 0.3, 'rgba(255,64,129,.06)');
  haze(width * 0.52, height * 0.96, width * 0.34, 'rgba(252,211,77,.05)');
  let seed = 11;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 360; i++) {
    const glow = random() * random();
    context.fillStyle = `rgba(226,232,255,${0.08 + glow * 0.7})`;
    const radius = 0.35 + random() * random() * 1.1;
    context.beginPath();
    context.arc(random() * width, random() * height, radius, 0, Math.PI * 2);
    context.fill();
  }
}
