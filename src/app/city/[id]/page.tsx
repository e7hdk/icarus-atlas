import { notFound } from 'next/navigation';
import { ReignRulerLinks } from '@/components/city/ReignRulerLinks';
import { CityShell } from '@/components/city/CityShell';
import { buildCharacterIndex, loadAtlasData } from '@/features/characters/load';
import { loadCities, loadLineage, loadRegions } from '@/features/geo/load';
import { countCityResidents } from '@/features/geo/residents';

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
  const [cities, regions, { characters }] = await Promise.all([
    loadCities(),
    loadRegions(),
    loadAtlasData(),
  ]);
  const city = cities.find((c) => c.id === id);
  if (!city) notFound();

  const characterIndex = buildCharacterIndex(characters);
  const lineage = await loadLineage(city.id);
  const region = city.region ? regions.find((r) => r.id === city.region) : undefined;
  const parentRegion = region?.parent ? regions.find((r) => r.id === region.parent) : undefined;
  const residentCount = countCityResidents(characters, city.id);

  return (
    <CityShell
      city={city}
      region={region}
      parentRegion={parentRegion}
      active="lineage"
      residentCount={residentCount}
    >
      <section className="mt-10">
        <h2 className="text-center font-display text-[12px] uppercase tracking-[0.3em] text-aether-faint">
          Royal succession
        </h2>
        {lineage ? (
          <ol className="relative mx-auto mt-8 max-w-2xl">
            <span
              className="absolute bottom-2 left-[15px] top-2 w-px bg-gradient-to-b from-nebula-soft/50 via-glass-border to-transparent"
              aria-hidden
            />
            {lineage.reigns.map((reign, index) => (
              <li key={`${reign.ruler}-${index}`} className="relative flex gap-5 pb-8 last:pb-0">
                <span
                  className="z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-glass-border bg-cosmos-raised font-display text-[11px] text-aether-muted"
                  style={{ boxShadow: '0 0 12px rgb(124 77 255 / 0.35)' }}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 pt-1" title={reign.citation}>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <ReignRulerLinks
                      reign={reign}
                      characterIndex={characterIndex}
                      className="font-display text-xl tracking-[0.08em]"
                    />
                    {reign.topic && (
                      <span
                        className="text-sm text-nebula-soft"
                        title="The sources disagree about this reign."
                        aria-label="Disputed reign"
                      >
                        ⚖
                      </span>
                    )}
                  </div>
                  {reign.note && (
                    <p className="mt-1 font-body text-[16px] leading-relaxed text-aether-muted">
                      {reign.note}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-8 text-center font-body text-lg italic text-aether-faint">
            The royal line of {city.name} is still being researched — the atlas grows one throne
            at a time.
          </p>
        )}
      </section>

      <p className="mt-16 text-center font-body text-[12px] italic text-aether-faint">
        Coordinates: Pleiades gazetteer, CC BY · place {city.pleiadesId}
      </p>
    </CityShell>
  );
}
