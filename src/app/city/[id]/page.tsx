import { notFound } from 'next/navigation';
import { ReignRulerLinks } from '@/components/city/ReignRulerLinks';
import { CityTheatre, type SealResident, type TheatreReign } from '@/components/city/CityTheatre';
import { CityGates, type GateMyth } from '@/components/city/CityGates';
import { CityTabNav } from '@/components/city/CityTabNav';
import { CrumbBar } from '@/components/hud/CrumbBar';
import { buildCharacterIndex, loadAtlasData } from '@/features/characters/load';
import { loadCities, loadLineage, loadRegions } from '@/features/geo/load';
import { countCityResidents } from '@/features/geo/residents';
import { loadStories } from '@/features/stories/load';
import type { CharacterType, SourceId } from '@/types/character';

/** Seal ordering: the brightest orders of the sky first, then the mortal roll. */
const SEAL_TYPE_ORDER: CharacterType[] = [
  'olympian',
  'god',
  'titan',
  'primordial',
  'hero',
  'nymph',
  'creature',
  'mortal',
];
const SEAL_CAP = 28;

export async function generateStaticParams() {
  const cities = await loadCities();
  return cities.map((city) => ({ id: city.id }));
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const cities = await loadCities();
  const city = cities.find((c) => c.id === id);
  return {
    title: city ? `${city.name} — Icarus Atlas` : 'City — Icarus Atlas',
    description: city
      ? `The royal succession and stories of ${city.name} (${city.greekName}).`
      : undefined,
  };
}

export default async function CityPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [cities, regions, { characters, sources }, stories] = await Promise.all([
    loadCities(),
    loadRegions(),
    loadAtlasData(),
    loadStories(),
  ]);
  const city = cities.find((c) => c.id === id);
  if (!city) notFound();

  const characterIndex = buildCharacterIndex(characters);
  const lineage = await loadLineage(city.id);
  const region = city.region ? regions.find((r) => r.id === city.region) : undefined;
  const parentRegion = region?.parent ? regions.find((r) => r.id === region.parent) : undefined;
  const regionLabel = region
    ? `${region.name}${parentRegion ? ` — ${parentRegion.name}` : ''}`
    : undefined;
  const residentCount = countCityResidents(characters, city.id);

  /** Her sky in miniature: real dwellers, brightest orders first. */
  const sealResidents: SealResident[] = characters
    .filter((character) => character.residences?.some((residence) => residence.city === city.id))
    .map(({ id: characterId, name, type }) => ({ id: characterId, name, type }))
    .sort(
      (a, b) =>
        SEAL_TYPE_ORDER.indexOf(a.type) - SEAL_TYPE_ORDER.indexOf(b.type) ||
        a.name.localeCompare(b.name),
    )
    .slice(0, SEAL_CAP);

  const sourceNames = new Map<SourceId, string>(sources.map((source) => [source.id, source.name]));
  const reigns: TheatreReign[] = (lineage?.reigns ?? []).map((reign) => ({
    label: reign.ruler,
    title: <ReignRulerLinks reign={reign} characterIndex={characterIndex} />,
    note: reign.note,
    footnote: `${reign.sources.map((sourceId) => sourceNames.get(sourceId) ?? sourceId).join(' · ')}${
      reign.citation ? ` — ${reign.citation}` : ''
    }`,
    disputed: Boolean(reign.topic),
  }));

  /** The tales whose places include this city, in mythic order. */
  const myths: GateMyth[] = stories
    .filter((story) => story.places.some((place) => place.id === city.id))
    .map((story) => ({
      id: story.id,
      title: story.title,
      role: story.places.find((place) => place.id === city.id)?.role,
    }));

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 pb-24 pt-20">
      <CrumbBar
        back={{ href: '/areas', label: 'Back to the lands' }}
        trail={[{ href: '/areas', label: 'Lands' }]}
        current={city.name}
      />

      <CityTabNav cityId={city.id} active="lineage" residentCount={residentCount} className="mt-4" />

      <CityTheatre
        city={{
          id: city.id,
          name: city.name,
          greekName: city.greekName,
          pleiadesId: city.pleiadesId,
        }}
        regionLabel={regionLabel}
        residentCount={residentCount}
        sealResidents={sealResidents}
        reigns={reigns}
      />

      <CityGates
        cityId={city.id}
        residentCount={residentCount}
        myths={myths}
        regionLabel={regionLabel}
      />

      <p className="mt-14 text-center font-body text-[12px] italic text-aether-faint">
        Coordinates: Pleiades gazetteer, CC BY · place {city.pleiadesId}
      </p>
    </main>
  );
}
