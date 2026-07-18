/**
 * Builds public/geo/* for the MapLibre Lands map (/areas).
 *
 * Single coherent basemap:
 * - Natural Earth 10m land / coastline / lakes for the whole Mediterranean basin
 *   (docs/LANDS_PLAN.md §7 — 1:10m base physical layer, CC0)
 * - Every feature is CLIPPED (not dropped) to the padded basin box, so the
 *   continental mainland — Iberia, Italy, the Balkans, Anatolia, North Africa —
 *   is present, while world-spanning coastlines never streak across the view.
 *
 * The old Wikimedia "Greece (ancient)" SVG detail overlay is intentionally NOT
 * fed into the style: its plate-carrée calibration was approximate, so its
 * coastline ghosted against Natural Earth, and its path→geo conversion produced
 * stray triangles and synthetic region rectangles. data/geo/basemap.json stays
 * on disk as reference until AWMC region polygons replace it (LANDS_PLAN §M9.9).
 *
 * Usage: pnpm build:map
 */
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import bboxClip from '@turf/bbox-clip';
import { featureCollection } from '@turf/helpers';
import {
  RELIEF_MINZOOM,
  RELIEF_OPACITY_STOPS,
  SHADE_ACCENT,
  SHADE_HIGHLIGHT,
  SHADE_SHADOW,
  TINT_STOPS,
} from './lib/relief-style';
import type {
  Feature,
  FeatureCollection,
  Geometry,
  LineString,
  MultiLineString,
  MultiPolygon,
  Polygon,
} from 'geojson';

const RAW_DIR = join('data', 'geo', 'raw', 'natural-earth');
const OUT_DIR = join('public', 'geo');

/** Padded basin box [west, south, east, north] — slightly larger than the
 *  camera's maxBounds so the clip seam is never visible while panning. */
const BASIN_BBOX: [number, number, number, number] = [-8, 20, 46, 48];

/** Coordinate precision (decimals). ~11 m at the equator — plenty for a
 *  myth atlas, and it keeps the inlined GeoJSON small. */
const COORD_DP = 4;

/** Camera limits (WGS84) — docs/LANDS_PLAN.md §3.1. */
export const MAP_BOUNDS = {
  west: -6,
  south: 22,
  east: 44,
  north: 47,
} as const;

const NE_BASE =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson';

/** 1:10m for crisp islands and coastline at deep zoom (LANDS_PLAN §7). */
const LAYERS = {
  land: `${NE_BASE}/ne_10m_land.geojson`,
  lakes: `${NE_BASE}/ne_10m_lakes.geojson`,
  coastline: `${NE_BASE}/ne_10m_coastline.geojson`,
} as const;

/** Generated layers from the retired SVG hybrid — remove so public/geo stays clean. */
const STALE_OUTPUTS = [
  'detail-land.json',
  'detail-coast.json',
  'detail-lakes.json',
  'regions.json',
  'regions.geojson',
];

/** Aether Nebula palette — sync with src/styles/theme.css */
const COLORS = {
  /** Transparent: the sea is the CSS nebula backdrop behind the canvas (see
   *  MapLibreView), so the basin glows like the rest of the atlas instead of a
   *  flat fill. The canvas is alpha by default; no opaque background layer. */
  background: 'rgba(8, 4, 29, 0)',
  land: '#1a1240',
  landStroke: '#7c4dff',
  lake: '#0a0726',
  coast: '#00e5ff',
  coastHalo: '#7c4dff',
  /** Base hydrography (the dense OSM river network) — a quiet cyan, fainter than
   *  the bright coastline and the curated mythic rivers drawn on top. */
  river: '#3fb8d6',
} as const;

/**
 * Terrain elevation (terrarium encoding). Three tiers:
 * - TERRAIN (preferred): the pinned extract split losslessly into 256px tiles
 *   at public/geo/dem-terrain.pmtiles (`pnpm dem:terrain`).
 * - PINNED: the original 512px Mapterhorn extract at public/geo/dem.pmtiles
 *   (`pnpm dem:fetch`, ~1.2 GB, not committed).
 * - REMOTE: AWS Open Data "Terrain Tiles" (Mapzen/Joerd lineage), keyless — a
 *   fresh checkout still gets relief with zero setup.
 * The sea is bathymetry (negative), so every relief ramp below keeps
 * elevation ≤ 0 fully transparent and the nebula sea stays untouched.
 */
const DEM_PMTILES_PATH = join('public', 'geo', 'dem.pmtiles');
const TERRAIN_DEM_PMTILES_PATH = join('public', 'geo', 'dem-terrain.pmtiles');
const AWS_DEM_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

/** Hosted-geo base for deploys (e.g. a Cloudflare R2 bucket): the pmtiles
 *  archives and baked relief tiles are gitignored (~2.2 GB, reproducible), so
 *  CI never has them on disk. Set GEO_ASSETS_BASE=https://tiles.example.com
 *  at build time and the style points every heavy source there instead —
 *  PMTiles range-reads need an object store, not the app CDN. Unset (local
 *  dev), everything serves from public/geo exactly as before. */
const ASSET_BASE = (process.env.GEO_ASSETS_BASE ?? '').replace(/\/+$/, '');

/** Baked relief raster (tint + hillshade pre-shaded offline by
 *  scripts/bake-relief.ts). When present, ONE cheap raster layer replaces the
 *  two runtime DEM layers — under 3D terrain those were re-rasterized per
 *  terrain tile (render-to-texture), the single largest draped-layer cost. */
const RELIEF_MANIFEST_PATH = join('public', 'geo', 'relief', 'manifest.json');

interface DemSourceSpec {
  type: 'raster-dem';
  encoding: 'terrarium';
  tileSize: number;
  attribution: string;
  url?: string;
  tiles?: string[];
  maxzoom?: number;
}

/** raster-dem source spec for whichever elevation tier is available. */
function demSource(): DemSourceSpec {
  if (ASSET_BASE || existsSync(TERRAIN_DEM_PMTILES_PATH)) {
    return {
      type: 'raster-dem',
      // The 512px source tiles are split losslessly into 256px z+1 children by
      // `pnpm dem:terrain`. Ground resolution stays identical while MapLibre's
      // terrain RTT edge drops from 2048px to 1024px. With GEO_ASSETS_BASE set
      // the archive is trusted to exist at the hosted base (CI has no copy).
      url: `pmtiles://${ASSET_BASE}/geo/dem-terrain.pmtiles`,
      encoding: 'terrarium',
      tileSize: 256,
      attribution: '© Mapterhorn',
    };
  }
  if (existsSync(DEM_PMTILES_PATH)) {
    return {
      type: 'raster-dem',
      // The pmtiles:// protocol (registered in MapLibreView) reads the archive
      // with range requests; min/max zoom come from the archive header.
      url: 'pmtiles:///geo/dem.pmtiles',
      encoding: 'terrarium',
      tileSize: 512,
      attribution: '© Mapterhorn',
    };
  }
  return {
    type: 'raster-dem',
    tiles: [AWS_DEM_TILES],
    encoding: 'terrarium',
    tileSize: 256,
    maxzoom: 12,
    attribution: 'Terrain Tiles (Mapzen/AWS)',
  };
}

/** The zoom→opacity fade shared by both relief tiers. */
const reliefOpacityExpr = [
  'interpolate',
  ['linear'],
  ['zoom'],
  ...RELIEF_OPACITY_STOPS.flat(),
];

/**
 * Relief layers, two tiers:
 * - BAKED (preferred): scripts/bake-relief.ts pre-shaded tint + hillshade into
 *   raster tiles — one texture-copy layer, near-free under terrain RTT.
 * - RUNTIME (fallback): color-relief + hillshade computed from the DEM on the
 *   GPU per tile — correct but the most expensive draped layers we had.
 * Both read their colours from scripts/lib/relief-style.ts.
 */
function reliefLayers(): object[] {
  if (existsSync(RELIEF_MANIFEST_PATH)) {
    return [
      {
        id: 'relief-baked',
        type: 'raster',
        source: 'relief',
        minzoom: RELIEF_MINZOOM,
        paint: {
          'raster-opacity': reliefOpacityExpr,
        },
      },
    ];
  }
  return [
    {
      // Hypsometric tint in the Aether palette: lowlands keep the plain land
      // fill, highlands lift toward nebula violet, peaks toward star white.
      // Alpha ramp (not opaque colors) so the land base glows through, and the
      // bathymetric sea (≤ 0 m) stays fully transparent.
      id: 'dem-color-relief',
      type: 'color-relief',
      source: 'dem',
      // The basin overview opens at z4.6 — a hard minzoom keeps the overview
      // DEM-free; the opacity ramp still eases relief in.
      minzoom: RELIEF_MINZOOM,
      paint: {
        'color-relief-color': [
          'interpolate',
          ['linear'],
          ['elevation'],
          ...TINT_STOPS.flat(),
        ],
        // The far view stays the flat 2D atlas; relief only breathes in as the
        // camera closes on a region (the "walking onto the map" narrative).
        'color-relief-opacity': reliefOpacityExpr,
      },
    },
    {
      // Soft directional shading so ridges and valleys read as relief. Igor
      // method stays gentle; colors carry alpha so the effect is a whisper at
      // basin view and firms up as you close in.
      id: 'dem-hillshade',
      type: 'hillshade',
      source: 'dem',
      minzoom: RELIEF_MINZOOM,
      paint: {
        'hillshade-method': 'igor',
        // Near zero at basin view (hillshade has no opacity prop — exaggeration
        // doubles as one), firming up as the camera approaches. Also keeps the
        // bathymetric seafloor from texturing the nebula sea at overview.
        'hillshade-exaggeration': [
          'interpolate',
          ['linear'],
          ['zoom'],
          RELIEF_MINZOOM,
          0.02,
          6.5,
          0.36,
          9,
          0.5,
          12,
          0.58,
        ],
        'hillshade-shadow-color': SHADE_SHADOW,
        'hillshade-highlight-color': SHADE_HIGHLIGHT,
        'hillshade-accent-color': SHADE_ACCENT,
      },
    },
  ];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function download(url: string, file: string): Promise<string> {
  const target = join(RAW_DIR, file);
  if (existsSync(target)) return readFileSync(target, 'utf-8');
  mkdirSync(RAW_DIR, { recursive: true });
  process.stdout.write(`downloading ${file}… `);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'IcarusAtlas-map-build/0.1 (educational mythology atlas)' },
  });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const text = await res.text();
  writeFileSync(target, text);
  console.log('done');
  await sleep(500);
  return text;
}

function geometryHasCoords(geometry: Geometry): boolean {
  switch (geometry.type) {
    case 'Polygon':
      return geometry.coordinates.length > 0 && geometry.coordinates[0].length > 2;
    case 'MultiPolygon':
      return geometry.coordinates.some((ring) => ring.length > 0 && ring[0].length > 2);
    case 'LineString':
      return geometry.coordinates.length > 1;
    case 'MultiLineString':
      return geometry.coordinates.some((line) => line.length > 1);
    default:
      return false;
  }
}

/**
 * Prune empty / degenerate parts left behind by bbox clipping.
 *
 * @turf/bbox-clip clips every sub-polygon of a MultiPolygon independently and
 * emits an empty `[]` polygon for each one that falls entirely outside the box
 * (the world land layer is one MultiPolygon, so thousands of out-of-basin
 * islands become empty entries). MapLibre throws "reading 'points'" when it
 * tries to bucket those, so we drop empty sub-polygons, short rings (< 4
 * positions), and short lines (< 2 positions). Returns null if nothing valid
 * remains.
 */
function sanitizeGeometry(geometry: Geometry): Geometry | null {
  const ringOk = (r: unknown): boolean => Array.isArray(r) && r.length >= 4;
  const lineOk = (l: unknown): boolean => Array.isArray(l) && l.length >= 2;
  switch (geometry.type) {
    case 'Polygon': {
      const rings = geometry.coordinates.filter(ringOk);
      return rings.length ? { type: 'Polygon', coordinates: rings } : null;
    }
    case 'MultiPolygon': {
      const polys = geometry.coordinates
        .map((poly) => poly.filter(ringOk))
        .filter((poly) => poly.length > 0);
      return polys.length ? { type: 'MultiPolygon', coordinates: polys } : null;
    }
    case 'LineString':
      return geometry.coordinates.length >= 2 ? geometry : null;
    case 'MultiLineString': {
      const lines = geometry.coordinates.filter(lineOk);
      return lines.length ? { type: 'MultiLineString', coordinates: lines } : null;
    }
    default:
      return null;
  }
}

/** Round coordinates in place to COORD_DP decimals to shrink the inlined GeoJSON. */
function roundGeom(geometry: Geometry): void {
  const f = 10 ** COORD_DP;
  const walk = (coords: unknown): void => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === 'number') {
      coords[0] = Math.round((coords[0] as number) * f) / f;
      coords[1] = Math.round((coords[1] as number) * f) / f;
      return;
    }
    for (const c of coords) walk(c);
  };
  if ('coordinates' in geometry) walk(geometry.coordinates);
}

/**
 * Clip every feature to the basin box. Unlike the old "drop wide polygons"
 * filter, this KEEPS the continental landmass (trimmed to the box) instead of
 * discarding the one giant Afro-Eurasia polygon — so mainland fill is present
 * everywhere — and trims world-spanning coastlines to the basin segment.
 */
function clipToBasin<G extends Geometry>(fc: FeatureCollection<G>): FeatureCollection<G> {
  const kept: Feature<G>[] = [];
  for (const f of fc.features) {
    if (!geometryHasCoords(f.geometry)) continue;
    let clipped: Feature<Geometry> | null = null;
    try {
      clipped = bboxClip(
        f as Feature<Polygon | MultiPolygon | LineString | MultiLineString>,
        BASIN_BBOX,
      ) as Feature<Geometry>;
    } catch {
      continue; // skip invalid topology
    }
    if (!clipped?.geometry) continue;
    const clean = sanitizeGeometry(clipped.geometry);
    if (!clean || !geometryHasCoords(clean)) continue;
    clipped.geometry = clean;
    roundGeom(clipped.geometry);
    if (!geometryHasCoords(clipped.geometry)) continue;
    kept.push(clipped as Feature<G>);
  }
  return featureCollection(kept);
}

function buildStyle(
  land: FeatureCollection,
  lakes: FeatureCollection,
  coastline: FeatureCollection,
): object {
  const sources: Record<string, object> = {
    land: { type: 'geojson', data: land },
    lakes: { type: 'geojson', data: lakes },
    coastline: { type: 'geojson', data: coastline },
    // Loaded by URL (not inlined) so style.json stays small — built by
    // scripts/build-rivers-base.ts from bulk OSM extracts. Data © OSM (ODbL).
    'rivers-base': { type: 'geojson', data: '/geo/rivers-base.json' },
    // One shared raster-dem source for the mesh AND the (fallback) relief
    // layers — a second identical source doubled tile fetch, webp decode and
    // GPU upload for every DEM tile, which is exactly the mid-zoom stutter band.
    dem: demSource(),
  };

  if (existsSync(RELIEF_MANIFEST_PATH)) {
    const reliefManifest = JSON.parse(readFileSync(RELIEF_MANIFEST_PATH, 'utf-8')) as {
      bbox: [number, number, number, number];
      minzoom: number;
      maxzoom: number;
      tileSize: number;
    };
    sources.relief = {
      type: 'raster',
      tiles: [`${ASSET_BASE}/geo/relief/{z}/{x}/{y}.webp`],
      tileSize: reliefManifest.tileSize,
      minzoom: reliefManifest.minzoom,
      maxzoom: reliefManifest.maxzoom,
      // No requests outside the baked extract (tiles there would 404).
      bounds: reliefManifest.bbox,
      attribution: '© Mapterhorn',
    };
  }

  const layers: object[] = [
    {
      id: 'background',
      type: 'background',
      paint: {
        // Transparent at the flat 2D band so the CSS nebula sea glows through.
        // Once the camera enters the 3D terrain band the background turns
        // opaque cosmos: MapLibre's terrain render-to-texture smears the edge
        // pixels of transparent tiles down tile seams (vertical streak walls),
        // so the sea must be painted inside the canvas there.
        'background-color': [
          'interpolate',
          ['linear'],
          ['zoom'],
          6.4,
          'rgba(8, 4, 29, 0)',
          7,
          'rgba(8, 4, 29, 1)',
        ],
      },
    },
    {
      id: 'land-fill',
      type: 'fill',
      source: 'land',
      paint: {
        'fill-color': COLORS.land,
        'fill-opacity': 0.98,
      },
    },
    ...reliefLayers(),
    {
      id: 'lakes-fill',
      type: 'fill',
      source: 'lakes',
      paint: {
        'fill-color': COLORS.lake,
        'fill-opacity': 0.95,
      },
    },
    {
      // Base hydrography — the dense OSM river network, thin and quiet, beneath the
      // coastline glow and the curated mythic rivers. Longer rivers read a touch
      // stronger; the whole network brightens as you zoom in.
      id: 'rivers-base',
      type: 'line',
      source: 'rivers-base',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': COLORS.river,
        // MapLibre requires ["zoom"] at the top level of a step/interpolate, so the
        // length factor (longer rivers a touch stronger) is baked into each zoom
        // stop's output as a nested len-interpolate rather than multiplied outside.
        'line-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5,
          ['interpolate', ['linear'], ['get', 'len'], 2, 0.09, 12, 0.16],
          8,
          ['interpolate', ['linear'], ['get', 'len'], 2, 0.18, 12, 0.32],
          12,
          ['interpolate', ['linear'], ['get', 'len'], 2, 0.25, 12, 0.46],
        ],
        'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.4, 8, 0.85, 12, 1.5],
      },
    },
    {
      // Wide, blurred cyan bloom — fakes the galaxy's glow where shore meets the
      // nebula sea. Drawn first so the halo and crisp core sit on top. An
      // overview-only effect: in the 3D terrain band every render-to-texture
      // tile would redraw this blurred ribbon along the whole fractal coast,
      // so it fades out before the mesh switches on and hard-stops at 7.5.
      id: 'coast-bloom',
      type: 'line',
      source: 'coastline',
      maxzoom: 7.5,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': COLORS.coast,
        'line-blur': ['interpolate', ['linear'], ['zoom'], 3, 2.5, 12, 7],
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.03, 6.5, 0.05, 7.4, 0],
        'line-width': ['interpolate', ['linear'], ['zoom'], 3, 3, 8, 7, 12, 12],
      },
    },
    {
      // Soft violet halo behind the crisp coast — an overview effect like
      // coast-bloom: in the terrain band every render-to-texture tile would
      // re-blur it along the fractal coastline, so it fades out before the
      // mesh switches on (baked relief + coast-line carry the shore there).
      id: 'coast-halo',
      type: 'line',
      source: 'coastline',
      maxzoom: 7.5,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': COLORS.coastHalo,
        'line-blur': 0.6,
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.06, 6.5, 0.1, 7.4, 0],
        'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.2, 8, 2.2],
      },
    },
    {
      id: 'coast-line',
      type: 'line',
      source: 'coastline',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': COLORS.coast,
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.18, 8, 0.26, 12, 0.34],
        'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.45, 8, 0.85, 12, 1.25],
      },
    },
    {
      // Hairline violet land edge — an overview affordance; in the terrain
      // band the hillshade and coast-line already draw the edge, so drop it
      // from the render-to-texture pass there.
      id: 'land-outline',
      type: 'line',
      source: 'land',
      maxzoom: 7.5,
      paint: {
        'line-color': COLORS.landStroke,
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.18, 6.5, 0.18, 7.4, 0],
        'line-width': 0.5,
      },
    },
  ];

  return {
    version: 8,
    name: 'Icarus Atlas — Aether Nebula',
    metadata: {
      'icarus:engine': 'maplibre',
      'icarus:bounds': MAP_BOUNDS,
      'icarus:resolution': '10m',
    },
    glyphs: '/geo/font/{fontstack}/{range}.pbf',
    // Horizon atmosphere for the tilted camera (M-camera choreography): the sky
    // is the deep cosmos, the horizon a nebula-violet haze, and distant terrain
    // fades into fog instead of ending at a hard clip line. atmosphere-blend is
    // zoom-gated so the flat basin overview keeps its pure 2D look.
    sky: {
      'sky-color': '#0b0620',
      'horizon-color': '#2a1b5e',
      'fog-color': '#08041d',
      'sky-horizon-blend': 0.7,
      'horizon-fog-blend': 0.6,
      // Pull the ground fog closer as the camera goes horizontal: distant
      // terrain LOD rings (and their skirt seams) melt into the nebula instead
      // of rendering as hard walls. 0 = fog at the camera, 1 = at the horizon.
      'fog-ground-blend': [
        'interpolate',
        ['linear'],
        ['zoom'],
        9,
        0.82,
        10.5,
        0.62,
        12.5,
        0.48,
      ],
      'atmosphere-blend': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5.5,
        0,
        7,
        0.55,
        10,
        0.75,
      ],
    },
    sources,
    layers,
  };
}

/** All files this build reads from — if every output is newer than each of
 *  these (and exists), the basemap is current and we can skip the whole clip. */
const INPUT_FILES = [
  join(RAW_DIR, 'ne_10m_land.geojson'),
  join(RAW_DIR, 'ne_10m_lakes.geojson'),
  join(RAW_DIR, 'ne_10m_coastline.geojson'),
  join('scripts', 'build-map-style.ts'),
  join('scripts', 'build-regions-geojson.ts'),
  join('scripts', 'lib', 'svg-path-geo.ts'),
  join('scripts', 'lib', 'relief-style.ts'),
  // Appearing/refreshing local DEM tiers must update the selected terrain source.
  DEM_PMTILES_PATH,
  TERRAIN_DEM_PMTILES_PATH,
  // Appearing/refreshing baked relief must flip the style to the raster tier.
  RELIEF_MANIFEST_PATH,
  join('data', 'geo', 'basemap.json'),
  join('data', 'geo', 'regions.json'),
];

const OUTPUT_FILES = [
  join(OUT_DIR, 'land.json'),
  join(OUT_DIR, 'lakes.json'),
  join(OUT_DIR, 'coastline.json'),
  join(OUT_DIR, 'style.json'),
  join(OUT_DIR, 'manifest.json'),
  join(OUT_DIR, 'regions-meta.json'),
];

/** Skip the (multi-second) clip when the basemap is already up to date.
 *  Requires the raw Natural Earth tiles to be present — a fresh checkout with
 *  no raw cache always rebuilds (and downloads). */
function isCurrent(): boolean {
  if (!OUTPUT_FILES.every(existsSync)) return false;
  // Optional local terrain assets can appear or disappear without an mtime to
  // compare. Confirm the built style still points at the tier demSource() now
  // selects, otherwise rebuild even when every remaining input is older.
  try {
    const style = JSON.parse(readFileSync(join(OUT_DIR, 'style.json'), 'utf-8')) as {
      sources?: Record<string, { url?: string; tiles?: string[]; tileSize?: number }>;
    };
    const currentDem = style.sources?.dem;
    const desiredDem = demSource();
    if (
      currentDem?.url !== desiredDem.url ||
      currentDem?.tileSize !== desiredDem.tileSize ||
      JSON.stringify(currentDem?.tiles) !== JSON.stringify(desiredDem.tiles)
    ) {
      return false;
    }
    if (!!style.sources?.relief !== existsSync(RELIEF_MANIFEST_PATH)) return false;
  } catch {
    return false;
  }
  const inputs = INPUT_FILES.filter(existsSync);
  // Raw tiles are mandatory inputs; if they aren't cached we must rebuild.
  if (!existsSync(join(RAW_DIR, 'ne_10m_land.geojson'))) return false;
  const newestInput = Math.max(...inputs.map((p) => statSync(p).mtimeMs));
  const oldestOutput = Math.min(...OUTPUT_FILES.map((p) => statSync(p).mtimeMs));
  return oldestOutput >= newestInput;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  if (isCurrent()) {
    console.log('Basemap already built & current — skipping (touch a data/geo input to rebuild).');
    return;
  }

  const [landRaw, lakesRaw, coastRaw] = await Promise.all([
    download(LAYERS.land, 'ne_10m_land.geojson'),
    download(LAYERS.lakes, 'ne_10m_lakes.geojson'),
    download(LAYERS.coastline, 'ne_10m_coastline.geojson'),
  ]);

  const land = clipToBasin(
    JSON.parse(landRaw) as FeatureCollection<Polygon | MultiPolygon>,
  );
  const lakes = clipToBasin(
    JSON.parse(lakesRaw) as FeatureCollection<Polygon | MultiPolygon>,
  );
  const coastline = clipToBasin(
    JSON.parse(coastRaw) as FeatureCollection<LineString | MultiLineString>,
  );

  const style = buildStyle(land, lakes, coastline);

  writeFileSync(join(OUT_DIR, 'land.json'), JSON.stringify(land));
  writeFileSync(join(OUT_DIR, 'lakes.json'), JSON.stringify(lakes));
  writeFileSync(join(OUT_DIR, 'coastline.json'), JSON.stringify(coastline));
  writeFileSync(join(OUT_DIR, 'style.json'), JSON.stringify(style));

  // Drop stale layers from the retired SVG hybrid so they can't be served by mistake.
  for (const stale of STALE_OUTPUTS) {
    const p = join(OUT_DIR, stale);
    if (existsSync(p)) rmSync(p);
  }

  const manifest = {
    version: 4,
    bounds: MAP_BOUNDS,
    maxBounds: [
      [MAP_BOUNDS.west, MAP_BOUNDS.south],
      [MAP_BOUNDS.east, MAP_BOUNDS.north],
    ],
    center: [24, 36] as [number, number],
    defaultZoom: 4.6,
    minZoom: 3,
    maxZoom: 14,
    attribution: [
      {
        name: 'Natural Earth',
        url: 'https://www.naturalearthdata.com/',
        license: 'CC0 1.0',
      },
      existsSync(TERRAIN_DEM_PMTILES_PATH) || existsSync(DEM_PMTILES_PATH)
        ? {
            name: 'Mapterhorn',
            url: 'https://mapterhorn.com/attribution',
            license: 'Open Data',
          }
        : {
            name: 'Terrain Tiles (Mapzen/AWS)',
            url: 'https://registry.opendata.aws/terrain-tiles/',
            license: 'Open Data',
          },
    ],
  };
  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const { buildRegionsGeoJson } = await import('./build-regions-geojson');
  const { metaCount } = buildRegionsGeoJson();
  console.log(`regions-meta: ${metaCount} entries`);

  const kb = (n: number) => `${Math.round(n / 1024)} KB`;
  console.log(
    `wrote public/geo/ — land ${land.features.length} ${kb(JSON.stringify(land).length)}, ` +
      `lakes ${lakes.features.length} ${kb(JSON.stringify(lakes).length)}, ` +
      `coast ${coastline.features.length} ${kb(JSON.stringify(coastline).length)}, ` +
      `style ${kb(JSON.stringify(style).length)} (inline GeoJSON)`,
  );
  if (land.features.length < 5) {
    console.error('ERROR: too few land polygons — map will be blank');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
