import type { SagaId } from '@/features/stories/sagas';
import type { SourceId } from './character';

/** The Loom's data layer (docs/LOOM_PLAN.md §4). `data/culture` and
 *  `data/story-culture` stay the authored source; everything here is derived from
 *  them, from Commons metadata and from a small overrides file. */

export type Medium = 'painting' | 'vase' | 'stone' | 'wall' | 'print';

/** How a figure came to be on a work, strongest first. */
export type FigureVia = 'shelf' | 'title' | 'category' | 'override';

/** Which rule settled a work's saga; stored so the heuristic share stays visible. */
export type SagaVia = 'override' | 'story' | 'cast' | 'type' | 'relation' | 'none';

/** Which signal settled a work's medium. `disputed` means Commons categories and
 *  the work's own text disagree, and the record waits on the review list. */
export type MediumVia = 'override' | 'shelf' | 'agreed' | 'category' | 'text' | 'default' | 'disputed';

/** One Commons file, as `pnpm art:commons` recorded it. */
export interface CommonsFileMeta {
  width: number;
  height: number;
  mime: string;
  /** Commons LicenseShortName; null when the file page states none. */
  license: string | null;
  licenseUrl?: string;
  /** Commons `Artist` field, HTML stripped. Can name the painter, not the photographer. */
  author?: string;
  attributionRequired: boolean;
  categories: string[];
}

export interface ArtCommons {
  files: Record<string, CommonsFileMeta>;
}

/** What the UI shows beside a culture image. Derived at load time, never authored. */
export interface ImageCredit {
  author?: string;
  license: string;
  licenseUrl?: string;
  /** The file's Commons page: always linked, it carries the full attribution. */
  pageUrl: string;
  publicDomain: boolean;
}

/** One artwork or artifact as a figure's or a story's shelf holds it. */
export interface ShelfEntry {
  owner: string;
  ownerKind: 'figure' | 'story';
  shelf: 'artworks' | 'artifacts';
  title: string;
  artist: string;
  year: string;
  imageUrl: string;
  description: string;
  /** Set on artifacts only. */
  kind?: string;
}

/** Exceptions to the derivation rules, keyed by Commons file name. */
export interface ArtWorkOverride {
  /** Not an image of the myths: a modern photograph of a place, say. */
  exclude?: boolean;
  /** Other Commons files showing this same physical work. */
  sameAs?: string[];
  sortYear?: number;
  medium?: Medium;
  saga?: SagaId;
  figuresAdd?: string[];
  figuresRemove?: string[];
  /** The shelf owner whose caption this work should use. */
  caption?: string;
  /** Anchor size on the cloth, in cells. */
  span?: [number, number];
  /** Tile crop centre, 0..1. */
  focus?: [number, number];
  /** Whether a shared link previews as the work itself: false shows the cloth instead,
   *  true overrides the nudity read from Commons categories (docs/LOOM_PLAN.md §10). */
  preview?: boolean;
}

export interface ArtOverrides {
  works: Record<string, ArtWorkOverride>;
}

/** A work the gold thread passes through. An ancient claim in its note carries a
 *  citation and sources; an art-historical one, an evidence link. */
export interface ArtPatternStop {
  /** Catalogue id. */
  work: string;
  note?: string;
  citation?: string;
  sources?: SourceId[];
  evidence?: string;
}

/** data/art/patterns/<id>.json (docs/LOOM_PLAN.md §4.6): one gesture followed through
 *  time. A Pattern groups by likeness; descent is stated only with evidence. */
export interface ArtPattern {
  id: string;
  title: string;
  /** Museum-caption voice. */
  summary: string;
  /** Oldest first: the thread only ever falls. */
  stops: ArtPatternStop[];
  /** Lit, but off the thread. */
  members?: string[];
}

export interface ArtWorkFigure {
  id: string;
  via: FigureVia;
}

/** One physical work: a tile on the cloth, a plate at `/art/[id]`. */
export interface ArtWork {
  /** Stable slug, the URL. */
  id: string;
  title: string;
  artist: string;
  year: string;
  /** Signed year for ordering; negative is BC. */
  sortYear: number;
  medium: Medium;
  mediumVia: MediumVia;
  /** Commons file name; `sameAs` scans merge into one record. */
  file: string;
  /** Commons hash path, for thumbnails: `d/d5`. */
  path: string;
  width: number;
  height: number;
  license: string;
  licenseUrl?: string;
  author?: string;
  /** Everyone the work shows (LOOM_PLAN §4.3). */
  figures: ArtWorkFigure[];
  stories: string[];
  saga: SagaId;
  sagaVia: SagaVia;
  span?: [number, number];
  focus?: [number, number];
}

/** One work in public/art/loom.json, as a row to keep the door's first payload small:
 *  id, title, artist, year, sortYear, saga index, medium index, Commons hash path,
 *  Commons file, width, height, sprite index, anchor slot or -1, and the figures it
 *  shows as indices into `LoomDoorData.figures`. */
export type LoomWorkRow = [
  string, string, string, string, number, number, number, string, string, number, number, number, number, number[],
];

export interface LoomDoorLayout {
  width: number;
  height: number;
  tearTop: number;
  tearRows: number;
  eras: { label: string; sub: string; row: number }[];
  /** Flat x, row, w, h per work, in the order of `works`. */
  cells: number[];
}

/** A Pattern as the door holds it: stops and members as indices into `works`, and a
 *  stop's sources and citation already written out as its footnote. */
export interface LoomDoorPattern {
  id: string;
  title: string;
  summary: string;
  stops: { work: number; note?: string; footnote?: string; evidence?: string }[];
  members: number[];
}

/** public/art/loom.json: what the door needs before its first frame. */
export interface LoomDoorData {
  works: LoomWorkRow[];
  /** Every figure some work shows, as [id, name]; the threads are built from these. */
  figures: [string, string][];
  /** Every story some work is linked to, as [id, title, work indices], so a deep link
   *  such as `/art?story=…` can light its works. */
  stories: [string, string, number[]][];
  patterns: LoomDoorPattern[];
  desktop: LoomDoorLayout;
  phone: LoomDoorLayout;
  sheet: { columns: number; cell: number; lqCell: number; anchorColumns: number; anchorSlot: number };
}

/** One entry of public/art/details.json, fetched the first time a plate opens. */
export interface LoomWorkDetail {
  caption: string;
  credit?: ImageCredit;
  figures: { id: string; name: string }[];
  stories: { id: string; title: string }[];
}

/** data/generated/art-catalogue.json */
export interface ArtCatalogue {
  signature: string;
  count: number;
  works: ArtWork[];
  /** Captions apart from the records, so the door's first payload stays small. */
  captions: Record<string, string>;
}
