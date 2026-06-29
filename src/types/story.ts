import type { SourceId } from './character';

export type StoryKind = 'cosmogony' | 'war' | 'catastrophe' | 'saga' | 'episode';

export interface StoryChapter {
  title: string;
  text: string;
  sources: SourceId[];
  citation?: string;
  topic?: string;
}

export interface StoryCastMember {
  /** Character id once the figure is in the roster; plain name until then. */
  id?: string;
  name: string;
  role: string;
}

export interface StoryPlace {
  /** Geo place id (`data/geo/places.json`) once curated; plain name until then. */
  id?: string;
  /** Geo feature id (`data/geo/features.json`) for mountains, rivers, straits. */
  featureId?: string;
  name: string;
  role?: string;
}

export interface StoryAttestation {
  source: SourceId;
  work: string;
  citation?: string;
}

/** A curated, sourced "knot of fate" (data/story-crossings.json): two myths from
 *  different saga-arms that meet at one shared moment — a shared figure, a shared
 *  place, or the very same event told twice. The spindle ties their two
 *  world-lines together with a glowing filament across the gulf between arms,
 *  so the timeline shows not just when each myth runs but where they cross. */
export interface StoryCrossing {
  /** The two stories tied together (order only sets the filament's color gradient). */
  a: string;
  b: string;
  /** Where they meet, when it has a name — shown on the hover label. */
  place?: string;
  /** One-line gloss of the shared moment. */
  note: string;
  /** The authors who attest the link — the lens gate, like any other fact. */
  sources: SourceId[];
}

/** The chronographic authorities that date the myths (data/chronology.json).
 *  NOT galaxy source lenses — they only carry the Spindle's internal BC-year axis. */
export type ChronographerId = 'eratosthenes' | 'marmor-parium' | 'eusebius';

export interface Chronographer {
  id: ChronographerId;
  name: string;
  work: string;
  note: string;
}

export interface ChronologyDate {
  /** Negative = BC. Used only to position world-lines; never shown as a UI label. */
  year: number;
  source: ChronographerId;
  citation: string;
}

/** One dated moment that pins its `stories` to a BC year on the Spindle. A few
 *  deep-past anchors (Sicyon, Inachus) carry no story yet — documentation only. */
export interface ChronologyAnchor {
  id: string;
  label: string;
  stories: string[];
  dates: ChronologyDate[];
  /** Set when chronographers disagree (e.g. the fall of Troy) — the dispute gate. */
  topic?: string;
  /** True when the year is a generational/chronographer estimate, not attested. */
  estimate: boolean;
}

export interface Chronology {
  chronographers: Chronographer[];
  anchors: ChronologyAnchor[];
}

/** A myth told as a story (data/stories/*.json). Sub-stories nest via `parent`. */
export interface Story {
  id: string;
  title: string;
  greekTitle?: string;
  kind: StoryKind;
  parent: string | null;
  /** Mythic-chronology sort key and the START of the world-line on the spindle. */
  era: number;
  /** Optional END of the world-line; derived from descendants when omitted. */
  eraEnd?: number;
  /** Open-ended ("unfinished") myth: its world-line spirals on past the spindle's
   *  end and dissolves into the dark, instead of stopping at an era. */
  open?: boolean;
  /** When true, direct children share one branch height and fan into parallel lanes
   *  (e.g. the Nostoi captains sailing home at once) instead of stacking in time order. */
  forkChildren?: boolean;
  summary: { text: string; sources: SourceId[]; citation?: string; topic?: string };
  chapters: StoryChapter[];
  cast: StoryCastMember[];
  places: StoryPlace[];
  attestations: StoryAttestation[];
}
