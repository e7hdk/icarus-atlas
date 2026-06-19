/** Append Nymph Batch F relations (NYMPHS.md §5 Batch F). */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REL_PATH = join(import.meta.dirname, '..', 'data', 'relations.json');

const newRelations = [
  {
    id: 'apollo-lover-cyrene-nymph',
    type: 'lover',
    from: 'apollo',
    to: 'cyrene-nymph',
    sources: ['apollonius', 'hyginus'],
    note: 'Argonautica 2.500–527; Fabulae 161',
  },
  {
    id: 'aristaeus-parent-cyrene-nymph',
    type: 'parent',
    from: 'aristaeus',
    to: 'cyrene-nymph',
    sources: ['apollonius', 'hyginus', 'pausanias'],
    note: 'Argonautica 2.500–527; Fabulae 161; Description of Greece 10.17.3',
  },
  {
    id: 'idmon-parent-apollo',
    type: 'parent',
    from: 'idmon',
    to: 'apollo',
    sources: ['apollonius', 'hyginus'],
    topic: 'idmon-parentage',
    note: 'Argonautica 1.139; Fabulae 14 (rival to Abas as father)',
  },
  {
    id: 'idmon-parent-cyrene-nymph',
    type: 'parent',
    from: 'idmon',
    to: 'cyrene-nymph',
    sources: ['hyginus'],
    topic: 'idmon-parentage',
    note: 'Fabulae 14 (maternal line; Apollonius names only Apollo)',
  },
  {
    id: 'idmon-parent-abas',
    type: 'parent',
    from: 'idmon',
    to: 'abas',
    sources: ['hyginus'],
    topic: 'idmon-parentage',
    note: 'Fabulae 14 (some say son of Abas, an Argive)',
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
console.log(`Added ${toAdd.length} Batch F relations.`);
