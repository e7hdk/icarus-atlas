'use client';

import type { Character, Source } from '@/types/character';
import { SearchOverlay } from '@/components/hud/SearchOverlay';
import { SettingsPanel } from '@/components/hud/SettingsPanel';

/** The search and settings modals for the 2D pages (Lands, Myths). The galaxy
 *  mounts its own copies inside GalaxyView; here search opens the codex rather
 *  than flying a camera that does not exist. */
export function AtlasOverlays({
  characters,
  sources,
}: {
  characters: Character[];
  sources: Source[];
}) {
  return (
    <>
      <SearchOverlay characters={characters} navigate />
      <SettingsPanel sources={sources} />
    </>
  );
}
