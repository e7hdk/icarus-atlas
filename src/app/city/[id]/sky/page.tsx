import { notFound } from 'next/navigation';
import { CitySkyChrome } from '@/components/city/CitySkyChrome';
import { CitySkyEmpty } from '@/components/city/CitySkyEmpty';
import { GalaxyView } from '@/components/galaxy/GalaxyView';
import { loadAtlasData } from '@/features/characters/load';
import {
  filterCityResidents,
  filterInternalRelations,
} from '@/features/geo/residents';
import { loadCities } from '@/features/geo/load';

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
  const [cities, atlas] = await Promise.all([loadCities(), loadAtlasData()]);
  const city = cities.find((c) => c.id === id);
  if (!city) notFound();

  const residents = filterCityResidents(atlas.characters, city.id);
  const relations = filterInternalRelations(residents, atlas.relations);

  if (residents.length === 0) {
    return (
      <CitySkyEmpty cityId={city.id} cityName={city.name} greekName={city.greekName} />
    );
  }

  return (
    <>
      <GalaxyView
        characters={residents}
        relations={relations}
        sources={atlas.sources}
        layout="compact"
        activeMainTab="areas"
        back={{ href: `/city/${city.id}`, label: `Back to the ${city.name} codex` }}
      />
      <CitySkyChrome
        cityId={city.id}
        cityName={city.name}
        greekName={city.greekName}
        residentCount={residents.length}
      />
    </>
  );
}
