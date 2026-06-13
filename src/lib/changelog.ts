/** The atlas's own chronicle — each release a stanza, newest first.
 *  Kept in the mythic register of the rest of the app; the version shown in
 *  the settings footer is CHANGELOG[0].version. */

export interface ChangelogEntry {
  version: string;
  /** A short codename for the release, in the app's voice. */
  codename: string;
  /** ISO date the release was sealed. */
  date: string;
  /** Poetic lines — what the sky gained. */
  lines: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.1.1',
    codename: 'The Houses Gather',
    date: '2026-06-12',
    lines: [
      'The House of Aeolus kindled along the outer arm — seven-and-forty stars from a single Thessalian king: the Argonauts’ Iolcus, Corinthian Sisyphus at his ever-falling stone, the golden ram, and Bellerophon astride the wind.',
      'The Athenian royal house took its place, from serpent-bodied Cecrops who witnessed Athena’s olive down to Theseus and the slain Minotaur.',
      'Every new star now burns with three lights: the poets’ sourced telling, an encyclopedia’s plain record, and a gallery of the art it kindled across the ages.',
      'Athens found its ground on the map — its kings ranked in succession, its dwellers gathered into a sky of their own.',
      'And the sky learned to count itself: the settings now keep a tally of every star that hangs in the dark.',
    ],
  },
  {
    version: '0.1.0',
    codename: 'First Light',
    date: '2026-06-11',
    lines: [
      'The first sky was struck from the dark — Chaos at the centre, the primordials in close orbit, the Titans on their ember ring, the Olympians on a band of gold, and the Night Court wheeling below.',
      'Every figure became a star, glowing by its nature; every bond a thread of light drawn between them.',
      'The source lens was lit, that the whole sky might re-shape itself according to Hesiod, or Homer, or any of seven ancient hands — for the tellers never did agree, and the disagreement is the point.',
    ],
  },
];

/** The live version, shown in the settings footer. */
export const APP_VERSION = CHANGELOG[0].version;
