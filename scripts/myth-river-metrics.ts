/** Reports how readable the River of Myth is. Run with:
 *
 *   pnpm myth-river:metrics          lay out the river, then measure it
 *   pnpm myth-river:metrics --json   machine-readable, for before/after diffs
 *
 * A report, never a gate — `pnpm validate-myth-river` enforces the limits on
 * the same measurements (scripts/lib/myth-river-metrics.ts).
 */

import { buildChronologyYears } from '../src/features/stories/chronology';
import { loadChronology, loadStories, loadStoryCrossings } from '../src/features/stories/load';
import { buildRiverLayout } from '../src/features/stories/river';
import { measureRiver } from './lib/myth-river-metrics';

async function main() {
  const stories = await loadStories();
  const crossings = await loadStoryCrossings();
  const years = buildChronologyYears(stories, await loadChronology());
  const startedAt = performance.now();
  const river = buildRiverLayout(stories, years, crossings);
  const layoutMs = Math.round(performance.now() - startedAt);
  const metrics = measureRiver(river);

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ layoutMs, ...metrics }, null, 2));
    return;
  }

  const fmt = (value: number, digits = 2) => value.toFixed(digits);
  const row = (label: string, value: string) => console.log(`  ${label.padEnd(42)} ${value}`);
  console.log(`River of Myth — laid out in ${layoutMs} ms`);
  console.log('\nStreams:');
  row('sagas · distributaries · lone stories', `${metrics.streams.saga} · ${metrics.streams.distributary} · ${metrics.streams.lone}`);
  row('stars', String(metrics.stars));
  console.log('\nSourced crossings, as drawn:');
  row('kisses', String(metrics.kisses));
  row('tributaries', String(metrics.tributaries));
  row("knots at a fork's mouth", String(metrics.knots));
  row('threads of fate — far apart in time', String(metrics.threads.far));
  row('threads of fate — kept apart by the lanes', String(metrics.threads.apart));
  row('within one stream', String(metrics.unmet));
  console.log('\nBraid:');
  row('passes (two streams changing places)', String(metrics.passes));
  row('ribbon overlaps outside kisses, mouths, passes', String(metrics.overlaps.count));
  for (const o of metrics.overlaps.pairs) {
    row(`  ${o.a} / ${o.b}`, `deepest ${fmt(o.depth)} at t ${fmt(o.t, 3)}`);
  }
  row('kisses that do not touch', metrics.kissesApart.length ? metrics.kissesApart.join(', ') : '0');
  if (metrics.clearWater) {
    const c = metrics.clearWater;
    row('narrowest clear water', `${fmt(c.min)} (${c.a} / ${c.b} at t ${fmt(c.t, 3)})`);
  }
  console.log('\nShape (lane units):');
  row('sideways travel, all streams', fmt(metrics.wiggle.total, 1));
  row('most restless stream (per unit of axis)', `${metrics.wiggle.worst.stream} ${fmt(metrics.wiggle.worst.perUnitT, 1)}`);
  row('sharpest bend · P90', `${fmt(metrics.bend.peak, 3)} (${metrics.bend.stream} at t ${fmt(metrics.bend.t, 3)}) · ${fmt(metrics.bend.p90, 4)}`);
  row('river height · widest moment', `${fmt(metrics.height.river, 1)} · ${fmt(metrics.height.peak, 1)} at t ${fmt(metrics.height.t, 3)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
