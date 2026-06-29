/** City residence audit — lineage gaps, orphan sky edges, compact layout coverage.
 *
 * Usage:
 *   pnpm audit:residences           # all 6 flagship cities
 *   pnpm audit:residences sparta    # one city
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { computePositions } from '../src/features/galaxy/layout';
import { lineageSchema } from '../src/lib/schemas';
import type { Character, Relation } from '../src/types/character';

const DATA_DIR = join(import.meta.dirname, '..', 'data');
const FLAGSHIP_CITIES = ['thebes', 'mycenae', 'argos', 'athens', 'sparta', 'troy'] as const;

const allCharacters = readdirSync(join(DATA_DIR, 'characters'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(join(DATA_DIR, 'characters', file), 'utf-8')) as Character);
const allRelations = JSON.parse(readFileSync(join(DATA_DIR, 'relations.json'), 'utf-8')) as Relation[];

function residentsForCity(cityId: string): Character[] {
  return allCharacters.filter((character) =>
    character.residences?.some((residence) => residence.city === cityId),
  );
}

function internalRelations(residents: Character[]): Relation[] {
  const residentIds = new Set(residents.map((character) => character.id));
  return allRelations.filter(
    (relation) => residentIds.has(relation.from) && residentIds.has(relation.to),
  );
}

function orphanSkyEdges(cityId: string): { count: number; ids: string[] } {
  const residentIds = new Set(residentsForCity(cityId).map((character) => character.id));
  const ids: string[] = [];
  for (const relation of allRelations) {
    const fromResident = residentIds.has(relation.from);
    const toResident = residentIds.has(relation.to);
    if (fromResident !== toResident) ids.push(relation.id);
  }
  return { count: ids.length, ids };
}

function reignLinkedIds(reign: {
  characterId?: string;
  characterIds?: string[];
}): string[] {
  if (reign.characterIds?.length) return reign.characterIds;
  if (reign.characterId) return [reign.characterId];
  return [];
}

function lineageGaps(cityId: string): { ruler: string; characterId: string }[] {
  const lineagePath = join(DATA_DIR, 'lineages', `${cityId}.json`);
  if (!existsSync(lineagePath)) return [];
  const parsed = lineageSchema.safeParse(JSON.parse(readFileSync(lineagePath, 'utf-8')));
  if (!parsed.success) return [];
  const gaps: { ruler: string; characterId: string }[] = [];
  for (const reign of parsed.data.reigns) {
    for (const characterId of reignLinkedIds(reign)) {
      const character = allCharacters.find((c) => c.id === characterId);
      const hasResidence = character?.residences?.some((r) => r.city === cityId);
      if (!hasResidence) gaps.push({ ruler: reign.ruler, characterId });
    }
  }
  return gaps;
}

function plainReignCount(cityId: string): { plain: number; total: number } {
  const lineagePath = join(DATA_DIR, 'lineages', `${cityId}.json`);
  if (!existsSync(lineagePath)) return { plain: 0, total: 0 };
  const parsed = lineageSchema.safeParse(JSON.parse(readFileSync(lineagePath, 'utf-8')));
  if (!parsed.success) return { plain: 0, total: 0 };
  const total = parsed.data.reigns.length;
  const plain = parsed.data.reigns.filter((reign) => reignLinkedIds(reign).length === 0).length;
  return { plain, total };
}

function starlessResidents(residents: Character[], relations: Relation[]): string[] {
  const positions = computePositions(residents, relations, { compact: true });
  return residents.filter((character) => !positions.has(character.id)).map((character) => character.id);
}

function auditCity(cityId: string) {
  const residents = residentsForCity(cityId);
  const relations = internalRelations(residents);
  const gaps = lineageGaps(cityId);
  const reignPlain = plainReignCount(cityId);
  const orphans = orphanSkyEdges(cityId);
  const starless = starlessResidents(residents, relations);
  return {
    cityId,
    residentCount: residents.length,
    internalRelationCount: relations.length,
    lineageGaps: gaps,
    reignPlain,
    orphanEdges: orphans,
    starless,
  };
}

function pad(value: string | number, width: number): string {
  return String(value).padEnd(width);
}

const cityArg = process.argv[2];
const cities =
  cityArg && cityArg !== '--help' && cityArg !== '-h'
    ? [cityArg]
    : [...FLAGSHIP_CITIES];

if (cityArg === '--help' || cityArg === '-h') {
  console.log('Usage: pnpm audit:residences [cityId]');
  console.log(`Flagship cities: ${FLAGSHIP_CITIES.join(', ')}`);
  process.exit(0);
}

const results = cities.map(auditCity);

console.log('\nCity residence audit\n');
console.log(
  `${pad('City', 10)} ${pad('Residents', 10)} ${pad('Internal', 10)} ${pad('Lineage gaps', 14)} ${pad('Orphan edges', 14)} ${pad('Starless', 10)}`,
);
console.log('-'.repeat(72));

for (const result of results) {
  console.log(
    `${pad(result.cityId, 10)} ${pad(result.residentCount, 10)} ${pad(result.internalRelationCount, 10)} ${pad(result.lineageGaps.length, 14)} ${pad(result.orphanEdges.count, 14)} ${pad(result.starless.length, 10)}`,
  );
}

for (const result of results) {
  if (result.reignPlain.total > 0) {
    console.log(
      `\n${result.cityId} — reign plain count: ${result.reignPlain.plain}/${result.reignPlain.total}`,
    );
  }
}

for (const result of results) {
  if (result.lineageGaps.length > 0) {
    console.log(`\n${result.cityId} — lineage gaps (ruler lacks residence):`);
    for (const gap of result.lineageGaps) {
      console.log(`  · ${gap.ruler} (${gap.characterId})`);
    }
  }
  if (result.orphanEdges.count > 0) {
    console.log(`\n${result.cityId} — orphan sky edges (${result.orphanEdges.count}):`);
    console.log(`  ${result.orphanEdges.ids.join(', ')}`);
  }
  if (result.starless.length > 0) {
    console.log(`\n${result.cityId} — compact layout starless (${result.starless.length}):`);
    console.log(`  ${result.starless.join(', ')}`);
  }
}

console.log('');
