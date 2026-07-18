import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { characterSchema, cultureSchema, referenceSchema, relationSchema, sourceSchema } from '@/lib/schemas';
import type { Character, CultureData, ReferenceData, Relation, Source } from '@/types/character';

export type { CharacterIndex } from './character-index';
export { buildCharacterIndex } from './character-index';

const DATA_DIR = path.join(process.cwd(), 'data');

export interface AtlasData {
  characters: Character[];
  relations: Relation[];
  sources: Source[];
}

/** Batched reads: page prerenders run many renders in parallel, and an
 *  unbounded Promise.all over 1484 character files per render can overflow
 *  the macOS system file table during `next build` (ENFILE). Order is
 *  preserved; behavior is otherwise identical. */
const READ_BATCH = 64;

async function readJsonDir<T>(dir: string, parse: (raw: unknown) => T): Promise<T[]> {
  let files: string[];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  const results: T[] = [];
  for (let start = 0; start < files.length; start += READ_BATCH) {
    results.push(
      ...(await Promise.all(
        files
          .slice(start, start + READ_BATCH)
          .map(async (file) => parse(JSON.parse(await readFile(path.join(dir, file), 'utf-8')))),
      )),
    );
  }
  return results;
}

/** Loads and validates the core data layer. Server-side only (build/render time). */
export async function loadAtlasData(): Promise<AtlasData> {
  const characters = (await readJsonDir(path.join(DATA_DIR, 'characters'), (raw) =>
    characterSchema.parse(raw),
  )) as Character[];
  characters.sort((a, b) => a.id.localeCompare(b.id));

  const relations = relationSchema
    .array()
    .parse(JSON.parse(await readFile(path.join(DATA_DIR, 'relations.json'), 'utf-8'))) as Relation[];

  const sources = sourceSchema
    .array()
    .parse(JSON.parse(await readFile(path.join(DATA_DIR, 'sources.json'), 'utf-8'))) as Source[];

  return { characters, relations, sources };
}

/** Build-time-baked galaxy positions (scripts/bake-layout.ts). Null when absent;
 *  GalaxyView falls back to a runtime solve and validates the baked set by signature. */
export interface BakedLayout {
  signature: string;
  count: number;
  positions: Record<string, [number, number, number]>;
}

export async function loadBakedLayout(): Promise<BakedLayout | null> {
  try {
    const raw = await readFile(path.join(DATA_DIR, 'generated', 'galaxy-positions.json'), 'utf-8');
    return JSON.parse(raw) as BakedLayout;
  } catch {
    return null;
  }
}

/** Encyclopedic reference for the Information tab; null when not yet written. */
/** Flagship stars for build-time prerender (docs/NOSTOS_PLAN.md D16): the
 *  figures with a curated Legacy shelf — the pages searchers actually land on.
 *  The remaining codex pages render on first request and cache at the CDN,
 *  which keeps the CI static-generation pass inside Netlify's build window
 *  (all 1486 × 3 pages prerendered blew past its 18-minute cap). */
export async function loadFlagshipCharacterIds(): Promise<string[]> {
  try {
    const files = await readdir(path.join(DATA_DIR, 'culture'));
    return files.filter((file) => file.endsWith('.json')).map((file) => file.replace(/\.json$/, ''));
  } catch {
    return [];
  }
}

export async function loadReference(id: string): Promise<ReferenceData | null> {
  try {
    const raw = JSON.parse(await readFile(path.join(DATA_DIR, 'reference', `${id}.json`), 'utf-8'));
    return referenceSchema.parse(raw) as ReferenceData;
  } catch {
    return null;
  }
}

/** Cultural legacy items for the Legacy page; null when not yet curated. */
export async function loadCulture(id: string): Promise<CultureData | null> {
  try {
    const raw = JSON.parse(await readFile(path.join(DATA_DIR, 'culture', `${id}.json`), 'utf-8'));
    return cultureSchema.parse(raw) as CultureData;
  } catch {
    return null;
  }
}
