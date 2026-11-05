import type { BlockMargin } from './margins';
import type { CharacterType } from '@/types/character';

/** Where a reading page's margin lies in public/atlas/library/, and its shape
 *  (docs/LIBRARY_PLAN.md §4.8). A page has a small index, `<unit>.json`, and its
 *  notes cut into chunks under the budget, `<unit>-<n>.json`, which the reading
 *  room fetches as the reader moves. Safe for the client: no data, no Node. */

export const marginBase = (work: string, unit: string) => `/atlas/library/${work}/${unit}`;
export const marginIndexUrl = (base: string) => `${base}.json`;
export const marginChunkUrl = (base: string, chunk: number) => `${base}-${chunk}.json`;

export interface MarginBlock extends BlockMargin {
  /** Loom works for the block's stories, at most three. */
  works?: string[];
  /** topic → the claims (by their place in the quarrel) whose passage is this block */
  here?: Record<string, number[]>;
}

/** A quarrel in the margin: its title and its claims in their tellers' order. */
export type MarginQuarrel = [title: string, claims: [who: string, claim: string, citation: string][]];

/** What a chunk's notes point at, for its own blocks only. */
export interface MarginTables {
  who: Record<string, [name: string, type: CharacterType]>;
  stories: Record<string, [title: string, accent: string]>;
  topics: Record<string, MarginQuarrel>;
  relations: Record<string, [from: string, to: string, type: string, sources: string[]]>;
  works: Record<string, [title: string, artist: string, year: string, thumb: string]>;
}

/** `<unit>.json`: the facts resting on each block, the chunk that holds its notes,
 *  and the stories told across the whole page. */
export interface MarginIndex {
  facts: Record<string, number>;
  chunk: Record<string, number>;
  chunks: number;
  across: { facts: number; stories: Record<string, [title: string, accent: string]> };
}

/** `<unit>-<n>.json`: the notes of a run of blocks. */
export interface MarginChunk extends MarginTables {
  blocks: Record<string, MarginBlock>;
}
