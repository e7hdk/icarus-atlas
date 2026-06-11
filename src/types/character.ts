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
  domains: string[];
  epithets?: string[];
  /** Hover card text; the renderer picks the best match for the active lens. */
  summary: SourcedText[];
  /** Full story paragraphs, each tagged with its sources. */
  story: SourcedText[];
  /** Galaxy region, drives spatial placement (e.g. "core", "titan-ring", "olympian-band"). */
  cluster: string;
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

/** Neutral encyclopedic reference (Information tab). Lens-independent. */
export interface ReferenceData {
  id: string;
  summary: string;
  attribution: string;
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
