import { loadBasemap, loadCities, loadLineage, loadRegions } from '@/features/geo/load';
import { MapView } from '@/components/map/MapView';
import { MainNav } from '@/components/hud/MainNav';
import type { Lineage } from '@/types/geo';

export const metadata = {
  title: 'Areas — Icarus Atlas',
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
      <header className="pointer-events-none z-20 flex items-center justify-between px-6 py-4">
        <MainNav active="areas" />
        <div className="text-center">
          <h1 className="font-display text-lg tracking-[0.38em] text-aether">AREAS</h1>
          <p className="font-body text-sm italic text-aether-muted">
            The mortal geography beneath the myths
          </p>
        </div>
        <span className="font-display text-sm tracking-[0.38em] text-aether-faint">
          ICARUS <span className="text-star-olympian">ATLAS</span>
        </span>
      </header>
      <div className="min-h-0 flex-1">
        <MapView basemap={basemap} regions={regions} cities={cities} lineages={lineages} />
      </div>
    </div>
  );
}
