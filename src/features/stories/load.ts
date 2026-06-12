import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { storySchema } from '@/lib/schemas';
import type { Story } from '@/types/story';

const STORY_DIR = path.join(process.cwd(), 'data', 'stories');

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

export async function loadStory(id: string): Promise<Story | null> {
  try {
    const raw = JSON.parse(await readFile(path.join(STORY_DIR, `${id}.json`), 'utf-8'));
    return storySchema.parse(raw) as Story;
  } catch {
    return null;
  }
}
