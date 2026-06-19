import type { GeoFeature } from '@/types/geo';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

/** MapLibre overlay source built from data/geo/features.json entries. */
export function featuresToGeoJson(features: GeoFeature[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: features.map(
      (feature): Feature => ({
        type: 'Feature',
        id: feature.id,
        geometry: feature.geometry as Geometry,
        properties: {
          id: feature.id,
          name: feature.name,
          kind: feature.kind,
          importance: feature.importance,
        },
      }),
    ),
  };
}
