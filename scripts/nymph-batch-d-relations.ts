/** Append Nymph Batch D relations (NYMPHS.md §5 Batch D). */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REL_PATH = join(import.meta.dirname, '..', 'data', 'relations.json');

const newRelations = [
  {
    id: 'apollo-lover-daphne-nymph',
    type: 'lover',
    from: 'apollo',
    to: 'daphne-nymph',
    sources: ['ovid', 'hyginus'],
    note: 'Metamorphoses 1.577–748; Fabulae 203',
  },
  {
    id: 'hera-adversary-echo-nymph',
    type: 'adversary',
    from: 'hera',
    to: 'echo-nymph',
    sources: ['ovid'],
    note: 'Metamorphoses 3.347–370 (Juno strips Echo of free speech)',
  },
  {
    id: 'pan-lover-syrinx-nymph',
    type: 'lover',
    from: 'pan',
    to: 'syrinx-nymph',
    sources: ['ovid'],
    note: 'Metamorphoses 1.868–954',
  },
];

const existing = JSON.parse(readFileSync(REL_PATH, 'utf8')) as { id: string }[];
const ids = new Set(existing.map((r) => r.id));
const toAdd = newRelations.filter((r) => {
  if (ids.has(r.id)) {
    console.log(`skip (exists): ${r.id}`);
    return false;
  }
  return true;
});

writeFileSync(REL_PATH, `${JSON.stringify([...existing, ...toAdd], null, 2)}\n`, 'utf8');
console.log(`Added ${toAdd.length} relations.`);
