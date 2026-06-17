import type { GeoPlace } from '@/types/geo';
import type { Feature, FeatureCollection } from 'geojson';

/** Non-city POIs for the Lands map overlay (myth-sites, sanctuaries, …). */
export function placesToGeoJson(places: GeoPlace[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: places
      .filter((place) => place.kind !== 'city')
      .map(
        (place): Feature => ({
          type: 'Feature',
          id: place.id,
          geometry: {
            type: 'Point',
            coordinates: place.coordinates,
          },
          properties: {
            id: place.id,
            name: place.name,
            kind: place.kind,
            importance: place.importance,
          },
        }),
      ),
  };
}
