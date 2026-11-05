import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import quarrelsJson from '../../../data/quarrels.json';
import { createCitationResolver } from './cite';
import { LIBRARY_REGISTRY, libraryWork, unitOf } from './links';
import { buildMargins, clip, covered, type BlockMargin, type UnitMargin } from './margins';
import type { MarginBlock, MarginChunk, MarginIndex, MarginQuarrel, MarginTables } from './margin-paths';
import { claimsInTime } from './quarrel-order';
import { collectCitationSites } from './sites';
import { commonsThumbAtLeast, commonsThumbUrl } from '@/features/art/commons';
import { loadAtlasData } from '@/features/characters/load';
import { resolveSaga, SAGA_ACCENT } from '@/features/stories/sagas';
import { loadStories } from '@/features/stories/load';
import type { CiteRef, LibraryBlock, LibraryText } from '@/types/library';
import type { QuarrelClaim, QuarrelsFile } from '@/types/quarrel';

/** The margin of every reading page, with what it takes to draw it: the names,
 *  stories, quarrels, sky lines and Loom works its blocks point at. Built from
 *  data/ on disk — by `pnpm bake-atlas-data` into public/atlas/library/, which the
 *  reading room fetches, and by the server render, which scopes the linked names.
 *  Each page is an index and its notes in chunks (margin-paths.ts), so a book the
 *  atlas cites densely still loads in small pieces. */

export type MarginFile = MarginIndex | MarginChunk;

/** A chunk stops growing past this much JSON: about 10 KB gzipped, a third of
 *  the 30 KB a margin file may weigh (docs/LIBRARY_PLAN.md §4.8). */
const CHUNK_BYTES = 48_000;

const ROOT = process.cwd();
const TEXTS_DIR = join(ROOT, 'data', 'generated', 'library');

const noTables = (): MarginTables => ({ who: {}, stories: {}, topics: {}, relations: {}, works: {} });

function readTexts(): LibraryText[] {
  return readdirSync(TEXTS_DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(readFileSync(join(TEXTS_DIR, name), 'utf8')) as LibraryText);
}

const QUARRELS = (quarrelsJson as unknown as QuarrelsFile).quarrels;

interface CatalogueWork { id: string; title: string; artist: string; year: string; sortYear: number; file: string; path: string; width: number; stories: string[] }

interface MarginData {
  /** `work/unit` → the page's reverse index, for the server's linking scope */
  margins: Map<string, UnitMargin>;
  /** path under public/atlas/library/ → the file written there */
  files: Map<string, MarginFile>;
  relationEnds: Map<string, [string, string]>;
}

let built: Promise<MarginData> | null = null;

export function libraryMarginData(): Promise<MarginData> {
  built ??= assemble();
  return built;
}

async function assemble(): Promise<MarginData> {
  const [{ characters, relations }, stories] = await Promise.all([loadAtlasData(), loadStories()]);
  const resolver = createCitationResolver(LIBRARY_REGISTRY);
  const sites = collectCitationSites(join(ROOT, 'data'), { notes: true });
  const texts = readTexts();
  const margins = buildMargins(sites, (raw, context) => resolver.resolve(raw, context), texts, LIBRARY_REGISTRY.works);
  const pageBlocks = new Map<string, LibraryBlock[]>(texts.flatMap((text) => text.units.map((unit) => [`${text.work}/${unit.id}`, unit.blocks] as const)));

  const characterById = new Map(characters.map((character) => [character.id, character]));
  const storyById = new Map(stories.map((story) => [story.id, story]));
  const relationById = new Map(relations.map((relation) => [relation.id, relation]));
  const relationEnds = new Map(relations.map((relation) => [relation.id, [relation.from, relation.to] as [string, string]]));
  // each quarrel's claims in their tellers' order, and the passages each names
  const quarrels = new Map(QUARRELS.map((quarrel) => [quarrel.topic, { title: quarrel.title, claims: claimsInTime(quarrel) }]));
  const claimRefs = new Map<QuarrelClaim, Extract<CiteRef, { kind: 'passage' }>[]>();
  const refsOf = (claim: QuarrelClaim) => {
    const known = claimRefs.get(claim);
    if (known) return known;
    const refs = claim.citation ? resolver.resolve(claim.citation, { sources: claim.sources }).filter((ref) => ref.kind === 'passage') : [];
    claimRefs.set(claim, refs);
    return refs;
  };
  /** The claims of a quarrel whose passage is this block of this page. */
  const claimsHere = (topic: string, key: string, from: string): number[] => {
    const blocks = pageBlocks.get(key) ?? [];
    return (quarrels.get(topic)?.claims ?? []).flatMap((claim, index) =>
      refsOf(claim).some((ref) => {
        const work = libraryWork(ref.work);
        if (`${ref.work}/${unitOf(work, ref.from)}` !== key) return false;
        const hits = covered(work, blocks, ref.from, ref.to);
        return hits !== 'broad' && hits.some((block) => block.from === from);
      })
        ? [index]
        : [],
    );
  };
  const quarrelEntry = (topic: string): MarginQuarrel => {
    const quarrel = quarrels.get(topic);
    if (!quarrel) return [topic, []];
    return [quarrel.title, quarrel.claims.map((claim) => [claim.who, clip(claim.claim, 150), claim.citation ?? ''])];
  };
  let catalogue: CatalogueWork[] = [];
  try {
    catalogue = (JSON.parse(readFileSync(join(ROOT, 'data', 'generated', 'art-catalogue.json'), 'utf8')) as { works: CatalogueWork[] }).works;
  } catch {
    // before the first art bake there is no Loom to point at
  }
  const worksByStory = new Map<string, CatalogueWork[]>();
  for (const work of catalogue) for (const story of work.stories) worksByStory.set(story, [...(worksByStory.get(story) ?? []), work]);
  for (const list of worksByStory.values()) list.sort((a, b) => a.sortYear - b.sortYear);

  const storyEntry = (id: string): [string, string] | null => {
    const story = storyById.get(id);
    return story ? [story.title, SAGA_ACCENT[resolveSaga(story, storyById)]] : null;
  };
  /** The tables one block's notes point at. */
  const describe = (block: BlockMargin, works: CatalogueWork[]): MarginTables => {
    const tables = noTables();
    const know = (id: string) => {
      const character = characterById.get(id);
      if (character) tables.who[id] = [character.name, character.type];
    };
    for (const id of Object.keys(block.figures)) know(id);
    for (const id of block.relations) {
      const relation = relationById.get(id);
      if (!relation) continue;
      tables.relations[id] = [relation.from, relation.to, relation.type, relation.sources];
      know(relation.from);
      know(relation.to);
    }
    for (const id of Object.keys(block.stories)) {
      const entry = storyEntry(id);
      if (entry) tables.stories[id] = entry;
    }
    for (const topic of block.topics) tables.topics[topic] = quarrelEntry(topic);
    for (const work of works) tables.works[work.id] = [work.title, work.artist, work.year, commonsThumbUrl(work.path, work.file, commonsThumbAtLeast(work.width, 250))];
    return tables;
  };

  const files = new Map<string, MarginFile>();
  for (const [key, margin] of margins) {
    const index: MarginIndex = { facts: {}, chunk: {}, chunks: 0, across: { facts: margin.across.facts, stories: {} } };
    for (const id of Object.keys(margin.across.stories)) {
      const entry = storyEntry(id);
      if (entry) index.across.stories[id] = entry;
    }
    // the blocks in reading order, a chunk closing once it holds enough
    const chunks: MarginChunk[] = [];
    let bytes = Infinity;
    for (const { from } of pageBlocks.get(key) ?? []) {
      const block = margin.blocks[from];
      if (!block) continue;
      const works = [...new Map(Object.keys(block.stories).flatMap((id) => worksByStory.get(id) ?? []).map((work) => [work.id, work])).values()].slice(0, 3);
      const here = Object.fromEntries(block.topics.map((topic) => [topic, claimsHere(topic, key, from)] as const).filter(([, claims]) => claims.length > 0));
      const entry: MarginBlock = { ...block, ...(works.length ? { works: works.map((work) => work.id) } : {}), ...(Object.keys(here).length ? { here } : {}) };
      const tables = describe(block, works);
      const cost = JSON.stringify(entry).length + JSON.stringify(tables).length;
      if (bytes + cost > CHUNK_BYTES) {
        chunks.push({ blocks: {}, ...noTables() });
        bytes = 0;
      }
      const chunk = chunks[chunks.length - 1];
      chunk.blocks[from] = entry;
      Object.assign(chunk.who, tables.who);
      Object.assign(chunk.stories, tables.stories);
      Object.assign(chunk.topics, tables.topics);
      Object.assign(chunk.relations, tables.relations);
      Object.assign(chunk.works, tables.works);
      bytes += cost;
      index.facts[from] = block.facts;
      index.chunk[from] = chunks.length - 1;
    }
    index.chunks = chunks.length;
    chunks.forEach((chunk, n) => files.set(`${key}-${n}.json`, chunk));
    files.set(`${key}.json`, index);
  }
  return { margins, files, relationEnds };
}
