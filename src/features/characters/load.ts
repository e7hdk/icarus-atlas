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

async function readJsonDir<T>(dir: string, parse: (raw: unknown) => T): Promise<T[]> {
  let files: string[];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  return Promise.all(
    files.map(async (file) => parse(JSON.parse(await readFile(path.join(dir, file), 'utf-8')))),
  );
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
