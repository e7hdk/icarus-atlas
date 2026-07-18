/** Server-side assembly of the Ephemeris (docs/EPHEMERIS_PLAN.md §3).
 *  Like the rest of the loaders this reads the filesystem — import it only
 *  from server components, route handlers and scripts. The client receives
 *  the date-independent `EphemerisData` and derives "today" itself, so a
 *  stale static build can never bake yesterday into the page. */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { loadAtlasData, loadCulture } from '@/features/characters/load';
import { bondsFor } from '@/features/characters/relations';
import { loadPlaces } from '@/features/geo/load';
import { loadStories } from '@/features/stories/load';
import { storiesFeaturingCharacter } from '@/features/stories/appearances';
import { isDisputed } from '@/lib/lens';
import {
  festivalSchema,
  sacredDaysSchema,
  spotlightOverridesSchema,
  spotlightWeeksSchema,
} from '@/lib/schemas';
import { buildRoster } from './eligibility';
import { WEEK_MIN_CAST } from './weeks';
import type { Character, Relation, SourceId, SourcedText } from '@/types/character';
import type { Story } from '@/types/story';
import type {
  AtticCalendar,
  EphemerisCardPayload,
  EphemerisCuratedWeek,
  EphemerisData,
  EphemerisFestival,
  EphemerisRosterEntry,
  EphemerisWeekSaga,
  Festival,
  ProemBond,
  ProemQuarrelVariant,
  SacredDay,
  SpotlightOverrides,
  WeekDayKey,
} from '@/types/spotlight';

const DATA_DIR = path.join(process.cwd(), 'data');

async function loadSpotlightOverrides(): Promise<SpotlightOverrides> {
  const raw = JSON.parse(
    await readFile(path.join(DATA_DIR, 'spotlight', 'spotlight.json'), 'utf-8'),
  );
  return spotlightOverridesSchema.parse(raw) as SpotlightOverrides;
}

/** Culture ids that count as a spotlight signal: at least one shelf must be
 *  non-empty. An "honest empty Legacy" (the M2.20 abstractions) documents the
 *  absence of reception — it is not curation of presence, so it does not admit
 *  a figure into the daily pool. */
async function loadCuratedCultureIds(): Promise<Set<string>> {
  const dir = path.join(DATA_DIR, 'culture');
  let files: string[];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  } catch {
    return new Set();
  }
  const ids: (string | null)[] = [];
  const batchSize = 64; // bounded fan-out — see readJsonDir in characters/load.ts
  for (let start = 0; start < files.length; start += batchSize) {
    ids.push(
      ...(await Promise.all(
        files.slice(start, start + batchSize).map(async (file) => {
          const culture = JSON.parse(await readFile(path.join(dir, file), 'utf-8')) as {
            id: string;
            artworks?: unknown[];
            artifacts?: unknown[];
            films?: unknown[];
            music?: unknown[];
            popCulture?: unknown[];
          };
          const shelves = [culture.artworks, culture.artifacts, culture.films, culture.music, culture.popCulture];
          return shelves.some((shelf) => (shelf?.length ?? 0) > 0) ? culture.id : null;
        }),
      )),
    );
  }
  return new Set(ids.filter((id): id is string => id !== null));
}

interface SpotlightWeekFile {
  isoWeek: string;
  story: string;
  title?: string;
  days?: Partial<Record<WeekDayKey, string>>;
}

async function loadSpotlightWeeks(): Promise<SpotlightWeekFile[]> {
  try {
    const raw = JSON.parse(
      await readFile(path.join(DATA_DIR, 'spotlight', 'weeks.json'), 'utf-8'),
    );
    return spotlightWeeksSchema.parse(raw) as SpotlightWeekFile[];
  } catch {
    return [];
  }
}

/** The baked reconstructed calendar; null (graceful degradation to the
 *  conventional resolver) when the table has not been generated. */
async function loadAtticCalendar(): Promise<AtticCalendar | null> {
  try {
    const raw = JSON.parse(
      await readFile(path.join(DATA_DIR, 'generated', 'attic-calendar.json'), 'utf-8'),
    );
    return raw as AtticCalendar;
  } catch {
    return null;
  }
}

async function loadSacredDays(): Promise<SacredDay[]> {
  try {
    const raw = JSON.parse(await readFile(path.join(DATA_DIR, 'sacred-days.json'), 'utf-8'));
    return sacredDaysSchema.parse(raw) as SacredDay[];
  } catch {
    return [];
  }
}

/** Festival batch files (data/festivals/*.json) — validated per file, sorted
 *  by id so the same-day tie-break stays deterministic. Exported for the
 *  Heortologion page, which reads the full files (testimonia and all). */
export async function loadFestivals(): Promise<Festival[]> {
  const dir = path.join(DATA_DIR, 'festivals');
  let files: string[];
  try {
    files = (await readdir(dir)).filter((file) => file.endsWith('.json'));
  } catch {
    return [];
  }
  const festivals = await Promise.all(
    files.map(async (file) =>
      festivalSchema.parse(JSON.parse(await readFile(path.join(dir, file), 'utf-8'))) as Festival,
    ),
  );
  return festivals.sort((a, b) => a.id.localeCompare(b.id));
}

interface EphemerisContext {
  charactersById: Map<string, Character>;
  relations: Relation[];
  stories: Story[];
  roster: EphemerisRosterEntry[];
  rosterIds: Set<string>;
  sourceNames: Map<SourceId, string>;
  citiesById: Map<string, string>;
  weeks: EphemerisData['weeks'];
  festivals: EphemerisFestival[];
  attic: AtticCalendar | null;
  sacredDays: SacredDay[];
}

async function assembleContext(): Promise<EphemerisContext> {
  const [
    { characters, relations, sources },
    stories,
    cultureIds,
    overrides,
    places,
    weekEntries,
    festivalFiles,
    attic,
    sacredDays,
  ] = await Promise.all([
    loadAtlasData(),
    loadStories(),
    loadCuratedCultureIds(),
    loadSpotlightOverrides(),
    loadPlaces(),
    loadSpotlightWeeks(),
    loadFestivals(),
    loadAtticCalendar(),
    loadSacredDays(),
  ]);
  const roster = buildRoster({ characters, relations, stories, cultureIds, overrides });
  const rosterIds = new Set(roster.map((entry) => entry.id));

  // Weekly themes (docs/EPHEMERIS_PLAN.md D4): loadStories() is era-sorted, so
  // the saga rotation walks mythic time; a saga carries a week only when
  // enough of its cast survives the eligibility gate.
  const eligibleCast = (story: Story) =>
    story.cast
      .map((member) => member.id)
      .filter((id): id is string => Boolean(id && rosterIds.has(id)));
  const sagas: EphemerisWeekSaga[] = stories
    .filter((story) => story.parent === null)
    .map((story) => ({ storyId: story.id, title: story.title, cast: eligibleCast(story) }))
    .filter((saga) => saga.cast.length >= WEEK_MIN_CAST);
  const storiesById = new Map(stories.map((story) => [story.id, story]));
  const curated: EphemerisCuratedWeek[] = weekEntries.flatMap((entry) => {
    const story = storiesById.get(entry.story);
    if (!story) return []; // validate-data reports it; runtime degrades to auto
    return [
      {
        isoWeek: entry.isoWeek,
        storyId: story.id,
        title: entry.title ?? story.title,
        cast: eligibleCast(story),
        days: entry.days,
      },
    ];
  });

  const placesById = new Map(places.map((place) => [place.id, place]));
  const festivals: EphemerisFestival[] = festivalFiles.map((festival) => {
    const place = festival.place ? placesById.get(festival.place) : undefined;
    const aitionStory = festival.aition ? storiesById.get(festival.aition) : undefined;
    return {
      id: festival.id,
      name: festival.name,
      ...(festival.greekName ? { greekName: festival.greekName } : {}),
      summary: festival.summary,
      deities: festival.deities,
      conventionalDates: festival.conventionalDates ?? [],
      atticDate: festival.atticDate.days
        ? { month: festival.atticDate.month, days: festival.atticDate.days }
        : null,
      ...(festival.games ? { gamesCycle: festival.games.cycleYears } : {}),
      place: place
        ? { id: place.id, name: place.name, isCity: place.kind === 'city' }
        : null,
      aition: aitionStory ? { id: aitionStory.id, title: aitionStory.title } : null,
    };
  });

  return {
    charactersById: new Map(characters.map((character) => [character.id, character])),
    relations,
    stories,
    roster,
    rosterIds,
    sourceNames: new Map(sources.map((source) => [source.id, source.name])),
    citiesById: new Map(
      places.filter((place) => place.kind === 'city').map((place) => [place.id, place.name]),
    ),
    weeks: { sagas, curated },
    festivals,
    attic,
    sacredDays,
  };
}

/** Thread-beat bond priority — the relations that tell a life in three lines.
 *  Labels are the directional phrases of features/characters/relations. */
const BOND_LABEL_PRIORITY = [
  'consort of',
  'parent of',
  'child of',
  'slain by',
  'slayer of',
  'lover of',
  'created by',
  'creator of',
  'sibling of',
  'adversary of',
  'ally of',
];

function keyBonds(id: string, context: EphemerisContext): ProemBond[] {
  const ranked = bondsFor(id, context.relations)
    .map((bond) => ({ bond, rank: BOND_LABEL_PRIORITY.indexOf(bond.label) }))
    .filter(({ bond, rank }) => rank >= 0 && context.charactersById.has(bond.otherId));
  const seen = new Set<string>();
  const picked: ProemBond[] = [];
  for (const { bond } of [...ranked].sort((a, b) => a.rank - b.rank)) {
    if (seen.has(bond.otherId)) continue;
    seen.add(bond.otherId);
    picked.push({
      relationId: bond.relationId,
      otherId: bond.otherId,
      otherName: context.charactersById.get(bond.otherId)?.name ?? bond.otherId,
      label: bond.label,
    });
    if (picked.length === 3) break;
  }
  return picked;
}

/** First topic told at least twice in the figure's own prose — the quarrel beat. */
function firstQuarrel(
  character: Character,
  context: EphemerisContext,
): { topic: string; variants: ProemQuarrelVariant[] } | null {
  const byTopic = new Map<string, SourcedText[]>();
  for (const entry of [...character.summary, ...character.story]) {
    if (!entry.topic) continue;
    const bucket = byTopic.get(entry.topic) ?? [];
    bucket.push(entry);
    byTopic.set(entry.topic, bucket);
  }
  for (const [topic, entries] of byTopic) {
    if (entries.length < 2) continue;
    return {
      topic,
      variants: entries.slice(0, 3).map((entry) => ({
        sourceLabel: entry.sources
          .map((source) => context.sourceNames.get(source) ?? source)
          .join(' · '),
        text: entry.text,
      })),
    };
  }
  return null;
}

let contextPromise: Promise<EphemerisContext> | null = null;

/** Memoized in production — the data layer is frozen per deploy, and the 453
 *  static card routes would otherwise re-read the whole atlas each. Dev stays
 *  un-memoized so data edits show up without a server restart. */
function getEphemerisContext(): Promise<EphemerisContext> {
  if (process.env.NODE_ENV !== 'production') return assembleContext();
  contextPromise ??= assembleContext();
  return contextPromise;
}

/** The compact payload RootLayout hands to the client host. */
export async function buildEphemerisData(): Promise<EphemerisData> {
  const context = await getEphemerisContext();
  return {
    roster: context.roster,
    weeks: context.weeks,
    festivals: context.festivals,
    attic: context.attic,
    sacredDays: context.sacredDays,
  };
}

/** Card payload for one eligible star; null when the id is off the roster. */
export async function buildCardPayload(id: string): Promise<EphemerisCardPayload | null> {
  const context = await getEphemerisContext();
  if (!context.rosterIds.has(id)) return null;
  const character = context.charactersById.get(id);
  if (!character) return null;

  const culture = await loadCulture(id);
  const artwork = culture?.artworks[0] ?? null;
  const story = storiesFeaturingCharacter(context.stories, id)[0] ?? null;
  const residence = character.residences?.find((entry) => context.citiesById.has(entry.city));

  return {
    id,
    name: character.name,
    greekName: character.greekName,
    romanName: character.romanName,
    type: character.type,
    kinds: character.kinds,
    domains: character.domains,
    epithets: character.epithets,
    summary: character.summary,
    disputed: isDisputed(character, context.relations),
    bonds: keyBonds(id, context),
    quarrel: firstQuarrel(character, context),
    artwork: artwork
      ? { title: artwork.title, artist: artwork.artist, year: artwork.year, imageUrl: artwork.imageUrl }
      : null,
    storyId: story?.id ?? null,
    storyTitle: story?.title ?? null,
    city: residence
      ? { id: residence.city, name: context.citiesById.get(residence.city) as string }
      : null,
  };
}
