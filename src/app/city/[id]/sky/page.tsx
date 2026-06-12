import { notFound } from 'next/navigation';
import { loadAtlasData } from '@/features/characters/load';
import { loadCities } from '@/features/geo/load';
import { GalaxyView } from '@/components/galaxy/GalaxyView';
import { CitySkyChrome } from '@/components/city/CitySkyChrome';

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

  // The same galaxy, narrowed to this city's residents and the bonds among them.
  const residents = atlas.characters.filter((character) =>
    character.residences?.some((residence) => residence.city === city.id),
  );
  const residentIds = new Set(residents.map((character) => character.id));
  const relations = atlas.relations.filter(
    (relation) => residentIds.has(relation.from) && residentIds.has(relation.to),
  );

  return (
    <>
      <GalaxyView
        characters={residents}
        relations={relations}
        sources={atlas.sources}
        layout="compact"
      />
      <CitySkyChrome cityId={city.id} cityName={city.name} />
    </>
  );
}
