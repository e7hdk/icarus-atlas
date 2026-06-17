/**
 * One-off: tag Epitome 7.26–7.27 Dulichium suitors on existing character nodes.
 * Apollodorus lists these names under "From Dulichium came fifty-seven" (7.27).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DULICHIUM_SUITOR_IDS = [
  'amphinomus-dulichium',
  'thoas-dulichium',
  'demoptolemus-dulichium',
  'amphimachus-ithaca',
  'euryalus-ithaca',
  'paralus-dulichium',
  'evenorides-ithaca',
  'clytius-same',
  'agenor-ithaca',
  'eurypylus-dulichium',
  'pylaemenes-dulichium',
  'acamas-dulichium',
  'thersilochus-dulichium',
  'hagius-dulichium',
  'clymenus-dulichium',
  'philodemus-dulichium',
  'meneptolemus-dulichium',
  'damastor-dulichium',
  'bias-dulichium',
  'telmius-dulichium',
  'polyidus-dulichium',
  'astylochus-dulichium',
  'schedius-dulichium',
  'antigonus-dulichium',
  'marpsius-dulichium',
  'iphidamas-dulichium',
  'argius-dulichium',
  'glaucus-dulichium',
  'calydoneus-dulichium',
  'echion-dulichium',
  'lamas-dulichium',
  'andraemon-dulichium',
  'agerochus-dulichium',
  'medon-dulichium',
  'agrius-dulichium',
  'promus-dulichium',
  'ctesius-dulichium',
  'acarnan-dulichium',
  'cycnus-dulichium',
  'pseras-dulichium',
  'hellanicus-dulichium',
  'periphron-dulichium',
  'megasthenes-dulichium',
  'thrasymedes-dulichium',
  'ormenius-dulichium',
  'diopithes-dulichium',
  'mecisteus-dulichium',
  'antimachus-dulichium',
  'ptolemaeus-dulichium',
  'lestorides-dulichium',
  'nicomachus-dulichium',
  'polypoetes-dulichium',
  'ceraus-dulichium',
] as const;

const EPITOME_CITATION = 'Epitome 7.26–7.27';

for (const id of DULICHIUM_SUITOR_IDS) {
  const path = join('data', 'characters', `${id}.json`);
  if (!existsSync(path)) {
    console.warn(`skip missing: ${id}`);
    continue;
  }

  const char = JSON.parse(readFileSync(path, 'utf8')) as {
    domains?: string[];
    summary?: { text: string; sources: string[]; citation?: string }[];
    residences?: { city: string; sources: string[] }[];
  };

  if (char.domains) {
    char.domains = char.domains.filter((d) => d !== 'wooer of Ithaca');
    if (!char.domains.includes('man of Dulichium')) {
      char.domains.push('man of Dulichium');
    }
  }

  const hasApollodorusSummary = char.summary?.some((s) =>
    s.sources.includes('apollodorus'),
  );
  if (char.summary?.length && hasApollodorusSummary) {
    for (const fact of char.summary) {
      if (fact.sources.includes('apollodorus')) {
        if (!fact.citation?.includes('7.26')) {
          fact.citation = fact.citation?.includes('7.27')
            ? EPITOME_CITATION
            : `${fact.citation ?? ''}; ${EPITOME_CITATION}`.replace(/^; /, '');
        }
        if (!fact.text.includes('Dulichium')) {
          fact.text = fact.text.replace(
            /Apollodorus' long catalogue/,
            "Apollodorus' catalogue of the fifty-seven wooers from Dulichium",
          );
          if (!fact.text.includes('Dulichium')) {
            fact.text = `One of the fifty-seven suitors from Dulichium in Apollodorus' island roll — ${fact.text.charAt(0).toLowerCase()}${fact.text.slice(1)}`;
          }
        }
      }
    }
  }

  char.residences ??= [];
  if (!char.residences.some((r) => r.city === 'dulichium')) {
    char.residences.unshift({ city: 'dulichium', sources: ['apollodorus'] });
  }
  if (!char.residences.some((r) => r.city === 'ithaca')) {
    char.residences.push({ city: 'ithaca', sources: ['apollodorus'] });
  }

  writeFileSync(path, JSON.stringify(char, null, 2) + '\n');
  console.log(`patched: ${id}`);
}

console.log('done');
