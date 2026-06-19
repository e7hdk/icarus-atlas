import { ZOOM_FEATURE_LABELS } from '@/features/geo/map-theme';
import { pickTopRegionAtPoint, ZOOM_SUBREGION, type RegionsMetaFile } from '@/features/geo/region-drilldown';
import type { FeatureImportance, GeoFeature, GeoRegion } from '@/types/geo';

const LINE_FEATURE_KINDS = new Set<GeoFeature['kind']>(['river', 'strait']);

/** Top-level region id for a curated sub-region (mirrors city label gating). */
export function featureFamily(regionId: string | null, byId: Map<string, GeoRegion>): string | null {
  if (!regionId) return null;
  const region = byId.get(regionId);
  return region?.parent ?? regionId;
}

function lineCoordinates(feature: GeoFeature): [number, number][] {
  if (feature.geometry.type === 'LineString') {
    return feature.geometry.coordinates as [number, number][];
  }
  const ring = (feature.geometry.coordinates as [number, number][][])[0];
  return ring ?? [];
}

/** True when any vertex of the feature lies inside a top-level region bbox. */
export function featureIntersectsTopRegion(
  feature: GeoFeature,
  regionId: string,
  meta: RegionsMetaFile,
): boolean {
  const entry = meta.regions[regionId];
  if (!entry || entry.level !== 'region') return false;
  const [west, south, east, north] = entry.bbox;
  return lineCoordinates(feature).some(
    ([lon, lat]) => lon >= west && lon <= east && lat >= south && lat <= north,
  );
}

function regionalZoomThreshold(importance: FeatureImportance): number {
  return importance === 'minor' ? ZOOM_SUBREGION + 0.5 : ZOOM_SUBREGION;
}

function globalZoomThreshold(importance: FeatureImportance): number {
  return importance === 'minor' ? ZOOM_FEATURE_LABELS + 1.5 : ZOOM_FEATURE_LABELS;
}

/** Live parent region under the map centre (same signal as MapLabels city gating). */
export function liveMapParent(
  zoom: number,
  center: { lng: number; lat: number },
  meta: RegionsMetaFile | null,
): string | null {
  if (!meta || zoom < ZOOM_SUBREGION) return null;
  return pickTopRegionAtPoint(center.lng, center.lat, meta);
}

/** Whether a river/strait line or label should render at the current view. */
export function isLinearFeatureVisible(
  feature: GeoFeature,
  zoom: number,
  liveParent: string | null,
  byId: Map<string, GeoRegion>,
  meta: RegionsMetaFile | null,
): boolean {
  if (!LINE_FEATURE_KINDS.has(feature.kind)) return true;
  if (zoom >= globalZoomThreshold(feature.importance)) return true;
  if (!liveParent || zoom < regionalZoomThreshold(feature.importance)) return false;

  const family = featureFamily(feature.region, byId);
  if (family === liveParent) return true;
  if (!feature.region && meta) return featureIntersectsTopRegion(feature, liveParent, meta);
  return false;
}
