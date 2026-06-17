import type { GeoCity, GeoFeature, GeoPlace } from '@/types/geo';
import { fold, matchIn } from '@/features/search/match';

export type PlaceSearchKind = 'city' | 'place' | 'feature';

export interface PlaceSearchHit {
  kind: PlaceSearchKind;
  id: string;
  name: string;
  greekName?: string;
  subtitle: string;
  field: 'name' | 'greekName';
  value: string;
  start: number;
  end: number;
}

interface ScoredPlaceHit extends PlaceSearchHit {
  score: number;
}

const FIELD_WEIGHT: Record<PlaceSearchHit['field'], number> = {
  name: 3,
  greekName: 2,
};

function featureSubtitle(feature: GeoFeature): string {
  if (feature.kind === 'river') return 'River';
  if (feature.kind === 'strait') return 'Strait';
  if (feature.kind === 'mountain-range') return 'Mountain';
  return feature.kind;
}

function placeSubtitle(place: GeoPlace): string {
  if (place.kind === 'sanctuary') return 'Sanctuary';
  if (place.kind === 'myth-site') return 'Myth site';
  return place.kind;
}

/** Rank cities, POIs, and geography features against a query. */
export function searchPlaces(
  cities: GeoCity[],
  places: GeoPlace[],
  features: GeoFeature[],
  rawQuery: string,
  limit = 10,
): PlaceSearchHit[] {
  const query = fold(rawQuery.trim());
  if (!query) return [];

  const hits: ScoredPlaceHit[] = [];

  const consider = (
    kind: PlaceSearchKind,
    id: string,
    name: string,
    greekName: string | undefined,
    subtitle: string,
  ) => {
    const candidates: [PlaceSearchHit['field'], string][] = [['name', name]];
    if (greekName) candidates.push(['greekName', greekName]);

    let best: ScoredPlaceHit | null = null;
    for (const [field, value] of candidates) {
      const match = matchIn(value, query);
      if (!match) continue;
      const score = match.score + FIELD_WEIGHT[field] * 50 + (kind === 'city' ? 8 : 0);
      if (!best || score > best.score) {
        best = {
          kind,
          id,
          name,
          greekName,
          subtitle,
          field,
          value,
          start: match.start,
          end: match.end,
          score,
        };
      }
    }
    if (best) hits.push(best);
  };

  for (const city of cities) {
    consider('city', city.id, city.name, city.greekName, 'City');
  }
  for (const place of places) {
    if (place.kind === 'city') continue;
    consider('place', place.id, place.name, place.greekName, placeSubtitle(place));
  }
  for (const feature of features) {
    consider('feature', feature.id, feature.name, feature.greekName, featureSubtitle(feature));
  }

  hits.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return hits.slice(0, limit);
}
