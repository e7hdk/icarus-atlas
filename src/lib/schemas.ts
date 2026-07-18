import { z } from 'zod';
import {
  CHARACTER_TYPES,
  FIGURE_KINDS,
  MAX_FIGURE_KINDS,
  RELATION_TYPES,
  SOURCE_IDS,
} from '@/types/character';
import { ATTIC_MONTHS } from '@/types/spotlight';
import { VOYAGE_MOODS } from '@/types/story';

export const sourceIdSchema = z.enum(SOURCE_IDS);

export const sourcedTextSchema = z.object({
  text: z.string().min(1),
  sources: z.array(sourceIdSchema).min(1),
  citation: z.string().optional(),
  topic: z.string().optional(),
});

export const characterSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case'),
  name: z.string().min(1),
  greekName: z.string().min(1),
  romanName: z.string().optional(),
  type: z.enum(CHARACTER_TYPES),
  kinds: z.array(z.enum(FIGURE_KINDS)).max(MAX_FIGURE_KINDS).optional(),
  domains: z.array(z.string().min(1)).min(1),
  epithets: z.array(z.string().min(1)).optional(),
  summary: z.array(sourcedTextSchema).min(1),
  story: z.array(sourcedTextSchema).min(1),
  cluster: z.string().min(1),
  residences: z
    .array(
      z.object({
        city: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'city must be kebab-case'),
        sources: z.array(sourceIdSchema).min(1),
      }),
    )
    .optional(),
});

export const relationSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case'),
  type: z.enum(RELATION_TYPES),
  from: z.string().min(1),
  to: z.string().min(1),
  sources: z.array(sourceIdSchema).min(1),
  topic: z.string().optional(),
  note: z.string().optional(),
});

export const sourceSchema = z.object({
  id: sourceIdSchema,
  name: z.string().min(1),
  works: z.array(z.string().min(1)).min(1),
  period: z.string().min(1),
  language: z.string().min(1),
  description: z.string().min(1),
});

export const artworkSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  year: z.string().min(1),
  imageUrl: z.string().url(),
  description: z.string().min(1),
});

/** Modern-reception links must be https and one-click verifiable (CULTURE_PLAN §3). */
const httpsUrl = z.string().url().startsWith('https://', 'must be an https URL');

export const artifactSchema = z.object({
  title: z.string().min(1),
  kind: z.enum(['vase', 'sculpture', 'relief', 'mosaic', 'coin', 'fresco', 'other']),
  period: z.string().min(1),
  museum: z.string().min(1),
  imageUrl: httpsUrl,
  description: z.string().min(1),
  externalUrl: httpsUrl.optional(),
});

export const screenWorkSchema = z.object({
  title: z.string().min(1),
  year: z.string().min(1),
  medium: z.enum(['film', 'tv', 'animation']),
  director: z.string().min(1).optional(),
  description: z.string().min(1),
  externalUrl: httpsUrl,
});

export const musicWorkSchema = z.object({
  title: z.string().min(1),
  year: z.string().min(1),
  kind: z.enum(['opera', 'ballet', 'song', 'album', 'orchestral', 'stage']),
  composer: z.string().min(1),
  description: z.string().min(1),
  externalUrl: httpsUrl,
});

export const popCultureItemSchema = z.object({
  title: z.string().min(1),
  year: z.string().min(1),
  kind: z.enum(['videogame', 'comic', 'novel', 'brand', 'language', 'other']),
  creator: z.string().min(1).optional(),
  description: z.string().min(1),
  externalUrl: httpsUrl,
});

/** Legacy shelves are curated, not encyclopedic: hard cap 8 per shelf (CULTURE_PLAN §3).
 *  Only artworks/artifacts may carry imagery — enforced structurally by the shapes above. */
export const cultureSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case'),
  artworks: z.array(artworkSchema),
  artifacts: z.array(artifactSchema).max(8).optional(),
  films: z.array(screenWorkSchema).max(8).optional(),
  music: z.array(musicWorkSchema).max(8).optional(),
  popCulture: z.array(popCultureItemSchema).max(8).optional(),
});

/** Editorial overrides for the Ephemeris spotlight pool (docs/EPHEMERIS_PLAN.md D8).
 *  Pins are always eligible, exclusions never; validate-data forbids overlap. */
export const spotlightOverridesSchema = z.object({
  pins: z.array(z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case')),
  exclusions: z.array(z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case')),
});

const spotlightDaySchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case')
  .optional();

/** A curated Ephemeris week (data/spotlight/weeks.json, docs/EPHEMERIS_PLAN.md D4):
 *  the whole ISO week tells `story`; `days` may pin stars to weekdays. */
export const spotlightWeekSchema = z.object({
  isoWeek: z.string().regex(/^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/, 'isoWeek must be YYYY-Www'),
  story: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'story must be kebab-case'),
  title: z.string().min(1).optional(),
  days: z
    .object({
      mon: spotlightDaySchema,
      tue: spotlightDaySchema,
      wed: spotlightDaySchema,
      thu: spotlightDaySchema,
      fri: spotlightDaySchema,
      sat: spotlightDaySchema,
      sun: spotlightDaySchema,
    })
    .optional(),
});

export const spotlightWeeksSchema = z.array(spotlightWeekSchema);

/** Ancient festivals (data/festivals/*.json, docs/EPHEMERIS_PLAN.md M12.4) —
 *  lens-independent reference data pinned to the Attic calendar. */
const festivalDaySchema = z.number().int().min(1).max(30);

/** Monthly sacred days (data/sacred-days.json) — flavor lines on the
 *  reconstructed calendar, never pick-takeovers. */
export const sacredDaySchema = z.object({
  day: z.number().int().min(1).max(30),
  label: z.string().min(1),
  deities: z
    .array(z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'deity must be kebab-case'))
    .min(1),
  testimonia: z.array(z.string().min(1)).min(1),
});

export const sacredDaysSchema = z.array(sacredDaySchema);

export const festivalSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case'),
  name: z.string().min(1),
  greekName: z.string().min(1).optional(),
  deities: z
    .array(z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'deity must be kebab-case'))
    .min(1),
  place: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'place must be kebab-case').optional(),
  panhellenic: z.boolean().optional(),
  games: z.object({ cycleYears: z.union([z.literal(2), z.literal(4)]) }).optional(),
  atticDate: z.object({
    month: z.enum(ATTIC_MONTHS),
    days: z
      .union([z.tuple([festivalDaySchema]), z.tuple([festivalDaySchema, festivalDaySchema])])
      .optional(),
    approximate: z.boolean().optional(),
  }),
  conventionalDates: z
    .array(z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, 'must be MM-DD'))
    .min(1)
    .optional(),
  aition: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).optional(),
  summary: z.string().min(1),
  testimonia: z.array(z.string().min(1)).min(1),
  furtherReading: z.array(z.string().min(1)).optional(),
});

export const STORY_KINDS = ['cosmogony', 'war', 'catastrophe', 'saga', 'episode'] as const;

export const storySchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case'),
  title: z.string().min(1),
  greekTitle: z.string().optional(),
  kind: z.enum(STORY_KINDS),
  /** Sub-stories nest under a parent story (e.g. Rhesus under the Trojan War). */
  parent: z.string().nullable(),
  /** Rough mythic-chronology sort key (cosmogony 0 … returns 9). Also the
   *  START of the story's world-line on the Spindle of Time. */
  era: z.number(),
  /** Optional END of the world-line (the story spans era → eraEnd on the spindle).
   *  When omitted the spindle derives it: a parent reaches its latest descendant,
   *  a leaf gets a short segment. Must be ≥ era when present. */
  eraEnd: z.number().optional(),
  /** Open-ended myth: the world-line spirals past the spindle's end into the dark. */
  open: z.boolean().optional(),
  /** Parallel sibling layout: children fan from one fork instead of stacking down the tunnel. */
  forkChildren: z.boolean().optional(),
  summary: sourcedTextSchema,
  /** The narrative as sourced beats; competing variants share a `topic`. */
  chapters: z
    .array(
      z.object({
        title: z.string().min(1),
        text: z.string().min(1),
        sources: z.array(sourceIdSchema).min(1),
        citation: z.string().optional(),
        topic: z.string().optional(),
      }),
    )
    .min(1),
  /** Cast; `id` links to a character once promoted, plain names until then. */
  cast: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      role: z.string().min(1),
    }),
  ),
  /** Places; `id` links to a geo place, `featureId` to a geo feature. */
  places: z.array(
    z.object({
      id: z.string().optional(),
      featureId: z.string().optional(),
      name: z.string().min(1),
      role: z.string().optional(),
    }),
  ),
  /** The ancient works that tell this story ("told in"). */
  attestations: z
    .array(
      z.object({
        source: sourceIdSchema,
        work: z.string().min(1),
        citation: z.string().optional(),
      }),
    )
    .min(1),
});

const kebab = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be kebab-case');

/** A voyage station: presentation overlay on an existing episode (docs/NOSTOS_PLAN.md §7).
 *  Myth prose always renders from the episode's sourced chapters; the epigraph is a
 *  verbatim quotation with a citation — never editorial dressed as fact (hard rule 2). */
const voyageEpigraphSchema = z.object({
  grc: z.string().min(1),
  en: z.string().min(1),
  citation: z
    .string()
    .regex(/^Hom\. Od\. \d+\.\d+(–\d+(\.\d+)?)?$/, 'citation must be "Hom. Od. b.l[–l]"'),
});

const voyageStationSchema = z.object({
  id: kebab,
  movement: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  title: z.string().min(1),
  kicker: z.string().min(1).optional(),
  episode: kebab,
  chapterIndexes: z.array(z.number().int().min(0)).min(1).optional(),
  epigraph: voyageEpigraphSchema,
  art: z
    .array(
      z.object({
        culture: kebab,
        titles: z.array(z.string().min(1)).min(1),
      }),
    )
    .optional(),
  place: kebab.optional(),
  mood: z.enum(VOYAGE_MOODS),
  told: z.boolean().optional(),
  pinned: z.boolean().optional(),
});

/** Flagship scroll experience over an existing saga (data/experience/*.json, M13). */
export const voyageSchema = z.object({
  id: kebab,
  story: kebab,
  movements: z
    .array(
      z.object({
        n: z.union([z.literal(1), z.literal(2), z.literal(3)]),
        title: z.string().min(1),
        books: z.string().min(1),
      }),
    )
    .min(1),
  stations: z.array(voyageStationSchema).min(1),
  finale: z
    .object({ castHighlight: z.boolean(), epigraph: voyageEpigraphSchema.optional() })
    .optional(),
});

/** A sourced "knot of fate" tying two myths from different saga-arms together
 *  where they share a moment. Referential integrity (a/b exist, a≠b) is checked
 *  in validate-data once all story ids are known. */
export const storyCrossingSchema = z.object({
  a: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'a must be a kebab-case story id'),
  b: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'b must be a kebab-case story id'),
  place: z.string().min(1).optional(),
  note: z.string().min(1),
  sources: z.array(sourceIdSchema).min(1),
});

export const storyCrossingsSchema = z.array(storyCrossingSchema);

/** The chronographic authorities that date the myths (data/chronology.json).
 *  These are NOT galaxy source lenses — they only carry the BC-year axis. */
export const CHRONOGRAPHER_IDS = ['eratosthenes', 'marmor-parium', 'eusebius'] as const;
export const chronographerIdSchema = z.enum(CHRONOGRAPHER_IDS);

export const chronologyDateSchema = z.object({
  /** Negative = BC. Internal positioning only; never shown as a UI label. */
  year: z.number().int(),
  source: chronographerIdSchema,
  citation: z.string().min(1),
});

export const chronologyAnchorSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case'),
  label: z.string().min(1),
  /** Story ids this anchor pins to a year (may be empty for documentation-only
   *  deep-past anchors like Sicyon/Inachus that have no story yet). */
  stories: z.array(z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'story id must be kebab-case')),
  dates: z.array(chronologyDateSchema).min(1),
  /** Folds into the dispute gate when chronographers disagree (e.g. Troy). */
  topic: z.string().min(1).optional(),
  /** True when the year is a generational/chronographer estimate, not attested. */
  estimate: z.boolean(),
});

export const chronologySchema = z.object({
  chronographers: z
    .array(
      z.object({
        id: chronographerIdSchema,
        name: z.string().min(1),
        work: z.string().min(1),
        note: z.string().min(1),
      }),
    )
    .min(1),
  anchors: z.array(chronologyAnchorSchema),
});

export const geoRegionSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case'),
  name: z.string().min(1),
  greekName: z.string().min(1),
  parent: z.string().nullable(),
  blurb: z.object({
    text: z.string().min(1),
    sources: z.array(z.enum(SOURCE_IDS)),
  }),
});

export const PLACE_KINDS = [
  'city',
  'sanctuary',
  'landmark',
  'mountain',
  'pass',
  'myth-site',
  'region-capital',
] as const;

export const PLACE_CERTAINTIES = ['fixed', 'approximate', 'traditional', 'disputed'] as const;

export const PLACE_IMPORTANCE = ['flagship', 'major', 'minor', 'obscure'] as const;

export const FEATURE_KINDS = ['river', 'lake', 'plain', 'strait', 'gulf', 'mountain-range'] as const;

export const FEATURE_IMPORTANCE = ['major', 'minor'] as const;

export const geoCitySchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case'),
  name: z.string().min(1),
  greekName: z.string().min(1),
  /** Region (or sub-region) id; null for far-myth places outside every region. */
  region: z.string().nullable(),
  /** [longitude, latitude] from the Pleiades gazetteer (CC BY). */
  coordinates: z.tuple([z.number(), z.number()]),
  pleiadesId: z.string().min(1),
});

export const geoPlaceSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case'),
    name: z.string().min(1),
    greekName: z.string().min(1),
    kind: z.enum(PLACE_KINDS),
    region: z.string().nullable(),
    coordinates: z.tuple([z.number(), z.number()]),
    certainty: z.enum(PLACE_CERTAINTIES),
    pleiadesId: z.string().min(1).optional(),
    importance: z.enum(PLACE_IMPORTANCE),
    summary: z.array(sourcedTextSchema).min(1),
    story: z.array(sourcedTextSchema).optional(),
    characterIds: z.array(z.string().min(1)).optional(),
    storyIds: z.array(z.string().min(1)).optional(),
    deityIds: z.array(z.string().min(1)).optional(),
    cityId: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'cityId must be kebab-case').optional(),
    topics: z.array(z.string().min(1)).optional(),
  })
  .superRefine((place, ctx) => {
    if (place.kind === 'city') {
      if (place.cityId !== place.id) {
        ctx.addIssue({
          code: 'custom',
          message: 'city places must set cityId equal to id',
          path: ['cityId'],
        });
      }
      if (!place.pleiadesId) {
        ctx.addIssue({
          code: 'custom',
          message: 'city places require pleiadesId',
          path: ['pleiadesId'],
        });
      }
    }
    if (place.certainty === 'fixed' && !place.pleiadesId) {
      const hasCitation = place.summary.some((s) => s.citation && s.sources.length > 0);
      if (!hasCitation) {
        ctx.addIssue({
          code: 'custom',
          message: 'certainty "fixed" requires pleiadesId or an explicit citation in summary',
          path: ['certainty'],
        });
      }
    }
  });

export const geoFeatureSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case'),
  name: z.string().min(1),
  greekName: z.string().min(1),
  kind: z.enum(FEATURE_KINDS),
  geometry: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('LineString'),
      coordinates: z.array(z.tuple([z.number(), z.number()])).min(2),
    }),
    z.object({
      type: z.literal('Polygon'),
      coordinates: z.array(z.array(z.tuple([z.number(), z.number()])).min(4)).min(1),
    }),
  ]),
  region: z.string().nullable(),
  summary: z.array(sourcedTextSchema).min(1),
  characterId: z.string().optional(),
  placeIds: z.array(z.string().min(1)).optional(),
  storyIds: z.array(z.string().min(1)).optional(),
  importance: z.enum(FEATURE_IMPORTANCE),
  sources: z.array(sourceIdSchema).min(1),
});

export const lineageSchema = z.object({
  city: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'city must be kebab-case'),
  reigns: z
    .array(
      z.object({
        /** Display name; may stay a plain attested name until promoted to a character. */
        ruler: z.string().min(1),
        /** Optional link to data/characters once the ruler is a verified character. */
        characterId: z.string().optional(),
        /** Joint simultaneous rule — all linked characters share one reign row. */
        characterIds: z.array(z.string().min(1)).optional(),
        sources: z.array(z.enum(SOURCE_IDS)).min(1),
        citation: z.string().optional(),
        note: z.string().optional(),
        /** Competing variants of the same fact share a topic (⚖ in the UI). */
        topic: z.string().optional(),
      }),
    )
    .min(1),
});

export const referenceSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case'),
  summary: z.string().min(1),
  attribution: z.string().min(1),
  sections: z
    .array(
      z.object({
        heading: z.string().min(1),
        paragraphs: z.array(z.string().min(1)).min(1),
      }),
    )
    .optional(),
  symbols: z.array(z.string().min(1)).optional(),
  sacredAnimals: z.array(z.string().min(1)).optional(),
  cultCenters: z.array(z.string().min(1)).optional(),
  etymology: z.string().optional(),
  externalLinks: z.array(z.object({ label: z.string().min(1), url: z.string().url() })).optional(),
});

export type CharacterInput = z.infer<typeof characterSchema>;
export type RelationInput = z.infer<typeof relationSchema>;
export type SourceInput = z.infer<typeof sourceSchema>;
