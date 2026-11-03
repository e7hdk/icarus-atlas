/** Audits parent edges for a reversed from/to. Run with: pnpm audit:parents
 *
 * The contract is `from` = child, `to` = parent. A whole batch once went in the
 * other way round, and a consistently reversed family is self-consistent: it
 * forms no loop and trips no count, so `validate-data` cannot see it. This
 * script reads the evidence a human would — the edge's own note, both figures'
 * prose, and the surrounding kinship — and lists edges that look reversed.
 *
 * Heuristic, so warning-level: it never edits data and exits 0 unless --strict.
 * Verify every suspect against the local corpus (`pnpm corpus:search`) before
 * touching `data/relations.json`; never reverse an edge from names alone.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Character, Relation } from '../src/types/character';

const DATA_DIR = join(import.meta.dirname, '..', 'data');
const characters = readdirSync(join(DATA_DIR, 'characters'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(join(DATA_DIR, 'characters', file), 'utf-8')) as Character);
const charactersById = new Map(characters.map((character) => [character.id, character]));
const relations = JSON.parse(readFileSync(join(DATA_DIR, 'relations.json'), 'utf-8')) as Relation[];
const parentEdges = relations.filter((relation) => relation.type === 'parent');

const QUALIFIERS = '(?:(?:the|king|queen|lord|old|great|god|goddess|nymph|river|river-god|hero)\\s+){0,2}';
const KIN_VERBS = '(?:begot|begat|bore|bare|fathered|sired)';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function nameOf(character: Character): string {
  return escapeRegExp(character.name.split(' (')[0]);
}

function proseOf(character: Character): string {
  return [...character.summary, ...character.story].map((entry) => entry.text).join(' ');
}

/** "son of X", "daughter of the river-god X" — X is named as a parent. */
function namesAsParent(text: string, name: string): boolean {
  return new RegExp(`\\b(?:sons?|daughters?|child(?:ren)?)\\s+of\\s+${QUALIFIERS}${name}\\b`, 'i').test(text);
}

/** "mother of X", "father of X" — X is named as a child. */
function namesAsChild(text: string, name: string): boolean {
  return new RegExp(`\\b(?:mother|father|parents?)\\s+of\\s+${QUALIFIERS}${name}\\b`, 'i').test(text);
}

const partnersOf = new Map<string, Set<string>>();
const siblingsOf = new Map<string, Set<string>>();
for (const relation of relations) {
  const index =
    relation.type === 'consort' || relation.type === 'lover'
      ? partnersOf
      : relation.type === 'sibling'
        ? siblingsOf
        : undefined;
  if (!index) continue;
  index.set(relation.from, (index.get(relation.from) ?? new Set()).add(relation.to));
  index.set(relation.to, (index.get(relation.to) ?? new Set()).add(relation.from));
}
const parentsOf = new Map<string, Set<string>>();
for (const relation of parentEdges) {
  parentsOf.set(relation.from, (parentsOf.get(relation.from) ?? new Set()).add(relation.to));
}

/** Suspects already checked against the local corpus and found correctly
 *  directed — homonyms and "X son of Y" asides in a neighbour's prose trip the
 *  heuristics. Keyed by relation id; the value is the passage that settles it. */
const VERIFIED_FORWARD = new Map<string, string>([
  ['admetus-parent-pheres-aeolid', 'Admetus, son of Pheres (Bibliotheca 1.8.2)'],
  ['theseus-parent-aethra', 'Aethra, the mother of Theseus (Bibliotheca 3.10.7)'],
  ['oebalus-parent-cynortas', 'Cynortas had a son Oebalus (Description of Greece 3.1.3)'],
  ['elatus-arcadia-parent-erato-dryad', 'By Erato Arcas had Azan, Apheidas and Elatus (Description of Greece 8.4.2)'],
  ['pelegon-paeonian-parent-periboea-paeonian', 'Pelegon, begotten of Axius and Periboea (Iliad 21.141–143)'],
  ['alcimede-parent-clymene-minyas', 'Alcimede, born of Clymene daughter of Minyas (Argonautica 1.228)'],
]);

const suspects: { relation: Relation; reasons: string[] }[] = [];

for (const relation of parentEdges) {
  const child = charactersById.get(relation.from);
  const parent = charactersById.get(relation.to);
  if (!child || !parent) continue;
  const childName = nameOf(child);
  const parentName = nameOf(parent);
  const note = relation.note ?? '';
  const reasons: string[] = [];

  // The note calls the recorded child a parent, or the recorded parent a child.
  if (namesAsParent(note, childName) && !namesAsParent(note, parentName)) {
    reasons.push(`note names ${child.name} as the parent`);
  }
  if (namesAsChild(note, parentName) && !namesAsChild(note, childName)) {
    reasons.push(`note names ${parent.name} as the child`);
  }
  const verbObject =
    new RegExp(`^${KIN_VERBS}\\s+${QUALIFIERS}${parentName}\\b`, 'i').test(note) ||
    new RegExp(`\\b${childName}\\b[^;.(]{0,25}\\b${KIN_VERBS}\\b[^;.(]{0,30}\\b${parentName}\\b`, 'i').test(note);
  if (verbObject) reasons.push(`note makes ${parent.name} the one begotten`);

  // The recorded parent's own prose calls it a child of the recorded child.
  if (namesAsParent(proseOf(parent), childName) && !namesAsParent(proseOf(child), parentName)) {
    reasons.push(`${parent.name}'s prose calls ${child.name} a parent`);
  }

  // Kinship around the edge contradicts it.
  for (const sibling of siblingsOf.get(relation.to) ?? []) {
    if (parentsOf.get(sibling)?.has(relation.from)) {
      reasons.push(`${parent.name} is a sibling of ${sibling}, a recorded child of ${child.name}`);
      break;
    }
  }
  for (const grandparent of parentsOf.get(relation.to) ?? []) {
    if (partnersOf.get(relation.from)?.has(grandparent)) {
      reasons.push(`${child.name} is a partner of ${grandparent}, a recorded parent of ${parent.name}`);
      break;
    }
  }

  if (reasons.length > 0 && !VERIFIED_FORWARD.has(relation.id)) suspects.push({ relation, reasons });
}

console.log(
  `Parent edges: ${parentEdges.length} · Direction suspects: ${suspects.length} · Verified forward: ${VERIFIED_FORWARD.size}`,
);
for (const { relation, reasons } of suspects) {
  console.log(`\n  ? ${relation.id}  (${relation.from} recorded as child of ${relation.to})`);
  for (const reason of reasons) console.log(`      - ${reason}`);
  if (relation.note) console.log(`      note: ${relation.note}`);
}

if (suspects.length === 0) {
  console.log('\nNo parent edge looks reversed.');
} else {
  console.log('\nHeuristic only — verify each against the corpus before editing relations.json.');
  if (process.argv.includes('--strict')) process.exit(1);
}
