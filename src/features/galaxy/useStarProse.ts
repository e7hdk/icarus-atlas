'use client';

import { starFile } from '@/features/atlas/files';
import { useAtlasFile } from '@/features/atlas/useAtlasFile';
import type { ProseSegment } from '@/features/linking/parse-prose';
import type { SourcedText } from '@/types/character';

/** A sourced passage with its names already linked (pnpm bake-linked-prose). */
export interface LinkedText extends SourcedText {
  segments: ProseSegment[];
}

export interface StarProse {
  summary: LinkedText[];
  story: LinkedText[];
}

/** The prose of the star being read, or null while it is on its way. Hovering a star
 *  costs one small file, once; the sky itself never carries the text. */
export function useStarProse(id: string | null | undefined): { prose: StarProse | null; failed: boolean } {
  const { data, failed } = useAtlasFile<StarProse>(id ? starFile(id) : null);
  return { prose: data, failed };
}
