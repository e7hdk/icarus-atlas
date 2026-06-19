/**
 * Base hydrography — turns bulk OSM `waterway=river` extracts into a faint,
 * decorative river network (public/geo/rivers-base.json) for the Lands map.
 *
 * Two-tier rivers: this layer is the DENSITY (every river + tributary, thin and
 * faint, non-interactive); the curated mythic rivers in data/geo/features.json
 * are drawn brighter on top. Reads every data/geo/raw/osm/bulk-rivers-*.json
 * cache, so the roster grows by adding more regional bulk fetches.
 *
 * Data © OpenStreetMap contributors (ODbL) — attributed in the map credits.
 *
 *   pnpm tsx scripts/build-rivers-base.ts
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OSM_DIR = join('data', 'geo', 'raw', 'osm');
const OUT = join('public', 'geo', 'rivers-base.json');

/** Clip to the Mediterranean basin the map shows (lon/lat). */
const BASIN: [number, number, number, number] = [-8, 28, 46, 48];
/** Ramer–Douglas–Peucker tolerance in degrees (~110 m) — kills jitter, keeps curves. */
const SIMPLIFY_DEG = 0.0012;
/** Drop fragments shorter than this (km) — declutters the noise of tiny stubs. */
const MIN_LEN_KM = 2;
const COORD_DP = 4;

type LL = [number, number];

function distKm(a: LL, b: LL): number {
  const dx = (a[0] - b[0]) * 111 * Math.cos(((a[1] + b[1]) / 2) * (Math.PI / 180));
  const dy = (a[1] - b[1]) * 111;
  return Math.hypot(dx, dy);
}
function lenKm(c: LL[]): number {
  let s = 0;
  for (let i = 1; i < c.length; i += 1) s += distKm(c[i - 1], c[i]);
  return s;
}
function inBasin(c: LL[]): boolean {
  const [w, s, e, n] = BASIN;
  return c.some(([lon, lat]) => lon >= w && lon <= e && lat >= s && lat <= n);
}

/** Perpendicular distance of p from segment a–b, in degrees. */
function perpDist(p: LL, a: LL, b: LL): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const m2 = dx * dx + dy * dy;
  if (m2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / m2;
  const cx = a[0] + t * dx;
  const cy = a[1] + t * dy;
  return Math.hypot(p[0] - cx, p[1] - cy);
}
function rdp(pts: LL[], eps: number): LL[] {
  if (pts.length < 3) return pts;
  let maxD = 0;
  let idx = 0;
  for (let i = 1; i < pts.length - 1; i += 1) {
    const d = perpDist(pts[i], pts[0], pts[pts.length - 1]);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD <= eps) return [pts[0], pts[pts.length - 1]];
  const left = rdp(pts.slice(0, idx + 1), eps);
  const right = rdp(pts.slice(idx), eps);
  return [...left.slice(0, -1), ...right];
}
function round(c: LL[]): LL[] {
  const f = 10 ** COORD_DP;
  return c.map(([lon, lat]) => [Math.round(lon * f) / f, Math.round(lat * f) / f]);
}

function main() {
  const files = existsSync(OSM_DIR)
    ? readdirSync(OSM_DIR).filter((f) => f.startsWith('bulk-rivers-') && f.endsWith('.json'))
    : [];
  if (files.length === 0) {
    console.error('No bulk-rivers-*.json caches in', OSM_DIR);
    process.exit(1);
  }

  const features: object[] = [];
  let kept = 0;
  let dropped = 0;
  const seen = new Set<number>(); // OSM way id, dedupe across overlapping caches

  for (const file of files) {
    const doc = JSON.parse(readFileSync(join(OSM_DIR, file), 'utf-8')) as {
      elements?: { type: string; id: number; geometry?: { lon: number; lat: number }[] }[];
    };
    for (const el of doc.elements ?? []) {
      if (el.type !== 'way' || !el.geometry || el.geometry.length < 2) continue;
      if (seen.has(el.id)) continue;
      seen.add(el.id);
      const raw = el.geometry.map((p) => [p.lon, p.lat] as LL);
      if (!inBasin(raw)) continue;
      const simplified = round(rdp(raw, SIMPLIFY_DEG));
      const len = lenKm(simplified);
      if (len < MIN_LEN_KM || simplified.length < 2) {
        dropped += 1;
        continue;
      }
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: simplified },
        properties: { len: Math.round(len) },
      });
      kept += 1;
    }
  }

  const fc = { type: 'FeatureCollection', features };
  writeFileSync(OUT, JSON.stringify(fc));
  const kb = (JSON.stringify(fc).length / 1024).toFixed(0);
  const totalPts = features.reduce(
    (s, f) => s + ((f as { geometry: { coordinates: LL[] } }).geometry.coordinates.length),
    0,
  );
  console.log(
    `rivers-base: ${kept} rivers (${dropped} tiny dropped), ${totalPts} pts, ${kb} KB → ${OUT}`,
  );
}

main();
