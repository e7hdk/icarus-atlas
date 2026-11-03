'use client';

import { DoorUnavailable } from '@/components/ui/DoorUnavailable';
import { LandsOverlays } from '@/components/hud/LandsOverlays';
import { ATLAS_FILES } from '@/features/atlas/files';
import { useAtlasFile } from '@/features/atlas/useAtlasFile';
import type { CharacterIndex } from '@/features/characters/character-index';
import type { Source } from '@/types/character';
import type { GeoCity, GeoFeature, GeoPlace, GeoRegion, Lineage } from '@/types/geo';
import { MapView } from './MapView';

export interface LandsData {
  regions: GeoRegion[];
  cities: GeoCity[];
  places: GeoPlace[];
  features: GeoFeature[];
  lineages: Record<string, Lineage | null>;
  characterIndex: CharacterIndex;
}

/** The Lands door: the map's data is one baked file, preloaded by the page. */
export function LandsDoor({ sources, starCount }: { sources: Source[]; starCount: number }) {
  const { data, failed } = useAtlasFile<LandsData>(ATLAS_FILES.lands);
  if (failed) return <DoorUnavailable what="The map" />;
  if (!data) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="font-body text-sm italic text-aether-muted">Charting the basin…</p>
      </div>
    );
  }
  return (
    <>
      <MapView
        regions={data.regions}
        cities={data.cities}
        places={data.places}
        features={data.features}
        lineages={data.lineages}
        characterIndex={data.characterIndex}
      />
      <LandsOverlays
        cities={data.cities}
        places={data.places}
        features={data.features}
        sources={sources}
        starCount={starCount}
      />
    </>
  );
}
