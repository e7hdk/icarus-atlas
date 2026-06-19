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
