/** Append Nymph Batch A relations (NYMPHS.md §5 Batch A). */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REL_PATH = join(import.meta.dirname, '..', 'data', 'relations.json');

const newRelations = [
  {
    id: 'doris-oceanid-parent-oceanus',
    type: 'parent',
    from: 'doris-oceanid',
    to: 'oceanus',
    sources: ['hesiod', 'apollodorus'],
    note: 'Theogony 350; Bibliotheca 1.2.2',
  },
  {
    id: 'doris-oceanid-parent-tethys',
    type: 'parent',
    from: 'doris-oceanid',
    to: 'tethys',
    sources: ['hesiod', 'apollodorus'],
    note: 'Theogony 350; Bibliotheca 1.2.2',
  },
  {
    id: 'doris-oceanid-consort-nereus',
    type: 'consort',
    from: 'doris-oceanid',
    to: 'nereus',
    sources: ['hesiod', 'apollodorus', 'homer'],
    note: 'Theogony 240–264; Bibliotheca 1.2.7; Iliad 18.45',
  },
  {
    id: 'thetis-parent-doris-oceanid',
    type: 'parent',
    from: 'thetis',
    to: 'doris-oceanid',
    sources: ['hesiod', 'apollodorus'],
    note: 'Theogony 240–264; Bibliotheca 1.2.7',
  },
  {
    id: 'psamathe-parent-nereus',
    type: 'parent',
    from: 'psamathe',
    to: 'nereus',
    sources: ['hesiod', 'apollodorus'],
    note: 'Theogony 240–264; Bibliotheca 1.2.7',
  },
  {
    id: 'psamathe-parent-doris-oceanid',
    type: 'parent',
    from: 'psamathe',
    to: 'doris-oceanid',
    sources: ['hesiod', 'apollodorus'],
    note: 'Theogony 240–264; Bibliotheca 1.2.7',
  },
  {
    id: 'galatea-nymph-parent-nereus',
    type: 'parent',
    from: 'galatea-nymph',
    to: 'nereus',
    sources: ['hesiod', 'apollodorus', 'ovid'],
    note: 'Theogony 250; Bibliotheca 1.2.7; Metamorphoses 13.750',
  },
  {
    id: 'galatea-nymph-parent-doris-oceanid',
    type: 'parent',
    from: 'galatea-nymph',
    to: 'doris-oceanid',
    sources: ['hesiod', 'apollodorus', 'ovid'],
    note: 'Theogony 250; Bibliotheca 1.2.7; Metamorphoses 13.750',
  },
  {
    id: 'amphitrite-parent-nereus',
    type: 'parent',
    from: 'amphitrite',
    to: 'nereus',
    sources: ['hesiod', 'apollodorus'],
    topic: 'amphitrite-parentage',
    note: 'Theogony 240–264; Bibliotheca 1.2.7 (Nereid roll)',
  },
  {
    id: 'amphitrite-parent-doris-oceanid',
    type: 'parent',
    from: 'amphitrite',
    to: 'doris-oceanid',
    sources: ['hesiod', 'apollodorus'],
    topic: 'amphitrite-parentage',
    note: 'Theogony 240–264; Bibliotheca 1.2.7 (Nereid roll)',
  },
  {
    id: 'amphitrite-parent-oceanus',
    type: 'parent',
    from: 'amphitrite',
    to: 'oceanus',
    sources: ['apollodorus'],
    topic: 'amphitrite-parentage',
    note: 'Bibliotheca 1.2.2 (Oceanid roll)',
  },
  {
    id: 'amphitrite-parent-tethys',
    type: 'parent',
    from: 'amphitrite',
    to: 'tethys',
    sources: ['apollodorus'],
    topic: 'amphitrite-parentage',
    note: 'Bibliotheca 1.2.2 (Oceanid roll)',
  },
  {
    id: 'amphitrite-consort-poseidon',
    type: 'consort',
    from: 'amphitrite',
    to: 'poseidon',
    sources: ['hesiod', 'apollodorus'],
    note: 'Theogony 930–933',
  },
  {
    id: 'electra-oceanid-parent-oceanus',
    type: 'parent',
    from: 'electra-oceanid',
    to: 'oceanus',
    sources: ['hesiod', 'apollodorus'],
    note: 'Theogony 350; Bibliotheca 1.2.2',
  },
  {
    id: 'electra-oceanid-parent-tethys',
    type: 'parent',
    from: 'electra-oceanid',
    to: 'tethys',
    sources: ['hesiod', 'apollodorus'],
    note: 'Theogony 350; Bibliotheca 1.2.2',
  },
  {
    id: 'electra-oceanid-consort-thaumas',
    type: 'consort',
    from: 'electra-oceanid',
    to: 'thaumas',
    sources: ['hesiod', 'apollodorus'],
    note: 'Theogony 265–269; Bibliotheca 1.2.6',
  },
  {
    id: 'iris-parent-electra-oceanid',
    type: 'parent',
    from: 'iris',
    to: 'electra-oceanid',
    sources: ['hesiod', 'apollodorus'],
    note: 'Theogony 265–267; Bibliotheca 1.2.6',
  },
  {
    id: 'harpies-parent-electra-oceanid',
    type: 'parent',
    from: 'harpies',
    to: 'electra-oceanid',
    sources: ['hesiod', 'apollodorus'],
    note: 'Theogony 265–269; Bibliotheca 1.2.6',
  },
  {
    id: 'eurynome-parent-oceanus',
    type: 'parent',
    from: 'eurynome',
    to: 'oceanus',
    sources: ['hesiod', 'apollodorus'],
    note: 'Theogony 350; Bibliotheca 1.2.2',
  },
  {
    id: 'eurynome-parent-tethys',
    type: 'parent',
    from: 'eurynome',
    to: 'tethys',
    sources: ['hesiod', 'apollodorus'],
    note: 'Theogony 350; Bibliotheca 1.2.2',
  },
  {
    id: 'eurynome-consort-zeus',
    type: 'consort',
    from: 'eurynome',
    to: 'zeus',
    sources: ['hesiod', 'apollodorus'],
    note: 'Theogony 907–911; Bibliotheca 1.3.1',
  },
  {
    id: 'aglaea-parent-eurynome',
    type: 'parent',
    from: 'aglaea',
    to: 'eurynome',
    sources: ['hesiod', 'apollodorus', 'pausanias'],
    note: 'Theogony 907–911; Bibliotheca 1.3.1',
  },
  {
    id: 'euphrosyne-parent-eurynome',
    type: 'parent',
    from: 'euphrosyne',
    to: 'eurynome',
    sources: ['hesiod', 'apollodorus', 'pausanias'],
    note: 'Theogony 907–911; Bibliotheca 1.3.1',
  },
  {
    id: 'thalia-charis-parent-eurynome',
    type: 'parent',
    from: 'thalia-charis',
    to: 'eurynome',
    sources: ['hesiod', 'apollodorus', 'pausanias'],
    note: 'Theogony 907–911; Bibliotheca 1.3.1',
  },
  {
    id: 'metis-parent-oceanus',
    type: 'parent',
    from: 'metis',
    to: 'oceanus',
    sources: ['hesiod', 'apollodorus'],
    note: 'Theogony 350; Bibliotheca 1.2.2',
  },
  {
    id: 'metis-parent-tethys',
    type: 'parent',
    from: 'metis',
    to: 'tethys',
    sources: ['hesiod', 'apollodorus'],
    note: 'Theogony 350; Bibliotheca 1.2.2',
  },
  {
    id: 'metis-consort-zeus',
    type: 'consort',
    from: 'metis',
    to: 'zeus',
    sources: ['hesiod', 'apollodorus'],
    note: 'Theogony 886–900; Bibliotheca 1.3.6',
  },
  {
    id: 'athena-parent-metis',
    type: 'parent',
    from: 'athena',
    to: 'metis',
    sources: ['hesiod', 'apollodorus'],
    note: 'Theogony 886–900, 924–926; Bibliotheca 1.3.6',
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
