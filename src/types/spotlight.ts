/** Core types for the Ephemeris — the daily sky (docs/EPHEMERIS_PLAN.md).
 *  The engine is a pure function of date + data: every visitor sees the same
 *  star on the same Athens day, with no backend involved. */

import type { Artwork, CharacterType, FigureKind, SourcedText } from './character';

/** Editorial overrides for the spotlight pool (data/spotlight/spotlight.json).
 *  Pins are always eligible whatever the rule says; exclusions never are.
 *  validate-data forbids overlap and dangling ids. */
export interface SpotlightOverrides {
  pins: string[];
  exclusions: string[];
}

/** One member of the eligible roster — the compact slice the client needs
 *  before the card fetches the full payload. */
export interface EphemerisRosterEntry {
  id: string;
  name: string;
  type: CharacterType;
}

export const WEEK_DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type WeekDayKey = (typeof WEEK_DAY_KEYS)[number];

/** The twelve months of the Attic calendar, Hekatombaion first (the year
 *  began after the summer solstice). Festival dates are recorded in these —
 *  the ancients' own terms — and only the resolver maps them to Gregorian
 *  days (docs/EPHEMERIS_PLAN.md D5/D6). */
export const ATTIC_MONTHS = [
  'hekatombaion',
  'metageitnion',
  'boedromion',
  'pyanepsion',
  'maimakterion',
  'poseideon',
  'gamelion',
  'anthesterion',
  'elaphebolion',
  'mounichion',
  'thargelion',
  'skirophorion',
] as const;
export type AtticMonth = (typeof ATTIC_MONTHS)[number];

export interface FestivalAtticDate {
  month: AtticMonth;
  /** Day or [start, end] within the month (1..30); absent = month-known-only. */
  days?: [number] | [number, number];
  /** The exact day is a scholarly reconstruction or disputed. */
  approximate?: boolean;
}

/** One ancient festival (data/festivals/*.json) — lens-independent reference
 *  data (D5): dates come from inscriptions, scholia and modern scholarship,
 *  cited as free-text `testimonia`, never as lens facts. */
export interface Festival {
  id: string;
  name: string;
  greekName?: string;
  /** CharacterIds honored, in day order — day N of the window features
   *  deities[N-1]; later days of a single-deity festival are ambience only. */
  deities: string[];
  /** Geo place id (city or sanctuary); the UI links a door only for cities. */
  place?: string;
  panhellenic?: boolean;
  games?: { cycleYears: 2 | 4 };
  atticDate: FestivalAtticDate;
  /** Curated traditional Gregorian placements ('MM-DD'), the v1 resolver —
   *  replaced by the M12.5 reconstruction without touching atticDate. */
  conventionalDates?: string[];
  /** StoryId of the founding myth, when the atlas already tells it. */
  aition?: string;
  summary: string;
  testimonia: string[];
  furtherReading?: string[];
}

/** Trimmed festival slice the client resolver needs. `atticDate` is present
 *  only when the festival carries a day-precise Attic date — those move to
 *  the reconstructed calendar (M12.5); day-less festivals keep their
 *  conventional placements; games resolve via the Olympiad peak. */
export interface EphemerisFestival {
  id: string;
  name: string;
  greekName?: string;
  /** Museum-caption prose from the festival file — the card's festival block. */
  summary?: string;
  deities: string[];
  conventionalDates: string[];
  atticDate: { month: AtticMonth; days: [number] | [number, number] } | null;
  gamesCycle?: number;
  place: { id: string; name: string; isCity: boolean } | null;
  /** The founding myth, when the atlas already tells it — a door. */
  aition?: { id: string; title: string } | null;
}

/** The reconstructed Attic calendar (data/generated/attic-calendar.json,
 *  baked by scripts/build-attic-calendar.ts — see the convention there).
 *  Always labeled "reconstructed" wherever the UI shows it. */
export type AtticCalendarMonthName = AtticMonth | 'poseideon-ii';

export interface AtticCalendarMonth {
  name: AtticCalendarMonthName;
  /** Athens calendar date of the month's Day 1 (YYYY-MM-DD). */
  start: string;
}

export interface AtticCalendarYear {
  /** e.g. "2026/2027" — solstice to solstice. */
  atticYear: string;
  months: AtticCalendarMonth[];
  /** Olympiad years only: the second full moon after the solstice. */
  olympicPeak?: string;
}

export interface AtticCalendar {
  convention: string;
  engine: string;
  years: AtticCalendarYear[];
}

/** A monthly sacred day (data/sacred-days.json) — flavor only, never a pick. */
export interface SacredDay {
  day: number;
  label: string;
  deities: string[];
  testimonia: string[];
}

/** One deterministic Daily Oracle question (docs/EPHEMERIS_PLAN.md §11).
 *  Options arrive pre-shuffled; exactly one is correct. */
export interface OracleQuestion {
  kind: 'bond' | 'poet' | 'myth' | 'role';
  prompt: string;
  options: string[];
  correctIndex: number;
}

/** One saga usable as a weekly theme: eligible cast ids in cast (narrative)
 *  order — day N of the week features cast[N] (docs/EPHEMERIS_PLAN.md D4). */
export interface EphemerisWeekSaga {
  storyId: string;
  title: string;
  cast: string[];
}

/** A curated week (data/spotlight/weeks.json), resolved server-side: title
 *  falls back to the story's own, cast to the story's eligible cast; `days`
 *  may pin specific stars to specific weekdays. */
export interface EphemerisCuratedWeek extends EphemerisWeekSaga {
  isoWeek: string;
  days?: Partial<Record<WeekDayKey, string>>;
}

/** Date-independent payload assembled server-side (features/spotlight/build.ts)
 *  and handed to the client host; "today" is always derived client-side so a
 *  stale static build can never bake yesterday into the page. */
export interface EphemerisData {
  /** Eligible roster sorted by id — the permutation's stable base order. */
  roster: EphemerisRosterEntry[];
  /** Weekly themes: era-ordered saga rotation + curated overrides. */
  weeks: {
    sagas: EphemerisWeekSaga[];
    curated: EphemerisCuratedWeek[];
  };
  /** The festival calendar (attic-first once the table exists). */
  festivals: EphemerisFestival[];
  /** The reconstructed Attic calendar; null when the table is absent. */
  attic: AtticCalendar | null;
  /** Monthly sacred days — flavor on festival-less days. */
  sacredDays: SacredDay[];
}

/** Why today's star is today's star. M12.1 only deals cycle picks; festival
 *  and week overrides arrive with their milestones (docs/EPHEMERIS_PLAN.md D7). */
export type DayPickReason = 'festival' | 'week' | 'cycle';

export interface DayPick {
  id: string;
  reason: DayPickReason;
  /** Athens calendar date the pick was computed for (YYYY-MM-DD). */
  isoDate: string;
  /** Whole days since EPHEMERIS_EPOCH on the Athens calendar. */
  dayIndex: number;
  /** Set when the pick came from the constellation of the week. */
  week?: { storyId: string; title: string; day: number; of: number };
  /** Set on festival days — even when the star itself came from the week or
   *  cycle (a later day of a single-deity festival is ambience only). */
  festival?: { id: string; name: string; day: number; of: number };
}

/** One lit edge of the thread beat, phrased from the star's point of view
 *  ("slain by Perseus") with the directional labels of features/characters/relations. */
export interface ProemBond {
  relationId: string;
  otherId: string;
  otherName: string;
  label: string;
}

export interface ProemQuarrelVariant {
  /** Display names of the attesting sources, e.g. "Hesiod" or "Ovid · Hyginus". */
  sourceLabel: string;
  text: string;
}

/** Trimmed per-star payload served by /api/ephemeris/[id] for the card and
 *  the proem. Summary stays a sourced array — the client picks the line for
 *  the active lens with the same lens helpers the hover card uses. */
export interface EphemerisCardPayload {
  id: string;
  name: string;
  greekName: string;
  romanName?: string;
  type: CharacterType;
  kinds?: FigureKind[];
  domains: string[];
  epithets?: string[];
  summary: SourcedText[];
  /** True when any topic on this figure is told differently by the sources. */
  disputed: boolean;
  /** Up to three key bonds in deterministic priority order — the thread beat. */
  bonds: ProemBond[];
  /** First documented dispute told in this figure's own prose, when any. */
  quarrel: { topic: string; variants: ProemQuarrelVariant[] } | null;
  /** First Legacy artwork, when the figure carries culture data. */
  artwork: Pick<Artwork, 'title' | 'artist' | 'year' | 'imageUrl'> | null;
  /** Earliest-era story whose cast lists the figure — the "Read the myth" door. */
  storyId: string | null;
  storyTitle: string | null;
  /** First residence promoted to a city-sky door, when the geo layer knows it. */
  city: { id: string; name: string } | null;
}

/** The five fixed beats (docs/EPHEMERIS_PLAN.md §6). Thread, quarrel and
 *  trace drop out silently when their data is absent. */
export type ProemBeat =
  | { kind: 'invocation'; line: string }
  | { kind: 'thread'; steps: ProemBond[] }
  | { kind: 'telling'; summary: SourcedText[] }
  | { kind: 'quarrel'; variants: ProemQuarrelVariant[] }
  | { kind: 'trace'; artwork: Pick<Artwork, 'title' | 'artist' | 'year' | 'imageUrl'> };

/** A staged telling, assembled purely from existing sourced data (D12). */
export interface ProemScript {
  characterId: string;
  name: string;
  beats: ProemBeat[];
  doors: {
    storyId: string | null;
    storyTitle: string | null;
    city: { id: string; name: string } | null;
  };
}
