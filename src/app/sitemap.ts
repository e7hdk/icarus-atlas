import type { MetadataRoute } from 'next';
import { loadArtCatalogue } from '@/features/art/load';
import { loadCharacterIds } from '@/features/characters/load';
import { loadCities } from '@/features/geo/load';
import { unitHref, workHref } from '@/features/library/links';
import { libraryWorks, loadLibraryText } from '@/features/library/load';
import { TELLER_ORDER, quarrelHref } from '@/features/library/paths';
import { QUARRELS } from '@/features/library/quarrels';
import { loadSky } from '@/features/sky/load';
import { loadStories } from '@/features/stories/load';

/** The atlas's sitemap (docs/LIBRARY_PLAN.md §9): every prerendered page, listed
 *  from the same loaders the routes build their pages from. A static export writes
 *  it once, at build. */
export const dynamic = 'force-static';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://icarusatlas.app').replace(/\/$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [characters, stories, cities, sky, { works: art }] = await Promise.all([loadCharacterIds(), loadStories(), loadCities(), loadSky(), loadArtCatalogue()]);
  const books = await Promise.all(
    libraryWorks()
      .filter((work) => work.units === 'books')
      .map(async (work) => (await loadLibraryText(work.id)).units.map((unit) => unitHref(work, unit.id))),
  );
  const paths = [
    '/',
    '/areas',
    '/stories',
    '/art',
    '/art/list',
    '/library',
    '/library/quarrels',
    '/theogony',
    '/sky',
    '/odyssey',
    '/festivals',
    ...characters.flatMap((id) => [`/character/${id}`, `/character/${id}/info`, `/character/${id}/legacy`]),
    ...stories.map((story) => `/story/${story.id}`),
    ...cities.flatMap((city) => [`/city/${city.id}`, `/city/${city.id}/sky`]),
    ...sky.constellations.map((figure) => `/constellation/${figure.id}`),
    ...art.map((work) => `/art/${work.id}`),
    ...TELLER_ORDER.map((teller) => `/library/${teller}`),
    ...libraryWorks().map((work) => workHref(work)),
    ...books.flat(),
    ...QUARRELS.map((quarrel) => quarrelHref(quarrel.topic)),
  ];
  return paths.map((path) => ({ url: `${SITE}${path === '/' ? '' : path}` }));
}
