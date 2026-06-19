import type { FeatureCollection, Point } from 'geojson';
import type { GeoRegion } from '@/types/geo';
import type { RegionsMetaFile } from '@/features/geo/region-drilldown';

function bboxCenter(bbox: [number, number, number, number]): [number, number] {
  const [west, south, east, north] = bbox;
  return [(west + east) / 2, (south + north) / 2];
}

/**
 * Region label anchor points from WGS84 bboxes — there are no SVG region polygon
 * overlays on the Natural Earth basemap. The points feed the DOM region labels
 * (see MapLabels); they are not added to the map as SDF symbol layers.
 */
export function regionLabelsGeoJson(
  regionList: GeoRegion[],
  meta: RegionsMetaFile,
): FeatureCollection<Point> {
  const byId = new Map(regionList.map((r) => [r.id, r]));
  const features = Object.entries(meta.regions).map(([id, entry]) => {
    const region = byId.get(id);
    if (!region) return null;
    const [nudgeLon, nudgeLat] = entry.labelNudge;
    const [lon, lat] = bboxCenter(entry.bbox);
    return {
      type: 'Feature' as const,
      id,
      geometry: {
        type: 'Point' as const,
        coordinates: [lon + nudgeLon, lat + nudgeLat],
      },
      properties: {
        id,
        name: region.name,
        level: entry.level,
        parent: entry.parent,
      },
    };
  });
  return {
    type: 'FeatureCollection',
    features: features.filter((f): f is NonNullable<typeof f> => f !== null),
  };
}
