/** The baked files the client fetches, all from `pnpm bake-atlas-data` but the Loom's,
 *  which `pnpm bake-art` writes. Anything that travels as a page prop repeats in that
 *  page's HTML and RSC payload; these are fetched once, and the host compresses and
 *  revalidates them. */
export const ATLAS_FILES = {
  ephemeris: '/atlas/ephemeris.json',
  searchIndex: '/atlas/search-index.json',
  galaxy: '/atlas/galaxy.json',
  myths: '/atlas/myths.json',
  lands: '/atlas/lands.json',
  loom: '/art/loom.json',
  /** The Loom's low-quality sprite sheet: both doors weave their first cloth from it. */
  loomPreview: '/art/sheet-lq.webp',
} as const;

/** One star's prose, read when the star is. */
export const starFile = (id: string) => `/atlas/stars/${id}.json`;
