/**
 * SVG path → WGS84 helpers for the Wikimedia "Greece (ancient)" basemap series.
 * Calibration matches scripts/build-basemap.ts (plate-carrée fit).
 */
import { feature, featureCollection } from '@turf/helpers';
import type {
  Feature,
  FeatureCollection,
  LineString,
  MultiLineString,
  Polygon,
} from 'geojson';

export const CAL = {
  lonScale: 847.3,
  lonOffset: -16446,
  latScale: 1076.4,
  latOffset: 44946,
} as const;

export function unproject([x, y]: [number, number]): [number, number] {
  return [
    round5((x - CAL.lonOffset) / CAL.lonScale),
    round5((CAL.latOffset - y) / CAL.latScale),
  ];
}

function round5(n: number): number {
  return Math.round(n * 1e5) / 1e5;
}

type Matrix = [number, number, number, number, number, number];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

function parseTransform(transform: string): Matrix {
  let m = IDENTITY;
  const fnRe = /(translate|matrix|scale)\(([^)]*)\)/g;
  let fn: RegExpExecArray | null;
  while ((fn = fnRe.exec(transform))) {
    const args = fn[2].split(/[\s,]+/).filter(Boolean).map(Number);
    let next: Matrix = IDENTITY;
    if (fn[1] === 'translate') next = [1, 0, 0, 1, args[0], args[1] ?? 0];
    else if (fn[1] === 'scale') next = [args[0], 0, 0, args[1] ?? args[0], 0, 0];
    else next = args as Matrix;
    m = multiply(m, next);
  }
  return m;
}

function multiply(a: Matrix, b: Matrix): Matrix {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

/** Collect on-curve endpoints of a path in absolute map coordinates. */
export function pathPoints(d: string, transform = ''): [number, number][] {
  const m = parseTransform(transform);
  const points: [number, number][] = [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];
  let i = 0;
  let cmd = '';
  const read = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    switch (cmd.toLowerCase()) {
      case 'm':
      case 'l':
      case 't': {
        const nx = read();
        const ny = read();
        x = rel ? x + nx : nx;
        y = rel ? y + ny : ny;
        if (cmd.toLowerCase() === 'm') {
          startX = x;
          startY = y;
          cmd = rel ? 'l' : 'L';
        }
        break;
      }
      case 'h': {
        const nx = read();
        x = rel ? x + nx : nx;
        break;
      }
      case 'v': {
        const ny = read();
        y = rel ? y + ny : ny;
        break;
      }
      case 'c': {
        read(); read(); read(); read();
        const nx = read();
        const ny = read();
        x = rel ? x + nx : nx;
        y = rel ? y + ny : ny;
        break;
      }
      case 's':
      case 'q': {
        read(); read();
        const nx = read();
        const ny = read();
        x = rel ? x + nx : nx;
        y = rel ? y + ny : ny;
        break;
      }
      case 'a': {
        read(); read(); read(); read(); read();
        const nx = read();
        const ny = read();
        x = rel ? x + nx : nx;
        y = rel ? y + ny : ny;
        break;
      }
      case 'z':
        x = startX;
        y = startY;
        continue;
      default:
        i++;
        continue;
    }
    points.push([m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]);
  }
  return points.filter(([px, py]) => Number.isFinite(px) && Number.isFinite(py));
}

function isClosed(d: string, points: [number, number][]): boolean {
  if (/[zZ]\s*$/.test(d.trim())) return true;
  if (points.length < 3) return false;
  const [x0, y0] = points[0];
  const [x1, y1] = points[points.length - 1];
  return Math.hypot(x0 - x1, y0 - y1) < 2;
}

export interface SvgPath {
  d: string;
  transform?: string;
}

function pathToPolygonFeature(
  { d, transform = '' }: SvgPath,
  properties: Record<string, unknown> = {},
): Feature<Polygon> | null {
  const pts = pathPoints(d, transform);
  if (pts.length < 3 || !isClosed(d, pts)) return null;
  const ring = pts.map(unproject);
  const [a0, a1] = ring[0];
  const [b0, b1] = ring[ring.length - 1];
  if (a0 !== b0 || a1 !== b1) ring.push(ring[0]);
  return feature({ type: 'Polygon', coordinates: [ring] }, properties);
}

function pathToLineFeature(
  { d, transform = '' }: SvgPath,
  properties: Record<string, unknown> = {},
): Feature<LineString> | null {
  const pts = pathPoints(d, transform);
  if (pts.length < 2) return null;
  return feature(
    { type: 'LineString', coordinates: pts.map(unproject) },
    properties,
  );
}

function mapCoordsToPolygon(
  points: [number, number][],
  properties: Record<string, unknown>,
): Feature<Polygon> | null {
  if (points.length < 3) return null;
  const ring = points.map(unproject);
  const [a0, a1] = ring[0];
  const [b0, b1] = ring[ring.length - 1];
  if (a0 !== b0 || a1 !== b1) ring.push(ring[0]);
  return feature({ type: 'Polygon', coordinates: [ring] }, properties);
}

export interface BasemapJson {
  land: SvgPath[];
  foreign: SvgPath[];
  lakes: SvgPath[];
  coast: SvgPath[];
  regions: Record<string, SvgPath[]>;
  regionExtensions?: Record<string, { points: [number, number][] }>;
  subregions?: Record<string, { points: [number, number][] }>;
}

export interface BasemapGeoLayers {
  detailLand: FeatureCollection<Polygon>;
  detailCoast: FeatureCollection<LineString | MultiLineString>;
  detailLakes: FeatureCollection<Polygon>;
  regions: FeatureCollection<Polygon>;
}

export function basemapToGeoJson(basemap: BasemapJson): BasemapGeoLayers {
  const landFeatures: Feature<Polygon>[] = [];
  for (const path of [...basemap.land, ...basemap.foreign]) {
    const f = pathToPolygonFeature(path);
    if (f) landFeatures.push(f);
  }
  for (const [id, ext] of Object.entries(basemap.regionExtensions ?? {})) {
    const f = mapCoordsToPolygon(ext.points, { regionId: id, synthetic: true });
    if (f) landFeatures.push(f);
  }

  const coastFeatures: Feature<LineString>[] = [];
  for (const path of basemap.coast) {
    const f = pathToLineFeature(path);
    if (f) coastFeatures.push(f);
  }

  const lakeFeatures: Feature<Polygon>[] = [];
  for (const path of basemap.lakes) {
    const f = pathToPolygonFeature(path);
    if (f) lakeFeatures.push(f);
  }

  const regionFeatures: Feature<Polygon>[] = [];
  for (const [id, paths] of Object.entries(basemap.regions)) {
    for (const path of paths) {
      const f = pathToPolygonFeature(path, { regionId: id, level: 'region' });
      if (f) regionFeatures.push(f);
    }
  }
  for (const [id, ext] of Object.entries(basemap.regionExtensions ?? {})) {
    const f = mapCoordsToPolygon(ext.points, { regionId: id, level: 'region', synthetic: true });
    if (f) regionFeatures.push(f);
  }
  for (const [id, sub] of Object.entries(basemap.subregions ?? {})) {
    const f = mapCoordsToPolygon(sub.points, { regionId: id, level: 'subregion' });
    if (f) regionFeatures.push(f);
  }

  return {
    detailLand: featureCollection(landFeatures),
    detailCoast: featureCollection(coastFeatures),
    detailLakes: featureCollection(lakeFeatures),
    regions: featureCollection(regionFeatures),
  };
}
