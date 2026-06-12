import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { geoCitySchema, geoRegionSchema, lineageSchema } from '@/lib/schemas';
import type { BasemapData, GeoCity, GeoRegion, Lineage } from '@/types/geo';

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

/** Loads and validates the curated city list. */
export async function loadCities(): Promise<GeoCity[]> {
  const raw = JSON.parse(await readFile(path.join(GEO_DIR, 'cities.json'), 'utf-8'));
  return geoCitySchema.array().parse(raw) as GeoCity[];
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
