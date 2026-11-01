import type { SagaId } from '@/features/stories/sagas';

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
}

export interface ArtOverrides {
  works: Record<string, ArtWorkOverride>;
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

/** data/generated/art-catalogue.json */
export interface ArtCatalogue {
  signature: string;
  count: number;
  works: ArtWork[];
  /** Captions apart from the records, so the door's first payload stays small. */
  captions: Record<string, string>;
}
