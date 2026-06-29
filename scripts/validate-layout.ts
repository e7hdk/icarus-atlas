/** Validates the deterministic cosmos layout. Run with: pnpm validate-layout
 *
 * City sky subset: pnpm validate-layout --city sparta
 *
 * Contract (src/features/galaxy/layout.ts):
 *   radius = mythic generation · angle = dynasty wedge + spiral twist
 *   height = cosmological realm band (may stretch by REALM_OVERFLOW at most)
 *   spacing ≥ MIN_STAR_DISTANCE, consort binaries ≥ MIN_CONSORT_DISTANCE
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  computeGenerations,
  computePositions,
  effectiveWedges,
  isChronologicalParentRelation,
  realmOf,
  MIN_CONSORT_DISTANCE,
  MIN_PARENT_CHILD_RADIAL_GAP,
  MIN_STAR_DISTANCE,
  REALM_BANDS,
  REALM_OVERFLOW,
} from '../src/features/galaxy/layout';
import type { Character, Relation } from '../src/types/character';

const DATA_DIR = join(import.meta.dirname, '..', 'data');
const allCharacters = readdirSync(join(DATA_DIR, 'characters'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(join(DATA_DIR, 'characters', file), 'utf-8')) as Character);
const allRelations = JSON.parse(readFileSync(join(DATA_DIR, 'relations.json'), 'utf-8')) as Relation[];

function parseCityArg(): string | undefined {
  const index = process.argv.indexOf('--city');
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function residentsForCity(cityId: string): Character[] {
  return allCharacters.filter((character) =>
    character.residences?.some((residence) => residence.city === cityId),
  );
}

function internalRelations(residents: Character[], relations: Relation[]): Relation[] {
  const residentIds = new Set(residents.map((character) => character.id));
  return relations.filter(
    (relation) => residentIds.has(relation.from) && residentIds.has(relation.to),
  );
}

function normalizeSignedAngle(angle: number): number {
  const turn = Math.PI * 2;
  let a = ((angle % turn) + turn) % turn;
  if (a > Math.PI) a -= turn;
  return a;
}

function validateLayout(
  characters: Character[],
  relations: Relation[],
  options: { compact: boolean; skipPelopid: boolean; label: string },
): string[] {
  const charactersById = new Map(characters.map((character) => [character.id, character]));
  const generations = computeGenerations(characters, relations);
  const wedges = effectiveWedges(characters, relations);
  const positions = computePositions(characters, relations, { compact: options.compact });
  const repeatedPositions = computePositions(characters, relations, { compact: options.compact });
  const errors: string[] = [];

  function radius(id: string): number {
    const position = positions.get(id);
    if (!position) throw new Error(`missing position for ${id}`);
    return Math.hypot(position[0], position[2]);
  }

  /* 0. Coverage */
  for (const character of characters) {
    if (!positions.has(character.id)) {
      errors.push(`${character.id}: no star — computePositions returned no position for this character`);
    }
  }
  if (positions.size !== characters.length) {
    errors.push(`star count mismatch: ${positions.size} stars for ${characters.length} characters`);
  }

  /* 1. Chronology */
  for (const relation of relations) {
    if (!isChronologicalParentRelation(relation, charactersById)) continue;
    const childGeneration = generations.get(relation.from);
    const parentGeneration = generations.get(relation.to);
    if (childGeneration === undefined || parentGeneration === undefined) continue;
    if (childGeneration < parentGeneration + 0.999) {
      errors.push(`${relation.id}: child generation must be after parent generation`);
    }
    if (radius(relation.from) <= radius(relation.to) + MIN_PARENT_CHILD_RADIAL_GAP) {
      errors.push(`${relation.id}: child star must be visibly farther from the core`);
    }
  }

  /* 2. Dynasty wedges */
  for (const character of characters) {
    if (character.id === 'chaos') continue;
    const position = positions.get(character.id);
    const wedge = wedges.get(character.id);
    if (!position || !wedge) continue;
    const offset = Math.abs(normalizeSignedAngle(Math.atan2(position[2], position[0]) - wedge.mid));
    if (offset > wedge.half + 0.02) {
      errors.push(
        `${character.id}: bearing leaves its dynasty wedge by ${(offset - wedge.half).toFixed(3)} rad`,
      );
    }
  }

  /* 3. Realm bands */
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

  /* 4. Pelopid sanity chain */
  const pelopidChain = ['zeus', 'tantalus', 'pelops', 'atreus', 'agamemnon', 'orestes'];
  const residentIds = new Set(characters.map((character) => character.id));
  const runPelopid = !options.skipPelopid || pelopidChain.every((id) => residentIds.has(id));
  if (runPelopid) {
    for (let index = 1; index < pelopidChain.length; index++) {
      const parent = pelopidChain[index - 1];
      const child = pelopidChain[index];
      if (!residentIds.has(parent) || !residentIds.has(child)) continue;
      if (radius(child) <= radius(parent)) {
        errors.push(`Pelopid chain order broken: ${child} must be outside ${parent}`);
      }
    }
  }

  /* 5. Determinism */
  for (const [id, position] of positions) {
    const repeated = repeatedPositions.get(id);
    if (!repeated || position.some((value, index) => value !== repeated[index])) {
      errors.push(`${id}: layout must be deterministic across runs`);
    }
  }

  /* 6. Separation floor */
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

  const pelopidRadii = pelopidChain
    .filter((id) => residentIds.has(id) && positions.has(id))
    .map((id) => `${id}=${radius(id).toFixed(1)}`)
    .join(' → ');
  console.log(
    `${options.label}: Characters: ${characters.length} · Stars: ${positions.size} · Parent edges checked: ${relations.filter((relation) => isChronologicalParentRelation(relation, charactersById)).length}`,
  );
  if (pelopidRadii) console.log(`Pelopid radii: ${pelopidRadii}`);
  if (closestPair) {
    console.log(`Closest stars: ${closestPair[0]}/${closestPair[1]}=${closestPair[2].toFixed(2)}`);
  }

  return errors;
}

const cityId = parseCityArg();
const characters = cityId ? residentsForCity(cityId) : allCharacters;
const relations = cityId ? internalRelations(characters, allRelations) : allRelations;

if (cityId && characters.length === 0) {
  console.error(`No residents found for city "${cityId}".`);
  process.exit(1);
}

const errors = validateLayout(characters, relations, {
  compact: Boolean(cityId),
  skipPelopid: Boolean(cityId),
  label: cityId ? `City sky (${cityId})` : 'Cosmos',
});

if (errors.length > 0) {
  console.error(`\n${errors.length} layout error(s):`);
  for (const error of errors) console.error(`  ✗ ${error}`);
  process.exit(1);
}

console.log(cityId ? `\nCity sky layout valid for ${cityId}.` : '\nCosmos layout valid.');
