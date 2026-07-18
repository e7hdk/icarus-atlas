import { notFound } from 'next/navigation';
import { loadStories, loadStoryCulture, loadVoyage } from '@/features/stories/load';
import { loadAtlasData } from '@/features/characters/load';
import { getBakedLinkedProse, getStoryProseSegments } from '@/features/linking/load-baked';
import { buildLinkingContext } from '@/features/linking/name-index';
import { loadCities } from '@/features/geo/load';
import { StoryProse } from '@/components/stories/StoryProse';
import {
  VoyageView,
  type VoyageViewMovement,
  type VoyageViewStation,
} from '@/components/voyage/VoyageView';
import type { CultureData, SourceId } from '@/types/character';

/** Nostos — the Odyssey experience (docs/NOSTOS_PLAN.md). A presentation layer
 *  over the existing sourced story tree: chapters render from the episodes,
 *  epigraphs are verbatim corpus quotations, and every screen opens a door
 *  deeper into the atlas. */

export const metadata = {
  title: 'The Odyssey — A Voyage Home | Icarus Atlas',
  description:
    "Homer's Odyssey told as a constellation being drawn across a star-sea: three movements, twenty stations, the poem's own words in Greek and English — and every figure a star in the atlas.",
  openGraph: {
    title: 'The Odyssey — A Voyage Home',
    description:
      "Homer's Odyssey as a star-sea voyage: twenty stations, the poem's own words, twenty-five centuries of art — every figure a star.",
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Odyssey — A Voyage Home | Icarus Atlas',
    description:
      "Homer's Odyssey as a star-sea voyage: twenty stations, the poem's own words, twenty-five centuries of art.",
  },
};

const ROMAN: Record<1 | 2 | 3, string> = { 1: 'I', 2: 'II', 3: 'III' };
const STATION_CAST_CLAMP = 6;
const FINALE_CAST_CLAMP = 14;

export default async function OdysseyVoyagePage() {
  const voyage = await loadVoyage('odyssey');
  if (!voyage) notFound();

  const [stories, atlas, cities] = await Promise.all([loadStories(), loadAtlasData(), loadCities()]);
  const bakedProse = getBakedLinkedProse();
  const storiesById = new Map(stories.map((story) => [story.id, story]));
  const sourceNames = new Map(atlas.sources.map((source) => [source.id, source.name]));
  const characterById = new Map(atlas.characters.map((character) => [character.id, character]));
  const cityById = new Map(cities.map((city) => [city.id, city]));
  const linkingContext = buildLinkingContext(atlas.characters);

  const cultureIds = [
    ...new Set(voyage.stations.flatMap((station) => (station.art ?? []).map((pick) => pick.culture))),
  ];
  const cultures = new Map<string, CultureData | null>(
    await Promise.all(
      cultureIds.map(
        async (id): Promise<[string, CultureData | null]> => [id, await loadStoryCulture(id)],
      ),
    ),
  );

  const footnote = (sources: SourceId[], citation?: string) =>
    `${sources.map((sourceId) => sourceNames.get(sourceId) ?? sourceId).join(' · ')}${
      citation ? ` — ${citation}` : ''
    }`;

  const firstToldId = voyage.stations.find((station) => station.told)?.id;
  const stations: VoyageViewStation[] = voyage.stations.map((station) => {
    const episode = storiesById.get(station.episode);
    if (!episode) notFound();
    const segments = bakedProse ? getStoryProseSegments(bakedProse, episode.id) : undefined;
    const scopeIds = episode.cast.flatMap((member) => (member.id ? [member.id] : []));
    const chapterIndexes = station.chapterIndexes ?? episode.chapters.map((_, index) => index);

    const art = (station.art ?? []).flatMap((pick) => {
      const culture = cultures.get(pick.culture);
      if (!culture) return [];
      const wanted = new Set(pick.titles);
      return [...culture.artworks, ...(culture.artifacts ?? [])]
        .filter((item) => wanted.has(item.title))
        .map((item) => ({
          title: item.title,
          artist: 'artist' in item ? item.artist : item.museum,
          year: 'year' in item ? item.year : item.period,
          imageUrl: item.imageUrl,
          description: item.description,
        }));
    });

    const linkedCast = episode.cast.filter((member) => member.id && characterById.has(member.id));
    const city = station.place ? cityById.get(station.place) : undefined;
    const showToldRubric = Boolean(station.told) && station.id === firstToldId;

    return {
      id: station.id,
      movement: station.movement,
      title: station.title,
      kicker: station.kicker,
      told: station.told,
      pinned: station.pinned,
      mood: station.mood,
      showToldRubric,
      epigraph: station.epigraph,
      chapters: chapterIndexes.map((index) => {
        const chapter = episode.chapters[index];
        return {
          title: chapter.title,
          disputed: Boolean(chapter.topic),
          citeline: footnote(chapter.sources, chapter.citation),
          prose: (
            <StoryProse
              key={`${episode.id}-${index}`}
              text={chapter.text}
              segments={segments?.chapters[index]}
              linkingContext={linkingContext}
              scopeIds={scopeIds}
            />
          ),
        };
      }),
      art,
      cast: linkedCast.slice(0, STATION_CAST_CLAMP).map((member) => ({
        name: member.name,
        id: member.id,
        linked: true,
      })),
      castMore: Math.max(episode.cast.length - STATION_CAST_CLAMP, 0),
      episodeId: episode.id,
      episodeTitle: episode.title,
      place: city ? { id: city.id, name: city.name } : undefined,
    };
  });

  const movements: VoyageViewMovement[] = voyage.movements.map((movement) => ({
    n: movement.n,
    roman: ROMAN[movement.n],
    title: movement.title,
    books: movement.books,
  }));

  const rootStory = storiesById.get(voyage.story);
  const finaleCast = (rootStory?.cast ?? [])
    .filter((member) => member.id && characterById.has(member.id))
    .slice(0, FINALE_CAST_CLAMP)
    .map((member) => ({ name: member.name, id: member.id, linked: true }));

  return (
    <main className="min-h-screen pt-14">
      <VoyageView
        movements={movements}
        stations={stations}
        finaleEpigraph={voyage.finale?.epigraph}
        finaleCast={finaleCast}
      />
    </main>
  );
}
