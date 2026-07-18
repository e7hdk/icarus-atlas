'use client';

import type { Source } from '@/types/character';
import type { SearchableCharacter } from '@/features/search/match';
import { SearchOverlay } from '@/components/hud/SearchOverlay';
import { SettingsPanel } from '@/components/hud/SettingsPanel';

/** The search and settings modals for every page without its own overlay set
 *  (mounted globally via GlobalOverlays). The galaxy, the Lands map and the
 *  Myths spindle mount their own copies; here search opens the codex rather
 *  than flying a camera that does not exist. */
export function AtlasOverlays({
  characters,
  sources,
}: {
  characters: SearchableCharacter[];
  sources: Source[];
}) {
  return (
    <>
      <SearchOverlay characters={characters} navigate />
      <SettingsPanel sources={sources} starCount={characters.length} />
    </>
  );
}
