'use client';

import { usePathname } from 'next/navigation';
import type { Source } from '@/types/character';
import type { SearchableCharacter } from '@/features/search/match';
import { AtlasOverlays } from './AtlasOverlays';
import { useAtlasSearchHotkey } from './useAtlasSearchHotkey';

/** Mounts the shared search (⌘K) + settings overlays — and the ⌘K hotkey —
 *  on every page that does not bring its own set, so the AtlasBar's buttons
 *  work everywhere. The galaxy, the Lands map, the Myths spindle and the
 *  city skies mount their own surface-specific overlays (and bind the hotkey
 *  themselves, which toggles — hence the strict either/or here). */
const HAS_OWN_OVERLAYS = [/^\/$/, /^\/areas/, /^\/stories$/, /^\/city\/[^/]+\/sky/];

export function GlobalOverlays({
  characters,
  sources,
}: {
  characters: SearchableCharacter[];
  sources: Source[];
}) {
  const pathname = usePathname();
  if (HAS_OWN_OVERLAYS.some((pattern) => pattern.test(pathname))) return null;
  return <MountedOverlays characters={characters} sources={sources} />;
}

function MountedOverlays({
  characters,
  sources,
}: {
  characters: SearchableCharacter[];
  sources: Source[];
}) {
  useAtlasSearchHotkey();
  return <AtlasOverlays characters={characters} sources={sources} />;
}
