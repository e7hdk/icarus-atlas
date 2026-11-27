'use client';

import { usePathname } from 'next/navigation';
import { DEDICATIONS } from '@/features/galaxy/dedication';
import type { Source } from '@/types/character';
import { AtlasOverlays } from './AtlasOverlays';
import { useAtlasSearchHotkey } from './useAtlasSearchHotkey';

/** Mounts the shared search (⌘K) + settings overlays — and the ⌘K hotkey —
 *  on every page that does not bring its own set, so the AtlasBar's buttons
 *  work everywhere. The galaxy, the Lands map, the Myths spindle and the
 *  city skies mount their own surface-specific overlays (and bind the hotkey
 *  themselves, which toggles — hence the strict either/or here). So does the
 *  Art door, except its plain list page. */
const HAS_OWN_OVERLAYS = [/^\/$/, /^\/areas/, /^\/stories$/, /^\/city\/[^/]+\/sky/, /^\/art(\/(?!list$)[^/]+)?$/];
/** A dedicated star's door is a stage: no search opens over it. */
const STAGES = Object.values(DEDICATIONS).flatMap((dedication) => dedication.door?.route ?? []);

export function GlobalOverlays({ sources, starCount }: { sources: Source[]; starCount: number }) {
  const pathname = usePathname();
  if (HAS_OWN_OVERLAYS.some((pattern) => pattern.test(pathname)) || STAGES.includes(pathname)) return null;
  return <MountedOverlays sources={sources} starCount={starCount} />;
}

function MountedOverlays({ sources, starCount }: { sources: Source[]; starCount: number }) {
  useAtlasSearchHotkey();
  return <AtlasOverlays sources={sources} starCount={starCount} />;
}
