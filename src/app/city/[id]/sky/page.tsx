import { notFound } from 'next/navigation';
import { CityShell } from '@/components/city/CityShell';
import { CitySkyView } from '@/components/city/CitySkyView';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { loadAtlasData } from '@/features/characters/load';
import {
  filterCityResidents,
  filterInternalRelations,
  countCityResidents,
} from '@/features/geo/residents';
import { loadCities, loadRegions } from '@/features/geo/load';

export async function generateStaticParams() {
  const cities = await loadCities();
  return cities.map((city) => ({ id: city.id }));
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const cities = await loadCities();
  const city = cities.find((c) => c.id === id);
  return {
    title: city ? `The sky over ${city.name} — Icarus Atlas` : 'City sky — Icarus Atlas',
  };
}

export default async function CitySkyPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [cities, regions, atlas] = await Promise.all([
    loadCities(),
    loadRegions(),
    loadAtlasData(),
  ]);
  const city = cities.find((c) => c.id === id);
  if (!city) notFound();

  const region = city.region ? regions.find((r) => r.id === city.region) : undefined;
  const parentRegion = region?.parent ? regions.find((r) => r.id === region.parent) : undefined;
  const residentCount = countCityResidents(atlas.characters, city.id);
  const citySummaries = cities.map(({ id: cityId, name, greekName }) => ({
    id: cityId,
    name,
    greekName,
  }));

  if (residentCount === 0) {
    return (
      <CityShell
        city={city}
        region={region}
        parentRegion={parentRegion}
        active="sky"
        residentCount={0}
      >
        <section className="mt-12">
          <GlassPanel className="mx-auto max-w-md bg-glass-heavy px-8 py-10 text-center shadow-[0_24px_80px_rgba(5,2,15,0.85),0_0_48px_rgba(124,77,255,0.16)]">
            <p className="font-display text-[11px] uppercase tracking-[0.28em] text-aether-faint">
              The sky over
            </p>
            <p className="mt-5 font-body text-[17px] leading-relaxed italic text-aether-muted">
              No figures are linked to this city yet. The atlas grows one residence at a time.
            </p>
          </GlassPanel>
        </section>
      </CityShell>
    );
  }

  const residents = filterCityResidents(atlas.characters, city.id);
  const relations = filterInternalRelations(residents, atlas.relations);

  return (
    <CitySkyView
      city={city}
      residentCount={residentCount}
      characters={residents}
      relations={relations}
      sources={atlas.sources}
      cities={citySummaries}
    />
  );
}
