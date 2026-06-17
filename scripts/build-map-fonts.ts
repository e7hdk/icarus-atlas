/**
 * Generates MapLibre SDF glyph PBFs for the Cinzel display face, so the map's
 * city / region / feature labels use the same classical serif as the rest of
 * the atlas (CLAUDE.md theme rule) instead of a generic sans from the demotiles
 * glyph server.
 *
 * MapLibre cannot read a CSS/web font for WebGL labels — it needs pre-baked
 * signed-distance-field glyph tiles. The canonical generator (fontnik) is a
 * native addon that does not build on Node 24/25, so this pipeline uses only
 * prebuilt-binary / pure-JS deps:
 *   - @napi-rs/canvas  rasterise each glyph at 24px (prebuilt, no node-gyp)
 *   - a tiny-sdf EDT    signed distance field (ported below, pure JS)
 *   - pbf               encode the glyphs.proto fontstack (pure JS)
 *
 * Output: public/geo/font/Cinzel/{start}-{end}.pbf  (committed static assets).
 * The style's `glyphs` URL points here; MAP_LABEL_FONT names the stack.
 *
 * Usage: pnpm build:fonts   (cached — skips when PBFs already exist; FORCE=1 to rebuild)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { PbfWriter } from 'pbf';

const FONT_NAME = 'Cinzel';
// SemiBold (600), not Regular: at 9–11px map-label sizes Cinzel's Regular
// hairlines render faint through the SDF; the heavier weight stays crisp.
const TTF_URL = 'https://cdn.jsdelivr.net/fontsource/fonts/cinzel@latest/latin-600-normal.ttf';
const RAW_TTF = join('data', 'geo', 'raw', 'fonts', 'Cinzel-SemiBold.ttf');
const OUT_DIR = join('public', 'geo', 'font', FONT_NAME);

/** fontnik defaults — keep glyph metrics compatible with MapLibre's renderer. */
const FONT_SIZE = 24;
const BUFFER = 3;
const RADIUS = 8;
const CUTOFF = 0.25;
const INF = 1e20;

/** Cinzel is a high-contrast serif: its thin horizontals go sub-pixel at map
 *  label sizes and render as faint grey ghosts. A small uniform outline stroke
 *  thickens every stroke by ~this many px (helping the thin ones most), which
 *  lowers the contrast just enough to stay crisp small without looking heavy. */
const EMBOLDEN = 0.75;

/** Codepoint ranges to bake. Every map label name is within 0-255 (verified),
 *  and Cinzel only covers Latin — baking higher ranges would just ship the
 *  system fallback face mislabeled as Cinzel. */
const RANGES: [number, number][] = [[0, 255]];

interface Glyph {
  id: number;
  width: number;
  height: number;
  left: number;
  top: number;
  advance: number;
  bitmap?: Uint8Array;
}

async function ensureTtf(): Promise<void> {
  if (existsSync(RAW_TTF)) return;
  mkdirSync(join('data', 'geo', 'raw', 'fonts'), { recursive: true });
  process.stdout.write(`downloading ${FONT_NAME} ttf… `);
  const res = await fetch(TTF_URL, {
    headers: { 'User-Agent': 'IcarusAtlas-font-build/0.1 (educational mythology atlas)' },
  });
  if (!res.ok) throw new Error(`${TTF_URL}: HTTP ${res.status}`);
  writeFileSync(RAW_TTF, Buffer.from(await res.arrayBuffer()));
  console.log('done');
}

/** 1D squared-distance transform (Felzenszwalb & Huttenlocher) — tiny-sdf port. */
function edt1d(
  grid: Float64Array,
  offset: number,
  stride: number,
  length: number,
  f: Float64Array,
  v: Int16Array,
  z: Float64Array,
): void {
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  f[0] = grid[offset]!;
  let k = 0;
  let s = 0;
  for (let q = 1; q < length; q++) {
    f[q] = grid[offset + q * stride]!;
    const q2 = q * q;
    let r: number;
    do {
      r = v[k]!;
      s = (f[q]! - f[r]! + q2 - r * r) / (q - r) / 2;
    } while (s <= z[k]! && --k > -1);
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  for (let q = 0, kk = 0; q < length; q++) {
    while (z[kk + 1]! < q) kk++;
    const r = v[kk]!;
    grid[offset + q * stride] = f[q]! + (q - r) * (q - r);
  }
}

function edt(
  grid: Float64Array,
  width: number,
  height: number,
  f: Float64Array,
  v: Int16Array,
  z: Float64Array,
): void {
  for (let x = 0; x < width; x++) edt1d(grid, x, width, height, f, v, z);
  for (let y = 0; y < height; y++) edt1d(grid, y * width, 1, width, f, v, z);
}

/** Signed-distance bitmap from an alpha-coverage grid (already buffered). */
function sdfFromAlpha(alpha: Float64Array, w: number, h: number): Uint8Array {
  const size = w * h;
  const gridOuter = new Float64Array(size);
  const gridInner = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    const a = alpha[i]!;
    gridOuter[i] = a === 1 ? 0 : a === 0 ? INF : Math.pow(Math.max(0, 0.5 - a), 2);
    gridInner[i] = a === 1 ? INF : a === 0 ? 0 : Math.pow(Math.max(0, a - 0.5), 2);
  }
  const max = Math.max(w, h);
  const f = new Float64Array(max);
  const v = new Int16Array(max);
  const z = new Float64Array(max + 1);
  edt(gridOuter, w, h, f, v, z);
  edt(gridInner, w, h, f, v, z);

  const out = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    const d = Math.sqrt(gridOuter[i]!) - Math.sqrt(gridInner[i]!);
    out[i] = Math.max(0, Math.min(255, Math.round(255 - 255 * (d / RADIUS + CUTOFF))));
  }
  return out;
}

const SCRATCH = 96;
const PEN_X = 24;
const BASELINE_Y = 64;

/** C0/C1 control codepoints have no glyph and break napi-canvas CString conversion. */
function isControl(cp: number): boolean {
  return cp < 0x20 || (cp >= 0x7f && cp <= 0xa0);
}

/** Rasterise one codepoint and return its SDF glyph, or null if it has no glyph. */
function renderGlyph(char: string, codepoint: number): Glyph | null {
  if (isControl(codepoint)) return null;
  const canvas = createCanvas(SCRATCH, SCRATCH);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SCRATCH, SCRATCH);
  ctx.font = `${FONT_SIZE}px ${FONT_NAME}`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#000';

  const advance = Math.round(ctx.measureText(char).width);

  ctx.fillText(char, PEN_X, BASELINE_Y);
  if (EMBOLDEN > 0) {
    ctx.lineWidth = EMBOLDEN;
    ctx.strokeStyle = '#000';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeText(char, PEN_X, BASELINE_Y);
  }
  const img = ctx.getImageData(0, 0, SCRATCH, SCRATCH).data;

  // Find the tight ink bbox from the alpha channel.
  let ix0 = SCRATCH;
  let iy0 = SCRATCH;
  let ix1 = -1;
  let iy1 = -1;
  for (let y = 0; y < SCRATCH; y++) {
    for (let x = 0; x < SCRATCH; x++) {
      if (img[(y * SCRATCH + x) * 4 + 3]! > 0) {
        if (x < ix0) ix0 = x;
        if (x > ix1) ix1 = x;
        if (y < iy0) iy0 = y;
        if (y > iy1) iy1 = y;
      }
    }
  }

  // No ink: a space (or a non-printing codepoint). Emit advance-only for ' '.
  if (ix1 < 0) {
    if (codepoint === 0x20) return { id: codepoint, width: 0, height: 0, left: 0, top: 0, advance };
    return null;
  }

  const glyphW = ix1 - ix0 + 1;
  const glyphH = iy1 - iy0 + 1;
  const w = glyphW + 2 * BUFFER;
  const h = glyphH + 2 * BUFFER;

  const alpha = new Float64Array(w * h);
  for (let gy = 0; gy < glyphH; gy++) {
    for (let gx = 0; gx < glyphW; gx++) {
      const a = img[((iy0 + gy) * SCRATCH + (ix0 + gx)) * 4 + 3]! / 255;
      alpha[(gy + BUFFER) * w + (gx + BUFFER)] = a;
    }
  }

  return {
    id: codepoint,
    width: glyphW,
    height: glyphH,
    left: ix0 - PEN_X,
    top: BASELINE_Y - iy0,
    advance,
    bitmap: sdfFromAlpha(alpha, w, h),
  };
}

function writeGlyph(glyph: Glyph, pbf: PbfWriter): void {
  pbf.writeVarintField(1, glyph.id);
  if (glyph.bitmap) pbf.writeBytesField(2, glyph.bitmap);
  pbf.writeVarintField(3, glyph.width);
  pbf.writeVarintField(4, glyph.height);
  pbf.writeSVarintField(5, glyph.left);
  pbf.writeSVarintField(6, glyph.top);
  pbf.writeVarintField(7, glyph.advance);
}

function writeFontstack(
  stack: { name: string; range: string; glyphs: Glyph[] },
  pbf: PbfWriter,
): void {
  pbf.writeStringField(1, stack.name);
  pbf.writeStringField(2, stack.range);
  for (const glyph of stack.glyphs) pbf.writeMessage(3, writeGlyph, glyph);
}

function encodeRange(name: string, range: string, glyphs: Glyph[]): Buffer {
  const pbf = new PbfWriter();
  pbf.writeMessage(1, writeFontstack, { name, range, glyphs });
  return Buffer.from(pbf.finish());
}

async function main() {
  const force = process.env.FORCE === '1';
  const done = RANGES.every(([s, e]) => existsSync(join(OUT_DIR, `${s}-${e}.pbf`)));
  if (done && !force) {
    console.log(`fonts: ${FONT_NAME} glyphs already built (FORCE=1 to rebuild)`);
    return;
  }

  await ensureTtf();
  if (!GlobalFonts.register(readFileSync(RAW_TTF), FONT_NAME)) {
    throw new Error(`failed to register ${FONT_NAME} font`);
  }
  mkdirSync(OUT_DIR, { recursive: true });

  let total = 0;
  for (const [start, end] of RANGES) {
    const glyphs: Glyph[] = [];
    for (let cp = start; cp <= end; cp++) {
      const glyph = renderGlyph(String.fromCodePoint(cp), cp);
      if (glyph) glyphs.push(glyph);
    }
    const buf = encodeRange(FONT_NAME, `${start}-${end}`, glyphs);
    writeFileSync(join(OUT_DIR, `${start}-${end}.pbf`), buf);
    total += glyphs.length;
    console.log(`fonts: ${FONT_NAME} ${start}-${end} — ${glyphs.length} glyphs, ${Math.round(buf.length / 1024)} KB`);
  }
  console.log(`fonts: wrote ${total} ${FONT_NAME} glyphs to ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
