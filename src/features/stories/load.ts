import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import {
  storySchema,
  storyCrossingsSchema,
  chronologySchema,
  cultureSchema,
  voyageSchema,
} from '@/lib/schemas';
import type { CultureData } from '@/types/character';
import type { Story, StoryCrossing, Chronology, Voyage } from '@/types/story';

const STORY_DIR = path.join(process.cwd(), 'data', 'stories');
const STORY_CROSSINGS_PATH = path.join(process.cwd(), 'data', 'story-crossings.json');
const CHRONOLOGY_PATH = path.join(process.cwd(), 'data', 'chronology.json');

/** Loads and validates every story, sorted by mythic era then title. */
export async function loadStories(): Promise<Story[]> {
  let files: string[];
  try {
    files = (await readdir(STORY_DIR)).filter((file) => file.endsWith('.json'));
  } catch {
    return [];
  }
  const stories = await Promise.all(
    files.map(async (file) =>
      storySchema.parse(JSON.parse(await readFile(path.join(STORY_DIR, file), 'utf-8'))) as Story,
    ),
  );
  stories.sort((a, b) => a.era - b.era || a.title.localeCompare(b.title));
  return stories;
}

/** The curated knots of fate that tie myths across saga-arms. */
export async function loadStoryCrossings(): Promise<StoryCrossing[]> {
  try {
    const raw = JSON.parse(await readFile(STORY_CROSSINGS_PATH, 'utf-8'));
    return storyCrossingsSchema.parse(raw) as StoryCrossing[];
  } catch {
    return [];
  }
}

/** The Eratosthenes-anchored mythic chronology that drives the Spindle's BC-year
 *  axis (internal positioning only; the years are never shown as UI labels). */
export async function loadChronology(): Promise<Chronology | null> {
  try {
    const raw = JSON.parse(await readFile(CHRONOLOGY_PATH, 'utf-8'));
    return chronologySchema.parse(raw) as Chronology;
  } catch {
    return null;
  }
}

export async function loadStory(id: string): Promise<Story | null> {
  try {
    const raw = JSON.parse(await readFile(path.join(STORY_DIR, `${id}.json`), 'utf-8'));
    return storySchema.parse(raw) as Story;
  } catch {
    return null;
  }
}

const STORY_CULTURE_DIR = path.join(process.cwd(), 'data', 'story-culture');

/** Optional culture shelves for a saga (data/story-culture/{id}.json). */
export async function loadStoryCulture(id: string): Promise<CultureData | null> {
  try {
    const raw = JSON.parse(await readFile(path.join(STORY_CULTURE_DIR, `${id}.json`), 'utf-8'));
    return cultureSchema.parse(raw) as CultureData;
  } catch {
    return null;
  }
}

const EXPERIENCE_DIR = path.join(process.cwd(), 'data', 'experience');

/** A flagship voyage overlay (data/experience/{id}.json, docs/NOSTOS_PLAN.md §7). */
export async function loadVoyage(id: string): Promise<Voyage | null> {
  try {
    const raw = JSON.parse(await readFile(path.join(EXPERIENCE_DIR, `${id}.json`), 'utf-8'));
    return voyageSchema.parse(raw) as Voyage;
  } catch {
    return null;
  }
}
