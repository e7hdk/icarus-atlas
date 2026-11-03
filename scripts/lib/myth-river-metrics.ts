/** Readability measurements of a laid-out River of Myth. Shared by
 *  `pnpm myth-river:metrics` (the report) and `pnpm validate-myth-river` (the
 *  gates), so the two can never disagree about what a number means. Lane units
 *  across the river, axis `t` (0 → 1) along it — docs/MYTHS_RIVER_PLAN.md §4. */

import type { RiverLayout, RiverPoint } from '../../src/features/stories/river';

export interface RiverMetrics {
  streams: { saga: number; distributary: number; lone: number };
  stars: number;
  /** How the sourced crossings are drawn. */
  kisses: number;
  tributaries: number;
  knots: number;
  threads: { far: number; apart: number };
  unmet: number;
  /** Two streams changing places. */
  passes: number;
  /** Ribbons overlapping outside a kiss, a fork's mouth or a pass: how many
   *  samples, and the deepest per pair of streams. */
  overlaps: { count: number; pairs: { a: string; b: string; t: number; depth: number }[] };
  /** Kisses whose streams do not touch at their moment, and tributaries that
   *  do not end inside their partner. */
  kissesApart: string[];
  /** The narrowest clear water between two neighbouring ribbons that may not touch. */
  clearWater: { min: number; a: string; b: string; t: number } | null;
  /** Sideways travel summed along every stream, and the most restless stream
   *  (lane units per unit of axis). */
  wiggle: { total: number; worst: { stream: string; perUnitT: number } };
  /** The sharpest bend of any stream — its largest second difference between
   *  neighbouring samples, in lane units — and the 90th percentile. */
  bend: { peak: number; stream: string; t: number; p90: number };
  /** Lane extent of the whole river, and of its widest single moment. */
  height: { river: number; peak: number; t: number };
}

interface Sample {
  stream: string;
  point: RiverPoint;
}

const pairKey = (x: string, y: string) => (x < y ? `${x}|${y}` : `${y}|${x}`);

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1)))];
}

export function measureRiver(river: RiverLayout): RiverMetrics {
  const kind = (k: string) => river.streams.filter((s) => s.kind === k).length;

  // Where two ribbons may overlap: a kiss (its whole approach), a fork's mouth
  // while it opens, and two streams passing each other.
  const allowed = new Map<string, [number, number][]>();
  const allow = (a: string, b: string, t1: number, t2: number) => {
    const key = pairKey(a, b);
    allowed.set(key, [...(allowed.get(key) ?? []), [t1, t2]]);
  };
  for (const c of river.confluences) allow(c.streams[0], c.streams[1], c.t1, c.t2);
  for (const p of river.passes) allow(p.a, p.b, p.t1, p.t2);
  for (const fork of river.forks) {
    const group = [fork.stream, ...fork.streams];
    for (let i = 0; i < group.length; i += 1) {
      for (let j = i + 1; j < group.length; j += 1) allow(group[i], group[j], fork.t1, fork.t2);
    }
  }
  const mayTouch = (a: string, b: string, t: number) =>
    (allowed.get(pairKey(a, b)) ?? []).some(([t1, t2]) => t >= t1 - 1e-9 && t <= t2 + 1e-9);

  // Every moment the river is sampled at, with the streams running there.
  const moments = new Map<number, Sample[]>();
  for (const stream of river.streams) {
    for (const point of stream.points) {
      const list = moments.get(point.t) ?? [];
      list.push({ stream: stream.id, point });
      moments.set(point.t, list);
    }
  }

  let overlapCount = 0;
  const overlapPairs = new Map<string, RiverMetrics['overlaps']['pairs'][number]>();
  let clearWater: RiverMetrics['clearWater'] = null;
  let peakHeight = 0;
  let peakHeightT = 0;
  for (const [t, samples] of moments) {
    samples.sort((x, y) => x.point.y - y.point.y);
    const top = Math.min(...samples.map((s) => s.point.y - s.point.width / 2));
    const bottom = Math.max(...samples.map((s) => s.point.y + s.point.width / 2));
    if (bottom - top > peakHeight) {
      peakHeight = bottom - top;
      peakHeightT = t;
    }
    for (let i = 1; i < samples.length; i += 1) {
      const upper = samples[i - 1];
      const lower = samples[i];
      if (mayTouch(upper.stream, lower.stream, t)) continue;
      const water =
        lower.point.y - lower.point.width / 2 - (upper.point.y + upper.point.width / 2);
      if (!clearWater || water < clearWater.min) {
        clearWater = { min: water, a: upper.stream, b: lower.stream, t };
      }
      if (water >= -1e-6) continue;
      overlapCount += 1;
      const key = pairKey(upper.stream, lower.stream);
      const known = overlapPairs.get(key);
      if (!known || -water > known.depth) {
        overlapPairs.set(key, { a: upper.stream, b: lower.stream, t, depth: -water });
      }
    }
  }

  // Every kiss touches at its moment; every tributary ends inside its partner.
  const byStream = new Map(river.streams.map((s) => [s.id, s]));
  const at = (stream: string, t: number): RiverPoint | undefined => {
    const points = byStream.get(stream)?.points ?? [];
    let best: RiverPoint | undefined;
    for (const p of points) if (!best || Math.abs(p.t - t) < Math.abs(best.t - t)) best = p;
    return best;
  };
  const kissesApart: string[] = [];
  for (const c of river.confluences) {
    const [a, b] = c.streams;
    const pa = at(a, c.t);
    const pb = at(b, c.t);
    if (!pa || !pb) {
      kissesApart.push(`${c.a} ~ ${c.b}`);
      continue;
    }
    const distance = Math.abs(pa.y - pb.y);
    const reach = c.kind === 'tributary' ? Math.max(pa.width, pb.width) / 2 : (pa.width + pb.width) / 2;
    if (distance > reach + 1e-6) kissesApart.push(`${c.a} ~ ${c.b}`);
  }

  // Wiggle and bends, along each stream.
  let wiggleTotal = 0;
  let worstWiggle = { stream: '', perUnitT: 0 };
  let peakBend = { peak: 0, stream: '', t: 0 };
  const bends: number[] = [];
  for (const stream of river.streams) {
    const points = stream.points;
    let travel = 0;
    for (let i = 1; i < points.length; i += 1) travel += Math.abs(points[i].y - points[i - 1].y);
    wiggleTotal += travel;
    const length = points.length > 1 ? points[points.length - 1].t - points[0].t : 0;
    if (length > 0 && travel / length > worstWiggle.perUnitT) {
      worstWiggle = { stream: stream.id, perUnitT: travel / length };
    }
    for (let i = 1; i < points.length - 1; i += 1) {
      const bend = Math.abs(points[i - 1].y - 2 * points[i].y + points[i + 1].y);
      bends.push(bend);
      if (bend > peakBend.peak) peakBend = { peak: bend, stream: stream.id, t: points[i].t };
    }
  }
  bends.sort((x, y) => x - y);

  return {
    streams: { saga: kind('saga'), distributary: kind('distributary'), lone: kind('lone') },
    stars: river.stars.length,
    kisses: river.confluences.filter((c) => c.kind === 'kiss').length,
    tributaries: river.confluences.filter((c) => c.kind === 'tributary').length,
    knots: river.confluences.filter((c) => c.kind === 'knot').length,
    threads: {
      far: river.bridges.filter((b) => b.reason === 'far').length,
      apart: river.bridges.filter((b) => b.reason === 'apart').length,
    },
    unmet: river.unmet.length,
    passes: river.passes.length,
    overlaps: {
      count: overlapCount,
      pairs: [...overlapPairs.values()].sort((x, y) => y.depth - x.depth || x.t - y.t),
    },
    kissesApart,
    clearWater,
    wiggle: { total: wiggleTotal, worst: worstWiggle },
    bend: { ...peakBend, p90: quantile(bends, 0.9) },
    height: { river: river.yMax - river.yMin, peak: peakHeight, t: peakHeightT },
  };
}
