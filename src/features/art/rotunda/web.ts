import * as THREE from 'three';
import type { LoomDoor } from '@/features/art/door';
import { LIFT, liftWeb } from '@/features/art/loomWeb';
import { lerp, smooth, type Drum } from './drum';
import { pushArc, setLines, type LineLayer } from './lines';
import { LIFT_FS, LIFT_VS } from './shaders';
import { loadImage, type Sheets } from './textures';
import { thumbFor, type Sharpener } from './sharpen';

/** The web in the rotunda (docs/LOOM_PLAN.md §12): a pull lifts the work toward you and
 *  its neighbours along each thread off the wall, nearest in time first, the same webs
 *  the flat door lifts (features/art/loomWeb.ts). Their threads cross the air of the
 *  room: one from above is older, one from the side another saga. */

interface Pose {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  s: number;
}

export interface Lifted {
  work: number;
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  from: Pose;
  to: Pose;
  t: number;
  s: number;
  leaving: boolean;
  /** The longest side, in pixels, its own image was asked for. */
  wanted: number;
}

export interface WebContext {
  scene: THREE.Scene;
  drum: Drum;
  door: LoomDoor;
  sheets: Sheets;
  sharpener: Sharpener;
  lines: LineLayer;
  colorOf: (saga: string) => THREE.Color;
  reduceMotion: boolean;
}

const plane = new THREE.PlaneGeometry(1, 1);

export class RotundaWeb {
  focus = -1;
  along: number | null = null;
  /** The threads lit with the web. */
  threads: number[] = [];
  /** A thread named in the rail, the others dimmed while it is. */
  isolate = -1;
  readonly lifted = new Map<number, Lifted>();
  private dirty = false;
  private readonly ctx: WebContext;

  constructor(ctx: WebContext) {
    this.ctx = ctx;
  }

  /** The held work's place: along the line of sight, drawn toward the middle of the
   *  view, `hold` cells away and `heldSize` cells on its long side. */
  pull(focus: number, along: number | null, eye: THREE.Vector3, view: THREE.Vector3, hold: number, heldSize: number) {
    const { door } = this.ctx;
    const members = liftWeb(door, focus, along, LIFT.desktop).lifted.map(({ work }) => work);
    const memberSet = new Set(members);
    for (const [index, lifted] of this.lifted) {
      if (memberSet.has(index)) continue;
      lifted.from = this.currentPose(lifted);
      lifted.to = this.wallPose(index);
      lifted.t = 0;
      lifted.leaving = true;
    }
    for (const index of members) {
      const work = door.works[index];
      const wall = this.wallPose(index);
      let to: Pose;
      if (index === focus) {
        const pos = eye.clone().addScaledVector(wall.pos.clone().sub(eye).normalize().lerp(view, 0.55).normalize(), hold);
        to = {
          pos,
          quat: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(eye, pos, new THREE.Vector3(0, 1, 0))),
          s: heldSize / Math.max(work.w, work.h),
        };
      } else {
        // Neighbours step well off the wall, a large work no larger than a cell and a
        // half, so the held work stays the largest thing in the room.
        const lift = 2.6 + (1.2 * ((index * 2654435761) % 1000)) / 1000;
        to = {
          pos: wall.pos.clone().addScaledVector(new THREE.Vector3(0, 0, 1).applyQuaternion(wall.quat), lift),
          quat: wall.quat,
          s: Math.min(1, 1.4 / Math.max(work.w, work.h)),
        };
      }
      let lifted = this.lifted.get(index);
      if (!lifted) {
        const material = new THREE.ShaderMaterial({
          uniforms: {
            uTex: { value: this.spriteTexture(index) },
            uCropOffset: { value: new THREE.Vector2(0, 0) },
            uCropScale: { value: new THREE.Vector2(1, 1) },
            uSize: { value: new THREE.Vector2(work.w, work.h) },
            uOpacity: { value: 1 },
            uHeld: { value: 0 },
            uHover: { value: 0 },
          },
          vertexShader: LIFT_VS,
          fragmentShader: LIFT_FS,
          transparent: true,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(plane, material);
        mesh.userData.work = index;
        mesh.renderOrder = 2;
        this.ctx.scene.add(mesh);
        lifted = { work: index, mesh, material, from: wall, to, t: 0, s: 1, leaving: false, wanted: 0 };
        this.lifted.set(index, lifted);
      } else {
        lifted.from = this.currentPose(lifted);
      }
      lifted.to = to;
      lifted.t = 0;
      lifted.leaving = false;
      lifted.material.uniforms.uHeld.value = index === focus ? 1 : 0;
      this.sharpen(lifted, index === focus ? 1024 : 384);
    }
    this.focus = focus;
    this.along = along;
    this.isolate = -1;
    this.threads = along === null ? door.threadsOf[focus] : [along];
    this.dirty = true;
  }

  /** Every lifted work flies back to its place on the wall. */
  release() {
    if (this.focus < 0) return;
    for (const [index, lifted] of this.lifted) {
      lifted.from = this.currentPose(lifted);
      lifted.to = this.wallPose(index);
      lifted.t = 0;
      lifted.leaving = true;
    }
    this.focus = -1;
    this.threads = [];
    this.dirty = true;
  }

  /** Let the web go at once, with no flight back to the wall. */
  drop() {
    for (const lifted of this.lifted.values()) this.remove(lifted);
    this.lifted.clear();
    this.focus = -1;
    this.threads = [];
    setLines(this.ctx.lines, [], []);
  }

  setIsolate(thread: number) {
    if (this.isolate === thread) return;
    this.isolate = thread;
    this.dirty = true;
  }

  /** Is a work up in the air, and staying there? */
  holds(index: number): boolean {
    const lifted = this.lifted.get(index);
    return Boolean(lifted && !lifted.leaving);
  }

  animate(dt: number) {
    const { door, drum } = this.ctx;
    let moving = this.dirty;
    for (const [index, lifted] of this.lifted) {
      if (lifted.t >= 1 && !lifted.leaving) continue;
      moving = true;
      lifted.t = Math.min(1, lifted.t + dt / (this.ctx.reduceMotion ? 0.2 : lifted.leaving ? 0.6 : 0.9));
      const e = 1 - Math.pow(1 - lifted.t, 3);
      lifted.mesh.position.lerpVectors(lifted.from.pos, lifted.to.pos, e);
      lifted.mesh.quaternion.slerpQuaternions(lifted.from.quat, lifted.to.quat, e);
      lifted.s = lerp(lifted.from.s, lifted.to.s, e);
      const work = door.works[index];
      lifted.mesh.scale.set(work.w * lifted.s, work.h * lifted.s, 1);
      (lifted.material.uniforms.uSize.value as THREE.Vector2).set(work.w * lifted.s, work.h * lifted.s);
      if (lifted.leaving) {
        lifted.material.uniforms.uOpacity.value = 1 - smooth(0.7, 1, lifted.t);
        if (lifted.t >= 1) {
          this.remove(lifted);
          this.lifted.delete(index);
        }
      }
    }
    if (!moving) return;
    this.dirty = false;
    const positions: number[] = [];
    const colors: number[] = [];
    // A neighbour hangs from the top of its frame; the held work lets its threads out
    // at the edge of its frame that faces the other end.
    const end = (lifted: Lifted, other: THREE.Vector3) => {
      const work = door.works[lifted.work];
      const hw = (work.w * lifted.s) / 2;
      const hh = (work.h * lifted.s) / 2;
      if (lifted.work !== this.focus) {
        return lifted.mesh.position.clone().add(new THREE.Vector3(0, hh, 0).applyQuaternion(lifted.mesh.quaternion));
      }
      const local = other.clone().sub(lifted.mesh.position).applyQuaternion(lifted.mesh.quaternion.clone().invert());
      const scale = Math.max(Math.abs(local.x) / hw, Math.abs(local.y) / hh, 1e-6);
      return lifted.mesh.position
        .clone()
        .add(new THREE.Vector3(local.x / scale, local.y / scale, 0.01).applyQuaternion(lifted.mesh.quaternion));
    };
    for (const index of this.threads) {
      const thread = door.threads[index];
      const on = thread.works.filter((work) => this.holds(work));
      const k = this.isolate < 0 || this.isolate === index ? 1 : 0.1;
      for (let j = 0; j + 1 < on.length; j++) {
        const a = this.lifted.get(on[j]);
        const b = this.lifted.get(on[j + 1]);
        if (!a || !b) continue;
        const held = a.work === this.focus || b.work === this.focus;
        pushArc(drum, end(a, b.mesh.position), end(b, a.mesh.position), this.ctx.colorOf(thread.saga), k, positions, colors, 20, held ? 0 : 0.3);
      }
    }
    setLines(this.ctx.lines, positions, colors);
  }

  dispose() {
    this.drop();
  }

  private wallPose(index: number): Pose {
    const { drum, door } = this.ctx;
    const work = door.works[index];
    return {
      pos: drum.bendAt(work.x + work.w / 2, work.row + work.h / 2, 0.02, new THREE.Vector3(), 1),
      quat: new THREE.Quaternion().setFromRotationMatrix(drum.wallBasis(work.x + work.w / 2, 1)),
      s: 1,
    };
  }

  private currentPose(lifted: Lifted): Pose {
    return { pos: lifted.mesh.position.clone(), quat: lifted.mesh.quaternion.clone(), s: lifted.s };
  }

  /** The baked sprite, until the work's own image arrives. */
  private spriteTexture(index: number): THREE.Texture {
    const { door, sheets, sharpener } = this.ctx;
    const work = door.works[index];
    const { sheet } = door;
    const [image, sx, sy, sw, sh] =
      work.anchor >= 0
        ? [
            sheets.anchors,
            (work.anchor % sheet.anchorColumns) * sheet.anchorSlot,
            Math.floor(work.anchor / sheet.anchorColumns) * sheet.anchorSlot,
            work.w * sheet.cell,
            work.h * sheet.cell,
          ]
        : [
            sheets.full,
            (work.sprite % sheet.columns) * sheet.cell,
            Math.floor(work.sprite / sheet.columns) * sheet.cell,
            sheet.cell,
            sheet.cell,
          ];
    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    canvas.getContext('2d')?.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
    return sharpener.canvasTexture(canvas);
  }

  /** A lifted work's own image, `longSide` pixels along its longer edge. */
  private sharpen(lifted: Lifted, longSide: number) {
    if (lifted.wanted >= longSide) return;
    lifted.wanted = longSide;
    const work = this.ctx.door.works[lifted.work];
    const perCell = longSide / Math.max(work.w, work.h);
    loadImage(thumbFor(work, perCell), true)
      .then((image) => {
        if (this.lifted.get(lifted.work) !== lifted) return;
        (lifted.material.uniforms.uTex.value as THREE.Texture).dispose();
        lifted.material.uniforms.uTex.value = this.ctx.sharpener.imageTexture(image);
        this.ctx.sharpener.setCrop(lifted.material, this.ctx.sharpener.cropOf(work, image));
      })
      .catch(() => {});
  }

  private remove(lifted: Lifted) {
    this.ctx.scene.remove(lifted.mesh);
    (lifted.material.uniforms.uTex.value as THREE.Texture).dispose();
    lifted.material.dispose();
  }
}
