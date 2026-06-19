import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load, type Cheerio, type CheerioAPI } from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import { z } from 'zod';
import { SOURCE_IDS } from '../../src/types/character';

const entrySchema = z.object({
  id: z.string().min(1),
  sourceId: z.enum(SOURCE_IDS),
  author: z.string().min(1),
  work: z.string().min(1),
  citationLabel: z.string().min(1),
  language: z.enum(['en', 'grc', 'lat']),
  format: z.enum(['perseus-tei', 'topostext-html']),
  urnBase: z.string().startsWith('urn:cts:'),
  edition: z.string().min(1),
  license: z.string().min(1),
  url: z.string().url(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  file: z.string().regex(/^[a-z0-9-]+\.(xml|html)$/),
});

const manifestSchema = z.object({
  version: z.literal(1),
  description: z.string().min(1),
  entries: z.array(entrySchema).min(1),
});

export const CORPUS_DIR = join(import.meta.dirname, '..', '..', 'research', 'corpus');
export const RAW_DIR = join(CORPUS_DIR, 'raw');
export const NORMALIZED_DIR = join(CORPUS_DIR, 'normalized');
export const INDEX_PATH = join(NORMALIZED_DIR, 'index.jsonl');
export const MANIFEST_PATH = join(CORPUS_DIR, 'manifest.json');

export type CorpusEntry = z.infer<typeof entrySchema>;
export type CorpusManifest = z.infer<typeof manifestSchema>;

export interface CorpusPassage {
  id: string;
  sourceId: CorpusEntry['sourceId'];
  author: string;
  work: string;
  citation: string;
  citationLabel: string;
  language: CorpusEntry['language'];
  text: string;
  urn: string;
  edition: string;
  sourceUrl: string;
}

export function loadManifest(): CorpusManifest {
  return manifestSchema.parse(JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')));
}

export function sha256(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanText($: CheerioAPI, selection: Cheerio<AnyNode>): string {
  const clone = selection.clone();
  clone.find('note, pb, milestone, fw, figure, figDesc').remove();
  return normalizeWhitespace(clone.text());
}

function numberedAncestors($: CheerioAPI, element: Element): Array<{ subtype: string; n: string }> {
  const result: Array<{ subtype: string; n: string }> = [];
  const chain = $(element).parents('div[type="textpart"]').get().reverse().concat(element);
  for (const node of chain) {
    const current = $(node);
    const n = current.attr('n');
    if (!n || n.startsWith('urn:cts:')) continue;
    result.push({ subtype: current.attr('subtype') ?? '', n });
  }
  return result;
}

function numericValues(values: string[]): number[] {
  return values.map(Number).filter((value) => Number.isFinite(value));
}

function lineRange($: CheerioAPI, element: Element): string | null {
  const selection = $(element);
  const lineNumbers = numericValues(selection.find('l[n]').map((_, line) => $(line).attr('n') ?? '').get());
  const milestoneNumbers = numericValues(
    selection.find('milestone[unit="line"][n]').map((_, milestone) => $(milestone).attr('n') ?? '').get(),
  );
  const values = lineNumbers.length > 0 ? lineNumbers : milestoneNumbers;
  if (values.length > 0) return values.length === 1 ? String(values[0]) : `${values[0]}-${values.at(-1)}`;

  const start = Number(selection.attr('n'));
  const next = Number(selection.nextAll('div[type="textpart"][subtype="card"][n]').first().attr('n'));
  if (Number.isFinite(start) && Number.isFinite(next)) return `${start}-${next - 1}`;
  return Number.isFinite(start) ? String(start) : null;
}

function textpartCitation($: CheerioAPI, element: Element): string {
  const parts = numberedAncestors($, element);
  const book = parts.find((part) => part.subtype === 'book')?.n;
  const subtype = $(element).attr('subtype') ?? '';

  if (subtype === 'card') {
    const range = lineRange($, element) ?? $(element).attr('n') ?? '?';
    return book ? `${book}.${range}` : range;
  }

  const structural = parts
    .filter((part) => ['book', 'chapter', 'section'].includes(part.subtype))
    .map((part) => part.n);
  return structural.length > 0 ? structural.join('.') : ($(element).attr('n') ?? '?');
}

function passage(entry: CorpusEntry, citation: string, text: string, index: number): CorpusPassage {
  return {
    id: `${entry.id}:${citation}:${index}`,
    sourceId: entry.sourceId,
    author: entry.author,
    work: entry.work,
    citation,
    citationLabel: entry.citationLabel,
    language: entry.language,
    text,
    urn: `${entry.urnBase}:${citation}`,
    edition: entry.edition,
    sourceUrl: entry.url,
  };
}

function normalizeTei(entry: CorpusEntry, content: string): CorpusPassage[] {
  const $ = load(content, { xmlMode: true });
  const textparts = $('body div[type="textpart"]').filter((_, element) => $(element).find('div[type="textpart"]').length === 0);
  const passages: CorpusPassage[] = [];

  textparts.each((_, element) => {
    const lines = $(element).find('l[n]');
    const text = lines.length > 0
      ? normalizeWhitespace(lines.map((__, line) => cleanText($, $(line))).get().join(' '))
      : cleanText($, $(element));
    if (text.length < 2) return;
    const citation = textpartCitation($, element);
    passages.push(passage(entry, citation, text, passages.length));
  });

  if (passages.length > 0) return passages;

  const lines = $('body l[n]').get();
  for (let offset = 0; offset < lines.length; offset += 5) {
    const group = lines.slice(offset, offset + 5);
    const first = $(group[0]).attr('n') ?? '?';
    const last = $(group.at(-1)!).attr('n') ?? first;
    const citation = first === last ? first : `${first}-${last}`;
    const text = normalizeWhitespace(group.map((line) => cleanText($, $(line))).join(' '));
    if (text.length >= 2) passages.push(passage(entry, citation, text, passages.length));
  }

  return passages;
}

function normalizeToposText(entry: CorpusEntry, content: string): CorpusPassage[] {
  const $ = load(content);
  const passages: CorpusPassage[] = [];
  $('p[id^="urn:cts:"]').each((_, element) => {
    const id = $(element).attr('id');
    if (!id) return;
    const citation = id.slice(id.lastIndexOf(':') + 1);
    const clone = $(element).clone();
    clone.find('b').first().remove();
    const text = normalizeWhitespace(clone.text());
    if (text.length >= 2) passages.push(passage(entry, citation, text, passages.length));
  });
  return passages;
}

export function normalizeEntry(entry: CorpusEntry, content: string): CorpusPassage[] {
  const passages = entry.format === 'perseus-tei'
    ? normalizeTei(entry, content)
    : normalizeToposText(entry, content);
  if (passages.length === 0) throw new Error(`${entry.id}: no citation-bearing passages found`);
  return passages;
}
