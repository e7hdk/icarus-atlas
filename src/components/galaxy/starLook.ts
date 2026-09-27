import type { CharacterType } from '@/types/character';

/** The one recipe for what a star LOOKS like: how far each cosmic role's light
 *  spreads, how hot it burns, the pulse it breathes with, and which roles carry
 *  diffraction spikes at rest. StarsDriver draws the galaxy's stars from it
 *  (shaders/psfStar.ts); the labels hang under the same sizes. */

export const STAR_SIZE: Record<CharacterType, number> = {
  primordial: 0.85,
  titan: 0.78,
  olympian: 0.95,
  god: 0.8,
  hero: 0.7,
  mortal: 0.6,
  nymph: 0.65,
  creature: 0.75,
};

export const STAR_PULSE: Record<
  'slow' | 'steady' | 'quick' | 'irregular',
  { speed: number; amp: number }
> = {
  slow: { speed: 0.7, amp: 0.1 },
  steady: { speed: 1.4, amp: 0.06 },
  quick: { speed: 3.2, amp: 0.1 },
  irregular: { speed: 2.1, amp: 0.12 },
};

/** Light per cosmic role (docs/PLAN.md §5): the Olympians burn brightest,
 *  mortals faint. Size sets how far the light spreads; this sets how hot it
 *  burns. */
export const STAR_RADIANCE: Record<CharacterType, number> = {
  primordial: 1.15,
  titan: 1.0,
  olympian: 1.3,
  god: 1.0,
  hero: 0.95,
  mortal: 0.8,
  nymph: 0.9,
  creature: 0.95,
};

/** Resting diffraction spikes — only the brightest roles carry them, as only
 *  the brightest stars do in a photograph. Every star spikes while in focus. */
export const STAR_SPIKE: Record<CharacterType, number> = {
  primordial: 0.4,
  titan: 0,
  olympian: 0.5,
  god: 0,
  hero: 0,
  mortal: 0,
  nymph: 0,
  creature: 0,
};
