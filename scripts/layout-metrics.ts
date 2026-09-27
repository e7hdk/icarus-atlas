/** Reports how readable families are in the galaxy layout. Run with:
 *
 *   pnpm layout:metrics            solve the layout, then measure it
 *   pnpm layout:metrics --baked    measure data/generated/galaxy-positions.json
 *   pnpm layout:metrics --json     machine-readable, for before/after diffs
 *
 * A report, never a gate — `pnpm validate-layout` enforces the thresholds on the
 * same measurements (scripts/lib/layout-metrics.ts).
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { computePositions, type Vec3 } from '../src/features/galaxy/layout';
import { layoutSignature } from '../src/features/galaxy/layoutSignature';
import type { Character, Relation } from '../src/types/character';
import { measureLayout, type Distribution } from './lib/layout-metrics';

const DATA_DIR = join(import.meta.dirname, '..', 'data');
const characters = readdirSync(join(DATA_DIR, 'characters'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(join(DATA_DIR, 'characters', file), 'utf-8')) as Character)
  .sort((a, b) => a.id.localeCompare(b.id));
const relations = JSON.parse(readFileSync(join(DATA_DIR, 'relations.json'), 'utf-8')) as Relation[];

function bakedPositions(): Map<string, Vec3> {
  const baked = JSON.parse(
    readFileSync(join(DATA_DIR, 'generated', 'galaxy-positions.json'), 'utf-8'),
  ) as { signature: string; positions: Record<string, Vec3> };
  if (baked.signature !== layoutSignature(characters, relations)) {
    console.error('The baked layout is stale — run `pnpm bake-layout`, or drop --baked to solve afresh.');
    process.exit(1);
  }
  return new Map(Object.entries(baked.positions));
}

const useBaked = process.argv.includes('--baked');
const startedAt = performance.now();
const positions = useBaked ? bakedPositions() : computePositions(characters, relations);
const solveMs = useBaked ? undefined : Math.round(performance.now() - startedAt);
const metrics = measureLayout(characters, relations, positions);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ solveMs, ...metrics }, null, 2));
  process.exit(0);
}

const fmt = (value: number) => value.toFixed(1);
const row = (label: string, d: Distribution) =>
  console.log(
    `  ${label.padEnd(30)} n=${String(d.n).padEnd(5)} median ${fmt(d.median).padStart(6)}   p75 ${fmt(d.p75).padStart(6)}   p90 ${fmt(d.p90).padStart(6)}   max ${fmt(d.max).padStart(6)}`,
  );

console.log(
  `Layout metrics — ${positions.size} stars, ${useBaked ? 'baked positions' : `solved in ${solveMs} ms`}, galaxy radius ${fmt(metrics.galaxyRadius)}`,
);
console.log('\nPlanar distance (world units):');
row('scaffold (placement) edges', metrics.scaffoldEdges);
row('bridge parent edges', metrics.bridgeEdges);
row('all parent edges', metrics.parentEdges);
row('adjacent siblings', metrics.adjacentSiblings);
row('consort pairs', metrics.consortPairs);
row('parentless leaf → ally hub', metrics.orphanToHub);

console.log('\nFixtures:');
for (const { parent, child, distance, limit } of metrics.fixtures) {
  console.log(`  ${`${parent} → ${child}`.padEnd(30)} ${fmt(distance).padStart(6)}   (limit ${limit})`);
}

console.log('\nGeneration rings:');
row('mortal → mortal parent step', metrics.mortalStepRings);
row('mortal spouses, ring gap', metrics.spouseRingGap);
console.log(
  `  ${'spouses within one ring'.padEnd(30)} ${metrics.spouseRingGap.withinOneRing} of ${metrics.spouseRingGap.n}`,
);
console.log('\nCohort patches (degrees of arc, P90 of members around the patch bearing):');
row('angular spread per cohort', metrics.cohortSpreadDegrees);

console.log('\nHeight by realm (stars · outside own band · inside another realm\'s band):');
for (const [realm, h] of Object.entries(metrics.heights)) {
  console.log(`  ${realm.padEnd(30)} ${String(h.stars).padStart(5)} · ${String(h.outsideOwnBand).padStart(4)} · ${String(h.insideOtherBand).padStart(4)}`);
}

const { terrestrial, rings, cohorts } = metrics;
console.log('\nStructure:');
console.log(`  mortal → mortal edges spanning 4+ rings   ${metrics.longMortalSteps}`);
console.log(
  `  terrestrial stars                          ${terrestrial.stars} · outside base band ${terrestrial.outsideBaseBand} · at another realm's height ${terrestrial.atOtherRealmHeight}`,
);
console.log(
  `  mortal base ring                           ${rings.mortalBase} · timeless figures on ring ${rings.mortalBase - 1}: ${rings.divineInsideBase}`,
);
console.log(
  `  most crowded ring                          ${rings.mostCrowded.ring}: ${rings.mostCrowded.population} stars for ${rings.mostCrowded.capacity}`,
);
console.log(
  `  cohorts                                    ${cohorts.count} · ${cohorts.members} stars · double membership ${cohorts.doubleMembership}`,
);
console.log(`  separation violations                      ${metrics.separationViolations}`);
