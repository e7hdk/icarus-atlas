import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  geoFeatureSchema,
  geoPlaceSchema,
  geoRegionSchema,
  lineageSchema,
} from '@/lib/schemas';
import type {
  BasemapData,
  GeoCity,
  GeoFeature,
  GeoPlace,
  GeoRegion,
  Lineage,
} from '@/types/geo';
import { placeToCity } from '@/types/geo';

const GEO_DIR = path.join(process.cwd(), 'data', 'geo');
const LINEAGE_DIR = path.join(process.cwd(), 'data', 'lineages');

/** Loads the generated basemap geometry. Server-side only (build/render time). */
export async function loadBasemap(): Promise<BasemapData> {
  return JSON.parse(await readFile(path.join(GEO_DIR, 'basemap.json'), 'utf-8')) as BasemapData;
}

/** Loads and validates curated region metadata. */
export async function loadRegions(): Promise<GeoRegion[]> {
  const raw = JSON.parse(await readFile(path.join(GEO_DIR, 'regions.json'), 'utf-8'));
  return geoRegionSchema.array().parse(raw) as GeoRegion[];
}

/** Loads and validates all point POIs on the Lands map. */
export async function loadPlaces(): Promise<GeoPlace[]> {
  const raw = JSON.parse(await readFile(path.join(GEO_DIR, 'places.json'), 'utf-8'));
  return geoPlaceSchema.array().parse(raw) as GeoPlace[];
}

/** Loads curated cities — flagship city places from places.json. */
export async function loadCities(): Promise<GeoCity[]> {
  const places = await loadPlaces();
  return places.filter((p) => p.kind === 'city').map(placeToCity);
}

/** Loads linear and areal geography features (rivers, mountains, …). */
export async function loadFeatures(): Promise<GeoFeature[]> {
  const raw = JSON.parse(await readFile(path.join(GEO_DIR, 'features.json'), 'utf-8'));
  return geoFeatureSchema.array().parse(raw) as GeoFeature[];
}

/** Royal succession for a city; null while the lineage is still being researched. */
export async function loadLineage(cityId: string): Promise<Lineage | null> {
  try {
    const raw = JSON.parse(await readFile(path.join(LINEAGE_DIR, `${cityId}.json`), 'utf-8'));
    return lineageSchema.parse(raw) as Lineage;
  } catch {
    return null;
  }
}
