/**
 * WGS84 region hit polygons, bboxes + label anchors for MapLibre drill-down.
 * The hit polygons are simplified copies of the authored SVG geography: they
 * are not rendered, but prevent overlapping bboxes from selecting a neighbour.
 *
 * Run via pnpm build:map
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { basemapToGeoJson, unproject, type BasemapJson } from './lib/svg-path-geo';
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

const HIT_POLYGON_TOLERANCE = 0.0025;

function squaredSegmentDistance(
  point: [number, number],
  start: [number, number],
  end: [number, number],
): number {
  let x = start[0];
  let y = start[1];
  let dx = end[0] - x;
  let dy = end[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = end[0];
      y = end[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
    dx = point[0] - x;
    dy = point[1] - y;
  } else {
    dx = point[0] - x;
    dy = point[1] - y;
  }

  return dx * dx + dy * dy;
}

function simplifyOpenLine(points: [number, number][], tolerance: number): [number, number][] {
  if (points.length <= 2) return points;
  const threshold = tolerance * tolerance;
  let maxDistance = threshold;
  let split = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const distance = squaredSegmentDistance(points[i], points[0], points[points.length - 1]);
    if (distance > maxDistance) {
      maxDistance = distance;
      split = i;
    }
  }

  if (split === 0) return [points[0], points[points.length - 1]];
  const left = simplifyOpenLine(points.slice(0, split + 1), tolerance);
  const right = simplifyOpenLine(points.slice(split), tolerance);
  return [...left.slice(0, -1), ...right];
}

/** Douglas–Peucker for a closed ring, split opposite the seam so closure does
 * not collapse the entire polygon into a zero-length segment. */
function simplifyRing(ring: [number, number][]): [number, number][] {
  if (ring.length <= 5) return ring;
  const first = ring[0];
  let farthest = 1;
  let farthestDistance = 0;
  for (let i = 1; i < ring.length - 1; i++) {
    const dx = ring[i][0] - first[0];
    const dy = ring[i][1] - first[1];
    const distance = dx * dx + dy * dy;
    if (distance > farthestDistance) {
      farthest = i;
      farthestDistance = distance;
    }
  }
  const firstHalf = simplifyOpenLine(ring.slice(0, farthest + 1), HIT_POLYGON_TOLERANCE);
  const secondHalf = simplifyOpenLine(ring.slice(farthest), HIT_POLYGON_TOLERANCE);
  const simplified = [...firstHalf.slice(0, -1), ...secondHalf];
  return simplified.length >= 4 ? simplified : ring;
}

export function buildRegionsGeoJson(): { metaCount: number } {
  if (!existsSync(BASEMAP)) {
    throw new Error(`missing ${BASEMAP} — run the basemap builder first`);
  }

  const basemap = JSON.parse(readFileSync(BASEMAP, 'utf-8')) as BasemapData;
  const regionList = JSON.parse(readFileSync(REGIONS, 'utf-8')) as GeoRegion[];
  const parentById = new Map(regionList.map((r) => [r.id, r.parent]));
  const polygonFeatures = basemapToGeoJson(basemap as unknown as BasemapJson).regions.features;
  const polygonsById = new Map<string, [number, number][][]>();
  for (const polygon of polygonFeatures) {
    const id = polygon.properties?.regionId;
    if (typeof id !== 'string') continue;
    const ring = simplifyRing(polygon.geometry.coordinates[0] as [number, number][]);
    const existing = polygonsById.get(id) ?? [];
    existing.push(ring);
    polygonsById.set(id, existing);
  }

  type MetaEntry = {
    level: 'region' | 'subregion';
    parent: string | null;
    centroid: [number, number];
    bbox: [number, number, number, number];
    labelNudge: [number, number];
    polygons: [number, number][][];
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
      polygons: polygonsById.get(id) ?? [],
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
      polygons: polygonsById.get(id) ?? [],
    };
  }

  // This is fetched on the critical map path; compact output keeps the extra
  // hit geometry substantially cheaper than pretty-printed coordinate arrays.
  writeFileSync(OUT_META, JSON.stringify({ regions: meta }));

  return { metaCount: Object.keys(meta).length };
}
