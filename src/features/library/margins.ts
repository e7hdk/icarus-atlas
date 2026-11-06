import { compareIds } from './extents';
import { unitOf } from './links';
import type { CitationSite } from './sites';
import type { CiteRef, LibraryBlock, LibraryText, LibraryWork, Locus } from '@/types/library';

/** The reverse index (docs/LIBRARY_PLAN.md §4.5): every citation in data/ turned
 *  round into passage → what rests on it, cut per reading page and per block. A
 *  citation that spans more than a few blocks — a whole episode, a book — goes to
 *  the page's `across` list rather than into every block it covers. */

export interface FigureNote {
  facts: number;
  /** The first claim this block proves for the figure. */
  excerpt: string;
  sources: string[];
  citation: string;
  topic?: string;
}

export interface BlockMargin {
  facts: number;
  figures: Record<string, FigureNote>;
  /** story id → the titles of its chapters that cite the block ('' for a summary or an attestation) */
  stories: Record<string, string[]>;
  relations: string[];
  topics: string[];
  /** "city:ruler" */
  reigns: string[];
  places: string[];
}

export interface UnitMargin {
  blocks: Record<string, BlockMargin>;
  across: BlockMargin;
}

/** A citation wider than this many blocks is the page's, not each block's. */
const BROAD = 6;

export const emptyMargin = (): BlockMargin => ({ facts: 0, figures: {}, stories: {}, relations: [], topics: [], reigns: [], places: [] });

const pushOnce = (list: string[], value: string) => {
  if (!list.includes(value)) list.push(value);
};

/** A claim cut, at a word, to about what the margin shows in its two lines. */
export function clip(text: string, length: number): string {
  if (text.length <= length) return text;
  const cut = text.slice(0, length);
  const space = cut.lastIndexOf(' ');
  return `${(space > 0 ? cut.slice(0, space) : cut).replace(/[\s,;:—–-]+$/u, '')}…`;
}

function add(margin: BlockMargin, site: CitationSite) {
  margin.facts += 1;
  if (site.topic) pushOnce(margin.topics, site.topic);
  const { owner } = site;
  if (owner.kind === 'character') {
    const note = margin.figures[owner.id] ?? { facts: 0, excerpt: clip(site.text ?? '', 160), sources: [], citation: site.raw };
    note.facts += 1;
    for (const source of site.context.sources ?? []) pushOnce(note.sources, source);
    if (site.topic && !note.topic) note.topic = site.topic;
    margin.figures[owner.id] = note;
    return;
  }
  if (owner.kind === 'story') {
    const titles = margin.stories[owner.id] ?? [];
    pushOnce(titles, owner.part === 'chapter' ? (owner.title ?? '') : '');
    margin.stories[owner.id] = titles;
    return;
  }
  if (owner.kind === 'relation') pushOnce(margin.relations, owner.id);
  if (owner.kind === 'reign') pushOnce(margin.reigns, `${owner.city}:${owner.ruler}`);
  if (owner.kind === 'place') pushOnce(margin.places, owner.id);
}

const isNumeric = (id: string) => /^\d/.test(id);

/** The blocks of a page a passage covers. */
export function covered(work: LibraryWork, blocks: LibraryBlock[], from: Locus, to: Locus): LibraryBlock[] | 'broad' {
  if (from.kind === 'book') return 'broad';
  if (from.kind === 'line') {
    const end = to.kind === 'line' && to.book === from.book ? to.line : null;
    return blocks.filter((block) => compareIds(block.to, from.line) >= 0 && (end === null || compareIds(block.from, end) <= 0));
  }
  if (from.kind === 'section') {
    const last = to.kind === 'section' ? to.path : from.path;
    const hits = blocks.filter((block) => block.from.startsWith(`${from.path}.`) || block.from.startsWith(`${last}.`) || (compareIds(block.from, from.path) >= 0 && compareIds(block.from, last) <= 0));
    if (hits.length) return hits;
    // inside a paragraph the edition does not cut: the block that opens before it
    const parent = from.path.slice(0, from.path.lastIndexOf('.'));
    const before = blocks.filter((block) => block.from.startsWith(`${parent}.`) && compareIds(block.from, from.path) <= 0);
    return before.slice(-1);
  }
  if (from.tale === 'preface') return blocks.filter((block) => !isNumeric(block.from) || block.from.startsWith('0.'));
  if (!isNumeric(from.tale)) return blocks.filter((block) => block.from === from.tale);
  const last = to.kind === 'tale' && isNumeric(to.tale) ? to.tale : from.tale;
  // a whole tale takes its parts too: Fab. 14 runs on as 14.2–14.5
  const within = (block: LibraryBlock) => block.from.startsWith(`${last}.`) || (compareIds(block.from, from.tale) >= 0 && compareIds(block.from, last) <= 0);
  return blocks.filter((block) => isNumeric(block.from) && !block.from.startsWith('0.') && within(block));
}

export function buildMargins(
  sites: CitationSite[],
  resolve: (raw: string, context: CitationSite['context']) => CiteRef[],
  texts: LibraryText[],
  works: LibraryWork[],
): Map<string, UnitMargin> {
  const workById = new Map(works.map((work) => [work.id, work]));
  const pages = new Map<string, { blocks: LibraryBlock[]; margin: UnitMargin }>();
  for (const text of texts) {
    for (const unit of text.units) pages.set(`${text.work}/${unit.id}`, { blocks: unit.blocks, margin: { blocks: {}, across: emptyMargin() } });
  }
  for (const site of sites) {
    for (const ref of resolve(site.raw, site.context)) {
      if (ref.kind !== 'passage') continue;
      const work = workById.get(ref.work);
      if (!work) continue;
      const page = pages.get(`${ref.work}/${unitOf(work, ref.from)}`);
      if (!page) continue;
      const hits = covered(work, page.blocks, ref.from, ref.to);
      if (hits === 'broad' || hits.length > BROAD) {
        add(page.margin.across, site);
        continue;
      }
      for (const block of hits) {
        const margin = page.margin.blocks[block.from] ?? emptyMargin();
        add(margin, site);
        page.margin.blocks[block.from] = margin;
      }
    }
  }
  return new Map([...pages].map(([key, page]) => [key, page.margin]));
}

/** The figures a block's passages are about: its linking scope (§4.6). */
export function scopeOf(margin: BlockMargin | undefined, relationEnds: Map<string, [string, string]>): string[] {
  if (!margin) return [];
  const scope = new Set(Object.keys(margin.figures));
  for (const id of margin.relations) for (const end of relationEnds.get(id) ?? []) scope.add(end);
  return [...scope];
}
