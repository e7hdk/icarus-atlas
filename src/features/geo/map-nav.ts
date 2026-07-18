import type { GeoFeature } from '@/types/geo';

/** Target zoom when flying to a POI from search, hash, or map click. */
export const FLY_ZOOM_CITY = 10;
export const FLY_ZOOM_PLACE = 9.5;
export const FLY_ZOOM_RIVER = 8.5;
export const FLY_ZOOM_MOUNTAIN = 9;

export function flyZoomForFeature(feature: GeoFeature): number {
  if (feature.kind === 'mountain-range' || feature.geometry.type === 'Polygon') {
    return FLY_ZOOM_MOUNTAIN;
  }
  return FLY_ZOOM_RIVER;
}

/** Never zoom out when already closer; always reach at least the target level. */
export function flyZoomFrom(current: number, target: number): number {
  return Math.max(current, target);
}

/**
 * Camera choreography — the "walking onto the map" tilt.
 *
 * Pitch is a pure function of zoom: flat 2D atlas at basin view, then the
 * camera leans in as you approach a region, reaching full tilt at city scale.
 * Because it is zoom-driven, every zoom animation (wheel, flyTo, search)
 * eases the tilt for free, and the pose is always reproducible from the hash.
 */
export const PITCH_ZOOM_START = 5.8;
export const PITCH_ZOOM_FULL = 9;
/** Full tilt — the "approach" pose, and the choreography's ceiling (second
 *  UX field round). A former second band leaned on to a 74° near-horizon
 *  pose; even with the ground-vote focus (ground-focus.ts) answering "where
 *  are we" correctly, at 74° the visible horizon band stacks the far shore's
 *  labels into a wall while the near field sits sparse — composition, not
 *  focus, was the residual bug. 55° keeps the lean-in drama with an honest
 *  field of view. */
export const PITCH_MAX = 55;
export const MAX_PITCH_LIMIT = 60;

const smoothstep = (t: number): number => t * t * (3 - 2 * t);

export function pitchForZoom(zoom: number): number {
  if (zoom <= PITCH_ZOOM_START) return 0;
  const t = Math.min(1, (zoom - PITCH_ZOOM_START) / (PITCH_ZOOM_FULL - PITCH_ZOOM_START));
  return PITCH_MAX * smoothstep(t);
}

/** Zoom past which the "return to the basin" control surfaces. */
export const ZOOM_RETURN_VISIBLE = 5.6;

/**
 * The 3D terrain mesh only runs while the choreography tilts the camera.
 * Below the tilt band the mesh adds nothing visually (pitch is 0; the relief
 * look comes from the cheap hillshade/color-relief rasters) but costs a lot:
 * terrain forces every draped layer through render-to-texture and makes every
 * label/marker projection elevation-aware. Hysteresis stops threshold thrash.
 */
/** Placed where the mesh's arrival is mathematically invisible: at z6.0 the
 *  choreography's pitch is ~0.6° (smoothstep barely off the floor), so the
 *  1.8× mountains rise with no visible pop — enabling later (the old z6.8,
 *  pitch ~13°) made every moveend a visible terrain jump. The z6.0–6.8 band
 *  pays the render-to-texture path a little earlier; that is the price of a
 *  seamless reveal. */
export const TERRAIN_ZOOM_ON = 6.0;
export const TERRAIN_ZOOM_HYSTERESIS = 0.4;
