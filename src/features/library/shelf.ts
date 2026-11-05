import 'server-only';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCitationResolver } from './cite';
import { compareIds } from './extents';
import { LIBRARY_REGISTRY } from './links';
import { TELLER_ORDER } from './paths';
import { QUARRELS } from './quarrels';
import { collectCitationSites } from './sites';
import { loadAtlasData } from '@/features/characters/load';
import { loadStories } from '@/features/stories/load';
import { resolveSaga, type SagaId } from '@/features/stories/sagas';
import type { SourceId } from '@/types/character';
import type { CiteRef, LibraryExtents, WorkId } from '@/types/library';

/** What the atlas owes each work and each teller (docs/LIBRARY_PLAN.md §5),
 *  counted from the reverse index: every citation in data/ resolved to its
 *  passage. The Shelf, the teller pages and the work pages read it. */

export interface WorkStats {
  /** Cited stretches that land in the work. */
  citations: number;
  /** The share of the work's lines (or sections and tales) some fact cites. */
  cited: number;
  figures: number;
  stories: number;
  /** saga → the stories of it that cite the work */
  sagas: Partial<Record<SagaId, number>>;
  /** Quarrels with a claim that cites the work: the sides it takes. */
  quarrels: number;
  lines: number | null;
  words: number;
}

/** The ids behind a work's counts, for its own page. */
export interface WorkLists {
  stories: string[];
  quarrels: string[];
}

export interface TellerStats {
  facts: number;
  figures: number;
  stories: number;
  quarrels: number;
  /** Figures every fact of which this teller alone tells. */
  only: string[];
}

type Passage = Extract<CiteRef, { kind: 'passage' }>;

let built: Promise<{ works: Record<WorkId, WorkStats>; lists: Record<WorkId, WorkLists>; tellers: Record<SourceId, TellerStats> }> | null = null;

export function libraryShelf() {
  built ??= assemble();
  return built;
}

async function assemble() {
  const root = process.cwd();
  const extents = JSON.parse(readFileSync(join(root, 'data', 'generated', 'library-extents.json'), 'utf8')) as LibraryExtents;
  const [{ characters }, stories] = await Promise.all([loadAtlasData(), loadStories()]);
  const storyById = new Map(stories.map((story) => [story.id, story]));
  const resolver = createCitationResolver(LIBRARY_REGISTRY);
  const sites = collectCitationSites(join(root, 'data'), { notes: true });
  const authorOf = new Map(LIBRARY_REGISTRY.works.map((work) => [work.id, work.author]));

  const marks = new Map<WorkId, Set<string>>();
  const citations = new Map<WorkId, number>();
  const figures = new Map<string, Set<string>>();
  const storiesOf = new Map<string, Set<string>>();
  const facts = new Map<SourceId, Set<string>>();
  const add = (map: Map<string, Set<string>>, key: string, value: string) => map.set(key, (map.get(key) ?? new Set()).add(value));

  sites.forEach((site, index) => {
    const refs = resolver.resolve(site.raw, site.context).filter((ref): ref is Passage => ref.kind === 'passage');
    for (const ref of refs) {
      citations.set(ref.work, (citations.get(ref.work) ?? 0) + 1);
      const teller = authorOf.get(ref.work);
      if (teller) add(facts as Map<string, Set<string>>, teller, String(index));
      if (site.owner.kind === 'character') {
        add(figures, ref.work, site.owner.id);
        if (teller) add(figures, `teller:${teller}`, site.owner.id);
      }
      if (site.owner.kind === 'story') {
        add(storiesOf, ref.work, site.owner.id);
        if (teller) add(storiesOf, `teller:${teller}`, site.owner.id);
      }
      const work = marks.get(ref.work) ?? new Set<string>();
      marks.set(ref.work, work);
      const extent = extents.works[ref.work];
      if (ref.from.kind === 'line' && ref.to.kind === 'line' && ref.from.book === ref.to.book) {
        // only lines the edition has: a relation note's locus is not gated and may run past its book
        const end = ref.from.book === undefined ? extent.lines?.last : extent.books?.[String(ref.from.book)]?.last;
        const last = Math.min(Number.parseInt(ref.to.line, 10), end ?? 0);
        for (let line = Number.parseInt(ref.from.line, 10); line <= last; line++) work.add(`${ref.from.book ?? ''}.${line}`);
      }
      if (ref.from.kind === 'section' || ref.from.kind === 'tale') {
        const first = ref.from.kind === 'section' ? ref.from.path : ref.from.tale;
        const end = ref.to.kind === 'section' ? ref.to.path : ref.to.kind === 'tale' ? ref.to.tale : first;
        for (const id of extent.ids ?? []) if (id === first || id.startsWith(`${first}.`) || (compareIds(id, first) >= 0 && compareIds(id, end) <= 0)) work.add(id);
      }
    }
  });

  const quarrelsCiting = new Map<WorkId, string[]>();
  for (const quarrel of QUARRELS) {
    const cited = new Set<WorkId>();
    for (const claim of quarrel.claims) {
      if (!claim.citation) continue;
      for (const ref of resolver.resolve(claim.citation, { sources: claim.sources })) if (ref.kind === 'passage') cited.add(ref.work);
    }
    for (const work of cited) quarrelsCiting.set(work, [...(quarrelsCiting.get(work) ?? []), quarrel.topic]);
  }

  const works = {} as Record<WorkId, WorkStats>;
  const lists = {} as Record<WorkId, WorkLists>;
  for (const work of LIBRARY_REGISTRY.works) {
    const extent = extents.works[work.id];
    const lines = extent.books ? Object.values(extent.books).reduce((sum, book) => sum + book.last, 0) : extent.lines ? extent.lines.last : null;
    const of = lines ?? extent.ids?.length ?? 0;
    const sagas: Partial<Record<SagaId, number>> = {};
    for (const id of storiesOf.get(work.id) ?? []) {
      const story = storyById.get(id);
      if (!story) continue;
      const saga = resolveSaga(story, storyById);
      sagas[saga] = (sagas[saga] ?? 0) + 1;
    }
    works[work.id] = {
      citations: citations.get(work.id) ?? 0,
      cited: of ? Math.min(1, (marks.get(work.id)?.size ?? 0) / of) : 0,
      figures: figures.get(work.id)?.size ?? 0,
      stories: storiesOf.get(work.id)?.size ?? 0,
      sagas,
      quarrels: quarrelsCiting.get(work.id)?.length ?? 0,
      lines,
      words: extent.words ?? 0,
    };
    lists[work.id] = { stories: [...(storiesOf.get(work.id) ?? [])], quarrels: quarrelsCiting.get(work.id) ?? [] };
  }

  // a figure only one teller tells of: every sourced line about it names that teller alone
  const onlyBy = new Map<SourceId, string[]>();
  for (const character of characters) {
    const told = new Set([...character.summary, ...character.story, ...(character.residences ?? [])].flatMap((entry) => entry.sources));
    if (told.size !== 1) continue;
    const [teller] = told;
    onlyBy.set(teller, [...(onlyBy.get(teller) ?? []), character.id]);
  }
  const tellers = {} as Record<SourceId, TellerStats>;
  for (const teller of TELLER_ORDER) {
    tellers[teller] = {
      facts: facts.get(teller)?.size ?? 0,
      figures: figures.get(`teller:${teller}`)?.size ?? 0,
      stories: storiesOf.get(`teller:${teller}`)?.size ?? 0,
      quarrels: QUARRELS.filter((quarrel) => quarrel.claims.some((claim) => claim.sources.includes(teller))).length,
      only: onlyBy.get(teller) ?? [],
    };
  }
  return { works, lists, tellers };
}
