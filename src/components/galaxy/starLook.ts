import type { CharacterType } from '@/types/character';
import { dedicatedSize, dedicationOf } from '@/features/galaxy/dedication';
import { PSF_GROWTH, PSF_KNEE_PX } from './shaders/psfStar';

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

/** A star in focus (hovered or selected) spreads this much wider. */
export const FOCUS_SPREAD = 0.3;

/** Device pixels a world unit covers at view depth 1: what the point-spread
 *  curve (shaders/psfStar.ts) measures a star with. `projectionY` is the
 *  projection matrix's y scale, elements[5]. */
export function pixelsPerUnit(drawingHeight: number, projectionY: number): number {
  return 0.5 * drawingHeight * projectionY;
}

/** The point-spread radius a star of world radius `size` is drawn with at
 *  `depth`, in world units at that depth: its own radius up to the curve's
 *  knee, and less past it, where a star no longer grows as fast as it nears. */
export function drawnRadius(size: number, depth: number, perUnit: number): number {
  const raw = (size * perUnit) / Math.max(depth, 1e-3);
  return raw > PSF_KNEE_PX ? size * Math.pow(PSF_KNEE_PX / raw, 1 - PSF_GROWTH) : size;
}

/** The view depth at which that star is drawn `radius` device pixels wide. */
export function depthForRadius(size: number, radius: number, perUnit: number): number {
  const raw = radius > PSF_KNEE_PX ? PSF_KNEE_PX * Math.pow(radius / PSF_KNEE_PX, 1 / PSF_GROWTH) : radius;
  return (size * perUnit) / Math.max(raw, 1e-3);
}

/** The world radius a star is drawn at: its role's, a dedicated star's in a
 *  sky spread `reach` times wider than composed (features/galaxy/spacing.ts),
 *  or the one a stage holds it at (`sizes`, by id). */
export function starSize(
  star: { id: string; type: CharacterType },
  reach: number,
  sizes?: Readonly<Record<string, number>>,
): number {
  const staged = sizes?.[star.id];
  if (staged !== undefined) return staged;
  const gift = dedicationOf(star.id);
  return gift ? dedicatedSize(gift, reach) : STAR_SIZE[star.type];
}

/** How far below its heart a star's name hangs: under its light. A giant's
 *  light is narrower than its world radius (the curve's knee), so its name
 *  keeps nearer than that radius would put it. */
export function labelDrop(size: number): number {
  return Math.min(size, 6) + 1.2;
}
