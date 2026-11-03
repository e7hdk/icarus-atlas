'use client';

import { useEffect, useState } from 'react';
import { ATLAS_FILES } from '@/features/atlas/files';
import { loadAtlasFile } from '@/features/atlas/useAtlasFile';
import type { SearchableCharacter } from './match';

/** How long the index may wait for an idle moment before loading anyway. */
const IDLE_TIMEOUT_MS = 3000;

function whenIdle(run: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(run, IDLE_TIMEOUT_MS);
  return () => window.clearTimeout(handle);
}

/** The ⌘K index for pages with no star list of their own: null until it lands. It
 *  loads when the browser is idle, so the first ⌘K already has it, or at once when
 *  `wanted`. A failed fetch is forgotten, so the next open asks again. */
export function useSearchIndex(wanted: boolean): SearchableCharacter[] | null {
  const [characters, setCharacters] = useState<SearchableCharacter[] | null>(null);

  useEffect(() => {
    if (characters) return;
    let cancelled = false;
    const load = () => {
      loadAtlasFile<SearchableCharacter[]>(ATLAS_FILES.searchIndex)
        .then((loaded) => {
          if (!cancelled) setCharacters(loaded);
        })
        .catch(() => {});
    };
    const cancelIdle = wanted ? null : whenIdle(load);
    if (wanted) load();
    return () => {
      cancelled = true;
      cancelIdle?.();
    };
  }, [characters, wanted]);

  return characters;
}
