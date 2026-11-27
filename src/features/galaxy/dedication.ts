import { TYPE_GLOW, type CharacterType } from '@/types/character';

/** A dedication: one star given as a gift. It is NOT mythology. Nothing here
 *  is a sourced fact, and the figure's data (`type`, prose, sources) stays as
 *  the ancient authors tell it: Hesiod names Calliope the chiefest of the Muses
 *  (Theogony 79), so "Greatest Muse" lives only here, as a dedication.
 *
 *  A dedication changes how a star LOOKS and how its badge reads, never where
 *  it stands: the layout engine does not read this file, so the galaxy's
 *  places, rings and gates are untouched. */
/** A door at the foot of a dedicated star's panel: it leads to a page of its
 *  own, where a sealed gift (src/features/dedication) opens to the one who
 *  knows its answer. The gift ships only as ciphertext. */
export interface DedicationDoor {
  /** The door's page. */
  route: string;
  /** The words at the foot of the panel that lead there. */
  whisper: string;
  /** What the door asks; the answer is a day. */
  prompt: string;
  /** The sealed gift, under public/. */
  sealed: string;
  /** The music the gift is performed to, under public/: the performance keeps its time. */
  music?: string;
}

export interface Dedication {
  /** Shown in place of the type on the star's badge. */
  label: string;
  /** The line of dedication under the badges. */
  line: string;
  /** The two colours the star's light drifts between. */
  from: string;
  to: string;
  /** The steady colour for text and chrome: between `from` and `to`. */
  color: string;
  /** World radius of the star (compare STAR_SIZE: an Olympian is 0.95). */
  size: number;
  /** How hot it burns (compare STAR_RADIANCE: an Olympian is 1.3). */
  radiance: number;
  /** Resting diffraction spikes (compare STAR_SPIKE: an Olympian is 0.5). */
  spike: number;
  door?: DedicationDoor;
}

const ROSE = '#f9a8c4';
const GOLD = '#f7c873';

export const DEDICATIONS: Readonly<Record<string, Dedication>> = {
  'thalia-muse': {
    label: 'Greatest Muse',
    line: 'Dedicated to Talia',
    from: ROSE,
    to: GOLD,
    color: '#f8b89c',
    size: 2.4,
    radiance: 1.45,
    spike: 0.75,
    door: {
      route: '/talia',
      whisper: 'I am Talia',
      prompt: 'Then tell the sky the day you were born.',
      sealed: '/dedication/talia.json',
      music: '/audio/dawn-on-the-lyre.mp3',
    },
  },
};

/** The star's dedication, if it was given one. */
export function dedicationOf(id: string): Dedication | undefined {
  return DEDICATIONS[id];
}

/** The colour a figure is drawn and written in: its dedication's, else its type's glow. */
export function glowColorOf(id: string, type: CharacterType): string {
  return DEDICATIONS[id]?.color ?? TYPE_GLOW[type].color;
}

/** How fast a dedicated star's light drifts between its two colours (radians per second). */
export const DEDICATION_DRIFT = 0.45;
