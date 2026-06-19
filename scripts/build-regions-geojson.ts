/**
 * WGS84 region bboxes + label anchors for MapLibre drill-down.
 * Polygons stay in data/geo/basemap.json for the legacy SVG map only —
 * Natural Earth uses bbox/label metadata until AWMC regions land (M9.9).
 *
 * Run via pnpm build:map
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { unproject } from './lib/svg-path-geo';
import type { BasemapData } from '../src/types/geo';
import type { GeoRegion } from '../src/types/geo';

const BASEMAP = join('data', 'geo', 'basemap.json');
const REGIONS = join('data', 'geo', 'regions.json');
const OUT_META = join('public', 'geo', 'regions-meta.json');

/** Hand nudges for labels (map units → applied after unproject to lon/lat offset). */
const LABEL_NUDGE: Record<string, [number, number]> = {
  'central-greece': [-0.19, 0.11],
  'ionian-islands': [0, -0.22],
  'south-aegean': [0.45, 0.06],
  'north-aegean': [0.28, -0.11],
  euboea: [0.31, 0.18],
  chalcidice: [0.09, -0.19],
};

const SUB_LABEL_NUDGE: Record<string, [number, number]> = {
  acarnania: [-0.22, 0.07],
  aetolia: [0.18, -0.05],
  phthia: [0.13, 0.06],
};

function mapUnitBboxToWgs84(bbox: number[]): [number, number, number, number] {
  const [x, y, w, h] = bbox;
  const corners = [
    unproject([x, y + h]),
    unproject([x + w, y + h]),
    unproject([x + w, y]),
    unproject([x, y]),
  ];
  const lons = corners.map((c) => c[0]);
  const lats = corners.map((c) => c[1]);
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
}

export function buildRegionsGeoJson(): { metaCount: number } {
  if (!existsSync(BASEMAP)) {
    throw new Error(`missing ${BASEMAP} — run the basemap builder first`);
  }

  const basemap = JSON.parse(readFileSync(BASEMAP, 'utf-8')) as BasemapData;
  const regionList = JSON.parse(readFileSync(REGIONS, 'utf-8')) as GeoRegion[];
  const parentById = new Map(regionList.map((r) => [r.id, r.parent]));

  type MetaEntry = {
    level: 'region' | 'subregion';
    parent: string | null;
    centroid: [number, number];
    bbox: [number, number, number, number];
    labelNudge: [number, number];
  };

  const meta: Record<string, MetaEntry> = {};

  for (const [id, bounds] of Object.entries(basemap.regionBounds)) {
    const bbox = mapUnitBboxToWgs84(bounds.bbox);
    meta[id] = {
      level: 'region',
      parent: null,
      centroid: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2],
      bbox,
      labelNudge: (LABEL_NUDGE[id] ?? [0, 0]) as [number, number],
    };
  }

  for (const [id, sub] of Object.entries(basemap.subregions ?? {})) {
    const bbox = mapUnitBboxToWgs84(sub.bbox);
    meta[id] = {
      level: 'subregion',
      parent: parentById.get(id) ?? null,
      centroid: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2],
      bbox,
      labelNudge: (SUB_LABEL_NUDGE[id] ?? [0, 0]) as [number, number],
    };
  }

  writeFileSync(OUT_META, JSON.stringify({ regions: meta }, null, 2));

  return { metaCount: Object.keys(meta).length };
}
