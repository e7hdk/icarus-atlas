import type { SourcedText } from './character';

/** The Greek sky — Ptolemy's 48 constellations (data/sky/constellations.json,
 *  baked by scripts/build-sky.ts from the Yale Bright Star Catalogue and the
 *  CC BY-SA line figures of doinab/constellation-lines; the file carries its
 *  own attribution). Static reference data: the galaxy hangs inside it, and a
 *  week lights the figure its saga was set into. */

export interface SkyStar {
  name: string;
  /** Bayer letter where the star earned one, else empty. */
  bayer: string;
  /** Degrees, equinox 2000. */
  ra: number;
  dec: number;
  /** Visual magnitude — the smaller, the brighter. */
  mag: number;
  /** The figure standing in this star — only where the sources name them star
   *  by star, which in the Greek sky means the Pleiades. */
  character?: string;
}

export interface Constellation {
  id: string;
  name: string;
  /** What the figure IS: "The Great Bear", "The Hunter". */
  figure: string;
  iau: string[];
  /** An asterism inside another figure (the Pleiades in Taurus) names its host. */
  asterism?: string;
  greekName?: string;
  /** The constellation IS this person or thing, as the ancients record it. */
  catasterism?: { characters?: string[]; testimonia: string[] };
  /** How the figure came to the sky — the constellation's own story, sourced
   *  paragraph by paragraph, standing whether or not a myth also tells it. */
  origin?: SourcedText[];
  /** Sagas whose own telling names this figure in the sky — a different claim
   *  from being it: Odysseus steers by the Bear, he is not the Bear. */
  namedIn?: { story: string; testimonia: string[] }[];
  stars: SkyStar[];
  /** The classical stick figure, as index pairs into `stars`. */
  lines: [number, number][];
}

export interface SkyCatalogue {
  note: string;
  attribution: {
    lines: { work: string; author: string; url: string; licence: string; note?: string };
    positions: { work: string; author: string; url: string; licence: string };
  };
  constellations: Constellation[];
}
