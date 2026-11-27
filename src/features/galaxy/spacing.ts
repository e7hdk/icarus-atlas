/** How far apart the galaxy's stars stand. The layout's positions are
 *  multiplied by the spacing, which the "Star spacing" setting moves. */

/** The spacing the galaxy was first composed at. A reading of the sky (First,
 *  Chaos; a gift's performance) is written in its distances and keeps it, and
 *  whatever must hold its measure as the stars are spread wider (the celestial
 *  sphere, how far the camera may draw back, a dedicated star) is scaled from it. */
export const REFERENCE_SPACING = 6.1;
/** What the setting allows, and where a visit begins. */
export const MIN_SPACING = 0.5;
export const MAX_SPACING = 15;
export const DEFAULT_SPACING = 15;

/** How many times wider than composed the sky is spread. A closer sky counts
 *  as one: nothing that leans on this is drawn smaller than it was made. */
export function skyReach(spacing: number): number {
  return Math.max(1, spacing / REFERENCE_SPACING);
}
