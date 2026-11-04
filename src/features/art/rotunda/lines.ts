import * as THREE from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import type { LoomDoor } from '@/features/art/door';
import { lerp, type Drum } from './drum';

/** Threads of light through the rotunda (docs/LOOM_PLAN.md §12): the web's, a
 *  Pattern's gold one, and the stitches on the back of the drum. */

export type LineLayer = LineSegments2;

export function createLineLayer(scene: THREE.Scene, width: number, opacity: number): LineLayer {
  const material = new LineMaterial({
    linewidth: width,
    vertexColors: true,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const lines = new LineSegments2(new LineSegmentsGeometry(), material);
  lines.frustumCulled = false;
  lines.visible = false;
  lines.renderOrder = 3;
  scene.add(lines);
  return lines;
}

export function setLines(lines: LineLayer, positions: number[], colors: number[]) {
  lines.geometry.dispose();
  lines.geometry = new LineSegmentsGeometry();
  if (positions.length) {
    lines.geometry.setPositions(positions);
    lines.geometry.setColors(colors);
  }
  lines.visible = positions.length > 0;
}

/** A thread through the air of the rotunda: between two works on the walls it bows
 *  toward the axis, toward the visitor; with no bow it leaves straight. */
export function pushArc(
  drum: Drum,
  a: THREE.Vector3,
  b: THREE.Vector3,
  color: THREE.Color,
  k: number,
  positions: number[],
  colors: number[],
  segments = 20,
  bow = 0.3,
) {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const length = a.distanceTo(b);
  const toAxis = new THREE.Vector3(-mid.x, 0, drum.R - mid.z);
  const reach = toAxis.length();
  const control = mid.clone();
  if (reach > 1e-3 && bow > 0) {
    control.addScaledVector(toAxis.divideScalar(reach), Math.min(length * bow, Math.max(0, reach - 1)));
  }
  control.y += length * 0.05;
  let previous = a.clone();
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const s = 1 - t;
    const p = new THREE.Vector3(
      s * s * a.x + 2 * s * t * control.x + t * t * b.x,
      s * s * a.y + 2 * s * t * control.y + t * t * b.y,
      s * s * a.z + 2 * s * t * control.z + t * t * b.z,
    );
    positions.push(previous.x, previous.y, previous.z, p.x, p.y, p.z);
    colors.push(color.r * k, color.g * k, color.b * k, color.r * k, color.g * k, color.b * k);
    previous = p;
  }
}

/** The back of the cloth: every stitch arcs out of the drum's outer face, low, so the
 *  web wraps the drum rather than clouding it. */
export function stitchesOnBack(
  drum: Drum,
  door: LoomDoor,
  colorOf: (saga: string) => THREE.Color,
  only: number[] | null = null,
): [number[], number[]] {
  const positions: number[] = [];
  const colors: number[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  for (const thread of only ? only.map((index) => door.threads[index]) : door.threads) {
    const c = colorOf(thread.saga);
    let seed = thread.index * 977 + 13;
    for (let j = 0; j + 1 < thread.works.length; j++) {
      const A = door.works[thread.works[j]];
      const B = door.works[thread.works[j + 1]];
      const ax = A.x + A.w / 2;
      const ay = A.row + A.h / 2;
      let bx = B.x + B.w / 2;
      const by = B.row + B.h / 2;
      // the short way round
      if (bx - ax > drum.W / 2) bx -= drum.W;
      else if (ax - bx > drum.W / 2) bx += drum.W;
      seed = (seed * 16807) % 2147483647;
      const h = (0.35 + Math.min(Math.hypot(bx - ax, by - ay), 34) * 0.07) * (0.7 + 0.6 * (seed / 2147483647));
      drum.bendAt(ax, ay, -0.05, a, 1);
      for (let i = 1; i <= 14; i++) {
        const s = i / 14;
        const e = s * s * (3 - 2 * s);
        drum.bendAt(lerp(ax, bx, e), lerp(ay, by, s), -0.05 - Math.sin(s * Math.PI) * h, b, 1);
        positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
        colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
        a.copy(b);
      }
    }
  }
  return [positions, colors];
}
