/** Built by scripts/build-regions-geojson.ts → public/geo/regions-meta.json */
export interface RegionMetaEntry {
  level: 'region' | 'subregion';
  parent: string | null;
  centroid: [number, number];
  bbox: [number, number, number, number];
  labelNudge: [number, number];
  /** Simplified WGS84 rings used for hit-testing only. */
  polygons?: [number, number][][];
}

export interface RegionsMetaFile {
  regions: Record<string, RegionMetaEntry>;
}

/** Zoom at which sub-regions auto-reveal (LANDS_PLAN §4.2: level 3–4). */
export const ZOOM_SUBREGION = 5.2;

/** Hide top-level region labels above this zoom. */
export const ZOOM_TOP_LABELS = 5.0;

/** Show city names without a focused parent above this zoom. */
export const ZOOM_CITY_NAMES = 6.8;

function pointInBbox(lon: number, lat: number, bbox: RegionMetaEntry['bbox']): boolean {
  const [west, south, east, north] = bbox;
  return lon >= west && lon <= east && lat >= south && lat <= north;
}

function bboxArea(bbox: RegionMetaEntry['bbox']): number {
  const [west, south, east, north] = bbox;
  return Math.max(0, east - west) * Math.max(0, north - south);
}

function pointOnSegment(
  lon: number,
  lat: number,
  start: [number, number],
  end: [number, number],
): boolean {
  const cross = (lon - start[0]) * (end[1] - start[1]) -
    (lat - start[1]) * (end[0] - start[0]);
  if (Math.abs(cross) > 1e-9) return false;
  return lon >= Math.min(start[0], end[0]) && lon <= Math.max(start[0], end[0]) &&
    lat >= Math.min(start[1], end[1]) && lat <= Math.max(start[1], end[1]);
}

function pointInRing(lon: number, lat: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, previous = ring.length - 1; i < ring.length; previous = i++) {
    const a = ring[previous];
    const b = ring[i];
    if (pointOnSegment(lon, lat, a, b)) return true;
    if (
      (a[1] > lat) !== (b[1] > lat) &&
      lon < ((b[0] - a[0]) * (lat - a[1])) / (b[1] - a[1]) + a[0]
    ) {
      inside = !inside;
    }
  }
  return inside;
}

function containsPoint(lon: number, lat: number, entry: RegionMetaEntry): boolean {
  if (!pointInBbox(lon, lat, entry.bbox)) return false;
  if (!entry.polygons?.length) return true;
  return entry.polygons.some((ring) => pointInRing(lon, lat, ring));
}

/** Smallest containing top-level region for a map centre point. */
export function pickTopRegionAtPoint(
  lon: number,
  lat: number,
  meta: RegionsMetaFile,
): string | null {
  let best: { id: string; area: number } | null = null;
  let bboxFallback: { id: string; area: number } | null = null;
  for (const [id, entry] of Object.entries(meta.regions)) {
    if (entry.level !== 'region') continue;
    if (!pointInBbox(lon, lat, entry.bbox)) continue;
    const area = bboxArea(entry.bbox);
    if (!containsPoint(lon, lat, entry)) {
      if (!bboxFallback || area < bboxFallback.area) bboxFallback = { id, area };
      continue;
    }
    if (!best || area < best.area) best = { id, area };
  }
  // Gazetteer points can sit a few metres offshore. In that narrow case the
  // smallest bbox preserves the legacy island-friendly fallback without ever
  // overriding a genuine polygon hit (as it previously did around Thebes).
  return best?.id ?? bboxFallback?.id ?? null;
}

/** Region under the cursor — sub-region when drilled in, else top-level. */
export function pickRegionAtPoint(
  lon: number,
  lat: number,
  meta: RegionsMetaFile,
  detailParentId: string | null,
  zoom: number,
): string | null {
  if (zoom >= ZOOM_SUBREGION && detailParentId) {
    return (
      pickSubRegionAtPoint(lon, lat, detailParentId, meta) ??
      pickTopRegionAtPoint(lon, lat, meta)
    );
  }
  return pickTopRegionAtPoint(lon, lat, meta);
}

/** Smallest containing sub-region under a parent. */
export function pickSubRegionAtPoint(
  lon: number,
  lat: number,
  parentId: string,
  meta: RegionsMetaFile,
): string | null {
  let best: { id: string; area: number } | null = null;
  for (const [id, entry] of Object.entries(meta.regions)) {
    if (entry.level !== 'subregion' || entry.parent !== parentId) continue;
    if (!containsPoint(lon, lat, entry)) continue;
    const area = bboxArea(entry.bbox);
    if (!best || area < best.area) best = { id, area };
  }
  return best?.id ?? null;
}
