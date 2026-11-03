import type { SagaId } from '@/features/stories/sagas';
import type { LoomDoor, LoomWork } from './door';

/** The web of the Loom (docs/LOOM_PLAN.md §7): a pulled work rises out of the cloth
 *  with its nearest neighbours along each of its threads, and the threads light. */

/** How a web rises: the pulled work with at most `max` neighbours, `focusSize` and
 *  `neighbourSize` cells on their long sides, kept near their places on the cloth. A
 *  phone's screen holds fewer and is narrow, so there the pulled work comes to the
 *  middle and its neighbours gather in rows around it, earlier above and later below,
 *  as many as `room` holds. */
export interface LiftShape {
  max: number;
  focusSize: number;
  neighbourSize: number;
  room: { width: number; height: number } | null;
}
export const LIFT = {
  desktop: { max: 24, focusSize: 11.5, neighbourSize: 4.4, room: null },
  phone: { max: 12, focusSize: 9.5, neighbourSize: 3.6, room: { width: 21, height: 28 } },
} satisfies Record<string, LiftShape>;
/** Gathered, the web rises as one layer: its rows stand 18 to 24 cells out of the
 *  cloth, just behind the held work, which looms this much larger beside them. */
const NEARER = 1.07;
/** A gathered web's height in cells, and about how far out of the cloth its rows
 *  stand, which makes them loom larger: the camera frames it by both. */
export const GATHERED = { rows: LIFT.phone.room.height, depth: 22 };
const SPREAD_PASSES = 70;
/** Out of the cloth, in cells: the held work stands furthest forward. */
const FOCUS_DEPTH = 26;
/** Gathered, the room kept between two frames, in cells. */
const GAP = 0.5;

export interface LiftedWork {
  work: number;
  /** Where it settles, in cells. */
  x: number;
  y: number;
  /** Long side once lifted, in cells. */
  size: number;
  /** Height out of the cloth, in cells. */
  z: number;
}

const hash01 = (n: number) => Math.abs(Math.sin(n * 91.17 + 3.3) * 24634.6345) % 1;
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const centreX = (work: LoomWork) => work.x + work.w / 2;
const centreY = (work: LoomWork) => work.row + work.h / 2;

/** The held work and its nearest neighbours in time along each thread (or along one),
 *  spread apart just enough to read and kept near their place on the cloth, or on a
 *  phone gathered around it. Pure: the same pull always lifts the same web. `reach` is how far along a thread it went,
 *  `middle` the row the risen web is centred on. */
export function liftWeb(
  door: LoomDoor,
  focus: number,
  along: number | null,
  shape: LiftShape = LIFT.desktop,
): { reach: number; middle: number; lifted: LiftedWork[] } {
  const threads = along === null ? door.threadsOf[focus] : [along];
  const chosen = new Set<number>();
  let reach = 1;
  for (let ring = 1; chosen.size < shape.max && ring < 150; ring++) {
    reach = ring + 1;
    for (const thread of threads) {
      const list = door.threads[thread].works;
      const at = list.indexOf(focus);
      for (const neighbour of [list[at - ring], list[at + ring]]) {
        if (neighbour !== undefined && neighbour !== focus && chosen.size < shape.max) chosen.add(neighbour);
      }
    }
  }

  if (shape.room) return { reach, ...gatherWeb(door, focus, [...chosen], shape, shape.room) };
  const held = new Set(door.threadsOf[focus]);
  return {
    reach,
    middle: centreY(door.works[focus]),
    lifted: spreadWeb(door, focus, [...chosen], shape).map((p) => {
      const shared = door.threadsOf[p.work].filter((thread) => held.has(thread)).length;
      const z = p.work === focus ? FOCUS_DEPTH : 9 + 6 * Math.max(0, shared - 1) + 7 * hash01(p.work);
      return { ...p, z };
    }),
  };
}

interface Placed {
  work: number;
  x: number;
  y: number;
  size: number;
}

/** Spread the web over the cloth: each work stays near its place, pushed off its
 *  neighbours until all can be read. */
function spreadWeb(door: LoomDoor, focus: number, chosen: number[], shape: LiftShape): Placed[] {
  const { width, height } = door.layout;
  const placed = [focus, ...chosen].map((index) => {
    const work = door.works[index];
    return { work: index, x: centreX(work), y: centreY(work), size: index === focus ? shape.focusSize : shape.neighbourSize };
  });
  for (let pass = 0; pass < SPREAD_PASSES; pass++) {
    for (let a = 0; a < placed.length; a++) {
      for (let b = a + 1; b < placed.length; b++) {
        const p = placed[a];
        const q = placed[b];
        const need = (p.size + q.size) * 0.58;
        let dx = q.x - p.x;
        let dy = q.y - p.y;
        let distance = Math.hypot(dx, dy);
        if (distance >= need) continue;
        if (distance < 0.01) {
          dx = hash01(a + b) - 0.5;
          dy = 0.5;
          distance = Math.hypot(dx, dy);
        }
        const push = ((need - distance) / distance) * 0.5;
        // The held work barely moves; its neighbours make room around it.
        const give = p.work === focus ? 0.15 : 1;
        p.x -= dx * push * give;
        p.y -= dy * push * give;
        q.x += dx * push;
        q.y += dy * push;
      }
    }
    for (const p of placed) {
      p.x = clamp(p.x, 4, width - 4);
      p.y = clamp(p.y, 3, height - 3);
    }
  }
  return placed;
}

/** A lifted work's frame, in cells, shaped as LoomLifted draws it. */
function frameOf(work: LoomWork, size: number) {
  const root = Math.sqrt(clamp(work.width / work.height, 0.62, 1.7));
  return { w: size * root, h: size / root };
}

interface Row {
  works: number[];
  width: number;
  height: number;
}

/** Gather the web on a narrow screen: the held work in the middle, earlier works in
 *  rows above it and later ones below, nearest along the threads first and each row
 *  in the cloth's order across. A neighbour the room cannot hold stays on the cloth. */
function gatherWeb(
  door: LoomDoor,
  focus: number,
  chosen: number[],
  { focusSize, neighbourSize }: LiftShape,
  room: { width: number; height: number },
): { middle: number; lifted: LiftedWork[] } {
  const midline = door.layout.width / 2;
  const heldY = centreY(door.works[focus]);
  const held = frameOf(door.works[focus], focusSize * NEARER);
  const above: Row[] = [];
  const below: Row[] = [];
  let height = held.h;
  for (const index of chosen) {
    const rows = centreY(door.works[index]) < heldY ? above : below;
    const { w, h } = frameOf(door.works[index], neighbourSize);
    const row = rows.at(-1);
    const taller = row ? Math.max(0, h - row.height) : 0;
    if (row && row.width + GAP + w <= room.width && height + taller <= room.height) {
      row.works.push(index);
      row.width += GAP + w;
      row.height += taller;
      height += taller;
      continue;
    }
    if (height + GAP + h > room.height) continue;
    rows.push({ works: [index], width: w, height: h });
    height += GAP + h;
  }

  const threads = new Set(door.threadsOf[focus]);
  const lifted: LiftedWork[] = [{ work: focus, x: midline, y: heldY, size: focusSize, z: FOCUS_DEPTH }];
  const extent = (rows: Row[]) => rows.reduce((sum, row) => sum + GAP + row.height, 0);
  for (const [rows, side] of [
    [above, -1],
    [below, 1],
  ] as const) {
    let edge = held.h / 2;
    for (const row of rows) {
      const y = heldY + side * (edge + GAP + row.height / 2);
      edge += GAP + row.height;
      let x = midline - row.width / 2;
      for (const index of row.works.sort((a, b) => centreX(door.works[a]) - centreX(door.works[b]))) {
        const { w } = frameOf(door.works[index], neighbourSize);
        // Risen nearly level, so a row still reads as a row through the eye's nearness.
        const shared = door.threadsOf[index].filter((thread) => threads.has(thread)).length;
        const z = 18 + 2 * Math.min(2, shared - 1) + 2 * hash01(index);
        lifted.push({ work: index, x: x + w / 2, y, size: neighbourSize, z });
        x += w + GAP;
      }
    }
  }
  return { middle: heldY + (extent(below) - extent(above)) / 2, lifted };
}

export interface WebItem {
  work: number;
  dx: number;
  dy: number;
  z: number;
  size: number;
  /** 0 on the cloth, 1 fully lifted. */
  k: number;
  leaving: boolean;
}

/** What the threads answer to. */
export interface WebView {
  hover: number | null;
  face: boolean;
  saga: SagaId | null;
  /** A thread named in the rail: it isolates while the pointer is on it. */
  peek: number | null;
  /** On a phone the back draws only the threads that cross the tear. */
  sparse: boolean;
}

/** The web as it moves: lifted works easing in and out, and every thread easing toward
 *  how bright and wide it should be. The scene uploads `lift` and `state` as textures;
 *  the DOM layer reads `items`. */
export class LoomWeb {
  focus: number | null = null;
  only: number | null = null;
  reach = 8;
  /** The row the held web is centred on. */
  middle = 0;
  readonly items = new Map<number, WebItem>();
  /** Per work: offset along the cloth and height out of it, in cells. */
  readonly lift: Float32Array;
  /** Per thread: alpha, width (0..255), place of the held work, reach. */
  readonly state: Uint8Array;
  private readonly goal: Float32Array;
  private readonly now: Float32Array;
  private touched = true;

  constructor(
    private readonly door: LoomDoor,
    private readonly shape: LiftShape = LIFT.desktop,
  ) {
    this.lift = new Float32Array(door.works.length * 4);
    this.state = new Uint8Array(door.threads.length * 4);
    this.goal = new Float32Array(door.threads.length * 2);
    this.now = new Float32Array(door.threads.length * 2);
  }

  pull(focus: number, along: number | null) {
    const { reach, middle, lifted } = liftWeb(this.door, focus, along, this.shape);
    this.focus = focus;
    this.only = along;
    this.reach = reach;
    this.middle = middle;
    for (const item of this.items.values()) item.leaving = true;
    for (const placed of lifted) {
      const work = this.door.works[placed.work];
      const item = this.items.get(placed.work) ?? { work: placed.work, dx: 0, dy: 0, z: 0, size: 1, k: 0, leaving: false };
      Object.assign(item, {
        dx: placed.x - centreX(work),
        dy: placed.y - centreY(work),
        z: placed.z,
        size: placed.size,
        leaving: false,
      });
      this.items.set(placed.work, item);
    }
  }

  release() {
    this.focus = null;
    this.only = null;
    for (const item of this.items.values()) item.leaving = true;
  }

  /** The thread a pulled web is narrowed to: named in the rail, or chosen. */
  isolated(peek: number | null): number | null {
    return peek ?? this.only;
  }

  /** Works on the threads in play, while a work is held. */
  near(peek: number | null): Set<number> | null {
    if (this.focus === null) return null;
    const isolated = this.isolated(peek);
    const threads = isolated === null ? this.door.threadsOf[this.focus] : [isolated];
    return new Set(threads.flatMap((thread) => this.door.threads[thread].works));
  }

  /** Point every thread at how it should look. Held by one work a thread shows only
   *  its neighbours and fades along its length; on the back every thread shows. */
  aim(view: WebView) {
    const focus = this.focus ?? view.hover;
    const lit = new Set(focus === null ? [] : this.door.threadsOf[focus]);
    const pulled = this.focus !== null;
    const isolated = this.isolated(view.peek);
    for (const thread of this.door.threads) {
      const n = thread.index;
      let alpha = 0;
      let width = 0;
      let place = 0;
      let reach = 255;
      if (view.face) {
        alpha = thread.crosses ? 0.34 : view.sparse ? 0 : 0.11;
        width = thread.crosses ? 0.2 : 0.15;
        if (view.saga && thread.saga !== view.saga) alpha = 0.025;
        if (focus !== null && !lit.has(n)) alpha *= 0.3;
      }
      if (lit.has(n) && focus !== null) {
        const shown = isolated === null || isolated === n;
        alpha = shown ? 1 : 0.2;
        width = shown ? (pulled ? 0.4 : 0.26) : 0.18;
        place = thread.works.indexOf(focus);
        reach = isolated === n ? 255 : pulled ? this.reach : 3;
      }
      this.goal[n * 2] = alpha;
      this.goal[n * 2 + 1] = width;
      this.state[n * 4 + 2] = Math.min(place, 255);
      this.state[n * 4 + 3] = Math.min(reach, 255);
    }
    this.touched = true;
  }

  /** Ease one frame; says which textures need uploading. */
  advance(dt: number): { lift: boolean; state: boolean } {
    let stateChanged = this.touched;
    this.touched = false;
    const threadRate = 1 - Math.exp(-dt * 8);
    for (let k = 0; k < this.now.length; k++) {
      const step = this.goal[k] - this.now[k];
      if (Math.abs(step) < 0.003) continue;
      this.now[k] += step * threadRate;
      this.state[(k >> 1) * 4 + (k & 1)] = Math.round(clamp(this.now[k], 0, 1) * 255);
      stateChanged = true;
    }

    let liftChanged = false;
    const liftRate = 1 - Math.exp(-dt * 5.5);
    for (const [index, item] of this.items) {
      item.k += ((item.leaving ? 0 : 1) - item.k) * liftRate;
      const at = index * 4;
      if (item.leaving && item.k < 0.015) {
        this.lift[at] = this.lift[at + 1] = this.lift[at + 2] = 0;
        this.items.delete(index);
      } else {
        this.lift[at] = item.dx * item.k;
        this.lift[at + 1] = item.dy * item.k;
        this.lift[at + 2] = item.z * item.k;
      }
      liftChanged = true;
    }
    return { lift: liftChanged, state: stateChanged };
  }
}
