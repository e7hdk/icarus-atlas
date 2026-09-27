import type { LensId } from '@/types/character';
import type { Story } from '@/types/story';
import type { RiverScene } from './river';
import { SHELF_ROOT_IDS, type SagaId } from './sagas';
import type { SpindleAge, SpindleLayout, SpindleNode, Vec3 } from './spindle';
import { AGE_BANDS } from './timeAxis';

/** The River of Myth's layout wound onto the Spindle (docs/MYTHS_RIVER_PLAN.md):
 *  the threads of the myths spun on the spindle of Necessity. Time runs down the
 *  spindle's length; the river's lane order becomes the angle around it, so a
 *  saga is one continuous thread, its stories stars on it in order; threads
 *  touch where the sources say the myths meet and part only at a fork. The
 *  whole winds slowly around the axis as it runs — the spindle turning.
 *  Coordinates are the Spindle's own, so its scene, rig and navigation apply. */

/** The spindle's radius, its top (the source) and the length time runs over. */
const RADIUS = 30;
const TOP = 6780;
const LENGTH = 7000;
/** Angle per lane unit: the river's widest moment — the Nostoi's thirteen
 *  returns — nearly closes the circle. */
const ANGLE_PER_LANE = (Math.PI * 2) / 42;
/** Whole turns the spindle makes over the length of time. */
const TURNS = 5;
const TWIST = (TURNS * Math.PI * 2) / LENGTH;
/** A thread's radius per lane of stream width, and at its thinnest. */
const THREAD = { base: 0.06, perLane: 0.06, trickle: 0.035 };
/** Points drawn per laid-out sample: the path is eased through them
 *  (Catmull–Rom), so a thread bends in arcs, never at a corner. */
const SUBDIVIDE = 3;

const smoothstep = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

/** Uniform Catmull–Rom between b and c at u. */
const catmullRom = (a: number, b: number, c: number, d: number, u: number) =>
  0.5 * (2 * b + (c - a) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (3 * b - a - 3 * c + d) * u * u * u);

/** A saga's thread down the spindle: its path, its thickness where it runs, and
 *  for each point the story whose reach it flows in (the lens reads it). */
export interface SpindleThread {
  id: string;
  saga: SagaId;
  color: string;
  points: Vec3[];
  radii: number[];
  trickle: boolean[];
  reach: string[];
}

export interface ThreadedSpindle {
  layout: SpindleLayout;
  threads: SpindleThread[];
}

const heightOf = (t: number) => TOP - t * LENGTH;
const place = (t: number, lane: number): Vec3 => {
  const angle = lane * ANGLE_PER_LANE + t * LENGTH * TWIST;
  return [RADIUS * Math.sin(angle), heightOf(t), RADIUS * Math.cos(angle)];
};

function sizeFor(story: Story): number {
  if (SHELF_ROOT_IDS.has(story.id)) return 1.15;
  if (story.kind === 'episode') return 0.6;
  return 0.85;
}

export function buildThreadedSpindle(stories: Story[], river: RiverScene): ThreadedSpindle {
  const storyById = new Map(stories.map((story) => [story.id, story]));
  const streamById = new Map(river.streams.map((stream) => [stream.id, stream]));

  // A kiss on the spindle is a touch: the lanes keep two meeting ribbons a
  // contact apart, but threads are fine, so each pair is drawn together over its
  // kiss until, at the moment, they share one point.
  const lanes = new Map(river.streams.map((stream) => [stream.id, stream.points.map((p) => p.y)]));
  const slot = (stream: string, t: number) => {
    const points = streamById.get(stream)!.points;
    let best = 0;
    for (let i = 1; i < points.length; i += 1) if (Math.abs(points[i].t - t) < Math.abs(points[best].t - t)) best = i;
    return Math.abs(points[best].t - t) < 1e-6 ? best : -1;
  };
  for (const kiss of river.confluences) {
    if (kiss.kind !== 'kiss') continue;
    const [a, b] = kiss.streams;
    const pa = streamById.get(a)!.points;
    for (let i = 0; i < pa.length; i += 1) {
      const t = pa[i].t;
      if (t < kiss.t1 || t > kiss.t2) continue;
      const j = slot(b, t);
      if (j < 0) continue;
      const span = t <= kiss.t ? kiss.t - kiss.t1 : kiss.t2 - kiss.t;
      const pull = span > 0 ? smoothstep(1 - Math.abs(t - kiss.t) / span) : 1;
      const ya = streamById.get(a)!.points[i].y;
      const yb = streamById.get(b)!.points[j].y;
      const mid = (ya + yb) / 2;
      lanes.get(a)![i] += pull * (mid - ya);
      lanes.get(b)![j] += pull * (mid - yb);
    }
  }

  // A star sits on its thread as drawn, pulled into its kisses with it.
  const laneAt = (stream: string, t: number) => {
    const points = streamById.get(stream)!.points;
    const ys = lanes.get(stream)!;
    let i = 0;
    while (i + 1 < points.length && points[i + 1].t <= t) i += 1;
    const j = Math.min(points.length - 1, i + 1);
    const f = j === i || points[j].t === points[i].t ? 0 : (t - points[i].t) / (points[j].t - points[i].t);
    return ys[i] + (ys[j] - ys[i]) * Math.min(1, Math.max(0, f));
  };
  const nodes: SpindleNode[] = [];
  for (const star of river.stars) {
    const story = storyById.get(star.id);
    const stream = streamById.get(star.stream);
    if (!story || !stream) continue;
    const pos = place(star.t, laneAt(star.stream, star.t));
    nodes.push({
      id: story.id,
      title: story.title,
      greekTitle: story.greekTitle,
      kind: story.kind,
      era: story.era,
      eraEnd: story.eraEnd ?? story.era,
      parentId: story.parent,
      sagaId: stream.saga,
      color: stream.color,
      size: sizeFor(story),
      isSagaRoot: SHELF_ROOT_IDS.has(story.id),
      pos,
      sources: star.sources as LensId[],
    });
  }


  const starT = new Map(river.stars.map((star) => [star.id, star.t]));
  const threads: SpindleThread[] = river.streams.map((stream) => {
    const pts = stream.points;
    const ys = lanes.get(stream.id)!;
    const points: Vec3[] = [];
    const radii: number[] = [];
    const trickle: boolean[] = [];
    const reach: string[] = [];
    let at = 0;
    for (let i = 0; i < pts.length; i += 1) {
      const steps = i === pts.length - 1 ? 1 : SUBDIVIDE;
      for (let s = 0; s < steps; s += 1) {
        const u = s / SUBDIVIDE;
        const next = pts[Math.min(pts.length - 1, i + 1)];
        const t = pts[i].t + (next.t - pts[i].t) * u;
        const y = catmullRom(
          ys[Math.max(0, i - 1)],
          ys[i],
          ys[Math.min(pts.length - 1, i + 1)],
          ys[Math.min(pts.length - 1, i + 2)],
          u,
        );
        const width = pts[i].width + (next.width - pts[i].width) * u;
        const trickles = u < 0.5 ? pts[i].trickle : next.trickle;
        while (at + 1 < stream.stars.length && starT.get(stream.stars[at + 1])! <= t + 1e-9) at += 1;
        points.push(place(t, y));
        radii.push(trickles ? THREAD.trickle : THREAD.base + THREAD.perLane * width);
        trickle.push(trickles);
        reach.push(stream.stars[at]);
      }
    }
    return { id: stream.id, saga: stream.saga, color: stream.color, points, radii, trickle, reach };
  });

  const ages: SpindleAge[] = river.ages.map((age, i) => ({
    y: heightOf(age.t),
    era: AGE_BANDS[i]?.era ?? 0,
    label: age.label,
  }));
  const eras = stories.map((story) => story.era);

  return {
    layout: {
      nodes,
      byId: new Map(nodes.map((node) => [node.id, node])),
      ages,
      minEra: Math.min(...eras),
      maxEra: Math.max(...stories.map((story) => story.eraEnd ?? story.era)),
      yTop: TOP,
      yBottom: TOP - LENGTH,
      radius: RADIUS,
    },
    threads,
  };
}
