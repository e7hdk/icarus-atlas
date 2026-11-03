import type { PerspectiveCamera } from 'three';
import type { LoomDoorLayout } from '@/types/art';

/** The Loom's camera (docs/LOOM_PLAN.md §6): `s` is CSS pixels per cell at the cloth,
 *  (x, y) the cell it looks at, and yaw and pitch orbit that cell. Hit tests are a
 *  ray through the cursor meeting the cloth's plane, labels are projected: nothing
 *  assumes the cloth faces the screen. */

const FOV = (30 * Math.PI) / 180;

/** Warp left bare below the cloth, in cells. */
export const FRINGE_ROWS = 8;
/** Room for the beam above and the clay weights below, in cells. */
const ABOVE_ROWS = 1.6;
const BELOW_ROWS = 3.5;

/** The rails beside the cloth in the home view, in CSS pixels. */
const MARGIN = { left: 236, right: 214, top: 74, bottom: 24 };
const NARROW_MARGIN = { left: 16, right: 16, top: 74, bottom: 24 };
export const NARROW_WIDTH = 1080;

export const MAX_SCALE = 460;

type Vec3 = [number, number, number];

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (a: Vec3): Vec3 => {
  const length = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / length, a[1] / length, a[2] / length];
};

const smooth = (from: number, to: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
};

export class LoomCamera {
  x = 0;
  y = 0;
  s = 16;
  yaw = 0;
  pitch = 0;
  goal = { x: 0, y: 0, s: 16, yaw: 0, pitch: 0 };
  home = { x: 0, y: 0, s: 16 };
  viewWidth = 1;
  viewHeight = 1;
  /** True on a frame where the view is still travelling. */
  moving = true;

  private tiltX = 0;
  private tiltY = 0;
  private eye: Vec3 = [0, 0, 1];
  private target: Vec3 = [0, 0, 0];
  private forward: Vec3 = [0, 0, -1];
  private right: Vec3 = [1, 0, 0];
  private up: Vec3 = [0, 1, 0];
  private distance = 1;
  private clip = new Float32Array(16);

  /** Fit the whole cloth, beam to weights, between the rails. */
  fit(layout: LoomDoorLayout, viewWidth: number, viewHeight: number, snap: boolean) {
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    const margin = viewWidth <= NARROW_WIDTH ? NARROW_MARGIN : MARGIN;
    const availableWidth = viewWidth - margin.left - margin.right;
    const availableHeight = viewHeight - margin.top - margin.bottom;
    const worldHeight = ABOVE_ROWS + layout.height + FRINGE_ROWS + BELOW_ROWS;
    const s = Math.min(availableWidth / layout.width, availableHeight / worldHeight);
    const spare = Math.max(0, availableHeight - worldHeight * s);
    this.home = {
      x: layout.width / 2 - (margin.left + availableWidth / 2 - viewWidth / 2) / s,
      y: -ABOVE_ROWS + (viewHeight / 2 - margin.top - spare / 2) / s,
      s,
    };
    this.goHome();
    if (snap) Object.assign(this, { x: this.home.x, y: this.home.y, s: this.home.s });
    this.solve();
  }

  goHome() {
    Object.assign(this.goal, this.home);
  }

  flyTo(x: number, y: number, s: number) {
    Object.assign(this.goal, { x, y, s });
  }

  panTo(x: number, y: number) {
    this.goal.x = x;
    this.goal.y = y;
  }

  /** Zoom toward a screen point, keeping the cell under it in place. */
  zoomAt(factor: number, screenX: number, screenY: number) {
    const s = Math.min(MAX_SCALE, Math.max(this.home.s * 0.8, this.goal.s * factor));
    const dx = screenX - this.viewWidth / 2;
    const dy = screenY - this.viewHeight / 2;
    this.goal.x += dx / this.goal.s - dx / s;
    this.goal.y += dy / this.goal.s - dy / s;
    this.goal.s = s;
  }

  /** Advance one frame. `pointerX` and `pointerY` run -1..1 across the view: the cloth
   *  answers the pointer a little, and not at all once it is being read. */
  tick(dt: number, pointerX: number, pointerY: number, still: boolean) {
    const ease = 1 - Math.exp(-dt * 7.5);
    this.moving =
      Math.abs(this.goal.s - this.s) > 0.002 * this.s ||
      Math.abs(this.goal.x - this.x) > 0.002 ||
      Math.abs(this.goal.y - this.y) > 0.002 ||
      Math.abs(this.tiltX) + Math.abs(this.tiltY) > 0.0002;
    this.x += (this.goal.x - this.x) * ease;
    this.y += (this.goal.y - this.y) * ease;
    // In log space, so the flight feels even from cloth to canvas.
    this.s = Math.exp(Math.log(this.s) + (Math.log(this.goal.s) - Math.log(this.s)) * ease);
    this.yaw += (this.goal.yaw - this.yaw) * (1 - Math.exp(-dt * 3.1));
    this.pitch += (this.goal.pitch - this.pitch) * (1 - Math.exp(-dt * 3.6));
    const calm = still ? 0 : 1 - smooth(20, 46, this.s);
    const follow = 1 - Math.exp(-dt * 2.8);
    this.tiltX += (pointerX * 0.06 * calm - this.tiltX) * follow;
    this.tiltY += (-pointerY * 0.04 * calm - this.tiltY) * follow;
    this.solve();
  }

  private solve() {
    const tan = Math.tan(FOV / 2);
    this.distance = this.viewHeight / 2 / (this.s * tan);
    const yaw = this.yaw + this.tiltX;
    const pitch = this.pitch + this.tiltY;
    const { distance } = this;
    this.target = [this.x, -this.y, 0];
    this.eye = [
      this.x + distance * Math.sin(yaw) * Math.cos(pitch),
      -this.y + distance * Math.sin(pitch),
      distance * Math.cos(yaw) * Math.cos(pitch),
    ];
    this.forward = unit(sub(this.target, this.eye));
    this.right = unit(cross(this.forward, [0, 1, 0]));
    this.up = cross(this.right, this.forward);

    const f = 1 / tan;
    const aspect = this.viewWidth / this.viewHeight;
    const [near, far] = this.clipRange();
    const a = (far + near) / (near - far);
    const b = (2 * far * near) / (near - far);
    const [R, U, F, E] = [this.right, this.up, this.forward, this.eye];
    const [ex, ey, ez] = [-dot(R, E), -dot(U, E), dot(F, E)];
    this.clip.set([
      (f / aspect) * R[0], f * U[0], -a * F[0], F[0],
      (f / aspect) * R[1], f * U[1], -a * F[1], F[1],
      (f / aspect) * R[2], f * U[2], -a * F[2], F[2],
      (f / aspect) * ex, f * ey, a * ez + b, -ez,
    ]);
  }

  private clipRange(): [number, number] {
    return [this.distance * 0.05, this.distance * 4];
  }

  /** Copy the view onto the scene's camera. */
  apply(camera: PerspectiveCamera) {
    const [near, far] = this.clipRange();
    camera.fov = (FOV * 180) / Math.PI;
    camera.aspect = this.viewWidth / this.viewHeight;
    camera.near = near;
    camera.far = far;
    camera.position.set(this.eye[0], this.eye[1], this.eye[2]);
    camera.up.set(0, 1, 0);
    camera.lookAt(this.target[0], this.target[1], this.target[2]);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  /** Screen position of a cell, and the CSS pixels per cell at that depth. */
  toScreen(x: number, y: number, z = 0): [number, number, number] {
    const m = this.clip;
    const worldY = -y;
    const cx = m[0] * x + m[4] * worldY + m[8] * z + m[12];
    const cy = m[1] * x + m[5] * worldY + m[9] * z + m[13];
    const cw = m[3] * x + m[7] * worldY + m[11] * z + m[15];
    const scale = (this.viewHeight / 2 / Math.tan(FOV / 2)) / cw;
    return [(cx / cw * 0.5 + 0.5) * this.viewWidth, (0.5 - (cy / cw) * 0.5) * this.viewHeight, scale];
  }

  /** The cell under a screen point. */
  toCell(screenX: number, screenY: number): [number, number] {
    const tan = Math.tan(FOV / 2);
    const aspect = this.viewWidth / this.viewHeight;
    const nx = (screenX / this.viewWidth) * 2 - 1;
    const ny = 1 - (screenY / this.viewHeight) * 2;
    const [R, U, F, E] = [this.right, this.up, this.forward, this.eye];
    const ray: Vec3 = [
      F[0] + R[0] * nx * tan * aspect + U[0] * ny * tan,
      F[1] + R[1] * nx * tan * aspect + U[1] * ny * tan,
      F[2] + R[2] * nx * tan * aspect + U[2] * ny * tan,
    ];
    const t = -E[2] / ray[2];
    return [E[0] + ray[0] * t, -(E[1] + ray[1] * t)];
  }
}
