'use client';

import type { Source } from '@/types/character';
import type { GeoCity, GeoFeature, GeoPlace } from '@/types/geo';
import { PlacesSearchOverlay } from '@/components/hud/PlacesSearchOverlay';
import { SettingsPanel } from '@/components/hud/SettingsPanel';
import { useAtlasSearchHotkey } from '@/components/hud/useAtlasSearchHotkey';

/** Search and settings modals for the Lands map — ⌘K opens place search, not the galaxy index. */
export function LandsOverlays({
  cities,
  places,
  features,
  sources,
  starCount,
}: {
  cities: GeoCity[];
  places: GeoPlace[];
  features: GeoFeature[];
  sources: Source[];
  starCount: number;
}) {
  useAtlasSearchHotkey();

  return (
    <>
      <PlacesSearchOverlay cities={cities} places={places} features={features} />
      <SettingsPanel sources={sources} starCount={starCount} />
    </>
  );
}
