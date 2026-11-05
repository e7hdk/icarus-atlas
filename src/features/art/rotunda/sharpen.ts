import * as THREE from 'three';
import { commonsOriginalUrl, commonsThumbAtLeast, commonsThumbUrl } from '@/features/art/commons';
import type { LoomDoor, LoomWork } from '@/features/art/door';
import { clamp, gridGeometry, type Drum } from './drum';
import { FINE_FS, PLAIN_VS } from './shaders';
import { imageHeight, imageWidth, loadImage, strokeAnchor, type FullSheets, type SheetImage } from './textures';

/** Sharper images (docs/LOOM_PLAN.md §12). The baked sheet gives every work 64 px a
 *  cell, soft once the cloth closes round you. Inside, each work's Commons thumbnail is
 *  woven into the cloth itself at its full cell resolution: the works you face first,
 *  then the rest of the room by how far you would have to turn to see them. A woven
 *  work stays sharp, so turning back finds it as it was. Where works show larger
 *  still, finer images are laid over the cloth around the way you look. Either way the
 *  image is cut where the bake cut its sprite, so it sharpens in place instead of
 *  shifting. */

/** Requests to Commons at a time. */
const REQUESTS = 6;
/** Radians from the line of sight that count as in view. */
const VIEW = 0.6;
/** Woven works copied into the cloth a frame, and finer images uploaded a frame. */
const WEAVE_PER_FRAME = 3;
const SETTLE_PER_FRAME = 2;

export type Crop = { x: number; y: number; w: number; h: number };

interface FineEntry {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  perCell: number;
  state: 'new' | 'loading' | 'ready' | 'failed';
  fade: number;
}

interface Wanted {
  work: LoomWork;
  turn: number;
  perCell: number;
}

/** The cloth's canvas and its texture, `cell` pixels a cell. */
export interface Cloth {
  canvas: HTMLCanvasElement;
  texture: THREE.CanvasTexture;
  cell: number;
}

export interface SharpenContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  drum: Drum;
  door: LoomDoor;
  cloth: Cloth;
  /** Texels of finer images kept on the GPU. */
  budget: number;
  /** Nothing is fetched from Commons: the cloth stays on the baked sheets. */
  saveData: boolean;
  isLifted: (index: number) => boolean;
  /** Weave only inside and at rest; outside, nothing sharpens. */
  phase: () => { inside: boolean; outside: boolean; moving: boolean };
  /** The view's height in CSS pixels. */
  viewHeight: () => number;
}

/** The Commons image of a work with `perCell` pixels a cell once cut to its tile. */
export function thumbFor(work: LoomWork, perCell: number): string {
  const aspect = work.width / work.height;
  const tile = work.w / work.h;
  const wanted = (aspect > tile ? work.h * perCell * aspect : work.w * perCell) * 0.85;
  const step = commonsThumbAtLeast(work.width, wanted);
  return step ? commonsThumbUrl(work.path, work.file, step) : commonsOriginalUrl(work.path, work.file);
}

export class Sharpener {
  private readonly ctx: SharpenContext;
  private readonly sharp = new Set<number>();
  private readonly failed = new Set<number>();
  private readonly weaving = new Set<number>();
  private readonly woven: { work: LoomWork; tile: HTMLCanvasElement }[] = [];
  private readonly fine = new Map<number, FineEntry>();
  private readonly arrivals: { work: LoomWork; entry: FineEntry; perCell: number; image: HTMLImageElement }[] = [];
  private readonly crops = new Map<number, Crop>();
  private readonly copyAt = new THREE.Vector2();
  private readonly scratch: CanvasRenderingContext2D;
  /** The full sprite sheets at half size, read into memory once they land: drawing from
   *  a sheet this large into a readable canvas would stall a frame. Until then nothing
   *  is woven, since nothing could be cut where the bake cut it. */
  private refs: { sheet: { width: number; data: Uint8ClampedArray }; anchors: { width: number; data: Uint8ClampedArray } } | null =
    null;
  private cloth: Cloth;
  private readonly maxAnisotropy: number;
  private weaveQueue: { work: LoomWork; turn: number }[] = [];
  private fineQueue: Wanted[] = [];
  private requests = 0;
  private disposed = false;

  constructor(ctx: SharpenContext) {
    this.ctx = ctx;
    const scratch = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    if (!scratch) throw new Error('No 2D context to align images');
    this.scratch = scratch;
    this.cloth = ctx.cloth;
    this.maxAnisotropy = ctx.renderer.capabilities.getMaxAnisotropy();
  }

  /** The full sheets have landed: images can now be cut where the bake cut them. */
  setFullSheets({ full, anchors }: FullSheets) {
    this.refs = { sheet: this.halfSize(full), anchors: this.halfSize(anchors) };
  }

  /** The cloth was rewoven at its full resolution: weave into that one now. */
  setCloth(cloth: Cloth) {
    this.cloth = cloth;
  }

  /** Order the room by how far you would turn to face each work: the cloth weaves them
   *  in that order, and wherever a work shows larger than the cloth's own pixels, a
   *  finer image is laid over it, the ones in view first, then those just beyond, up to
   *  the memory budget. Turning within that reach finds them still there. */
  update() {
    const { camera, drum, door, budget, saveData } = this.ctx;
    const { cloth } = this;
    const phase = this.ctx.phase();
    if (saveData || !this.refs || phase.moving || phase.outside) return;
    camera.updateMatrixWorld();
    const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
    const dpr = this.ctx.renderer.getPixelRatio();
    const finePx = cloth.cell * 1.15;
    const forward = camera.getWorldDirection(new THREE.Vector3());
    const p = new THREE.Vector3();
    const d = new THREE.Vector3();
    const room: { work: LoomWork; turn: number }[] = [];
    const wanted: Wanted[] = [];
    for (const work of door.works) {
      if (this.ctx.isLifted(work.index)) continue;
      drum.bendAt(work.x + work.w / 2, work.row + work.h / 2, 0, p);
      d.copy(p).sub(camera.position);
      const distance = d.length();
      const turn = Math.acos(clamp(d.dot(forward) / distance, -1, 1));
      if (phase.inside && !this.sharp.has(work.index) && !this.failed.has(work.index) && !this.weaving.has(work.index)) {
        room.push({ work, turn });
      }
      const px = (this.ctx.viewHeight() * dpr) / (2 * tanHalf * distance);
      if (px >= finePx) wanted.push({ work, turn, perCell: px > 420 ? 512 : px > 300 ? 384 : 256 });
    }
    this.weaveQueue = room.sort((a, b) => a.turn - b.turn);
    wanted.sort((a, b) => a.turn - b.turn);
    // Within the budget a work may load; a quarter beyond it, one already loaded may stay.
    const keep = new Set<number>();
    let used = 0;
    this.fineQueue = [];
    for (const item of wanted) {
      const entry = this.fine.get(item.work.index);
      used += item.work.w * item.work.h * Math.max(item.perCell, entry?.perCell ?? 0) ** 2;
      if (used > budget * 1.25) break;
      keep.add(item.work.index);
      if (used > budget) continue;
      if (!entry || (entry.state === 'ready' && item.perCell > entry.perCell)) this.fineQueue.push(item);
    }
    for (const [index, entry] of this.fine) if (!keep.has(index) && entry.state !== 'loading') this.dropFine(index, entry);
  }

  /** Six requests at a time: finer images in view, then the cloth's weaving, then the
   *  finer images beyond the view. */
  pump() {
    while (this.requests < REQUESTS) {
      const inView = this.fineQueue.length > 0 && this.fineQueue[0].turn < VIEW;
      if (inView || !this.weaveQueue.length) {
        const item = this.fineQueue.shift();
        if (!item) return;
        if (this.fine.get(item.work.index)?.state !== 'loading') void this.loadFine(item.work, item.perCell);
        continue;
      }
      const item = this.weaveQueue.shift();
      if (!item) return;
      const { index } = item.work;
      if (!this.sharp.has(index) && !this.failed.has(index) && !this.weaving.has(index)) void this.weaveIn(item.work);
    }
  }

  /** Copy up to three woven works a frame into the cloth on the GPU, with one mipmap
   *  rebuild for them, and into its canvas, so any later full upload keeps them. */
  flush() {
    if (!this.woven.length) return;
    const { renderer } = this.ctx;
    const { cloth } = this;
    const context = cloth.canvas.getContext('2d');
    const batch = this.woven.splice(0, WEAVE_PER_FRAME);
    cloth.texture.generateMipmaps = false;
    batch.forEach(({ work, tile }, i) => {
      context?.drawImage(tile, work.x * cloth.cell, work.row * cloth.cell);
      if (i === batch.length - 1) cloth.texture.generateMipmaps = true;
      const source = new THREE.CanvasTexture(tile);
      renderer.copyTextureToTexture(source, cloth.texture, null, this.copyAt.set(work.x * cloth.cell, work.row * cloth.cell));
      source.dispose();
    });
  }

  /** At most two finer images reach the GPU a frame, so a burst of arrivals never stalls one. */
  settle() {
    for (let n = 0; n < SETTLE_PER_FRAME && this.arrivals.length; n++) {
      const arrival = this.arrivals.shift();
      if (!arrival) return;
      const { work, entry, perCell, image } = arrival;
      if (this.fine.get(work.index) !== entry) continue;
      const previous = entry.material.uniforms.uTex.value as THREE.Texture | null;
      previous?.dispose();
      entry.material.uniforms.uTex.value = this.imageTexture(image);
      this.setCrop(entry.material, this.cropOf(work, image));
      entry.perCell = perCell;
      entry.state = 'ready';
      entry.mesh.visible = true;
    }
  }

  /** Finer images fade in over a quarter of a second and dim with their works. */
  fade(dt: number, bright: Float32Array) {
    for (const [index, entry] of this.fine) {
      if (entry.state !== 'ready' && entry.fade === 0) continue;
      entry.fade = Math.min(1, entry.fade + dt / 0.25);
      entry.material.uniforms.uOpacity.value = entry.fade;
      entry.material.uniforms.uBright.value = bright[index];
    }
  }

  /** Where the sprite sits in the full image. The bake cut each work to its tile with
   *  sharp's attention strategy, which slides a window along the image's long side; the
   *  same window is found here by comparing the sprite with every place it could take. */
  cropOf(work: LoomWork, image: SheetImage): Crop {
    const known = this.crops.get(work.index);
    if (known) return known;
    const { sheet } = this.ctx.door;
    const align = sheet.cell / 2;
    const a = imageWidth(image) / imageHeight(image);
    const t = work.w / work.h;
    if (Math.abs(a - t) / t < 0.01) return { x: 0, y: 0, w: 1, h: 1 };
    const across = a > t;
    let crop: Crop = across ? { x: (1 - t / a) / 2, y: 0, w: t / a, h: 1 } : { x: 0, y: (1 - a / t) / 2, w: 1, h: a / t };
    // Without the full sheets the middle of the image will do, and is not remembered.
    if (!this.refs) return crop;
    const anchor = work.anchor >= 0;
    const ref = anchor ? this.refs.anchors : this.refs.sheet;
    const ox = anchor
      ? ((work.anchor % sheet.anchorColumns) * sheet.anchorSlot) / 2
      : ((work.sprite % sheet.columns) * sheet.cell) / 2;
    const oy = anchor
      ? (Math.floor(work.anchor / sheet.anchorColumns) * sheet.anchorSlot) / 2
      : (Math.floor(work.sprite / sheet.columns) * sheet.cell) / 2;
    const rw = align * work.w;
    const rh = align * work.h;
    const iw = across ? Math.round(rh * a) : rw;
    const ih = across ? rh : Math.round(rw / a);
    this.scratch.imageSmoothingQuality = 'medium';
    const full = this.pixels((context) => context.drawImage(image, 0, 0, iw, ih), iw, ih);
    let best = -1;
    let bestError = Infinity;
    offsets: for (let o = 0; o <= (across ? iw - rw : ih - rh); o++) {
      let error = 0;
      for (let y = 0; y < rh; y++) {
        for (let x = 0; x < rw; x++) {
          const i = ((across ? y : y + o) * iw + (across ? x + o : x)) * 4;
          const j = ((oy + y) * ref.width + ox + x) * 4;
          const dr = full[i] - ref.data[j];
          const dg = full[i + 1] - ref.data[j + 1];
          const db = full[i + 2] - ref.data[j + 2];
          error += dr * dr + dg * dg + db * db;
        }
        if (error >= bestError) continue offsets;
      }
      best = o;
      bestError = error;
    }
    if (best >= 0) crop = across ? { x: best / iw, y: 0, w: rw / iw, h: 1 } : { x: 0, y: best / ih, w: 1, h: rh / ih };
    this.crops.set(work.index, crop);
    return crop;
  }

  /** A whole image as a texture, for the GPU to cut and scale: cutting and scaling a
   *  large image on a canvas would stall a frame. */
  imageTexture(image: HTMLImageElement): THREE.Texture {
    const texture = new THREE.Texture(image);
    Object.assign(texture, {
      colorSpace: THREE.NoColorSpace,
      minFilter: THREE.LinearMipmapLinearFilter,
      anisotropy: Math.min(4, this.maxAnisotropy),
      needsUpdate: true,
    });
    return texture;
  }

  /** Point a material at a work's crop of its image (texture rows run bottom up). */
  setCrop(material: THREE.ShaderMaterial, crop: Crop) {
    (material.uniforms.uCropOffset.value as THREE.Vector2).set(crop.x, 1 - crop.y - crop.h);
    (material.uniforms.uCropScale.value as THREE.Vector2).set(crop.w, crop.h);
  }

  /** A canvas as a texture with the cloth's filtering. */
  canvasTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
    const texture = new THREE.CanvasTexture(canvas);
    Object.assign(texture, {
      colorSpace: THREE.NoColorSpace,
      minFilter: THREE.LinearMipmapLinearFilter,
      anisotropy: Math.min(4, this.maxAnisotropy),
    });
    return texture;
  }

  dispose() {
    this.disposed = true;
    for (const [index, entry] of this.fine) this.dropFine(index, entry);
    this.woven.length = 0;
    this.arrivals.length = 0;
  }

  private halfSize(image: SheetImage) {
    const width = imageWidth(image) / 2;
    const height = imageHeight(image) / 2;
    return { width, data: this.pixels((context) => context.drawImage(image, 0, 0, width, height), width, height) };
  }

  private pixels(draw: (context: CanvasRenderingContext2D) => void, width: number, height: number) {
    this.scratch.canvas.width = width;
    this.scratch.canvas.height = height;
    draw(this.scratch);
    return this.scratch.getImageData(0, 0, width, height).data;
  }

  /** A work's image cut to its tile, `perCell` pixels a cell, anchors keeping their hairline. */
  private cropCanvas(work: LoomWork, image: HTMLImageElement, crop: Crop, perCell: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(work.w * perCell);
    canvas.height = Math.round(work.h * perCell);
    const context = canvas.getContext('2d');
    if (!context) return canvas;
    context.imageSmoothingQuality = 'high';
    context.drawImage(
      image,
      crop.x * image.naturalWidth,
      crop.y * image.naturalHeight,
      crop.w * image.naturalWidth,
      crop.h * image.naturalHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    if (work.w > 1) strokeAnchor(context, 0, 0, canvas.width, canvas.height, perCell);
    return canvas;
  }

  private async weaveIn(work: LoomWork) {
    const { cell } = this.cloth;
    this.weaving.add(work.index);
    this.requests++;
    try {
      const image = await loadImage(thumbFor(work, cell), true);
      if (this.disposed) return;
      this.woven.push({ work, tile: this.cropCanvas(work, image, this.cropOf(work, image), cell) });
      this.sharp.add(work.index);
    } catch {
      this.failed.add(work.index);
    } finally {
      this.requests--;
      this.weaving.delete(work.index);
    }
  }

  private async loadFine(work: LoomWork, perCell: number) {
    let entry = this.fine.get(work.index);
    if (!entry) {
      const material = new THREE.ShaderMaterial({
        uniforms: {
          ...this.ctx.drum.U,
          uLift: { value: 0.03 },
          uTex: { value: null },
          uCropOffset: { value: new THREE.Vector2(0, 0) },
          uCropScale: { value: new THREE.Vector2(1, 1) },
          uOpacity: { value: 0 },
          uBright: { value: 1 },
        },
        vertexShader: PLAIN_VS,
        fragmentShader: FINE_FS,
        transparent: true,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(gridGeometry(work.x, work.row, work.x + work.w, work.row + work.h, work.w * 4, 1, true), material);
      mesh.frustumCulled = false;
      mesh.visible = false;
      mesh.renderOrder = 1;
      this.ctx.scene.add(mesh);
      entry = { mesh, material, perCell: 0, state: 'new', fade: 0 };
      this.fine.set(work.index, entry);
    }
    entry.state = 'loading';
    this.requests++;
    try {
      const image = await loadImage(thumbFor(work, perCell), true);
      if (!this.disposed) this.arrivals.push({ work, entry, perCell, image });
    } catch {
      entry.state = entry.perCell ? 'ready' : 'failed';
    } finally {
      this.requests--;
    }
  }

  private dropFine(index: number, entry: FineEntry) {
    this.ctx.scene.remove(entry.mesh);
    entry.mesh.geometry.dispose();
    (entry.material.uniforms.uTex.value as THREE.Texture | null)?.dispose();
    entry.material.dispose();
    this.fine.delete(index);
  }
}
