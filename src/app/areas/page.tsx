import { loadCities, loadFeatures, loadLineage, loadPlaces, loadRegions } from '@/features/geo/load';
import { loadAtlasData } from '@/features/characters/load';
import { MapView } from '@/components/map/MapView';
import { MainNav } from '@/components/hud/MainNav';
import { HudActions } from '@/components/hud/HudActions';
import { LandsOverlays } from '@/components/hud/LandsOverlays';
import { IcarusBrand } from '@/components/ui/IcarusBrand';
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

  return (
    <div className="fixed inset-0">
      <MapView regions={regions} cities={cities} places={places} features={features} lineages={lineages} />
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex min-h-[68px] items-center px-4 py-3 sm:px-6 sm:py-4">
        <IcarusBrand />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <MainNav active="areas" />
        </div>
        <HudActions mapLayers />
      </header>
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
