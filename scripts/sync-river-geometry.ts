/**
 * Refreshes river/strait LineStrings in data/geo/features.json from cached OSM
 * extracts and Natural Earth centerlines.
 *
 * Prefer the orchestrator: pnpm refresh:rivers
 * This module is also imported by refresh-river-geometry.ts.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import bboxClip from '@turf/bbox-clip';
import { feature } from '@turf/helpers';
import type { FeatureCollection } from 'geojson';
import {
  OSM_NAME_ALIASES,
  type LonLat,
  type RiverAnchor,
  RIVER_ANCHORS,
} from './lib/river-geometry-recipes';

const FEATURES_FILE = join('data', 'geo', 'features.json');
const OSM_DIR = join('data', 'geo', 'raw', 'osm');
const NE_RIVERS = join('data', 'geo', 'raw', 'natural-earth', 'ne_10m_rivers_lake_centerlines.geojson');

const BASIN_BBOX: [number, number, number, number] = [-8, 20, 46, 48];
const COORD_DP = 4;
/** Endpoint snap tolerance (~120 m at Greek latitudes). */
const SNAP_DEG = 0.0012;

interface OvertureWay {
  type: 'way';
  geometry?: { lon: number; lat: number }[];
  tags?: Record<string, string>;
}

interface FeatureEntry {
  id: string;
  geometry: { type: 'LineString'; coordinates: LonLat[] };
  [key: string]: unknown;
}

/** Mythic anchor — see RIVER_ANCHORS in river-geometry-recipes.ts */
const ANCHORS = RIVER_ANCHORS;

function roundLine(coords: LonLat[]): LonLat[] {
  const f = 10 ** COORD_DP;
  return coords.map(([lon, lat]) => [Math.round(lon * f) / f, Math.round(lat * f) / f]);
}

function distDeg(a: LonLat, b: LonLat): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function distKm(a: LonLat, b: LonLat): number {
  const dx = (a[0] - b[0]) * 111 * Math.cos(((a[1] + b[1]) / 2) * (Math.PI / 180));
  const dy = (a[1] - b[1]) * 111;
  return Math.hypot(dx, dy);
}

function lineLengthKm(coords: LonLat[]): number {
  let len = 0;
  for (let i = 1; i < coords.length; i++) len += distKm(coords[i - 1], coords[i]);
  return len;
}

function minDistToPoint(line: LonLat[], point: LonLat): number {
  let min = Infinity;
  for (const p of line) min = Math.min(min, distKm(p, point));
  return min;
}

function wayToLine(way: OvertureWay): LonLat[] {
  return (way.geometry ?? []).map((p) => [p.lon, p.lat]);
}

function loadOsm(file: string): OvertureWay[] {
  const path = join(OSM_DIR, file);
  if (!existsSync(path)) return [];
  const text = readFileSync(path, 'utf-8');
  if (!text.startsWith('{')) return [];
  const doc = JSON.parse(text) as { elements?: OvertureWay[] };
  return (doc.elements ?? []).filter((e) => e.type === 'way' && !!e.geometry?.length);
}

/** Chain OSM ways whose endpoints snap together; returns all connected chains. */
function stitchWays(ways: OvertureWay[]): LonLat[][] {
  const segments = ways.map(wayToLine).filter((s) => s.length >= 2);
  if (segments.length === 0) return [];

  const used = new Set<number>();
  const chains: LonLat[][] = [];

  const tryAppend = (chain: LonLat[], seg: LonLat[]): LonLat[] | null => {
    const head = chain[0];
    const tail = chain[chain.length - 1];
    const s0 = seg[0];
    const s1 = seg[seg.length - 1];
    if (distDeg(tail, s0) <= SNAP_DEG) return [...chain, ...seg.slice(1)];
    if (distDeg(tail, s1) <= SNAP_DEG) return [...chain, ...seg.slice(0, -1).reverse()];
    if (distDeg(head, s1) <= SNAP_DEG) return [...seg.slice(0, -1), ...chain];
    if (distDeg(head, s0) <= SNAP_DEG) return [...seg.slice(1).reverse(), ...chain];
    return null;
  };

  for (let start = 0; start < segments.length; start++) {
    if (used.has(start)) continue;
    let chain = [...segments[start]];
    used.add(start);
    let extended = true;
    while (extended) {
      extended = false;
      for (let j = 0; j < segments.length; j++) {
        if (used.has(j)) continue;
        const next = tryAppend(chain, segments[j]);
        if (next) {
          chain = next;
          used.add(j);
          extended = true;
        }
      }
    }
    chains.push(chain);
  }
  return chains;
}

function pickBestChain(chains: LonLat[][], anchor?: RiverAnchor): LonLat[] | null {
  if (chains.length === 0) return null;

  const scoreChain = (chain: LonLat[]) => {
    const len = lineLengthKm(chain);
    const anchorDist = anchor ? minDistToPoint(chain, anchor.point) : 0;
    const mouthDist = anchor?.mouth ? minDistToPoint(chain, anchor.mouth) : 0;
    return { chain, len, anchorDist, mouthDist };
  };

  const scored = chains.map(scoreChain);

  if (anchor) {
    const within = scored.filter((s) => s.anchorDist <= anchor.maxDistKm);
    const pool = within.length > 0 ? within : scored;
    // Rivers with a sea mouth: prefer the main stem (longest chain), not a gorge fragment.
    if (anchor.mouth) {
      pool.sort(
        (a, b) => b.len - a.len || a.mouthDist - b.mouthDist || a.anchorDist - b.anchorDist,
      );
    } else {
      pool.sort((a, b) => a.anchorDist - b.anchorDist || b.len - a.len);
    }
    return pool[0]?.chain ?? null;
  }

  scored.sort((a, b) => b.len - a.len);
  return scored[0]?.chain ?? null;
}

/** Append a smooth tail when OSM stops short of the sea mouth. */
function extendToMouth(line: LonLat[], mouth: LonLat, maxGapKm: number): LonLat[] {
  const headDist = distKm(line[0], mouth);
  const tailDist = distKm(line[line.length - 1], mouth);
  const extendAtTail = tailDist <= headDist;
  const from = extendAtTail ? line[line.length - 1] : line[0];
  const gap = extendAtTail ? tailDist : headDist;
  if (gap <= maxGapKm) return line;

  const steps = Math.min(24, Math.max(6, Math.round(gap / 3)));
  const ext: LonLat[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    ext.push([
      from[0] + (mouth[0] - from[0]) * t,
      from[1] + (mouth[1] - from[1]) * t,
    ]);
  }

  if (extendAtTail) return [...line, ...ext.slice(1)];
  return [...ext.reverse(), ...line.slice(1)];
}

/** Splice a hand-traced lower reach when OSM ends above the delta. */
function extendWithPath(line: LonLat[], path: LonLat[], maxJoinKm = 8): LonLat[] {
  const tail = line[line.length - 1];
  const head = line[0];
  const tailJoin = minDistToPoint(path, tail);
  const headJoin = minDistToPoint(path, head);

  const spliceAtTail = () => {
    let startIdx = 0;
    let best = Infinity;
    for (let i = 0; i < path.length; i++) {
      const d = distKm(path[i], tail);
      if (d < best) {
        best = d;
        startIdx = i;
      }
    }
    if (best > maxJoinKm) return line;
    return [...line, ...path.slice(startIdx + 1)];
  };

  if (tailJoin <= headJoin) return spliceAtTail();

  let startIdx = path.length - 1;
  let best = Infinity;
  for (let i = 0; i < path.length; i++) {
    const d = distKm(path[i], head);
    if (d < best) {
      best = d;
      startIdx = i;
    }
  }
  if (best <= maxJoinKm) return [...path.slice(0, startIdx), ...line];
  return spliceAtTail();
}

const PENEUS_DELTA: LonLat[] = [
  [22.428, 39.647],
  [22.442, 39.636],
  [22.455, 39.625],
  [22.470, 39.612],
  [22.485, 39.6],
  [22.502, 39.588],
  [22.52, 39.575],
  [22.540, 39.560],
  [22.56, 39.545],
  [22.585, 39.528],
  [22.61, 39.51],
  [22.640, 39.490],
  [22.67, 39.47],
  [22.690, 39.455],
  [22.710, 39.442],
  [22.725, 39.433],
  [22.735, 39.425],
  [22.755, 39.410],
  [22.775, 39.398],
  [22.805, 39.385],
  [22.838, 39.372],
  [22.870, 39.360],
  [22.902, 39.350],
  [22.934, 39.339],
];

function osmRiverInBbox(
  file: string,
  bbox: [number, number, number, number],
  anchor?: RiverAnchor,
  deltaPath?: LonLat[],
): LonLat[] | null {
  const [west, south, east, north] = bbox;
  const ways = loadOsm(file).filter((way) => {
    const line = wayToLine(way);
    return line.some(([lon, lat]) => lon >= west && lon <= east && lat >= south && lat <= north);
  });
  const chains = stitchWays(ways);
  const best = pickBestChain(chains, anchor);
  return applyMouthExtension(best, anchor, deltaPath);
}

const ACHELOUS_DELTA: LonLat[] = [
  [21.105, 38.338],
  [21.18, 38.38],
  [21.26, 38.43],
  [21.34, 38.48],
  [21.4, 38.52],
  [21.43, 38.55],
];

/** Decimate stem and delta separately so uniform sampling does not collapse the mouth path. */
function buildStemWithDelta(
  stem: LonLat[],
  delta: LonLat[],
  stemMax = 440,
  deltaMax = 60,
  maxJoinKm = 8,
): LonLat[] {
  const stemDec = decimate(stem, stemMax);
  const tail = stemDec[stemDec.length - 1];
  let startIdx = 0;
  let best = Infinity;
  for (let i = 0; i < delta.length; i++) {
    const d = distKm(delta[i], tail);
    if (d < best) {
      best = d;
      startIdx = i;
    }
  }
  if (best > maxJoinKm) return stemDec;
  const deltaDec = decimate(delta.slice(startIdx + 1), deltaMax);
  return deltaDec.length > 0 ? [...stemDec, ...deltaDec] : stemDec;
}

function applyMouthExtension(line: LonLat[] | null, anchor?: RiverAnchor, deltaPath?: LonLat[]): LonLat[] | null {
  if (!line || !anchor?.mouth) return line;
  if (deltaPath) {
    const merged = buildStemWithDelta(line, deltaPath);
    if (minDistToPoint(merged, anchor.mouth) <= (anchor.mouthMaxDistKm ?? 5)) return merged;
  }
  return extendToMouth(line, anchor.mouth, anchor.mouthMaxDistKm ?? 5);
}

function osmRiverByTag(
  file: string,
  tagMatch: (tags: Record<string, string>) => boolean,
  anchor?: RiverAnchor,
  extraFilter?: (w: OvertureWay) => boolean,
  deltaPath?: LonLat[],
): LonLat[] | null {
  const ways = loadOsm(file).filter((w) => {
    if (!w.tags || !tagMatch(w.tags)) return false;
    return extraFilter ? extraFilter(w) : true;
  });
  const chains = stitchWays(ways);
  const best = pickBestChain(chains, anchor);
  return applyMouthExtension(best, anchor, deltaPath);
}

function lineInBbox(line: LonLat[], bbox: [number, number, number, number]): boolean {
  const [w, s, e, n] = bbox;
  return line.some(([lon, lat]) => lon >= w && lon <= e && lat >= s && lat <= n);
}

/** Keep file size sane while preserving curves. */
function decimate(coords: LonLat[], maxPoints: number): LonLat[] {
  if (coords.length <= maxPoints) return coords;
  const out: LonLat[] = [coords[0]];
  const step = (coords.length - 1) / (maxPoints - 1);
  for (let i = 1; i < maxPoints - 1; i++) out.push(coords[Math.round(i * step)]);
  out.push(coords[coords.length - 1]);
  return out;
}

function osmRiver(
  file: string,
  nameFilter: string,
  anchor?: RiverAnchor,
  extraFilter?: (w: OvertureWay) => boolean,
  deltaPath?: LonLat[],
): LonLat[] | null {
  return osmRiverByTag(file, (tags) => tags.name === nameFilter, anchor, extraFilter, deltaPath);
}

function clipLineToBasin(coords: LonLat[]): LonLat[] {
  const clipped = bboxClip(feature({ type: 'LineString', coordinates: coords }), BASIN_BBOX);
  const geom = clipped.geometry;
  if (geom.type !== 'LineString' || geom.coordinates.length < 2) return coords;
  return geom.coordinates as LonLat[];
}

function clipLineToBbox(coords: LonLat[], bbox: [number, number, number, number]): LonLat[] {
  const [w, s, e, n] = bbox;
  const inside = coords.filter(([lon, lat]) => lon >= w && lon <= e && lat >= s && lat <= n);
  return inside.length >= 2 ? inside : coords;
}

function neRiverNamed(name: string, clipBbox?: [number, number, number, number]): LonLat[] | null {
  if (!existsSync(NE_RIVERS)) return null;
  const fc = JSON.parse(readFileSync(NE_RIVERS, 'utf-8')) as FeatureCollection;
  let best: LonLat[] | null = null;
  let bestLen = 0;
  for (const f of fc.features) {
    if (f.properties?.name !== name) continue;
    const lines =
      f.geometry.type === 'LineString'
        ? [f.geometry.coordinates as LonLat[]]
        : f.geometry.type === 'MultiLineString'
          ? (f.geometry.coordinates as LonLat[][])
          : [];
    for (const line of lines) {
      let clipped = clipLineToBasin(line);
      if (clipBbox) clipped = clipLineToBbox(clipped, clipBbox);
      const len = lineLengthKm(clipped);
      if (len > bestLen) {
        bestLen = len;
        best = clipped;
      }
    }
  }
  return best;
}

/** Chaikin smooth for authored paths only. */
function chaikinSmooth(coords: LonLat[], iterations = 2): LonLat[] {
  if (coords.length < 3) return coords;
  let pts = coords;
  for (let iter = 0; iter < iterations; iter++) {
    const next: LonLat[] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      next.push([0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1]);
      next.push([0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1]);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
  }
  return pts;
}

/**
 * OSM mis-tags Küçük Menderes as Karamenderes near Troy — use those ways for Scamander.
 */
function osmTroyScamander(): LonLat[] | null {
  return osmRiverByTag(
    'troy-rivers.json',
    (tags) => /karamenderes|scamander/i.test(JSON.stringify(tags)),
    ANCHORS.scamander,
    (w) => {
      const line = wayToLine(w);
      return lineInBbox(line, [25.95, 39.75, 26.72, 40.05]);
    },
  );
}

/** Dümrek / Simoeis — eastern Troad tributary joining Scamander on the plain. */
function osmTroySimoeis(): LonLat[] | null {
  const ways = loadOsm('troy-rivers.json').filter((w) => {
    const name = w.tags?.name ?? '';
    if (name === 'Dombrik Sou' || name === 'Kimair Sou') return true;
    const line = wayToLine(w);
    const mid = line[Math.floor(line.length / 2)];
    return (
      (w.tags?.waterway === 'stream' || w.tags?.waterway === 'river') &&
      mid[0] > 26.28 &&
      mid[1] > 39.82 &&
      mid[1] < 40.05
    );
  });
  const chains = stitchWays(ways);
  if (chains.length === 0) return null;

  const anchor = ANCHORS.simoeis;
  const scored = chains
    .map((chain) => ({
      chain,
      conf: minDistToPoint(chain, anchor.point),
      len: lineLengthKm(chain),
    }))
    .filter((s) => s.len > 4)
    .sort((a, b) => a.conf - b.conf || b.len - a.len);

  return scored[0]?.chain ?? null;
}

/** Dardanelles centreline — Aegean (SW) to Marmara (NE). */
const HELLESPONT_STATIONS: LonLat[] = [
  [26.066, 39.997],
  [26.115, 40.03],
  [26.168, 40.068],
  [26.225, 40.108],
  [26.288, 40.15],
  [26.355, 40.192],
  [26.395, 40.215],
  [26.448, 40.248],
  [26.505, 40.285],
  [26.565, 40.322],
  [26.625, 40.355],
  [26.669, 40.386],
];

/** Strait of Messina centreline — Ionian (SE, Scylla cliff side) to Tyrrhenian (NW). */
const SCYLLA_CHARYBDIS_STATIONS: LonLat[] = [
  [15.65, 38.02],
  [15.6, 38.05],
  [15.55, 38.08],
  [15.5, 38.1],
  [15.46, 38.12],
  [15.42, 38.14],
  [15.38, 38.16],
  [15.34, 38.18],
  [15.3, 38.2],
  [15.28, 38.21],
];

/** Argive Inachus — hills above Argos to the Gulf of Argos (authored spine; OSM batch later). */
const INACHUS_STATIONS: LonLat[] = [
  [22.528, 37.872],
  [22.578, 37.842],
  [22.628, 37.812],
  [22.668, 37.778],
  [22.698, 37.742],
  [22.718, 37.702],
  [22.728, 37.662],
  [22.738, 37.622],
  [22.758, 37.582],
  [22.778, 37.548],
  [22.792, 37.528],
];

/** Boeotian Asopus — Phocis foothills through Thebes toward the Euripus. */
const ASOPUS_BOEOTIA_STATIONS: LonLat[] = [
  [22.98, 38.548],
  [23.08, 38.498],
  [23.18, 38.448],
  [23.28, 38.398],
  [23.36, 38.358],
  [23.42, 38.338],
  [23.48, 38.322],
  [23.54, 38.312],
  [23.59, 38.298],
  [23.62, 38.282],
];

/** Attic Cephissus (Kifisos) — Parnes foothills through Athens to Phaleron Bay. */
const CEPHISSUS_ATTICA_STATIONS: LonLat[] = [
  [23.768, 38.198],
  [23.752, 38.148],
  [23.738, 38.098],
  [23.728, 38.048],
  [23.722, 37.998],
  [23.718, 37.968],
  [23.708, 37.948],
  [23.688, 37.938],
  [23.658, 37.932],
  [23.628, 37.928],
  [23.608, 37.934],
];

const SPERCHEIUS_STATIONS: LonLat[] = [
  [22.18, 39.05],
  [22.28, 38.98],
  [22.38, 38.92],
  [22.48, 38.87],
  [22.54, 38.84],
  [22.58, 38.83],
  [22.62, 38.85],
];

const ACHERON_STATIONS: LonLat[] = [
  [20.72, 39.38],
  [20.66, 39.33],
  [20.58, 39.29],
  [20.531, 39.243],
  [20.72, 39.27],
  [20.83, 39.28],
];

const COCYTUS_STATIONS: LonLat[] = [
  [20.5, 39.27],
  [20.515, 39.26],
  [20.535, 39.245],
];

const HERMUS_STATIONS: LonLat[] = [
  [28.52, 38.98],
  [28.2, 38.92],
  [27.85, 38.85],
  [27.5, 38.82],
  [27.15, 38.84],
  [26.98, 38.85],
];

const CAYSTER_STATIONS: LonLat[] = [
  [27.55, 38.05],
  [27.48, 37.98],
  [27.42, 37.94],
  [27.35, 37.91],
  [27.28, 37.89],
  [27.18, 37.88],
];

const CEPHISSUS_BOEOTIA_STATIONS: LonLat[] = [
  [22.72, 38.58],
  [22.82, 38.52],
  [22.92, 38.48],
  [23.0, 38.45],
  [23.08, 38.42],
];

const PLEISTOS_STATIONS: LonLat[] = [
  [22.52, 38.55],
  [22.48, 38.48],
  [22.44, 38.40],
  [22.40, 38.35],
  [22.38, 38.32],
];

const STRYMON_STATIONS: LonLat[] = [
  [23.2, 41.65],
  [23.35, 41.45],
  [23.52, 41.22],
  [23.68, 41.0],
  [23.78, 40.88],
  [23.88, 40.78],
];

const HALYS_STATIONS: LonLat[] = [
  [34.0, 40.5],
  [34.4, 40.65],
  [34.9, 40.85],
  [35.2, 41.1],
  [35.5, 41.5],
];

const ENIPEUS_STATIONS: LonLat[] = [
  [22.2, 39.45],
  [22.28, 39.38],
  [22.38, 39.28],
  [22.48, 39.15],
  [22.58, 39.05],
  [22.65, 39.0],
];

const AXIOS_MACEDON_STATIONS: LonLat[] = [
  [21.0, 41.5],
  [21.5, 41.2],
  [22.0, 40.95],
  [22.5, 40.75],
  [22.95, 40.5],
];

const SANGARIUS_STATIONS: LonLat[] = [
  [30.5, 40.2],
  [31.2, 40.05],
  [31.98, 39.95],
  [31.5, 40.4],
  [30.9, 40.75],
  [30.63, 41.09],
];

const LADON_ARCADIA_STATIONS: LonLat[] = [
  [22.55, 38.05],
  [22.52, 37.98],
  [22.48, 37.88],
  [22.35, 37.86],
  [22.05, 37.85],
];

const ASOPUS_PHLIAS_STATIONS: LonLat[] = [
  [22.35, 38.05],
  [22.42, 37.98],
  [22.55, 37.95],
  [22.68, 37.92],
  [22.78, 37.88],
];

const ORONTES_STATIONS: LonLat[] = [
  [36.05, 34.05],
  [36.08, 34.6],
  [36.12, 35.3],
  [36.18, 35.9],
  [36.2, 36.15],
  [35.95, 35.87],
];

const ISTER_STATIONS: LonLat[] = [
  [29.05, 45.15],
  [28.2, 44.85],
  [27.0, 44.5],
  [25.5, 44.0],
  [24.0, 44.2],
  [22.67, 44.72],
  [21.0, 44.55],
  [19.0, 44.35],
];

const STYX_ARCADIA_STATIONS: LonLat[] = [
  [22.312, 37.828],
  [22.316, 37.824],
  [22.320, 37.818],
  [22.325, 37.812],
];

const EUPHRATES_STATIONS: LonLat[] = [
  [39.0, 39.0],
  [38.5, 37.5],
  [37.5, 36.0],
  [36.0, 34.5],
  [44.0, 32.5],
  [44.0, 31.0],
];

const TIGRIS_STATIONS: LonLat[] = [
  [42.0, 38.5],
  [41.5, 37.0],
  [40.5, 35.5],
  [44.36, 33.31],
  [44.0, 30.8],
];

const JORDAN_STATIONS: LonLat[] = [
  [35.65, 33.2],
  [35.6, 32.95],
  [35.55, 32.88],
  [35.58, 32.75],
  [35.55, 31.55],
];

const ARAXES_STATIONS: LonLat[] = [
  [42.0, 40.4],
  [42.5, 40.55],
  [43.0, 40.65],
  [43.5, 40.8],
  [44.0, 40.2],
];

const ERIDANUS_STATIONS: LonLat[] = [
  [12.5, 46.0],
  [12.0, 45.6],
  [11.9, 45.2],
  [12.1, 45.15],
  [12.25, 45.1],
];

/** Try auto OSM cache (`<id>.json`), then fall back to authored spine. */
function osmFromAutoCache(
  id: string,
  anchor: RiverAnchor,
  authoredFallback: () => LonLat[] | null,
): LonLat[] | null {
  const file = `${id}.json`;
  const names = OSM_NAME_ALIASES[id] ?? [];
  for (const name of names) {
    const line = osmRiver(file, name, anchor);
    if (line) return decimate(line, 500);
  }

  const ways = loadOsm(file);
  if (ways.length > 0) {
    const [lon, lat] = anchor.point;
    const byBbox = osmRiverInBbox(file, [lon - 1.1, lat - 1.1, lon + 1.1, lat + 1.1], anchor);
    if (byBbox) return decimate(byBbox, 500);
    const best = pickBestChain(stitchWays(ways), anchor);
    if (best) return decimate(best, 500);
  }

  const auth = authoredFallback();
  if (!auth) return null;
  if (anchor.mouth) return extendToMouth(auth, anchor.mouth, anchor.mouthMaxDistKm ?? 5);
  return auth;
}

const SOURCES: Record<string, () => LonLat[] | null> = {
  eurotas: () => {
    const line =
      osmRiver('eurotas2.json', 'Ευρώτας', ANCHORS.eurotas) ??
      osmRiver('eurotas2.json', 'Ευρώτας');
    return line ? decimate(line, 500) : null;
  },
  alpheus: () => {
    const line = osmRiver('alpheus.json', 'Αλφειός', ANCHORS.alpheus);
    return line ? decimate(line, 500) : null;
  },
  peneus: () => {
    const ways = loadOsm('peneus-thessaly.json');
    const fallbackWays = ways.length ? ways : loadOsm('peneus2.json').filter((w) => w.tags?.name === 'Πηνειός');
    const filtered = (fallbackWays.length ? fallbackWays : []).filter((w) => {
      const l = wayToLine(w);
      return lineInBbox(l, [22.0, 39.2, 23.5, 40.2]);
    });
    const chains = stitchWays(filtered);
    const best = pickBestChain(chains, ANCHORS.peneus);
    if (!best) return null;
    const merged = buildStemWithDelta(best, PENEUS_DELTA);
    return minDistToPoint(merged, ANCHORS.peneus.mouth!) <= ANCHORS.peneus.mouthMaxDistKm!
      ? merged
      : extendToMouth(merged, ANCHORS.peneus.mouth!, ANCHORS.peneus.mouthMaxDistKm!);
  },
  achelous: () => {
    const ways = loadOsm('achelous3.json').filter((w) => {
      if (w.tags?.name !== 'Αχελώος') return false;
      const l = wayToLine(w);
      return lineInBbox(l, [20.9, 38.0, 22.3, 39.05]);
    });
    const best = pickBestChain(stitchWays(ways), ANCHORS.achelous);
    if (!best) return null;
    const merged = buildStemWithDelta(best, ACHELOUS_DELTA, 440, 40);
    return minDistToPoint(merged, ANCHORS.achelous.mouth!) <= ANCHORS.achelous.mouthMaxDistKm!
      ? merged
      : extendToMouth(merged, ANCHORS.achelous.mouth!, ANCHORS.achelous.mouthMaxDistKm!);
  },
  maeander: () =>
    neRiverNamed('Byk Menderes', [26.0, 36.8, 29.5, 38.3]) ??
    neRiverNamed('Byk Menderes'),
  nilus: () => neRiverNamed('Nile', [24.0, 22.0, 33.5, 32.5]),
  scamander: () => {
    const line = osmTroyScamander();
    return line ? decimate(line, 500) : null;
  },
  simoeis: () => {
    const line = osmTroySimoeis();
    return line ? decimate(line, 500) : null;
  },
  hellespont: () => chaikinSmooth(HELLESPONT_STATIONS, 2),
  'scylla-charybdis': () => chaikinSmooth(SCYLLA_CHARYBDIS_STATIONS, 2),
  inachus: () =>
    osmFromAutoCache('inachus', ANCHORS.inachus, () =>
      extendToMouth(
        chaikinSmooth(INACHUS_STATIONS, 2),
        ANCHORS.inachus.mouth!,
        ANCHORS.inachus.mouthMaxDistKm!,
      ),
    ),
  'asopus-boeotia': () =>
    osmFromAutoCache('asopus-boeotia', ANCHORS['asopus-boeotia'], () =>
      extendToMouth(
        chaikinSmooth(ASOPUS_BOEOTIA_STATIONS, 2),
        ANCHORS['asopus-boeotia'].mouth!,
        ANCHORS['asopus-boeotia'].mouthMaxDistKm!,
      ),
    ),
  'cephissus-attica': () =>
    osmFromAutoCache('cephissus-attica', ANCHORS['cephissus-attica'], () =>
      extendToMouth(
        chaikinSmooth(CEPHISSUS_ATTICA_STATIONS, 2),
        ANCHORS['cephissus-attica'].mouth!,
        ANCHORS['cephissus-attica'].mouthMaxDistKm!,
      ),
    ),
  spercheius: () =>
    osmFromAutoCache('spercheius', ANCHORS.spercheius, () =>
      extendToMouth(
        chaikinSmooth(SPERCHEIUS_STATIONS, 2),
        ANCHORS.spercheius.mouth!,
        ANCHORS.spercheius.mouthMaxDistKm!,
      ),
    ),
  hermus: () =>
    osmFromAutoCache('hermus', ANCHORS.hermus, () => {
      const ne = neRiverNamed('Gediz', [26.5, 38.0, 29.5, 39.5]);
      const line = ne ?? chaikinSmooth(HERMUS_STATIONS, 2);
      return extendToMouth(line, ANCHORS.hermus.mouth!, ANCHORS.hermus.mouthMaxDistKm!);
    }),
  cayster: () =>
    osmFromAutoCache('cayster', ANCHORS.cayster, () =>
      extendToMouth(
        chaikinSmooth(CAYSTER_STATIONS, 2),
        ANCHORS.cayster.mouth!,
        ANCHORS.cayster.mouthMaxDistKm!,
      ),
    ),
  'cephissus-boeotia': () =>
    osmFromAutoCache('cephissus-boeotia', ANCHORS['cephissus-boeotia'], () =>
      extendToMouth(
        chaikinSmooth(CEPHISSUS_BOEOTIA_STATIONS, 2),
        ANCHORS['cephissus-boeotia'].mouth!,
        ANCHORS['cephissus-boeotia'].mouthMaxDistKm!,
      ),
    ),
  pleistos: () =>
    osmFromAutoCache('pleistos', ANCHORS.pleistos, () =>
      extendToMouth(
        chaikinSmooth(PLEISTOS_STATIONS, 2),
        ANCHORS.pleistos.mouth!,
        ANCHORS.pleistos.mouthMaxDistKm!,
      ),
    ),
  strymon: () =>
    osmFromAutoCache('strymon', ANCHORS.strymon, () => {
      const ne = neRiverNamed('Struma', [22.5, 40.0, 24.5, 42.0]);
      const line = ne ?? chaikinSmooth(STRYMON_STATIONS, 2);
      return extendToMouth(line, ANCHORS.strymon.mouth!, ANCHORS.strymon.mouthMaxDistKm!);
    }),
  halys: () =>
    osmFromAutoCache('halys', ANCHORS.halys, () => {
      const ne =
        neRiverNamed('Kizilirmak', [32.0, 39.0, 36.5, 42.0]) ??
        neRiverNamed('Kızılırmak', [32.0, 39.0, 36.5, 42.0]);
      const line = ne ?? chaikinSmooth(HALYS_STATIONS, 2);
      return extendToMouth(line, ANCHORS.halys.mouth!, ANCHORS.halys.mouthMaxDistKm!);
    }),
  enipeus: () =>
    osmFromAutoCache('enipeus', ANCHORS.enipeus, () =>
      extendToMouth(
        chaikinSmooth(ENIPEUS_STATIONS, 2),
        ANCHORS.enipeus.mouth!,
        ANCHORS.enipeus.mouthMaxDistKm!,
      ),
    ),
  'axios-macedon': () =>
    osmFromAutoCache('axios-macedon', ANCHORS['axios-macedon'], () => {
      const ne = neRiverNamed('Vardar', [20.5, 40.0, 23.5, 42.0]);
      const line = ne ?? chaikinSmooth(AXIOS_MACEDON_STATIONS, 2);
      return extendToMouth(
        line,
        ANCHORS['axios-macedon'].mouth!,
        ANCHORS['axios-macedon'].mouthMaxDistKm!,
      );
    }),
  sangarius: () =>
    osmFromAutoCache('sangarius', ANCHORS.sangarius, () =>
      extendToMouth(
        chaikinSmooth(SANGARIUS_STATIONS, 2),
        ANCHORS.sangarius.mouth!,
        ANCHORS.sangarius.mouthMaxDistKm!,
      ),
    ),
  'ladon-arcadia': () =>
    osmFromAutoCache('ladon-arcadia', ANCHORS['ladon-arcadia'], () =>
      extendToMouth(
        chaikinSmooth(LADON_ARCADIA_STATIONS, 2),
        ANCHORS['ladon-arcadia'].mouth!,
        ANCHORS['ladon-arcadia'].mouthMaxDistKm!,
      ),
    ),
  'asopus-phlias': () =>
    osmFromAutoCache('asopus-phlias', ANCHORS['asopus-phlias'], () =>
      extendToMouth(
        chaikinSmooth(ASOPUS_PHLIAS_STATIONS, 2),
        ANCHORS['asopus-phlias'].mouth!,
        ANCHORS['asopus-phlias'].mouthMaxDistKm!,
      ),
    ),
  orontes: () =>
    osmFromAutoCache('orontes', ANCHORS.orontes, () =>
      extendToMouth(
        chaikinSmooth(ORONTES_STATIONS, 2),
        ANCHORS.orontes.mouth!,
        ANCHORS.orontes.mouthMaxDistKm!,
      ),
    ),
  ister: () =>
    osmFromAutoCache('ister', ANCHORS.ister, () => {
      const ne = neRiverNamed('Danube', [18.0, 43.0, 30.0, 46.0]);
      const line = ne ?? chaikinSmooth(ISTER_STATIONS, 2);
      return extendToMouth(line, ANCHORS.ister.mouth!, ANCHORS.ister.mouthMaxDistKm!);
    }),
  'styx-arcadia': () =>
    osmFromAutoCache('styx-arcadia', ANCHORS['styx-arcadia'], () =>
      chaikinSmooth(STYX_ARCADIA_STATIONS, 1),
    ),
  euphrates: () =>
    osmFromAutoCache('euphrates', ANCHORS.euphrates, () => {
      const ne = neRiverNamed('Euphrates', [36.0, 30.0, 44.5, 40.0]);
      const line = ne ?? chaikinSmooth(EUPHRATES_STATIONS, 2);
      return extendToMouth(line, ANCHORS.euphrates.mouth!, ANCHORS.euphrates.mouthMaxDistKm!);
    }),
  tigris: () =>
    osmFromAutoCache('tigris', ANCHORS.tigris, () => {
      const ne = neRiverNamed('Tigris', [36.0, 30.0, 44.5, 42.0]);
      const line = ne ?? chaikinSmooth(TIGRIS_STATIONS, 2);
      return extendToMouth(line, ANCHORS.tigris.mouth!, ANCHORS.tigris.mouthMaxDistKm!);
    }),
  jordan: () =>
    osmFromAutoCache('jordan', ANCHORS.jordan, () =>
      extendToMouth(
        chaikinSmooth(JORDAN_STATIONS, 2),
        ANCHORS.jordan.mouth!,
        ANCHORS.jordan.mouthMaxDistKm!,
      ),
    ),
  araxes: () =>
    osmFromAutoCache('araxes', ANCHORS.araxes, () => {
      const ne = neRiverNamed('Aras', [38.0, 39.0, 44.5, 41.5]);
      const line = ne ?? chaikinSmooth(ARAXES_STATIONS, 2);
      return extendToMouth(line, ANCHORS.araxes.mouth!, ANCHORS.araxes.mouthMaxDistKm!);
    }),
  eridanus: () =>
    osmFromAutoCache('eridanus', ANCHORS.eridanus, () => {
      const ne = neRiverNamed('Po', [10.5, 44.5, 13.0, 46.5]);
      const line = ne ?? chaikinSmooth(ERIDANUS_STATIONS, 2);
      return extendToMouth(line, ANCHORS.eridanus.mouth!, ANCHORS.eridanus.mouthMaxDistKm!);
    }),
  acheron: () =>
    osmFromAutoCache('acheron', ANCHORS.acheron, () =>
      extendToMouth(
        chaikinSmooth(ACHERON_STATIONS, 2),
        ANCHORS.acheron.mouth!,
        ANCHORS.acheron.mouthMaxDistKm!,
      ),
    ),
  cocytus: () =>
    osmFromAutoCache('cocytus', ANCHORS.cocytus, () =>
      extendToMouth(
        chaikinSmooth(COCYTUS_STATIONS, 2),
        ANCHORS.cocytus.mouth!,
        ANCHORS.cocytus.mouthMaxDistKm!,
      ),
    ),
};

export interface SyncReport {
  lines: string[];
  count: number;
  updated: boolean;
}

export function runRiverGeometrySync(options?: {
  ids?: string[];
  dryRun?: boolean;
}): SyncReport {
  if (!existsSync(FEATURES_FILE)) {
    throw new Error(`missing ${FEATURES_FILE}`);
  }

  const want = options?.ids?.length ? new Set(options.ids) : null;
  const features = JSON.parse(readFileSync(FEATURES_FILE, 'utf-8')) as FeatureEntry[];
  const report: string[] = [];
  let count = 0;

  for (const feat of features) {
    if (feat.geometry.type !== 'LineString') continue;
    if (want && !want.has(feat.id)) continue;
    const build = SOURCES[feat.id];
    if (!build) {
      report.push(`${feat.id}: skipped — no sync recipe`);
      continue;
    }
    const line = build();
    if (!line || line.length < 2) {
      report.push(`${feat.id}: FAILED — no geometry`);
      continue;
    }
    if (!options?.dryRun) {
      feat.geometry.coordinates = roundLine(decimate(line, 600));
    }
    const anchor = ANCHORS[feat.id];
    const d = anchor ? minDistToPoint(line, anchor.point) : null;
    const mouthD = anchor?.mouth ? minDistToPoint(line, anchor.mouth) : null;
    report.push(
      `${feat.id}: ${line.length} pts, ~${Math.round(lineLengthKm(line))} km` +
        (d !== null ? `, anchor ${d.toFixed(1)} km` : '') +
        (mouthD !== null ? `, mouth ${mouthD.toFixed(1)} km` : '') +
        (options?.dryRun ? ' (dry-run)' : ''),
    );
    count++;
  }

  if (!options?.dryRun && count > 0) {
    writeFileSync(FEATURES_FILE, `${JSON.stringify(features, null, 2)}\n`);
  }

  return { lines: report, count, updated: !options?.dryRun && count > 0 };
}

function main() {
  const report = runRiverGeometrySync();
  console.log(`updated ${report.count} feature geometries in ${FEATURES_FILE}`);
  for (const line of report.lines) console.log(`  ${line}`);
}

const entry = process.argv[1] ?? '';
if (entry.includes('sync-river-geometry') && !entry.includes('refresh-river-geometry')) {
  main();
}
