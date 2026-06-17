/** One-off backfill: add `kinds` to legacy nymph and centaur nodes (NYMPHS.md Batch 0). */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const CHAR_DIR = join(import.meta.dirname, '..', 'data', 'characters');

const NYMPH_KINDS: Record<string, string[]> = {
  'aegina-nymph': ['naiad'],
  'argiope-parnassus': ['oread'],
  asia: ['oceanid'],
  astypalaea: ['naiad'],
  callisto: ['oread'],
  chariclo: ['naiad'],
  'chariclo-centaur': ['oceanid'],
  clymene: ['oceanid'],
  corcyra: ['naiad'],
  'eidothea-proteus': ['nereid'],
  'erato-dryad': ['dryad'],
  hesperides: ['hesperid'],
  'idyia-oceanid': ['oceanid'],
  maia: ['pleiad'],
  melia: ['oceanid'],
  meliae: ['melia'],
  'merope-pleiad': ['pleiad'],
  metope: ['naiad'],
  nephele: ['nephele'],
  'nubes-ixion': ['nephele'],
  orseis: ['oceanid'],
  pasiphae: ['oceanid'],
  'periboea-naiad': ['naiad'],
  'perseis-oceanid': ['oceanid'],
  philyra: ['oceanid'],
  plouto: ['oceanid'],
  'praxithea-naiad': ['naiad'],
  psamathe: ['nereid'],
  rhodos: ['naiad'],
  'salamis-nymph': ['naiad'],
  'sinope-nymph': ['naiad'],
  sparte: ['naiad'],
  taygete: ['pleiad'],
  thebe: ['naiad'],
  thetis: ['nereid'],
  'zeuxippe-naiad': ['naiad'],
};

/** Atlas daughter on Ogygia — Homer gives no sub-class; kinds omitted until sourced. */
const NYMPH_KINDS_SKIP = new Set(['calypso']);

const CENTAUR_IDS = new Set([
  'abas-centaur',
  'amycus-centaur',
  'antimachus-centaur',
  'asbolus-centaur',
  'bromus-centaur',
  'centauros',
  'chiron',
  'chromis-centaur',
  'dictys-centaur',
  'elatus-centaur',
  'elymus-centaur',
  'eurytion-centaur',
  'gryneus-centaur',
  'helops-centaur',
  'hylaeus-centaur',
  'latreus-centaur',
  'lycus-centaur',
  'melaneus-centaur',
  'nessus',
  'petraeus-centaur',
  'pholus',
  'pyracmos-centaur',
  'rhoecus-centaur',
  'styphelus-centaur',
]);

const OTHER_KINDS: Record<string, string[]> = {
  styx: ['oceanid'],
};

let updated = 0;

for (const file of readdirSync(CHAR_DIR).filter((f) => f.endsWith('.json'))) {
  const path = join(CHAR_DIR, file);
  const raw = JSON.parse(readFileSync(path, 'utf8')) as {
    id: string;
    type: string;
    kinds?: string[];
  };

  let kinds: string[] | undefined;

  if (NYMPH_KINDS[raw.id]) {
    kinds = NYMPH_KINDS[raw.id];
  } else if (CENTAUR_IDS.has(raw.id)) {
    kinds = ['centaur'];
  } else if (OTHER_KINDS[raw.id]) {
    kinds = OTHER_KINDS[raw.id];
  } else if (raw.type === 'nymph' && !NYMPH_KINDS_SKIP.has(raw.id)) {
    console.warn(`WARN: nymph without kinds mapping: ${raw.id}`);
    continue;
  } else {
    continue;
  }

  if (JSON.stringify(raw.kinds) === JSON.stringify(kinds)) continue;

  raw.kinds = kinds;
  writeFileSync(path, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
  updated++;
  console.log(`  ${raw.id} → [${kinds.join(', ')}]`);
}

console.log(`\nUpdated ${updated} character files.`);
