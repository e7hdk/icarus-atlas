'use client';

import { useEffect } from 'react';
import type { Character, Relation, Source } from '@/types/character';
import type { GeoCity } from '@/types/geo';
import { GalaxyView, type CitySkyContext } from '@/components/galaxy/GalaxyView';
import { CityTabNav } from '@/components/city/CityTabNav';
import { CitySkyChrome } from '@/components/city/CitySkyChrome';
import { useGalaxyStore } from '@/features/galaxy/store';

/** Full-screen city sky with shared codex tab navigation over the galaxy. */
export function CitySkyView({
  city,
  residentCount,
  characters,
  relations,
  sources,
  cities,
}: {
  city: Pick<GeoCity, 'id' | 'name' | 'greekName'>;
  residentCount: number;
  characters: Character[];
  relations: Relation[];
  sources: Source[];
  cities: Pick<GeoCity, 'id' | 'name' | 'greekName'>[];
}) {
  const select = useGalaxyStore((s) => s.select);
  const cityContext: CitySkyContext = { cityId: city.id, cities };

  useEffect(() => {
    select(null);
  }, [city.id, select]);

  return (
    <>
      <GalaxyView
        characters={characters}
        relations={relations}
        sources={sources}
        layout="compact"
        back={{ href: `/city/${city.id}`, label: `Back to the ${city.name} codex` }}
        cityContext={cityContext}
        cameraIntro
      />
      <div className="pointer-events-none fixed inset-x-0 top-[4.25rem] z-20 flex justify-center px-4 sm:top-[4.5rem]">
        <CityTabNav
          cityId={city.id}
          active="sky"
          residentCount={residentCount}
          className="pointer-events-auto"
        />
      </div>
      <CitySkyChrome
        cityId={city.id}
        cityName={city.name}
        greekName={city.greekName}
        residentCount={residentCount}
      />
    </>
  );
}
