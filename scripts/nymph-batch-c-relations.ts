/** Append Nymph Batch C relations (NYMPHS.md §5 Batch C). */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REL_PATH = join(import.meta.dirname, '..', 'data', 'relations.json');

const newRelations = [
  {
    id: 'cyllene-oread-consort-pelasgus-arcadia',
    type: 'consort',
    from: 'cyllene-oread',
    to: 'pelasgus-arcadia',
    sources: ['apollodorus'],
    topic: 'lycaon-mother',
    note: 'Bibliotheca 3.8.1 (rival to Meliboea as mother of Lycaon)',
  },
  {
    id: 'lycaon-parent-cyllene-oread',
    type: 'parent',
    from: 'lycaon',
    to: 'cyllene-oread',
    sources: ['apollodorus'],
    topic: 'lycaon-mother',
    note: 'Bibliotheca 3.8.1 (others say by nymph Cyllene)',
  },
  {
    id: 'nonacris-oread-consort-lycaon',
    type: 'consort',
    from: 'nonacris-oread',
    to: 'lycaon',
    sources: ['pausanias'],
    note: 'Description of Greece 8.17.6 (eponym of Nonacris)',
  },
  {
    id: 'melia-thebes-parent-oceanus',
    type: 'parent',
    from: 'melia-thebes',
    to: 'oceanus',
    sources: ['pausanias'],
    note: 'Description of Greece 9.10.5 (daughter of Ocean)',
  },
  {
    id: 'apollo-lover-melia-thebes',
    type: 'lover',
    from: 'apollo',
    to: 'melia-thebes',
    sources: ['pausanias'],
    note: 'Description of Greece 9.10.5–9.10.6',
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
