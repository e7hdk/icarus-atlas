import type { QuarrelsFile } from '../../src/types/quarrel';

/** docs/CONTRADICTIONS.md, written from data/quarrels.json (docs/LIBRARY_PLAN.md
 *  §4.7, L7). The catalogue is data since the Library shows it; the doc stays,
 *  readable as it always was, and `pnpm validate-data` fails when it falls behind. */

export const QUARRELS_DOC_PATH = 'docs/CONTRADICTIONS.md';
export const QUARRELS_PATH = 'data/quarrels.json';

const HEAD = `# Inter-author contradiction catalog

These contradictions power the source-lens dispute badges: under the \`consensus\` lens, a fact contested between authors is marked with a badge, and switching lenses re-wires the galaxy to that author's version. Every entry below was adversarially verified against the primary texts (Perseus Digital Library, ToposText) — claims and citations were checked line by line, and where the draft misstated a position, the corrected wording is what appears here. The kebab-case id under each heading is the \`topic\` key to use in data files.

This file is written from \`data/quarrels.json\` by \`pnpm quarrels:doc\`: edit the JSON, then rerun it. The Library reads each entry at \`/library/quarrels/<topic>\`.`;

const ids = (list: string[]) => list.map((id) => `\`${id}\``).join(', ');

export function renderQuarrelsDoc(file: QuarrelsFile): string {
  const sections = file.quarrels.map((quarrel) => {
    const lines = [`## ${quarrel.title}`, '', `- **topic**: \`${quarrel.topic}\``];
    if (quarrel.characters.length > 0) lines.push(`- **Characters**: ${ids(quarrel.characters)}`);
    if (quarrel.places?.length) lines.push(`- **Places**: ${ids(quarrel.places)}`);
    lines.push('', `| ${quarrel.strands ? 'Strand' : 'Author'} | Claim | Citation |`, '|---|---|---|');
    for (const claim of quarrel.claims) lines.push(`| ${claim.who} | ${claim.claim} | ${claim.citation ?? '—'} |`);
    if (quarrel.significance) lines.push('', `Significance: ${quarrel.significance}`);
    if (quarrel.verification) lines.push('', `Verification: ${quarrel.verification}`);
    return lines.join('\n');
  });
  return `${[HEAD, ...sections].join('\n\n')}\n`;
}
