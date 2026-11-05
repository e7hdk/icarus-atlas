/** The Library's citation report (docs/LIBRARY_PLAN.md §10): how much of each
 *  work the atlas cites, where, and what does not resolve yet.
 *  Run with: pnpm library:metrics [--json] [--failures] */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createCitationResolver } from '../src/features/library/cite';
import { libraryWorksFileSchema } from '../src/lib/schemas';
import { covered as blocksCovered } from '../src/features/library/margins';
import type { LibraryExtents, LibraryText, WorkId } from '../src/types/library';
import { collectCitationSites, describeRef, reasonClass, resolveSites } from './lib/library-citations';
import { LIBRARY_EXTENTS_PATH, LIBRARY_WORKS_PATH } from './lib/library-corpus';

const registry = libraryWorksFileSchema.parse(JSON.parse(readFileSync(LIBRARY_WORKS_PATH, 'utf8')));
const extents = JSON.parse(readFileSync(LIBRARY_EXTENTS_PATH, 'utf8')) as LibraryExtents;
const sites = collectCitationSites(join(import.meta.dirname, '..', 'data'));
const { resolved, failures } = resolveSites(sites, createCitationResolver(registry), extents);

interface WorkReport { title: string; refs: number; sites: number; covered: number; of: number; unit: string; perBook: Record<string, number> }
const reports = new Map<WorkId, WorkReport>();
for (const work of registry.works) {
  const extent = extents.works[work.id];
  const of = extent.books ? Object.values(extent.books).reduce((sum, book) => sum + book.last, 0) : extent.lines ? extent.lines.last : (extent.ids?.length ?? 0);
  reports.set(work.id, { title: work.title, refs: 0, sites: 0, covered: 0, of, unit: extent.ids ? 'ids' : 'lines', perBook: {} });
}

const covered = new Map<WorkId, Set<string>>();
const citingSites = new Map<WorkId, Set<string>>();
for (const { site, ref } of resolved) {
  if (ref.kind !== 'passage') continue;
  const report = reports.get(ref.work);
  if (!report) continue;
  report.refs += 1;
  citingSites.set(ref.work, (citingSites.get(ref.work) ?? new Set()).add(`${site.file}#${site.at}`));
  const marks = covered.get(ref.work) ?? new Set<string>();
  covered.set(ref.work, marks);
  const extent = extents.works[ref.work];
  if (ref.from.kind === 'line' && ref.to.kind === 'line') {
    const book = ref.from.book;
    report.perBook[String(book ?? '')] = (report.perBook[String(book ?? '')] ?? 0) + 1;
    if (book !== ref.to.book) continue;
    const last = Number.parseInt(ref.to.line, 10);
    for (let line = Number.parseInt(ref.from.line, 10); line <= last; line++) marks.add(`${book ?? ''}.${line}`);
    continue;
  }
  if (ref.from.kind === 'section' || ref.from.kind === 'tale') {
    const id = ref.from.kind === 'section' ? ref.from.path : ref.from.tale;
    const book = id.split('.')[0];
    report.perBook[book] = (report.perBook[book] ?? 0) + 1;
    for (const known of extent.ids ?? []) if (known === id || known.startsWith(`${id}.`)) marks.add(known);
  }
}
for (const [id, report] of reports) {
  report.covered = covered.get(id)?.size ?? 0;
  report.sites = citingSites.get(id)?.size ?? 0;
}

const classes: Record<string, number> = {};
for (const failure of failures) classes[reasonClass(failure.reason)] = (classes[reasonClass(failure.reason)] ?? 0) + 1;

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ sites: sites.length, resolved: resolved.length, failures: failures.length, classes, works: Object.fromEntries(reports) }, null, 2));
  process.exit(0);
}

const pct = (part: number, whole: number) => (whole ? `${((100 * part) / whole).toFixed(1)}%` : '—');
console.log(`${sites.length} citations · ${resolved.length + failures.length} cited stretches · ${pct(resolved.length, resolved.length + failures.length)} resolved\n`);
console.log('work                    refs   citations   cited of the work');
for (const report of reports.values()) {
  console.log(`  ${report.title.padEnd(22)}${String(report.refs).padStart(6)}${String(report.sites).padStart(12)}   ${pct(report.covered, report.of).padStart(6)} of ${report.of} ${report.unit}`);
}
console.log(`\nunresolved: ${failures.length}${Object.keys(classes).length ? ` (${Object.entries(classes).map(([name, count]) => `${count} ${name}`).join(', ')})` : ''}`);
if (process.argv.includes('--failures')) {
  for (const failure of failures) console.log(`  ${failure.site.file} ${failure.site.at}: "${failure.site.raw}" → ${failure.text}: ${failure.reason}`);
}

/* --audit: a figure's fact cites a passage whose English never names the figure,
 * under its name, its Roman name or the edition's own spelling. A list for an eye,
 * never a gate: a fact may cite a passage to say the figure is not there. */
if (process.argv.includes('--audit')) {
  const dataDir = join(import.meta.dirname, '..', 'data');
  const texts = new Map(readdirSync(join(dataDir, 'generated', 'library')).map((name) => {
    const text = JSON.parse(readFileSync(join(dataDir, 'generated', 'library', name), 'utf8')) as LibraryText;
    return [text.work, text] as const;
  }));
  const aliases = (JSON.parse(readFileSync(join(dataDir, 'library', 'aliases.json'), 'utf8')) as { editions: Record<string, Record<string, string | string[] | { id: string }>> }).editions;
  const namesOf = new Map<string, string[]>();
  const nameFor = (id: string) => {
    const known = namesOf.get(id);
    if (known) return known;
    const character = JSON.parse(readFileSync(join(dataDir, 'characters', `${id}.json`), 'utf8')) as { name: string; romanName?: string };
    const names = [character.name, character.romanName].filter((name): name is string => Boolean(name)).map((name) => name.replace(/^the\s+/i, '').split(/[ (]/)[0]);
    namesOf.set(id, names);
    return names;
  };
  const targetIds = (target: string | string[] | { id: string }) => (typeof target === 'string' ? [target] : Array.isArray(target) ? target : [target.id]);
  const warnings: string[] = [];
  for (const { site, ref } of resolved) {
    const { owner } = site;
    if (ref.kind !== 'passage' || owner.kind !== 'character') continue;
    const id = owner.id;
    const work = registry.works.find((candidate) => candidate.id === ref.work);
    const text = texts.get(ref.work);
    if (!work || !text || work.display !== 'full') continue;
    const unit = text.units.find((candidate) => candidate.id === (work.units === 'whole' ? 'whole' : String(ref.from.kind === 'section' ? ref.from.path.split('.')[0] : ref.from.kind === 'line' || ref.from.kind === 'book' ? ref.from.book : 'whole')));
    if (!unit) continue;
    const blocks = blocksCovered(work, unit.blocks, ref.from, ref.to);
    if (blocks === 'broad' || blocks.length === 0) continue;
    const english = blocks.flatMap((block) => block.trans).join(' ');
    const editionForms = Object.entries(aliases[work.translation.corpusId] ?? {}).filter(([, target]) => targetIds(target).includes(id)).map(([form]) => form);
    const forms = [...nameFor(id), ...editionForms];
    if (forms.some((form) => new RegExp(`\\b${form.replace(/[^\p{L}]/gu, '')}`, 'iu').test(english))) continue;
    warnings.push(`${site.file} ${site.at}: ${forms[0] ?? id} is not named in ${describeRef(ref)}`);
  }
  console.log(`\naudit: ${warnings.length} fact(s) cite a passage that never names their figure`);
  for (const warning of warnings.slice(0, process.argv.includes('--all') ? Infinity : 40)) console.log(`  ${warning}`);
}
