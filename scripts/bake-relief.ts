/**
 * Bakes the relief look (hypsometric tint + igor hillshade) into raster tiles.
 *
 * WHY: with 3D terrain enabled, MapLibre re-rasterizes every draped style
 * layer into a texture per terrain tile (render-to-texture). The two runtime
 * DEM layers (color-relief + hillshade) were the most expensive entries in
 * that pass — two full-tile raster ops recomputed from elevation on the GPU
 * for every tile that streams in. Baking them offline into ONE pre-shaded
 * raster turns that work into a plain texture copy, which is exactly how
 * satellite-basemap sites stay smooth under terrain.
 *
 * The shading math is a faithful port of MapLibre's hillshade shaders
 * (hillshade_prepare.fragment.glsl + the igor method in
 * hillshade.fragment.glsl), so the baked tiles match what the runtime layers
 * rendered. Colours/ramps live in scripts/lib/relief-style.ts, shared with the
 * runtime fallback in build-map-style.ts.
 *
 * Input:  public/geo/dem.pmtiles (Mapterhorn extract, `pnpm dem:fetch`)
 * Output: public/geo/relief/{z}/{x}/{y}.webp  (z4–z9, 512px, ~150 MB)
 *         public/geo/relief/manifest.json
 *
 * Usage: pnpm relief:bake  (idempotent — skips existing tiles; FORCE=1 redoes)
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { open, type FileHandle } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { PMTiles, type RangeResponse } from 'pmtiles';
import {
  BAKE_SHADE_EXAGGERATION,
  parseRgba,
  SHADE_AZIMUTH_DEG,
  SHADE_HIGHLIGHT,
  SHADE_SHADOW,
  TINT_STOPS,
  type Rgba,
} from './lib/relief-style';

const DEM_PATH = join('public', 'geo', 'dem.pmtiles');
const OUT_DIR = join('public', 'geo', 'relief');

/** Camera maxBounds — matches the dem:fetch extract bbox. */
const BBOX = { west: -6, south: 22, east: 44, north: 47 } as const;
/** z4 exists only as the animation-fallback parent of the z5 band. */
const MIN_Z = 4;
/** Mapterhorn extract maxzoom; MapLibre overzooms past it. */
const MAX_Z = 9;
const TILE = 512;
const GRID = TILE + 2; // 1px neighbour border for the 3x3 derivative kernel

const FORCE = process.env.FORCE === '1';

// ---------------------------------------------------------------------------
// DEM access (pmtiles over a local file handle)

class NodeFileSource {
  constructor(
    private handle: FileHandle,
    private key: string,
  ) {}
  getKey(): string {
    return this.key;
  }
  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    const buffer = Buffer.alloc(length);
    await this.handle.read(buffer, 0, length, offset);
    return { data: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + length) };
  }
}

/** Decoded DEM tiles (terrarium → metres), promise-deduped LRU. */
const demCache = new Map<string, Promise<Float32Array | null>>();
const DEM_CACHE_MAX = 260; // ~3 rows of z9 tiles at 1 MB each

function getDem(pm: PMTiles, z: number, x: number, y: number): Promise<Float32Array | null> {
  const key = `${z}/${x}/${y}`;
  const hit = demCache.get(key);
  if (hit) {
    // Refresh LRU position.
    demCache.delete(key);
    demCache.set(key, hit);
    return hit;
  }
  const promise = (async () => {
    if (x < 0 || y < 0 || x >= 2 ** z || y >= 2 ** z) return null;
    const tile = await pm.getZxy(z, x, y);
    if (!tile?.data) return null;
    const { data, info } = await sharp(Buffer.from(tile.data))
      .raw()
      .toBuffer({ resolveWithObject: true });
    if (info.width !== TILE || info.height !== TILE) {
      throw new Error(`DEM tile ${key} is ${info.width}x${info.height}, expected ${TILE}`);
    }
    const ch = info.channels;
    const out = new Float32Array(TILE * TILE);
    for (let i = 0; i < TILE * TILE; i++) {
      const o = i * ch;
      // Terrarium: e = R*256 + G + B/256 - 32768
      out[i] = data[o]! * 256 + data[o + 1]! + data[o + 2]! / 256 - 32768;
    }
    return out;
  })();
  demCache.set(key, promise);
  if (demCache.size > DEM_CACHE_MAX) {
    const oldest = demCache.keys().next().value!;
    demCache.delete(oldest);
  }
  return promise;
}

/** Elevation grid with a 1px border stitched from the 8 neighbour tiles
 *  (mirrors the DEM backfill MapLibre does before its prepare pass), so the
 *  derivative kernel never sees a seam at tile edges. Missing neighbours
 *  clamp to the tile's own edge. */
async function elevationGrid(
  pm: PMTiles,
  z: number,
  x: number,
  y: number,
): Promise<Float32Array | null> {
  const center = await getDem(pm, z, x, y);
  if (!center) return null;

  const grid = new Float32Array(GRID * GRID);
  for (let row = 0; row < TILE; row++) {
    grid.set(center.subarray(row * TILE, (row + 1) * TILE), (row + 1) * GRID + 1);
  }

  const [west, east, north, south] = await Promise.all([
    getDem(pm, z, x - 1, y),
    getDem(pm, z, x + 1, y),
    getDem(pm, z, x, y - 1),
    getDem(pm, z, x, y + 1),
  ]);
  const [nw, ne, sw, se] = await Promise.all([
    getDem(pm, z, x - 1, y - 1),
    getDem(pm, z, x + 1, y - 1),
    getDem(pm, z, x - 1, y + 1),
    getDem(pm, z, x + 1, y + 1),
  ]);

  for (let row = 0; row < TILE; row++) {
    const g = (row + 1) * GRID;
    grid[g] = west ? west[row * TILE + (TILE - 1)]! : grid[g + 1]!;
    grid[g + GRID - 1] = east ? east[row * TILE]! : grid[g + GRID - 2]!;
  }
  for (let col = 0; col < TILE; col++) {
    grid[col + 1] = north ? north[(TILE - 1) * TILE + col]! : grid[GRID + col + 1]!;
    grid[(GRID - 1) * GRID + col + 1] = south
      ? south[col]!
      : grid[(GRID - 2) * GRID + col + 1]!;
  }
  grid[0] = nw ? nw[TILE * TILE - 1]! : grid[GRID + 1]!;
  grid[GRID - 1] = ne ? ne[(TILE - 1) * TILE]! : grid[GRID + GRID - 2]!;
  grid[(GRID - 1) * GRID] = sw ? sw[TILE - 1]! : grid[(GRID - 2) * GRID + 1]!;
  grid[GRID * GRID - 1] = se ? se[0]! : grid[(GRID - 2) * GRID + GRID - 2]!;

  return grid;
}

// ---------------------------------------------------------------------------
// Shading (ported from MapLibre's hillshade shaders)

interface Premul {
  r: number;
  g: number;
  b: number;
  a: number;
}

const premul = ({ r, g, b, a }: Rgba): Premul => ({
  r: (r / 255) * a,
  g: (g / 255) * a,
  b: (b / 255) * a,
  a,
});

const SHADOW = premul(parseRgba(SHADE_SHADOW));
const HIGHLIGHT = premul(parseRgba(SHADE_HIGHLIGHT));
const AZIMUTH = (SHADE_AZIMUTH_DEG * Math.PI) / 180 + Math.PI;

/** Straight-alpha tint stops for piecewise-linear interpolation by elevation. */
const TINT: [number, Rgba][] = TINT_STOPS.map(([e, c]) => [e, parseRgba(c)]);

function tintAt(elevation: number): Premul {
  if (elevation <= TINT[0]![0]) return premul(TINT[0]![1]);
  const last = TINT[TINT.length - 1]!;
  if (elevation >= last[0]) return premul(last[1]);
  for (let i = 1; i < TINT.length; i++) {
    const [e1, c1] = TINT[i]!;
    if (elevation <= e1) {
      const [e0, c0] = TINT[i - 1]!;
      const t = (elevation - e0) / (e1 - e0);
      return premul({
        r: c0.r + (c1.r - c0.r) * t,
        g: c0.g + (c1.g - c0.g) * t,
        b: c0.b + (c1.b - c0.b) * t,
        a: c0.a + (c1.a - c0.a) * t,
      });
    }
  }
  return premul(last[1]);
}

const glslMod2 = (v: number): number => ((v % 2) + 2) % 2;

/** North (row 0) and south (row 512) latitudes of a mercator tile. */
function tileLatRange(z: number, y: number): [number, number] {
  const n = 2 ** z;
  const lat = (yy: number) =>
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * yy) / n))) * 180) / Math.PI;
  return [lat(y), lat(y + 1)];
}

/** Bake one tile: tint + igor hillshade composited (shade over tint),
 *  premultiplied, then written as straight-alpha webp. */
function shadeTile(grid: Float32Array, z: number, y: number): Buffer {
  const out = Buffer.alloc(TILE * TILE * 4);
  const [latN, latS] = tileLatRange(z, y);

  // hillshade_prepare.fragment.glsl: zoom-dependent derivative normalisation.
  const exaggerationFactor = z < 2 ? 0.4 : z < 4.5 ? 0.35 : 0.3;
  const prepExaggeration = z < 15 ? (z - 15) * exaggerationFactor : 0;
  const derivScale = TILE / 2 ** (prepExaggeration + (28.2562 - z));

  for (let py = 0; py < TILE; py++) {
    // hillshade.fragment.glsl: per-row latitude slope correction.
    const v = (py + 0.5) / TILE;
    const lat = (latN - latS) * (1 - v) + latS;
    const invScaleFactor = 1 / Math.cos((lat * Math.PI) / 180);

    for (let px = 0; px < TILE; px++) {
      const g = (py + 1) * GRID + (px + 1);
      const e = grid[g]!;
      const o = (py * TILE + px) * 4;

      // Bathymetry stays fully transparent — the nebula sea is untouched.
      if (e <= 0) continue;

      const a = grid[g - GRID - 1]!;
      const b = grid[g - GRID]!;
      const c = grid[g - GRID + 1]!;
      const d = grid[g - 1]!;
      const f = grid[g + 1]!;
      const gg = grid[g + GRID - 1]!;
      const h = grid[g + GRID]!;
      const i = grid[g + GRID + 1]!;

      // Prepare pass: 3x3 kernel derivative, clamped like the stored texture.
      let dx = (c + f + f + i - (a + d + d + gg)) * derivScale;
      let dy = (gg + h + h + i - (a + b + b + c)) * derivScale;
      dx = Math.max(-4, Math.min(4, dx)) * invScaleFactor;
      dy = Math.max(-4, Math.min(4, dy)) * invScaleFactor;

      // igor_hillshade with the paint exaggeration folded in (deriv * e * 2).
      const k = BAKE_SHADE_EXAGGERATION * 2;
      const ix = dx * k;
      const iy = dy * k;
      const aspect = ix !== 0 ? Math.atan2(iy, -ix) : (Math.PI / 2) * Math.sign(iy);
      const slopeStrength = (Math.atan(Math.hypot(ix, iy)) * 2) / Math.PI;
      const aspectStrength = 1 - Math.abs(glslMod2((aspect + AZIMUTH) / Math.PI + 0.5) - 1);
      const shadowStrength = slopeStrength * aspectStrength;
      const highlightStrength = slopeStrength * (1 - aspectStrength);

      // Feather the first ~30 m so shading never draws a hard coast edge.
      const coast = Math.min(1, e / 30);
      let sr = (SHADOW.r * shadowStrength + HIGHLIGHT.r * highlightStrength) * coast;
      let sg = (SHADOW.g * shadowStrength + HIGHLIGHT.g * highlightStrength) * coast;
      let sb = (SHADOW.b * shadowStrength + HIGHLIGHT.b * highlightStrength) * coast;
      let sa = (SHADOW.a * shadowStrength + HIGHLIGHT.a * highlightStrength) * coast;

      // Composite shade OVER tint (layer order of the old runtime pair).
      const tint = tintAt(e);
      sr += tint.r * (1 - sa);
      sg += tint.g * (1 - sa);
      sb += tint.b * (1 - sa);
      sa += tint.a * (1 - sa);

      if (sa <= 0) continue;
      out[o] = Math.round(Math.max(0, Math.min(1, sr / sa)) * 255);
      out[o + 1] = Math.round(Math.max(0, Math.min(1, sg / sa)) * 255);
      out[o + 2] = Math.round(Math.max(0, Math.min(1, sb / sa)) * 255);
      out[o + 3] = Math.round(Math.max(0, Math.min(1, sa)) * 255);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Tile enumeration & main loop

const lon2x = (lon: number, z: number) => ((lon + 180) / 360) * 2 ** z;
const lat2y = (lat: number, z: number) => {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.asinh(Math.tan(rad)) / Math.PI) / 2) * 2 ** z;
};

async function main() {
  if (!existsSync(DEM_PATH)) {
    console.log('relief: no local DEM extract (public/geo/dem.pmtiles) — skipping bake.');
    console.log('relief: run `pnpm dem:fetch` first; the style falls back to runtime relief.');
    return;
  }

  const handle = await open(DEM_PATH, 'r');
  const pm = new PMTiles(new NodeFileSource(handle, DEM_PATH));

  const jobs: { z: number; x: number; y: number }[] = [];
  for (let z = MIN_Z; z <= MAX_Z; z++) {
    const x0 = Math.floor(lon2x(BBOX.west, z));
    const x1 = Math.floor(lon2x(BBOX.east, z));
    const y0 = Math.floor(lat2y(BBOX.north, z));
    const y1 = Math.floor(lat2y(BBOX.south, z));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) jobs.push({ z, x, y });
    }
  }

  let done = 0;
  let skipped = 0;
  let baked = 0;
  const started = Date.now();

  const worker = async () => {
    for (;;) {
      const job = jobs.shift();
      if (!job) return;
      const { z, x, y } = job;
      const dir = join(OUT_DIR, String(z), String(x));
      const file = join(dir, `${y}.webp`);
      done++;
      if (!FORCE && existsSync(file)) {
        skipped++;
        continue;
      }
      const grid = await elevationGrid(pm, z, x, y);
      if (!grid) continue;
      const rgba = shadeTile(grid, z, y);
      const webp = await sharp(rgba, { raw: { width: TILE, height: TILE, channels: 4 } })
        .webp({ quality: 90, alphaQuality: 90 })
        .toBuffer();
      mkdirSync(dir, { recursive: true });
      writeFileSync(file, webp);
      baked++;
      if (baked % 200 === 0) {
        const dt = ((Date.now() - started) / 1000).toFixed(0);
        console.log(`relief: ${done}/${done + jobs.length} tiles (${baked} baked, ${dt}s)`);
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  await handle.close();

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    join(OUT_DIR, 'manifest.json'),
    JSON.stringify(
      {
        version: 1,
        source: 'Mapterhorn DEM extract (public/geo/dem.pmtiles)',
        bbox: [BBOX.west, BBOX.south, BBOX.east, BBOX.north],
        minzoom: MIN_Z,
        maxzoom: MAX_Z,
        tileSize: TILE,
        exaggeration: BAKE_SHADE_EXAGGERATION,
        tiles: baked + skipped,
      },
      null,
      2,
    ),
  );
  console.log(
    `relief: complete — ${baked} baked, ${skipped} already current, ` +
      `${((Date.now() - started) / 1000).toFixed(0)}s`,
  );
  console.log('relief: run `pnpm build:map` to switch the style to the baked tier.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
