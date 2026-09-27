/** Validates the River of Myth layout. Run with: pnpm validate-myth-river
 *
 * Contract (src/features/stories/river.ts, docs/MYTHS_RIVER_PLAN.md §3–4):
 *   every story is one star on one stream, in time order along it
 *   every sourced crossing is drawn exactly once — a kiss, a tributary, a knot
 *     at a fork's mouth or a thread of fate — or joins two stories of one stream
 *   ribbons never overlap outside a kiss, a fork's mouth or a pass
 *   every kiss touches; every tributary ends inside its partner
 *   deterministic, and blind to the order of its input
 *   readability LIMITS on the braid (scripts/lib/myth-river-metrics.ts)
 */

import { createHash } from 'node:crypto';
import { buildChronologyYears } from '../src/features/stories/chronology';
import { loadChronology, loadStories, loadStoryCrossings } from '../src/features/stories/load';
import { buildRiverLayout, type RiverLayout } from '../src/features/stories/river';
import { measureRiver } from './lib/myth-river-metrics';

/** Readability limits, set with headroom over the measured river (3 passes,
 *  1 meeting kept apart by the lanes, sharpest bend 1.9 in the Attic cycle's
 *  crowd of kisses, 38 lane units tall): a trip means the braid has tangled,
 *  not that a number wants nudging. */
const LIMITS = {
  /** Two streams changing places. */
  passes: 8,
  /** Sourced meetings the lane order could not bring together. */
  threadsApart: 3,
  /** Largest second difference along any stream, lane units. */
  peakBend: 2.5,
  /** Lane extent of the whole river. */
  height: 50,
};

const fingerprint = (river: RiverLayout) =>
  createHash('sha1')
    .update(JSON.stringify({ ...river, byId: undefined }))
    .digest('hex');

async function main() {
  const stories = await loadStories();
  const crossings = await loadStoryCrossings();
  const years = buildChronologyYears(stories, await loadChronology());
  const river = buildRiverLayout(stories, years, crossings);
  const errors: string[] = [];

  /* 1. Every story is one star on one stream. */
  const starIds = river.stars.map((star) => star.id);
  const seen = new Set<string>();
  for (const id of starIds) {
    if (seen.has(id)) errors.push(`${id}: placed more than once`);
    seen.add(id);
  }
  for (const story of stories) if (!seen.has(story.id)) errors.push(`${story.id}: not placed`);

  /* 2. Streams run forward in time, finite and with width; their stars sit on
   *    the stream's own run, in order. */
  for (const stream of river.streams) {
    const { points } = stream;
    if (points.length === 0) {
      errors.push(`${stream.id}: stream has no points`);
      continue;
    }
    for (let i = 0; i < points.length; i += 1) {
      const p = points[i];
      if (!Number.isFinite(p.y) || !(p.width > 0)) errors.push(`${stream.id}: bad sample at t ${p.t.toFixed(3)}`);
      if (i > 0 && !(p.t > points[i - 1].t)) errors.push(`${stream.id}: time runs backwards at t ${p.t.toFixed(3)}`);
    }
    const water = points.filter((p) => !p.trickle);
    const [from, to] = [water[0]?.t ?? Infinity, water[water.length - 1]?.t ?? -Infinity];
    let previous = -Infinity;
    for (const id of stream.stars) {
      const star = river.byId.get(id);
      if (!star || star.stream !== stream.id) {
        errors.push(`${id}: listed on ${stream.id} but placed elsewhere`);
        continue;
      }
      if (star.t < previous) errors.push(`${id}: out of time order on ${stream.id}`);
      previous = star.t;
      if (star.t < from - 1e-6 || star.t > to + 1e-6) errors.push(`${id}: star off its stream's run`);
    }
  }

  /* 3. Every sourced crossing is drawn exactly once. */
  const drawn = new Map<string, number>();
  const count = (a: string, b: string) => drawn.set(`${a}|${b}`, (drawn.get(`${a}|${b}`) ?? 0) + 1);
  for (const c of river.confluences) count(c.a, c.b);
  for (const b of river.bridges) count(b.a, b.b);
  for (const u of river.unmet) count(u.a, u.b);
  for (const crossing of crossings) {
    const times = drawn.get(`${crossing.a}|${crossing.b}`) ?? 0;
    if (times !== 1) errors.push(`crossing ${crossing.a} ~ ${crossing.b}: drawn ${times} times`);
  }
  if (drawn.size !== crossings.length) errors.push(`${drawn.size} crossings drawn for ${crossings.length} sourced`);
  for (const c of river.confluences) {
    const [sa, sb] = [river.byId.get(c.a), river.byId.get(c.b)];
    if (!sa || !sb || sa.stream !== c.streams[0] || sb.stream !== c.streams[1]) {
      errors.push(`confluence ${c.a} ~ ${c.b}: its streams are not its stories' streams`);
    }
  }

  /* 4–5. The braid: no overlaps, every kiss touches, within the limits. */
  const metrics = measureRiver(river);
  for (const o of metrics.overlaps.pairs) {
    errors.push(`${o.a} / ${o.b}: ribbons overlap by ${o.depth.toFixed(2)} at t ${o.t.toFixed(3)}`);
  }
  for (const kiss of metrics.kissesApart) errors.push(`${kiss}: the streams do not touch at their meeting`);
  const gate = (value: number, limit: number, label: string) => {
    if (value > limit) errors.push(`readability: ${label} is ${value.toFixed(2)}; limit is ${limit}`);
  };
  gate(metrics.passes, LIMITS.passes, 'passes');
  gate(metrics.threads.apart, LIMITS.threadsApart, 'meetings kept apart by the lanes');
  gate(metrics.bend.peak, LIMITS.peakBend, `sharpest bend (${metrics.bend.stream})`);
  gate(metrics.height.river, LIMITS.height, 'river height');

  /* 6. Deterministic, and blind to the order of its input. */
  const hash = fingerprint(river);
  if (fingerprint(buildRiverLayout(stories, years, crossings)) !== hash) {
    errors.push('determinism: two runs on the same roster differ');
  }
  const shuffled = buildRiverLayout([...stories].reverse(), years, [...crossings].reverse());
  if (fingerprint(shuffled) !== hash) errors.push('determinism: the river depends on the order of its input');

  console.log(
    `River of Myth: ${river.streams.length} streams · ${river.stars.length} stars · ${metrics.kisses} kisses · ${metrics.tributaries} tributaries · ${metrics.knots} knots · ${metrics.threads.far + metrics.threads.apart} threads · ${metrics.unmet} within one stream`,
  );
  console.log(
    `Braid: ${metrics.passes} passes · ${metrics.threads.apart} kept apart · sharpest bend ${metrics.bend.peak.toFixed(2)} (${metrics.bend.stream}) · height ${metrics.height.river.toFixed(1)} · fingerprint ${hash.slice(0, 12)}`,
  );

  if (errors.length > 0) {
    console.error(`\n${errors.length} river error(s):`);
    for (const error of errors) console.error(`  ✗ ${error}`);
    process.exit(1);
  }
  console.log('\nRiver of Myth layout valid.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
