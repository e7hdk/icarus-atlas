import type { Character } from '@/types/character';
import type { ProseSegment } from './parse-prose';
import bakedJson from '../../../data/generated/linked-prose.json';

export interface BakedStoryProse {
  summary: ProseSegment[];
  chapters: ProseSegment[][];
}

export interface BakedCharacterProse {
  summary: ProseSegment[][];
  story: ProseSegment[][];
}

export interface BakedLinkedProse {
  signature: string;
  stories: Record<string, BakedStoryProse>;
  characters: Record<string, BakedCharacterProse>;
}

let syncCache: BakedLinkedProse | null | undefined;

/** Baked linked prose — bundled at build time from data/generated/linked-prose.json. */
export function getBakedLinkedProse(): BakedLinkedProse | null {
  if (syncCache !== undefined) return syncCache;
  try {
    syncCache = bakedJson as BakedLinkedProse;
  } catch {
    syncCache = null;
  }
  return syncCache;
}

export function getStoryProseSegments(
  baked: BakedLinkedProse,
  storyId: string,
): BakedStoryProse | undefined {
  return baked.stories[storyId];
}

export function getCharacterSummarySegments(
  baked: BakedLinkedProse,
  charId: string,
  index: number,
): ProseSegment[] | undefined {
  return baked.characters[charId]?.summary[index];
}

export function getCharacterStorySegments(
  baked: BakedLinkedProse,
  charId: string,
  index: number,
): ProseSegment[] | undefined {
  return baked.characters[charId]?.story[index];
}

/** Match a sourced paragraph's text to its index in summary/story and return baked segments. */
export function resolveCharacterProseSegments(
  baked: BakedLinkedProse,
  character: Pick<Character, 'id' | 'summary' | 'story'>,
  paragraphText: string,
): ProseSegment[] | undefined {
  const entry = baked.characters[character.id];
  if (!entry) return undefined;
  const summaryIdx = character.summary.findIndex((p) => p.text === paragraphText);
  if (summaryIdx >= 0) return entry.summary[summaryIdx];
  const storyIdx = character.story.findIndex((p) => p.text === paragraphText);
  if (storyIdx >= 0) return entry.story[storyIdx];
  return undefined;
}
