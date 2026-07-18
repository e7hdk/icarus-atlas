/**
 * Relief appearance — single source of truth shared by the offline bake
 * (scripts/bake-relief.ts) and the runtime-fallback style layers
 * (scripts/build-map-style.ts). Change a colour here and both tiers follow.
 */

/** Zoom below which no relief renders at all (the flat 2D basin overview). */
export const RELIEF_MINZOOM = 5.2;

/**
 * Hypsometric tint in the Aether palette: lowlands keep the plain land fill,
 * highlands lift toward nebula violet, peaks toward star white. Alpha ramp
 * (not opaque colours) so the land base glows through, and the bathymetric
 * sea (elevation ≤ 0) stays fully transparent.
 */
export const TINT_STOPS: readonly [elevation: number, color: string][] = [
  [-100, 'rgba(124, 77, 255, 0)'],
  [0, 'rgba(124, 77, 255, 0)'],
  [150, 'rgba(96, 60, 200, 0.06)'],
  [600, 'rgba(124, 77, 255, 0.14)'],
  [1200, 'rgba(148, 108, 255, 0.22)'],
  [2000, 'rgba(192, 132, 252, 0.32)'],
  [2900, 'rgba(226, 217, 255, 0.42)'],
];

/** Igor-method hillshade colours (soft directional shading). */
export const SHADE_SHADOW = 'rgba(5, 2, 15, 0.8)';
export const SHADE_HIGHLIGHT = 'rgba(186, 200, 255, 0.14)';
/** Only the runtime `standard` fallback reads accent; igor ignores it. */
export const SHADE_ACCENT = 'rgba(124, 77, 255, 0.22)';

/** MapLibre's default hillshade-illumination-direction (degrees). */
export const SHADE_AZIMUTH_DEG = 335;

/** hillshade-exaggeration the bake freezes in. Matches the top of the old
 *  runtime ramp (z9+), so the terrain band looks identical; at lower zooms the
 *  shared opacity ramp below carries the fade-in the old per-layer ramps did. */
export const BAKE_SHADE_EXAGGERATION = 0.5;

/** Zoom→opacity stops for the baked relief layer: relief only breathes in as
 *  the camera closes on a region (the "walking onto the map" narrative).
 *  Mirrors the old color-relief opacity ramp; at z6.5 the baked shade lands at
 *  0.5 × 0.75 ≈ the old runtime hillshade strength (0.36). */
export const RELIEF_OPACITY_STOPS: readonly [zoom: number, opacity: number][] = [
  [RELIEF_MINZOOM, 0],
  [6.5, 0.75],
  [9, 1],
];

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Parse the `rgba(r, g, b, a)` strings above into 0–255 / 0–1 components. */
export function parseRgba(color: string): Rgba {
  const m = color.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
  if (!m) throw new Error(`Unparsable rgba colour: ${color}`);
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: Number(m[4]) };
}
