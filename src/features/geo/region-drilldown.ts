/** Built by scripts/build-regions-geojson.ts → public/geo/regions-meta.json */
export interface RegionMetaEntry {
  level: 'region' | 'subregion';
  parent: string | null;
  centroid: [number, number];
  bbox: [number, number, number, number];
  labelNudge: [number, number];
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

/** Smallest containing top-level region for a map centre point. */
export function pickTopRegionAtPoint(
  lon: number,
  lat: number,
  meta: RegionsMetaFile,
): string | null {
  let best: { id: string; area: number } | null = null;
  for (const [id, entry] of Object.entries(meta.regions)) {
    if (entry.level !== 'region') continue;
    if (!pointInBbox(lon, lat, entry.bbox)) continue;
    const area = bboxArea(entry.bbox);
    if (!best || area < best.area) best = { id, area };
  }
  return best?.id ?? null;
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
    if (!pointInBbox(lon, lat, entry.bbox)) continue;
    const area = bboxArea(entry.bbox);
    if (!best || area < best.area) best = { id, area };
  }
  return best?.id ?? null;
}
