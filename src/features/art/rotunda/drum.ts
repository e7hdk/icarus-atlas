import * as THREE from 'three';

/** The rotunda's space (docs/LOOM_PLAN.md §12). World units are cells. Flat, the cloth
 *  faces +z with its curl centre at x = 0; closed, it is a drum round the axis
 *  x = 0, z = R, its width the drum's circumference. */

export const TAU = Math.PI * 2;
export const clamp = (x: number, low: number, high: number) => Math.min(high, Math.max(low, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
/** The angle nearest `near` that points the same way as `angle`. */
export const unwrapNear = (angle: number, near: number) => angle + TAU * Math.round((near - angle) / TAU);

// A type, not an interface, so it spreads into a material's uniforms.
export type DrumUniforms = {
  uBend: { value: number };
  uCenter: { value: number };
  uR: { value: number };
  uW: { value: number };
  uH: { value: number };
  uTime: { value: number };
  uRoom: { value: number };
  uFloor: { value: number };
};

/** Flat cell coordinates (column across, row down) to the world, at a bend from 0 (a
 *  flat cloth) to 1 (the closed drum). The curl centre stays put; h lifts toward the
 *  visitor, so negative h is behind the cloth. */
export const BEND_GLSL = /* glsl */ `
uniform float uBend, uCenter, uR, uW, uH;
vec3 bendAt(vec2 g, float h) {
  float u = g.x - uCenter, v = uH * .5 - g.y;
  if (uBend < 1e-4) return vec3(u, v, h);
  float rho = uR / uBend, t = u / rho, r = rho - h;
  return vec3(r * sin(t), v, rho - r * cos(t));
}`;

export class Drum {
  readonly W: number;
  readonly H: number;
  readonly R: number;
  readonly TOP: number;
  readonly BOTTOM: number;
  /** The gold beam the warp hangs from, in rows above the cloth. */
  readonly BEAM: readonly [number, number] = [-1.45, -0.85];
  /** Where the stone attic band under the dome begins. */
  readonly ATTIC = -1.75;
  /** Where the clay weights hang, in rows. */
  readonly WEIGHT_TOP: number;
  readonly FLOOR_Y: number;
  /** The floor, in rows down from the cloth's top. */
  readonly FLOOR_ROW: number;
  readonly U: DrumUniforms;

  constructor(width: number, height: number) {
    this.W = width;
    this.H = height;
    this.R = width / TAU;
    this.TOP = height / 2;
    this.BOTTOM = -height / 2;
    this.WEIGHT_TOP = height + 2.2;
    this.FLOOR_Y = this.BOTTOM - 6.2;
    this.FLOOR_ROW = height / 2 - this.FLOOR_Y;
    this.U = {
      uBend: { value: 0 },
      uCenter: { value: width / 2 },
      uR: { value: this.R },
      uW: { value: width },
      uH: { value: height },
      uTime: { value: 0 },
      uRoom: { value: 0 },
      uFloor: { value: this.FLOOR_Y },
    };
  }

  bendAt(gx: number, gy: number, h: number, out = new THREE.Vector3(), b = this.U.uBend.value): THREE.Vector3 {
    const u = gx - this.U.uCenter.value;
    const v = this.H / 2 - gy;
    if (b < 1e-4) return out.set(u, v, h);
    const rho = this.R / b;
    const t = u / rho;
    const r = rho - h;
    return out.set(r * Math.sin(t), v, rho - r * Math.cos(t));
  }

  /** The wall's own axes at a column: along the cloth, up, and toward the visitor. */
  wallBasis(gx: number, b = this.U.uBend.value): THREE.Matrix4 {
    const t = b < 1e-4 ? 0 : (gx - this.U.uCenter.value) / (this.R / b);
    return new THREE.Matrix4().makeBasis(
      new THREE.Vector3(Math.cos(t), 0, Math.sin(t)),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(-Math.sin(t), 0, Math.cos(t)),
    );
  }

  /** The column a direction looks at once the drum is closed. */
  columnAt(yaw: number): number {
    return (((yaw * this.R + this.U.uCenter.value) % this.W) + this.W) % this.W;
  }

  /** Where the visitor stands inside: `d` behind the axis from the way they look. */
  rimPos(yaw: number, d: number, y: number): THREE.Vector3 {
    return new THREE.Vector3(-Math.sin(yaw) * d, y, this.R + Math.cos(yaw) * d);
  }

  /** Outside, circling the drum at an elevation and a distance from its axis. */
  orbitPos(yaw: number, el: number, dist: number): THREE.Vector3 {
    return new THREE.Vector3(
      -Math.sin(yaw) * dist * Math.cos(el),
      dist * Math.sin(el),
      this.R + Math.cos(yaw) * dist * Math.cos(el),
    );
  }
}

/** A grid over flat cell coordinates; the vertex shaders bend it. */
export function gridGeometry(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  segX: number,
  segY: number,
  flipV = false,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  for (let j = 0; j <= segY; j++) {
    for (let i = 0; i <= segX; i++) {
      positions.push(lerp(x0, x1, i / segX), lerp(y0, y1, j / segY), 0);
      uvs.push(i / segX, flipV ? 1 - j / segY : j / segY);
    }
  }
  for (let j = 0; j < segY; j++) {
    for (let i = 0; i < segX; i++) {
      const a = j * (segX + 1) + i;
      const b = a + 1;
      const c = a + segX + 1;
      const d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(index);
  return geometry;
}
