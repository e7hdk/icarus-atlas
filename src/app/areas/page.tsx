import { loadCities, loadFeatures, loadLineage, loadPlaces, loadRegions } from '@/features/geo/load';
import { buildCharacterIndex, loadAtlasData } from '@/features/characters/load';
import { MapView } from '@/components/map/MapView';
import { LandsOverlays } from '@/components/hud/LandsOverlays';
import type { Lineage } from '@/types/geo';

export const metadata = {
  title: 'Lands — Icarus Atlas',
  description: 'The regions and ancient cities of the Greek world, as an interactive map.',
};

export default async function AreasPage() {
  const [regions, cities, places, features, atlas] = await Promise.all([
    loadRegions(),
    loadCities(),
    loadPlaces(),
    loadFeatures(),
    loadAtlasData(),
  ]);
  const lineages: Record<string, Lineage | null> = Object.fromEntries(
    await Promise.all(cities.map(async (city) => [city.id, await loadLineage(city.id)])),
  );

  const characterIndex = buildCharacterIndex(atlas.characters);

  return (
    <div className="fixed inset-0">
      <MapView
        regions={regions}
        cities={cities}
        places={places}
        features={features}
        lineages={lineages}
        characterIndex={characterIndex}
      />
      <LandsOverlays
        cities={cities}
        places={places}
        features={features}
        sources={atlas.sources}
        starCount={atlas.characters.length}
      />
    </div>
  );
}
