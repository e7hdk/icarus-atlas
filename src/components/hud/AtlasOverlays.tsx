'use client';

import type { Source } from '@/types/character';
import { SearchOverlay } from '@/components/hud/SearchOverlay';
import { SettingsPanel } from '@/components/hud/SettingsPanel';
import { useGalaxyStore } from '@/features/galaxy/store';
import { useSearchIndex } from '@/features/search/useSearchIndex';

/** The search and settings modals for every page without its own overlay set
 *  (mounted globally via GlobalOverlays). The galaxy, the Lands map and the
 *  Myths spindle mount their own copies; here search opens the codex rather
 *  than flying a camera that does not exist. */
export function AtlasOverlays({ sources, starCount }: { sources: Source[]; starCount: number }) {
  const searchOpen = useGalaxyStore((s) => s.searchOpen);
  const characters = useSearchIndex(searchOpen);
  return (
    <>
      <SearchOverlay characters={characters} navigate />
      <SettingsPanel sources={sources} starCount={starCount} />
    </>
  );
}
