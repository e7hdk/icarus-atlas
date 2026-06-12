import { loadBasemap, loadCities, loadLineage, loadRegions } from '@/features/geo/load';
import { MapView } from '@/components/map/MapView';
import { MainNav } from '@/components/hud/MainNav';
import { IcarusBrand } from '@/components/ui/IcarusBrand';
import type { Lineage } from '@/types/geo';

export const metadata = {
  title: 'Lands — Icarus Atlas',
  description: 'The regions and ancient cities of the Greek world, as an interactive map.',
};

export default async function AreasPage() {
  const [basemap, regions, cities] = await Promise.all([
    loadBasemap(),
    loadRegions(),
    loadCities(),
  ]);
  const lineages: Record<string, Lineage | null> = Object.fromEntries(
    await Promise.all(cities.map(async (city) => [city.id, await loadLineage(city.id)])),
  );

  return (
    <div className="fixed inset-0 flex flex-col">
      <header className="pointer-events-none relative z-20 flex min-h-[68px] items-center px-6 py-4">
        <IcarusBrand />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <MainNav active="areas" />
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <MapView basemap={basemap} regions={regions} cities={cities} lineages={lineages} />
      </div>
    </div>
  );
}
