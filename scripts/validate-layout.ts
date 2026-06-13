/** Validates the deterministic cosmos layout. Run with: pnpm validate-layout
 *
 * Contract (src/features/galaxy/layout.ts):
 *   radius = mythic generation · angle = dynasty wedge + spiral twist
 *   height = cosmological realm band (may stretch by REALM_OVERFLOW at most)
 *   spacing ≥ MIN_STAR_DISTANCE, consort binaries ≥ MIN_CONSORT_DISTANCE
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  computeDynastyWedges,
  computeGenerations,
  computePositions,
  isChronologicalParentRelation,
  realmOf,
  MIN_CONSORT_DISTANCE,
  MIN_STAR_DISTANCE,
  REALM_BANDS,
  REALM_OVERFLOW,
  SPIRAL_TWIST,
} from '../src/features/galaxy/layout';
import type { Character, Relation } from '../src/types/character';

const DATA_DIR = join(import.meta.dirname, '..', 'data');
const characters = readdirSync(join(DATA_DIR, 'characters'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(join(DATA_DIR, 'characters', file), 'utf-8')) as Character);
const relations = JSON.parse(readFileSync(join(DATA_DIR, 'relations.json'), 'utf-8')) as Relation[];
const charactersById = new Map(characters.map((character) => [character.id, character]));
const generations = computeGenerations(characters, relations);
const wedges = computeDynastyWedges(characters, relations);
const positions = computePositions(characters, relations);
const repeatedPositions = computePositions(characters, relations);
const errors: string[] = [];

function radius(id: string): number {
  const position = positions.get(id);
  if (!position) throw new Error(`missing position for ${id}`);
  return Math.hypot(position[0], position[2]);
}

function normalizeSignedAngle(angle: number): number {
  const turn = Math.PI * 2;
  let a = ((angle % turn) + turn) % turn;
  if (a > Math.PI) a -= turn;
  return a;
}

/* 0. Coverage: every character must get a star. A character without a computed
 *    position is silently dropped from the galaxy (GalaxyCanvas skips it), so
 *    assert one position per character — no character file may be starless. */
for (const character of characters) {
  if (!positions.has(character.id)) {
    errors.push(`${character.id}: no star — computePositions returned no position for this character`);
  }
}
if (positions.size !== characters.length) {
  errors.push(
    `star count mismatch: ${positions.size} stars for ${characters.length} characters`,
  );
}

/* 1. Chronology: every sourced parent edge keeps the child visibly outside. */
for (const relation of relations) {
  if (!isChronologicalParentRelation(relation, charactersById)) continue;
  const childGeneration = generations.get(relation.from);
  const parentGeneration = generations.get(relation.to);
  if (childGeneration === undefined || parentGeneration === undefined) continue;
  if (childGeneration < parentGeneration + 0.999) {
    errors.push(`${relation.id}: child generation must be after parent generation`);
  }
  if (radius(relation.from) <= radius(relation.to) + 2.5) {
    errors.push(`${relation.id}: child star must be visibly farther from the core`);
  }
}

/* 2. Dynasty wedges: a star's untwisted bearing stays inside its wedge. */
for (const character of characters) {
  if (character.id === 'chaos') continue;
  const position = positions.get(character.id);
  const wedge = wedges.get(character.id);
  if (!position || !wedge) continue;
  const generation = generations.get(character.id) ?? 0;
  const bearing = Math.atan2(position[2], position[0]) - SPIRAL_TWIST * generation;
  const offset = Math.abs(normalizeSignedAngle(bearing - wedge.mid));
  if (offset > Math.max(wedge.half, 0.015) + 0.02) {
    errors.push(
      `${character.id}: bearing leaves its dynasty wedge by ${(offset - wedge.half).toFixed(3)} rad`,
    );
  }
}

/* 3. Realm bands: height stays inside the figure's cosmological level. */
for (const character of characters) {
  if (character.id === 'chaos') continue;
  const position = positions.get(character.id);
  if (!position) continue;
  const band = REALM_BANDS[realmOf(character)];
  const overshoot = Math.abs(position[1] - band.center) - (band.half + REALM_OVERFLOW);
  if (overshoot > 0.01) {
    errors.push(`${character.id}: height leaves the ${realmOf(character)} band by ${overshoot.toFixed(2)}`);
  }
}

/* 4. The Pelopid sanity chain. */
const pelopidChain = ['zeus', 'tantalus', 'pelops', 'atreus', 'agamemnon', 'orestes'];
for (let index = 1; index < pelopidChain.length; index++) {
  const parent = pelopidChain[index - 1];
  const child = pelopidChain[index];
  if (radius(child) <= radius(parent)) {
    errors.push(`Pelopid chain order broken: ${child} must be outside ${parent}`);
  }
}
// (The old Zeus–Tantalus 3D-distance heuristic was retired: dynasty-wedge
// containment plus the radius chain above express the same intent robustly.)

/* 5. Determinism. */
for (const [id, position] of positions) {
  const repeated = repeatedPositions.get(id);
  if (!repeated || position.some((value, index) => value !== repeated[index])) {
    errors.push(`${id}: layout must be deterministic across runs`);
  }
}

/* 6. Separation floor — consort binaries are allowed to orbit closer. */
const consortKeys = new Set(
  relations
    .filter((relation) => relation.type === 'consort')
    .map((relation) => [relation.from, relation.to].sort().join('|')),
);
const positionEntries = [...positions.entries()];
let closestPair: [string, string, number] | undefined;
for (let leftIndex = 0; leftIndex < positionEntries.length; leftIndex++) {
  for (let rightIndex = leftIndex + 1; rightIndex < positionEntries.length; rightIndex++) {
    const [leftId, leftPosition] = positionEntries[leftIndex];
    const [rightId, rightPosition] = positionEntries[rightIndex];
    const separation = Math.hypot(
      leftPosition[0] - rightPosition[0],
      leftPosition[1] - rightPosition[1],
      leftPosition[2] - rightPosition[2],
    );
    const floor = consortKeys.has([leftId, rightId].sort().join('|'))
      ? MIN_CONSORT_DISTANCE
      : MIN_STAR_DISTANCE;
    if (!closestPair || separation < closestPair[2]) {
      closestPair = [leftId, rightId, separation];
    }
    if (separation < floor - 0.001) {
      errors.push(
        `${leftId}/${rightId}: stars are ${separation.toFixed(2)} apart; minimum is ${floor}`,
      );
    }
  }
}

console.log(
  `Characters: ${characters.length} · Stars: ${positions.size} · Parent edges checked: ${relations.filter((relation) => isChronologicalParentRelation(relation, charactersById)).length}`,
);
console.log(`Pelopid radii: ${pelopidChain.map((id) => `${id}=${radius(id).toFixed(1)}`).join(' → ')}`);
if (closestPair) {
  console.log(`Closest stars: ${closestPair[0]}/${closestPair[1]}=${closestPair[2].toFixed(2)}`);
}

if (errors.length > 0) {
  console.error(`\n${errors.length} layout error(s):`);
  for (const error of errors) console.error(`  ✗ ${error}`);
  process.exit(1);
}

console.log('\nCosmos layout valid.');
