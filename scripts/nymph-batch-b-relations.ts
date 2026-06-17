/** Append Nymph Batch B relations (NYMPHS.md §5 Batch B). */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REL_PATH = join(import.meta.dirname, '..', 'data', 'relations.json');

const newRelations = [
  {
    id: 'batia-naiad-consort-oebalus',
    type: 'consort',
    from: 'batia-naiad',
    to: 'oebalus',
    sources: ['apollodorus'],
    topic: 'tyndareus-mother',
    note: 'Bibliotheca 3.10.4',
  },
  {
    id: 'tyndareus-parent-batia-naiad',
    type: 'parent',
    from: 'tyndareus',
    to: 'batia-naiad',
    sources: ['apollodorus'],
    topic: 'tyndareus-mother',
    note: 'Bibliotheca 3.10.4 (rival to Gorgophone as mother)',
  },
  {
    id: 'hippocoon-parent-batia-naiad',
    type: 'parent',
    from: 'hippocoon',
    to: 'batia-naiad',
    sources: ['apollodorus'],
    topic: 'tyndareus-mother',
    note: 'Bibliotheca 3.10.4',
  },
  {
    id: 'icarius-parent-batia-naiad',
    type: 'parent',
    from: 'icarius',
    to: 'batia-naiad',
    sources: ['apollodorus'],
    topic: 'tyndareus-mother',
    note: 'Bibliotheca 3.10.4',
  },
  {
    id: 'cleocharia-naiad-consort-lelex-laconia',
    type: 'consort',
    from: 'cleocharia-naiad',
    to: 'lelex-laconia',
    sources: ['apollodorus'],
    note: 'Bibliotheca 3.10.3',
  },
  {
    id: 'eurotas-parent-cleocharia-naiad',
    type: 'parent',
    from: 'eurotas',
    to: 'cleocharia-naiad',
    sources: ['apollodorus'],
    note: 'Bibliotheca 3.10.3 (Apollodorus makes Eurotas son of Lelex by Cleocharia directly)',
  },
];

const existing = JSON.parse(readFileSync(REL_PATH, 'utf8')) as { id: string; topic?: string }[];

// Tag Gorgophone mother edge with the shared dispute topic.
for (const rel of existing) {
  if (rel.id === 'tyndareus-parent-gorgophone' && !rel.topic) {
    rel.topic = 'tyndareus-mother';
  }
}

const ids = new Set(existing.map((r) => r.id));
const toAdd = newRelations.filter((r) => {
  if (ids.has(r.id)) {
    console.log(`skip (exists): ${r.id}`);
    return false;
  }
  return true;
});

writeFileSync(REL_PATH, `${JSON.stringify([...existing, ...toAdd], null, 2)}\n`, 'utf8');
console.log(`Added ${toAdd.length} relations; tagged tyndareus-parent-gorgophone.`);
