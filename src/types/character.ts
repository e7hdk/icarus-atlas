/** Core domain types for Icarus Atlas.
 *  This file is the contract between the data layer (data/*.json) and the UI.
 *  Keep in sync with src/lib/schemas.ts (zod) and docs/PLAN.md §4. */

export const SOURCE_IDS = [
  'homer',
  'hesiod',
  'apollodorus',
  'apollonius',
  'ovid',
  'hyginus',
  'pausanias',
] as const;

export type SourceId = (typeof SOURCE_IDS)[number];

/** A lens is a source the user reads the galaxy through; consensus = union of all. */
export type LensId = SourceId | 'consensus';

export const CHARACTER_TYPES = [
  'primordial',
  'titan',
  'olympian',
  'god',
  'hero',
  'mortal',
  'nymph',
  'creature',
] as const;

export type CharacterType = (typeof CHARACTER_TYPES)[number];

/** Controlled mythological sub-taxonomy — display and search only.
 *  Primary `type` alone drives TYPE_GLOW, star size/pulse, and the mortal clock.
 *  Never add these as CharacterType values (Dryad ≠ a glow palette slot). */
export const NYMPH_KINDS = [
  'oceanid',
  'nereid',
  'naiad',
  'dryad',
  'hamadryad',
  'oread',
  'pleiad',
  'melia',
  'nephele',
  'hesperid',
] as const;

export const CREATURE_KINDS = [
  'centaur',
  'cyclops',
  'hecatoncheir',
  'gorgon',
  'harpy',
  'siren',
  'giant',
  'dragon',
  'sphinx',
  'chimera',
] as const;

export const FIGURE_KINDS = [...NYMPH_KINDS, ...CREATURE_KINDS] as const;

export type NymphKind = (typeof NYMPH_KINDS)[number];
export type CreatureKind = (typeof CREATURE_KINDS)[number];
export type FigureKind = (typeof FIGURE_KINDS)[number];

/** At most three kinds per figure (primary + secondary + tertiary taxonomy). */
export const MAX_FIGURE_KINDS = 3;

export const RELATION_TYPES = [
  'parent',
  'consort',
  'sibling',
  'lover',
  'slayer',
  'creator',
  'ally',
  'adversary',
] as const;

export type RelationType = (typeof RELATION_TYPES)[number];

/** A piece of text attested by one or more ancient sources.
 *  Competing variants of the same fact share a `topic` key. */
export interface SourcedText {
  text: string;
  sources: SourceId[];
  citation?: string;
  topic?: string;
}

export interface Character {
  id: string;
  name: string;
  greekName: string;
  romanName?: string;
  type: CharacterType;
  /** Mythological sub-class (Oceanid, Dryad, Centaur, …). Optional on legacy
   *  figures; required on new nymph and creature entries. Does not affect glow
   *  or layout — see docs/NYMPHS.md §2 and docs/PLAN.md §4. */
  kinds?: FigureKind[];
  domains: string[];
  epithets?: string[];
  /** Hover card text; the renderer picks the best match for the active lens. */
  summary: SourcedText[];
  /** Full story paragraphs, each tagged with its sources. */
  story: SourcedText[];
  /** Galaxy region, drives spatial placement (e.g. "core", "titan-ring", "olympian-band"). */
  cluster: string;
  /** Cities this figure lived in — sourced facts; drives the per-city skies. */
  residences?: { city: string; sources: SourceId[] }[];
}

export interface Relation {
  id: string;
  type: RelationType;
  /** Child / agent side of the relation. */
  from: string;
  /** Parent / patient side of the relation. */
  to: string;
  sources: SourceId[];
  topic?: string;
  note?: string;
}

export interface Source {
  id: SourceId;
  name: string;
  works: string[];
  period: string;
  language: string;
  description: string;
}

export interface Artwork {
  title: string;
  artist: string;
  year: string;
  imageUrl: string;
  /** Museum-caption style paragraph: what the work shows and why it matters. */
  description: string;
}

/** Cultural legacy items (artworks now; films/music later). Lens-independent. */
export interface CultureData {
  id: string;
  artworks: Artwork[];
}

export interface ExternalLink {
  label: string;
  url: string;
}

/** A heading + its paragraphs, adapted from the figure's encyclopedia article (CC BY-SA). */
export interface ReferenceSection {
  heading: string;
  paragraphs: string[];
}

/** Neutral encyclopedic reference (Information tab). Lens-independent. */
export interface ReferenceData {
  id: string;
  summary: string;
  attribution: string;
  /** Encyclopedic article body: section headings and their paragraphs (CC BY-SA, attributed). */
  sections?: ReferenceSection[];
  symbols?: string[];
  sacredAnimals?: string[];
  cultCenters?: string[];
  etymology?: string;
  externalLinks?: ExternalLink[];
}

/** Star glow palette per character type — the "Aether Nebula" theme.
 *  Used by WebGL star materials; mirror of the star tokens in src/styles/theme.css.
 *  Keep both files in sync when tuning the palette. */
export const TYPE_GLOW: Record<CharacterType, { color: string; pulse: 'slow' | 'steady' | 'quick' | 'irregular' }> = {
  primordial: { color: '#c084fc', pulse: 'slow' },
  titan: { color: '#fb7185', pulse: 'slow' },
  olympian: { color: '#fcd34d', pulse: 'steady' },
  god: { color: '#60a5fa', pulse: 'steady' },
  hero: { color: '#2dd4bf', pulse: 'quick' },
  mortal: { color: '#e5e7eb', pulse: 'steady' },
  nymph: { color: '#4ade80', pulse: 'steady' },
  creature: { color: '#f472b6', pulse: 'irregular' },
};

/** The nine Muses are special: their fire is the inspiration that lets every other
 *  star shine, so they do not take the flat `god` glow. Instead each Muse's star
 *  slowly cycles its hue through the entire spectrum — a seamless loop, because hue
 *  wraps 360°→0° with no seam — and the nine are spread evenly across the rainbow,
 *  so at any instant the Muse cluster shimmers in every colour at once. This is the
 *  "iridescent" tag; the renderer (CharacterStar) drives the animation.
 *  IRIDESCENT_BASE_HUE maps each Muse id to its starting hue in [0,1). */
export const MUSE_IDS = [
  'calliope',
  'clio',
  'euterpe',
  'erato-muse',
  'melpomene',
  'polyhymnia',
  'terpsichore',
  'thalia-muse',
  'urania',
] as const;

export const IRIDESCENT_BASE_HUE: Record<string, number> = Object.fromEntries(
  MUSE_IDS.map((id, index) => [id, index / MUSE_IDS.length]),
);
