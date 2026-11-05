/** Ovid's two lineations (docs/LIBRARY_PLAN.md §4.3, rule 4). Perseus' English
 *  Metamorphoses numbers Brookes More's own verse lines — his 1.120 is Magnus'
 *  1.89 — and some atlas citations followed it. This proposes, for every Ovid
 *  locus, the Latin lines it means, and applies only what the user approves.
 *
 *  Evidence, per citation:
 *    - a locus past the end of its Latin book can only be More's: `certain`
 *    - otherwise the claim's names are looked for in the English the locus
 *      means under each numbering: found only under More's, `probable`; only
 *      under Magnus', it stays; under both or neither, it is listed for an eye
 *  More's lines map to Magnus' through the cards of the English file: each card
 *  opens at a Latin line and holds More's lines, so a line maps in proportion
 *  within its card (±3 lines or so; the card's Latin span is shown).
 *
 *  Needs the synced corpus. Run with:
 *    pnpm library:ovid-lineation                      → research/library/ovid-lineation.{md,json}
 *    pnpm library:ovid-lineation --apply certain      → rewrites those citations in data/
 *    pnpm library:ovid-lineation --apply certain,probable */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'cheerio';
import type { Element } from 'domhandler';
import { createCitationResolver } from '../src/features/library/cite';
import { libraryWorksFileSchema } from '../src/lib/schemas';
import type { LibraryExtents } from '../src/types/library';
import { loadManifest } from './lib/corpus';
import { collectCitationSites, type CitationSite } from './lib/library-citations';
import { LIBRARY_EXTENTS_PATH, LIBRARY_WORKS_PATH, readRaw } from './lib/library-corpus';

const ROOT = join(import.meta.dirname, '..');
const DATA_DIR = join(ROOT, 'data');
const OUT_DIR = join(ROOT, 'research', 'library');
const LEVELS = ['certain', 'probable', 'ambiguous', 'unknown', 'broken', 'latin'] as const;
type Level = (typeof LEVELS)[number];

interface Card { book: number; latinFrom: number; latinTo: number; moreFrom: number; moreTo: number; text: string }
interface Proposal { file: string; at: string; level: Level; raw: string; proposed: string | null; locus: string; latin: string | null; evidence: string }

const registry = libraryWorksFileSchema.parse(JSON.parse(readFileSync(LIBRARY_WORKS_PATH, 'utf8')));
const extents = JSON.parse(readFileSync(LIBRARY_EXTENTS_PATH, 'utf8')) as LibraryExtents;
const latinBooks = extents.works.metamorphoses.books ?? {};
const work = registry.works.find((candidate) => candidate.id === 'metamorphoses');
if (!work) throw new Error('metamorphoses is not in the registry');

/* The English file's cards: the Latin line each opens at, and More's lines inside. */
const english = readRaw(loadManifest().entries.find((entry) => entry.id === work.translation.corpusId) ?? (() => { throw new Error('no English Metamorphoses'); })());
const $ = load(english, { xmlMode: true });
const cards: Card[] = [];
$('body div[type="textpart"]').filter((_, div: Element) => /^book$/i.test($(div).attr('subtype') ?? '')).each((_, bookDiv: Element) => {
  const book = Number($(bookDiv).attr('n'));
  const inBook = $(bookDiv).find('div[subtype="card"]').get();
  inBook.forEach((card, index) => {
    const more = $(card).find('l[n]').map((__, line) => Number($(line).attr('n'))).get().filter(Number.isFinite);
    if (more.length === 0) return;
    const next = inBook[index + 1] ? Number($(inBook[index + 1]).attr('n')) - 1 : latinBooks[String(book)]?.last ?? 0;
    const clone = $(card).clone();
    clone.find('note').remove();
    cards.push({ book, latinFrom: Number($(card).attr('n')), latinTo: next, moreFrom: Math.min(...more), moreTo: Math.max(...more), text: clone.text().replace(/\s+/g, ' ') });
  });
});
const moreLast = (book: number) => Math.max(0, ...cards.filter((card) => card.book === book).map((card) => card.moreTo));
const englishFor = (book: number, from: number, to: number, numbering: 'latin' | 'more') =>
  cards.filter((card) => card.book === book && (numbering === 'latin' ? card.latinTo >= from && card.latinFrom <= to : card.moreTo >= from && card.moreFrom <= to)).map((card) => card.text).join(' ');

/** More's line → Magnus' line, in proportion within its card. */
function toLatin(book: number, line: number, edge: 'start' | 'end'): { line: number; card: Card } | null {
  const card = cards.find((candidate) => candidate.book === book && candidate.moreFrom <= line && line <= candidate.moreTo)
    ?? (line > moreLast(book) ? cards.filter((candidate) => candidate.book === book).at(-1) : undefined);
  if (!card) return null;
  const span = card.moreTo - card.moreFrom + 1;
  const share = Math.min(1, Math.max(0, (line - card.moreFrom + (edge === 'end' ? 1 : 0)) / span));
  const latin = card.latinFrom + (edge === 'end' ? Math.ceil(share * (card.latinTo - card.latinFrom + 1)) - 1 : Math.floor(share * (card.latinTo - card.latinFrom + 1)));
  return { line: Math.min(card.latinTo, Math.max(card.latinFrom, latin)), card };
}

/* The names a claim is about: its figure's names and the atlas names it mentions. */
const nameOwners = JSON.parse(readFileSync(join(DATA_DIR, 'generated', 'linked-prose.json'), 'utf8')).nameOwners as Record<string, string>;
const fold = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
function namesOf(site: CitationSite): string[] {
  const names = new Set<string>();
  const owner = site.file.match(/^characters\/(.+)\.json$/)?.[1];
  if (owner) {
    const character = JSON.parse(readFileSync(join(DATA_DIR, site.file), 'utf8')) as { name: string; romanName?: string };
    for (const name of [character.name, character.romanName]) if (name) names.add(name.split(/[ (]/)[0]);
  }
  for (const word of (site.text ?? '').match(/\p{Lu}[\p{L}'’-]{3,}/gu) ?? []) if (nameOwners[fold(word)]) names.add(word);
  return [...names];
}
const mentions = (text: string, names: string[]) => names.filter((name) => new RegExp(`\\b${name.replace(/[^\p{L}]/gu, '')}`, 'iu').test(text));

/* Magnus' Latin, line by line: a short citation moves to where its names are. */
const latinLines = new Map<string, string>();
{
  const latin = readRaw(loadManifest().entries.find((entry) => entry.id === work.original?.corpusId) ?? (() => { throw new Error('no Latin Metamorphoses'); })());
  const $l = load(latin, { xmlMode: true });
  $l('body div[type="textpart"]').filter((_, div: Element) => /^book$/i.test($l(div).attr('subtype') ?? '')).each((_, bookDiv: Element) => {
    const book = $l(bookDiv).attr('n');
    $l(bookDiv).find('l[n]').each((__, line: Element) => { latinLines.set(`${book}.${$l(line).attr('n')}`, $l(line).text()); });
  });
}
/** Latin inflects a name, so its stem is looked for: Arne → Arn(en), Minos → Mino(a). */
function latinHits(book: number, from: number, to: number, names: string[]): number[] {
  const stems = names.map((name) => name.replace(/[^\p{L}]/gu, '')).filter((name) => name.length >= 4).map((name) => new RegExp(`\\b${name.slice(0, Math.max(4, name.length - 2))}`, 'iu'));
  const hits: number[] = [];
  for (let line = from; line <= to; line++) if (stems.some((stem) => stem.test(latinLines.get(`${book}.${line}`) ?? ''))) hits.push(line);
  return hits;
}

/** Swaps one Ovid locus inside a citation string, whether it was written with its
 *  book ("10.680–879") or after one ("…, 680–879"): the rest of the string stays. */
function replaceLocus(text: string, locus: string, latin: string): string {
  const [book, lines] = locus.split('.');
  const [from, to] = lines.split('–');
  const range = to === undefined ? `${from}(?![\\d.]|\\s*[–-]\\s*\\d)` : `${from}\\s*[–-]\\s*(?:${book}\\.)?${to}(?!\\d)`;
  const pattern = new RegExp(`(?<![\\d.])(${book}\\.)?${range}`);
  const match = pattern.exec(text);
  if (!match) return text;
  const replacement = match[1] ? latin : latin.slice(book.length + 1);
  return text.slice(0, match.index) + replacement + text.slice(match.index + match[0].length);
}

/* Every Ovid locus in data/. */
const resolver = createCitationResolver(registry);
const proposals: Proposal[] = [];
for (const site of collectCitationSites(DATA_DIR)) {
  for (const ref of resolver.resolve(site.raw, site.context)) {
    if (ref.kind !== 'passage' || ref.work !== 'metamorphoses' || ref.from.kind !== 'line' || ref.to.kind !== 'line') continue;
    const book = ref.from.book ?? 0;
    const from = Number.parseInt(ref.from.line, 10);
    const to = Number.parseInt(ref.to.line, 10);
    const locus = `${book}.${from}${to === from ? '' : `–${to}`}`;
    if (ref.to.book !== book) {
      proposals.push({ file: site.file, at: site.at, level: 'unknown', raw: site.raw, proposed: null, locus, latin: null, evidence: 'crosses books; read by eye' });
      continue;
    }
    const latinOk = to <= (latinBooks[String(book)]?.last ?? 0) && from <= to;
    const moreOk = to <= moreLast(book) && from <= to;
    const names = namesOf(site);
    const underLatin = latinOk ? mentions(englishFor(book, from, to, 'latin'), names) : [];
    const underMore = moreOk ? mentions(englishFor(book, from, to, 'more'), names) : [];
    const level: Level = !latinOk && moreOk ? 'certain'
      : !latinOk ? 'broken'
      : !moreOk ? 'latin'
      : underMore.length > underLatin.length && underLatin.length === 0 ? 'probable'
      : underLatin.length > 0 && underMore.length === 0 ? 'latin'
      : underLatin.length > 0 ? 'ambiguous' : 'unknown';
    const evidence = `names ${names.join(', ') || '—'}; under Magnus: ${underLatin.join(', ') || 'none'}; under More: ${underMore.join(', ') || 'none'}`;
    if (level !== 'certain' && level !== 'probable') {
      proposals.push({ file: site.file, at: site.at, level, raw: site.raw, proposed: null, locus, latin: null, evidence });
      continue;
    }
    const start = toLatin(book, from, 'start');
    const end = toLatin(book, to, 'end');
    if (!start || !end) {
      proposals.push({ file: site.file, at: site.at, level: 'broken', raw: site.raw, proposed: null, locus, latin: null, evidence: `${evidence}; no card holds More's line` });
      continue;
    }
    // a short citation names a moment: move it to the Latin lines where its names stand
    const hits = to - from <= 10 ? latinHits(book, start.card.latinFrom, end.card.latinTo, names) : [];
    const [first, last] = hits.length ? [hits[0], hits.filter((hit) => hit - hits[0] <= Math.max(3, to - from)).at(-1) ?? hits[0]] : [start.line, end.line];
    const latin = `${book}.${first}${last === first ? '' : `–${last}`}`;
    const proposed = replaceLocus(site.raw, locus, latin);
    const how = hits.length ? `the names stand at Latin ${hits.slice(0, 6).join(', ')}` : 'in proportion within the card';
    proposals.push({ file: site.file, at: site.at, level, raw: site.raw, proposed: proposed === site.raw ? null : proposed, locus, latin, evidence: `${evidence}; cards Latin ${start.card.latinFrom}–${end.card.latinTo}, ${how}` });
  }
}

/* The review, or the approved rewrite. */
const applyArg = process.argv.indexOf('--apply');
if (applyArg >= 0) {
  const wanted = new Set((process.argv[applyArg + 1] ?? '').split(',').filter((level): level is Level => (LEVELS as readonly string[]).includes(level)));
  if (wanted.size === 0) throw new Error('--apply takes certain, probable or both, comma-separated');
  // one rewrite per citation string: a string with several Ovid loci collects all its changes first
  const byString = new Map<string, { file: string; raw: string; next: string }>();
  for (const proposal of proposals) {
    if (!wanted.has(proposal.level) || !proposal.proposed || !proposal.latin) continue;
    const key = `${proposal.file}\u0000${proposal.raw}`;
    const entry = byString.get(key) ?? { file: proposal.file, raw: proposal.raw, next: proposal.raw };
    entry.next = replaceLocus(entry.next, proposal.locus, proposal.latin);
    byString.set(key, entry);
  }
  let changed = 0;
  for (const { file, raw, next } of byString.values()) {
    if (raw === next) continue;
    const path = join(DATA_DIR, file);
    const before = readFileSync(path, 'utf8');
    const quoted = JSON.stringify(raw);
    const after = before.split(quoted).join(JSON.stringify(next));
    if (after === before) continue;
    JSON.parse(after);
    writeFileSync(path, after);
    changed += before.split(quoted).length - 1;
  }
  console.log(`Rewrote ${changed} citation string(s) for ${[...wanted].join(' + ')}. Run pnpm validate-library.`);
  process.exit(0);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'ovid-lineation.json'), `${JSON.stringify(proposals, null, 2)}\n`);
const counts = Object.fromEntries(LEVELS.map((level) => [level, proposals.filter((proposal) => proposal.level === level).length]));
const rows = (level: Level) => proposals.filter((proposal) => proposal.level === level)
  .map((proposal) => `| ${proposal.file} \`${proposal.at}\` | ${proposal.raw} | ${proposal.proposed ?? '—'} | ${proposal.evidence} |`).join('\n');
const section = (level: Level, title: string, note: string) => counts[level] ? `\n## ${title} (${counts[level]})\n\n${note}\n\n| Where | Citation now | Proposed | Evidence |\n|---|---|---|---|\n${rows(level)}\n` : '';
writeFileSync(join(OUT_DIR, 'ovid-lineation.md'), `# Ovid lineation review\n\nGenerated by \`pnpm library:ovid-lineation\` (docs/LIBRARY_PLAN.md §4.3). Every *Metamorphoses* locus in data/, read in Magnus' Latin lines and in Brookes More's English lines. Proposed loci map More's lines to Magnus' in proportion within the English file's cards, so they can be a few lines off; the cards' Latin span is in the evidence.\n\n${LEVELS.map((level) => `- ${level}: ${counts[level]}`).join('\n')}\n` +
  section('certain', 'Certain: past the end of the Latin book', 'Only More\'s numbering reaches these lines.') +
  section('probable', 'Probable: the names are only in More\'s lines', 'In range under both numberings, but the claim\'s names appear only where More\'s numbering points.') +
  section('ambiguous', 'Ambiguous: the names are in both', 'Left as they are; read by eye if in doubt.') +
  section('unknown', 'Unknown: the names are in neither', 'Left as they are; the name test could not decide (the English may use a Latin name).') +
  section('broken', 'Broken: past the end under both numberings', 'Needs a reading of the passage.'));
console.log(LEVELS.map((level) => `${level} ${counts[level]}`).join(' · '));
console.log(`Wrote research/library/ovid-lineation.md and .json`);
