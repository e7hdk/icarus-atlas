/** Append Nymph Batch E relations (NYMPHS.md §5 Batch E). */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REL_PATH = join(import.meta.dirname, '..', 'data', 'relations.json');

const newRelations = [
  {
    id: 'alcyone-pleiad-parent-atlas',
    type: 'parent',
    from: 'alcyone-pleiad',
    to: 'atlas',
    sources: ['apollodorus', 'hyginus'],
    note: 'Bibliotheca 3.10.1; Genealogies p.9',
  },
  {
    id: 'poseidon-lover-alcyone-pleiad',
    type: 'lover',
    from: 'poseidon',
    to: 'alcyone-pleiad',
    sources: ['apollodorus'],
    note: 'Bibliotheca 3.10.1 (Hyrieus, Hyperenor, Aethusa)',
  },
  {
    id: 'celaeno-pleiad-parent-atlas',
    type: 'parent',
    from: 'celaeno-pleiad',
    to: 'atlas',
    sources: ['apollodorus', 'hyginus'],
    note: 'Bibliotheca 3.10.1; Genealogies p.9',
  },
  {
    id: 'poseidon-lover-celaeno-pleiad',
    type: 'lover',
    from: 'poseidon',
    to: 'celaeno-pleiad',
    sources: ['apollodorus'],
    note: 'Bibliotheca 3.10.1 (Lycus of the Blessed Isles)',
  },
  {
    id: 'sterope-pleiad-parent-atlas',
    type: 'parent',
    from: 'sterope-pleiad',
    to: 'atlas',
    sources: ['apollodorus', 'hyginus', 'pausanias'],
    note: 'Bibliotheca 3.10.1; Description of Greece 6.21.7',
  },
  {
    id: 'sterope-pleiad-consort-oenomaus',
    type: 'consort',
    from: 'sterope-pleiad',
    to: 'oenomaus',
    sources: ['apollodorus', 'pausanias'],
    topic: 'oenomaus-sterope-relation',
    note: 'Bibliotheca 3.10.1; Description of Greece 6.21.7 (rival to Asterope as mother in Hyginus)',
  },
  {
    id: 'electra-pleiad-parent-atlas',
    type: 'parent',
    from: 'electra-pleiad',
    to: 'atlas',
    sources: ['apollodorus', 'hyginus', 'apollonius'],
    note: 'Bibliotheca 3.10.1, 3.12.1; Argonautica 1.916–921',
  },
  {
    id: 'zeus-lover-electra-pleiad',
    type: 'lover',
    from: 'zeus',
    to: 'electra-pleiad',
    sources: ['apollodorus'],
    note: 'Bibliotheca 3.12.1 (Iasion and Dardanus on Samothrace)',
  },
];

const existing = JSON.parse(readFileSync(REL_PATH, 'utf8')) as {
  id: string;
  to?: string;
}[];

// Retarget Trojan-line maternity from hero node to Pleiad nymph node.
for (const rel of existing) {
  if (rel.id === 'iasion-parent-electra-atlas') {
    rel.to = 'electra-pleiad';
  }
  if (rel.id === 'dardanus-parent-electra-atlas') {
    rel.to = 'electra-pleiad';
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
console.log(`Added ${toAdd.length} relations; retargeted Iasion/Dardanus maternity to electra-pleiad.`);
