/**
 * Retiles the pinned 512px Mapterhorn DEM into a dedicated 256px terrain archive.
 *
 * MapLibre sizes its terrain render-to-texture pool from the DEM source tileSize:
 * a 512px source becomes 2048px RTT tiles, while a 256px source becomes 1024px.
 * The visual relief remains the separately baked 512px raster; this archive only
 * drives the elevation mesh.
 *
 * To preserve elevation quality, this does not resample the DEM. Every 512x512
 * source tile is split into four lossless 256x256 child tiles at z+1. The ground
 * resolution and every Terrarium RGB elevation sample therefore stay identical.
 *
 * Input:  public/geo/dem.pmtiles          (512px, z0-z9)
 * Output: public/geo/dem-terrain.pmtiles  (256px, z1-z10)
 *
 * Usage: pnpm dem:terrain
 *        FORCE=1 pnpm dem:terrain
 */
import { createRequire } from 'node:module';
import { existsSync, rmSync } from 'node:fs';
import { open, type FileHandle } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { PMTiles, TileType, type RangeResponse } from 'pmtiles';

const SOURCE_PATH = 'public/geo/dem.pmtiles';
const OUTPUT_PATH = 'public/geo/dem-terrain.pmtiles';
const MBTILES_PATH = 'public/geo/dem-terrain.tmp.mbtiles';
const SOURCE_TILE_SIZE = 512;
const TERRAIN_TILE_SIZE = 256;
const WORKERS = 8;
const FORCE = process.env.FORCE === '1';

interface SqliteStatement {
  run(...values: unknown[]): unknown;
}

interface SqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
  close(): void;
}

interface SqliteModule {
  DatabaseSync: new (path: string) => SqliteDatabase;
}

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

interface TileJob {
  z: number;
  x: number;
  y: number;
}

interface VerificationSample extends TileJob {
  childX: number;
  childY: number;
  childZ: number;
  left: number;
  top: number;
}

const lon2x = (lon: number, z: number) => ((lon + 180) / 360) * 2 ** z;
const lat2y = (lat: number, z: number) => {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.asinh(Math.tan(rad)) / Math.PI) / 2) * 2 ** z;
};

function enumerateJobs(header: Awaited<ReturnType<PMTiles['getHeader']>>): TileJob[] {
  const jobs: TileJob[] = [];
  for (let z = header.minZoom; z <= header.maxZoom; z += 1) {
    const n = 2 ** z;
    const x0 = Math.max(0, Math.floor(lon2x(header.minLon, z)));
    const x1 = Math.min(n - 1, Math.floor(lon2x(header.maxLon, z)));
    const y0 = Math.max(0, Math.floor(lat2y(header.maxLat, z)));
    const y1 = Math.min(n - 1, Math.floor(lat2y(header.minLat, z)));
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) jobs.push({ z, x, y });
    }
  }
  return jobs;
}

async function splitTile(data: ArrayBuffer): Promise<Buffer[]> {
  const input = Buffer.from(data);
  const metadata = await sharp(input).metadata();
  if (metadata.width !== SOURCE_TILE_SIZE || metadata.height !== SOURCE_TILE_SIZE) {
    throw new Error(
      `Expected ${SOURCE_TILE_SIZE}px DEM tile, got ${metadata.width}x${metadata.height}`,
    );
  }

  const image = sharp(input);
  return Promise.all(
    [
      [0, 0],
      [TERRAIN_TILE_SIZE, 0],
      [0, TERRAIN_TILE_SIZE],
      [TERRAIN_TILE_SIZE, TERRAIN_TILE_SIZE],
    ].map(([left, top]) =>
      image
        .clone()
        .extract({ left, top, width: TERRAIN_TILE_SIZE, height: TERRAIN_TILE_SIZE })
        .webp({ lossless: true, effort: 2 })
        .toBuffer(),
    ),
  );
}

async function verifySamples(
  source: PMTiles,
  output: PMTiles,
  samples: VerificationSample[],
): Promise<void> {
  for (const sample of samples) {
    const [sourceTile, childTile] = await Promise.all([
      source.getZxy(sample.z, sample.x, sample.y),
      output.getZxy(sample.childZ, sample.childX, sample.childY),
    ]);
    if (!sourceTile || !childTile) {
      throw new Error(
        `Missing verification tile ${sample.childZ}/${sample.childX}/${sample.childY}`,
      );
    }

    const expected = await sharp(Buffer.from(sourceTile.data))
      .extract({
        left: sample.left,
        top: sample.top,
        width: TERRAIN_TILE_SIZE,
        height: TERRAIN_TILE_SIZE,
      })
      .raw()
      .toBuffer();
    const actual = await sharp(Buffer.from(childTile.data)).raw().toBuffer();
    if (!expected.equals(actual)) {
      throw new Error(
        `Terrain DEM pixel mismatch at ${sample.childZ}/${sample.childX}/${sample.childY}`,
      );
    }
  }
}

async function main() {
  if (!existsSync(SOURCE_PATH)) {
    throw new Error(`Missing ${SOURCE_PATH}; run \`pnpm dem:fetch\` first.`);
  }
  if (existsSync(OUTPUT_PATH) && !FORCE) {
    console.log(`terrain-dem: ${OUTPUT_PATH} already exists (use FORCE=1 to rebuild).`);
    return;
  }

  rmSync(MBTILES_PATH, { force: true });
  rmSync(OUTPUT_PATH, { force: true });

  const sourceHandle = await open(SOURCE_PATH, 'r');
  const source = new PMTiles(new NodeFileSource(sourceHandle, SOURCE_PATH));
  const header = await source.getHeader();
  if (header.tileType !== TileType.Webp) {
    throw new Error(`Expected WebP DEM tiles, got PMTiles tile type ${header.tileType}.`);
  }

  // Node 24 ships SQLite in core. Keep the structural type local so the project
  // can retain its Node 20 type package while the runtime requirement stays explicit.
  const require = createRequire(import.meta.url);
  const { DatabaseSync } = require('node:sqlite') as SqliteModule;
  const db = new DatabaseSync(MBTILES_PATH);
  db.exec(`
    PRAGMA journal_mode = OFF;
    PRAGMA synchronous = OFF;
    PRAGMA locking_mode = EXCLUSIVE;
    PRAGMA temp_store = MEMORY;
    CREATE TABLE metadata (name TEXT, value TEXT);
    CREATE TABLE tiles (
      zoom_level INTEGER,
      tile_column INTEGER,
      tile_row INTEGER,
      tile_data BLOB
    );
    CREATE UNIQUE INDEX tile_index
      ON tiles (zoom_level, tile_column, tile_row);
  `);

  const metadata = db.prepare('INSERT INTO metadata (name, value) VALUES (?, ?)');
  const metadataRows: [string, string][] = [
    ['name', 'Icarus Atlas terrain DEM'],
    ['description', 'Lossless 256px terrain mesh tiles split from the pinned Mapterhorn DEM'],
    ['version', '1'],
    ['type', 'baselayer'],
    ['format', 'webp'],
    ['bounds', `${header.minLon},${header.minLat},${header.maxLon},${header.maxLat}`],
    ['center', `${header.centerLon},${header.centerLat},${header.centerZoom + 1}`],
    ['minzoom', String(header.minZoom + 1)],
    ['maxzoom', String(header.maxZoom + 1)],
    ['attribution', '<a href="https://mapterhorn.com/attribution">© Mapterhorn</a>'],
  ];
  for (const row of metadataRows) metadata.run(...row);

  const insert = db.prepare(
    'INSERT INTO tiles (zoom_level, tile_column, tile_row, tile_data) VALUES (?, ?, ?, ?)',
  );
  const jobs = enumerateJobs(header);
  const total = jobs.length;
  const samples: VerificationSample[] = [];
  let cursor = 0;
  let visited = 0;
  let sourceTiles = 0;
  let childTiles = 0;
  const started = Date.now();

  db.exec('BEGIN');
  const worker = async () => {
    for (;;) {
      const index = cursor;
      cursor += 1;
      const job = jobs[index];
      if (!job) return;
      const tile = await source.getZxy(job.z, job.x, job.y);
      visited += 1;
      if (!tile) continue;

      const children = await splitTile(tile.data);
      sourceTiles += 1;
      const childZ = job.z + 1;
      for (let i = 0; i < children.length; i += 1) {
        const dx = i % 2;
        const dy = Math.floor(i / 2);
        const childX = job.x * 2 + dx;
        const childY = job.y * 2 + dy;
        const tmsY = 2 ** childZ - 1 - childY;
        insert.run(childZ, childX, tmsY, children[i]);
        childTiles += 1;

        if (samples.length < 8 && tile.data.byteLength > 1024) {
          samples.push({
            ...job,
            childZ,
            childX,
            childY,
            left: dx * TERRAIN_TILE_SIZE,
            top: dy * TERRAIN_TILE_SIZE,
          });
        }
      }

      if (sourceTiles % 200 === 0) {
        const seconds = Math.round((Date.now() - started) / 1000);
        console.log(
          `terrain-dem: ${visited}/${total} candidates, ${sourceTiles} source tiles, ` +
            `${childTiles} child tiles (${seconds}s)`,
        );
      }
    }
  };

  try {
    await Promise.all(Array.from({ length: WORKERS }, worker));
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  } finally {
    db.close();
  }

  const converted = spawnSync(
    'pnpm',
    ['exec', 'pmtiles', 'convert', MBTILES_PATH, OUTPUT_PATH, '--force'],
    { stdio: 'inherit' },
  );
  if (converted.status !== 0) {
    throw new Error(`pmtiles convert failed with exit code ${converted.status ?? 'unknown'}.`);
  }

  const outputHandle = await open(OUTPUT_PATH, 'r');
  try {
    const output = new PMTiles(new NodeFileSource(outputHandle, OUTPUT_PATH));
    const outputHeader = await output.getHeader();
    if (outputHeader.minZoom !== header.minZoom + 1 || outputHeader.maxZoom !== header.maxZoom + 1) {
      throw new Error(
        `Unexpected output zoom range z${outputHeader.minZoom}-z${outputHeader.maxZoom}.`,
      );
    }
    await verifySamples(source, output, samples);
  } finally {
    await outputHandle.close();
    await sourceHandle.close();
  }

  rmSync(MBTILES_PATH, { force: true });
  const seconds = Math.round((Date.now() - started) / 1000);
  console.log(
    `terrain-dem: complete — ${sourceTiles} source tiles -> ${childTiles} lossless child tiles ` +
      `in ${seconds}s; ${samples.length} pixel samples verified.`,
  );
  console.log('terrain-dem: run `pnpm build:map` to switch the style to the 256px archive.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
