/**
 * Builds data/geo/basemap.json for the Areas map (/areas) from the
 * "Greece (ancient)" SVG series on Wikimedia Commons (CC BY-SA 3.0).
 *
 * The series shares one coordinate space: every file is the same basemap with
 * one region tinted in a highlight color. We extract the shared land/foreign/
 * lake geometry once and the highlight polygons of each file as that region's
 * shape, copying path data verbatim (with cumulative transforms) so nothing
 * is re-projected or distorted.
 *
 * Usage: pnpm tsx scripts/build-basemap.ts [--report]
 *   --report  print per-region polygon extremes (used to calibrate the
 *             lon/lat → map-space fit) and skip writing the output file.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RAW_DIR = join('data', 'geo', 'raw');
const OUT_FILE = join('data', 'geo', 'basemap.json');

/** Region id → Commons file title. The Peloponnesus file doubles as the base. */
const SERIES: Record<string, string> = {
  peloponnese: 'Greece_(ancient)_Peloponnesus.svg',
  attica: 'Greece_(ancient)_Attica.svg',
  'central-greece': 'Greece_(ancient)_Central.svg',
  euboea: 'Greece_(ancient)_Euboea.svg',
  thessaly: 'Greece_(ancient)_Thessaly.svg',
  epirus: 'Greece_(ancient)_Epirus.svg',
  macedonia: 'Greece_(ancient)_Macedonia.svg',
  chalcidice: 'Greece_(ancient)_Chalcidice.svg',
  'ionian-islands': 'Greece_(ancient)_IonianIslands.svg',
  'north-aegean': 'Greece_(ancient)_NorthAegean.svg',
  'south-aegean': 'Greece_(ancient)_SouthAegean.svg',
  crete: 'Greece_(ancient)_Crete.svg',
};
const BASE_REGION = 'peloponnese';

const LAND_FILL = '#ffffd0';
const FOREIGN_FILL = '#f7d3aa';
const WATER_FILL = '#9ec7f3';
/** Stroke-only layers we never want (modern administrative borders). */
const SKIP_LAYERS = new Set(['Borders']);

interface ExtractedPath {
  d: string;
  transform: string;
  fill: string;
  layers: string[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function download(file: string): Promise<string> {
  const target = join(RAW_DIR, file);
  if (existsSync(target)) return target;
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}`;
  process.stdout.write(`downloading ${file}… `);
  for (let attempt = 1; ; attempt++) {
    // Commons rate-limits anonymous user agents hard; identify ourselves per their etiquette.
    const res = await fetch(url, {
      headers: { 'User-Agent': 'IcarusAtlas-basemap-build/0.1 (educational mythology atlas)' },
    });
    if (res.ok) {
      writeFileSync(target, Buffer.from(await res.arrayBuffer()));
      console.log('done');
      await sleep(2000); // stay friendly with Commons rate limits
      return target;
    }
    if (res.status === 429 && attempt < 5) {
      process.stdout.write(`429, retrying… `);
      await sleep(15000 * attempt);
      continue;
    }
    throw new Error(`${file}: HTTP ${res.status}`);
  }
}

/** Stream the SVG tags, tracking the <g> stack for transforms and layer labels. */
function parsePaths(svg: string): ExtractedPath[] {
  const paths: ExtractedPath[] = [];
  const stack: { transform: string; label: string }[] = [];
  // No dot-all flag needed: [^>] classes already cross newlines.
  const tagRe = /<(\/?)(g|path)\b([^>]*?)(\/?)>/g;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(svg))) {
    const [, closing, tag, attrs, selfClosing] = match;
    if (tag === 'g') {
      if (closing) stack.pop();
      else if (!selfClosing) {
        stack.push({
          transform: attr(attrs, 'transform') ?? '',
          label: attr(attrs, 'inkscape:label') ?? '',
        });
      }
      continue;
    }
    const d = attr(attrs, 'd');
    if (!d) continue;
    const style = attr(attrs, 'style') ?? '';
    const fill =
      /fill:\s*(#[0-9a-fA-F]+)/.exec(style)?.[1] ?? attr(attrs, 'fill') ?? 'none';
    const transform = [...stack.map((s) => s.transform), attr(attrs, 'transform') ?? '']
      .filter(Boolean)
      .join(' ');
    paths.push({
      d,
      transform,
      fill: fill.toLowerCase(),
      layers: stack.map((s) => s.label).filter(Boolean),
    });
  }
  return paths;
}

function attr(attrs: string, name: string): string | undefined {
  // Anchor on whitespace so `d="…"` cannot match inside `id="…"`.
  return new RegExp(`(?:^|\\s)${name.replace(':', '\\:')}="([^"]*)"`).exec(attrs)?.[1];
}

function isHighlight(fill: string): boolean {
  return fill.startsWith('#f0');
}

/* ---- geometry helpers (analysis only; rendered paths stay verbatim) ---- */

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

/** Collect the on-curve endpoints of a path in absolute map coordinates. */
function pathPoints(d: string, transform: string): [number, number][] {
  const m = parseTransform(transform);
  const points: [number, number][] = [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  // Numbers must stop at a second dot: Inkscape writes "1.2.3" for "1.2 .3".
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
  // Guard against odd Inkscape number runs ("1.2.3") the tokenizer mis-parses.
  return points.filter(([px, py]) => Number.isFinite(px) && Number.isFinite(py));
}

function extent(values: number[]): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return [min, max];
}

/* ---------------- authored sub-regions (lon/lat) ---------------- */

/** lon/lat → map-unit calibration for the series' plate-carrée source.
 *  Fitted on unambiguous coastal extremes (Kythira's southern tip for
 *  longitude+latitude, the Patroklou islet off Sounion for latitude) and
 *  cross-checked to within ~6 map units on independent capes. */
const CAL = { lonScale: 847.3, lonOffset: -16446, latScale: 1076.4, latOffset: 44946 };

function project([lon, lat]: [number, number]): [number, number] {
  return [
    Math.round(CAL.lonScale * lon + CAL.lonOffset),
    Math.round(CAL.latOffset - CAL.latScale * lat),
  ];
}

/** Classical sub-region boundaries, authored as rough lon/lat rings that
 *  overshoot the coast on purpose — the renderer clips them to the parent
 *  region's real coastline, so only the interior borders are hand-drawn
 *  (along the Neda, Taygetus and Parnon, per the classical atlases). */
/** Authored top-level patches for land the source series assigns to no region.
 *  The series follows modern peripheries and never drew "Western Greece", so
 *  Aetolia-Acarnania is orphaned; classically it belongs to Central Greece.
 *  Rings overshoot the sea and the neighbouring extracted shape — rendering
 *  clips them to land and flattens the overlap at group level. */
const REGION_EXTENSIONS: Record<string, [number, number][]> = {
  // West edge hugs the Acarnanian mainland coast so Leucas, Meganisi and
  // Ithaca stay with the Ionian Islands region.
  'central-greece': [
    [20.76, 38.95], [21.05, 38.97], [21.35, 39.12], [21.55, 39.18],
    [21.75, 39.0], [22.0, 38.85], [21.95, 38.3], [21.3, 38.15],
    [20.95, 38.4], [20.76, 38.55],
  ],
  // ---- Anatolia (Model B ethnic regions — docs/ANATOLIA_REGIONS.md §7) ----
  // Rings overshoot the coast; rendering clips them to the foreign layer.
  // The Troad: Priam's country between Mount Ida and the Hellespont.
  troad: [
    [25.6, 40.45], [26.8, 40.65], [27.9, 40.45], [28.0, 39.6],
    [26.8, 39.05], [25.9, 39.3],
  ],
  mysia: [[26.5, 40.2], [28.8, 40.2], [28.8, 39.0], [26.5, 39.0]],
  lydia: [[27.0, 39.5], [29.5, 39.5], [29.5, 38.0], [27.0, 38.0]],
  ionia: [[26.0, 38.8], [28.5, 38.8], [28.5, 37.5], [26.0, 37.5]],
  caria: [[27.0, 37.8], [29.5, 37.8], [29.5, 36.5], [27.0, 36.5]],
  lycia: [[27.8, 37.2], [31.5, 37.2], [31.5, 35.8], [27.8, 35.8]],
  pamphylia: [[30.0, 37.5], [32.5, 37.5], [32.5, 36.2], [30.0, 36.2]],
  cilicia: [[32.5, 37.8], [36.5, 37.8], [36.5, 36.0], [32.5, 36.0]],
  phrygia: [[27.5, 40.5], [32.5, 40.5], [32.5, 38.5], [27.5, 38.5]],
  bithynia: [[28.5, 41.5], [31.5, 41.5], [31.5, 40.0], [28.5, 40.0]],
  paphlagonia: [[32.0, 42.0], [36.0, 42.0], [36.0, 40.5], [32.0, 40.5]],
  pontus: [[36.0, 42.5], [41.5, 42.5], [41.5, 40.0], [36.0, 40.0]],
  cappadocia: [[33.5, 40.5], [38.5, 40.5], [38.5, 38.0], [33.5, 38.0]],
  // ---- West Mediterranean (docs/WEST_MEDITERRANEAN_PLAN.md §10) ----
  // Rings overshoot the coast; rendering clips them to the foreign layer.
  sicily: [[12.4, 38.3], [15.7, 38.3], [15.7, 36.4], [12.4, 36.4]],
  'magna-graecia': [[15.5, 41.3], [18.5, 41.3], [18.5, 37.8], [15.5, 37.8]],
  latium: [[12.2, 42.1], [13.2, 42.1], [13.2, 41.4], [12.2, 41.4]],
  campania: [[13.8, 41.3], [15.5, 41.3], [15.5, 40.5], [13.8, 40.5]],
};

const SUBREGIONS: Record<string, { parent: string; ring: [number, number][] }> = {
  // Shared-vertex discipline: wherever two siblings meet, both rings list the
  // IDENTICAL coordinate pairs along the shared border, so the clipped shapes
  // tile without slivers, crossings or gaps. Sea-ward edges overshoot freely.

  // ---- Peloponnese ----
  elis: {
    parent: 'peloponnese',
    ring: [
      [20.9, 38.45], [21.45, 38.3], [21.95, 38.0], [22.05, 37.55],
      [21.9, 37.32], [21.55, 37.35], [20.9, 37.6],
    ],
  },
  achaea: {
    parent: 'peloponnese',
    ring: [
      [21.2, 38.45], [22.2, 38.45], [22.55, 38.25], [22.45, 38.05],
      [22.1, 37.95], [21.95, 38.0], [21.45, 38.3],
    ],
  },
  corinthia: {
    parent: 'peloponnese',
    ring: [
      [22.55, 38.25], [23.25, 38.1], [23.25, 37.85], [22.95, 37.75],
      [22.65, 37.8], [22.45, 38.05],
    ],
  },
  argolis: {
    parent: 'peloponnese',
    ring: [
      [22.65, 37.8], [22.95, 37.75], [23.25, 37.85], [23.7, 37.45],
      [23.35, 37.2], [22.85, 37.4], [22.7, 37.6],
    ],
  },
  arcadia: {
    parent: 'peloponnese',
    ring: [
      [21.95, 38.0], [22.1, 37.95], [22.45, 38.05], [22.65, 37.8],
      [22.7, 37.6], [22.85, 37.4], [22.6, 37.15], [22.25, 37.15],
      [21.9, 37.32], [22.05, 37.55],
    ],
  },
  laconia: {
    parent: 'peloponnese',
    ring: [
      [22.25, 37.15], [22.6, 37.15], [22.85, 37.4], [23.35, 37.2],
      [23.45, 36.2], [22.9, 35.95], [22.35, 36.55], [22.3, 36.95],
    ],
  },
  messenia: {
    parent: 'peloponnese',
    ring: [
      [21.55, 37.35], [21.9, 37.32], [22.25, 37.15], [22.3, 36.95],
      [22.35, 36.55], [21.9, 36.5], [21.45, 36.9],
    ],
  },

  // ---- Attica ----
  megaris: {
    parent: 'attica',
    ring: [[22.9, 38.35], [23.45, 38.35], [23.47, 38.0], [23.42, 37.85], [22.9, 37.85]],
  },
  'attica-proper': {
    parent: 'attica',
    ring: [
      [23.45, 38.35], [24.2, 38.35], [24.2, 37.55], [23.62, 37.55],
      [23.62, 37.99], [23.47, 38.0],
    ],
  },
  salamis: {
    parent: 'attica',
    ring: [
      [23.36, 38.0], [23.5, 38.0], [23.55, 37.93], [23.595, 37.91],
      [23.58, 37.82], [23.37, 37.84],
    ],
  },
  aegina: {
    parent: 'attica',
    ring: [[23.3, 37.82], [23.6, 37.82], [23.6, 37.65], [23.3, 37.65]],
  },

  // ---- Central Greece ----
  acarnania: {
    parent: 'central-greece',
    ring: [[20.5, 39.1], [21.33, 39.1], [21.28, 38.6], [21.12, 38.32], [20.5, 38.3]],
  },
  aetolia: {
    parent: 'central-greece',
    ring: [
      [21.33, 39.1], [21.95, 39.15], [21.95, 38.95], [22.02, 38.72],
      [22.0, 38.55], [21.78, 38.65], [21.75, 38.28], [21.4, 38.25],
      [21.12, 38.32], [21.28, 38.6],
    ],
  },
  'ozolian-locris': {
    parent: 'central-greece',
    ring: [
      [21.78, 38.65], [22.0, 38.55], [22.3, 38.52], [22.28, 38.3],
      [21.75, 38.28],
    ],
  },
  doris: {
    parent: 'central-greece',
    ring: [[22.02, 38.72], [22.32, 38.7], [22.3, 38.52], [22.0, 38.55]],
  },
  malis: {
    parent: 'central-greece',
    ring: [
      [21.95, 39.15], [22.62, 38.92], [22.78, 38.72], [22.32, 38.7],
      [22.02, 38.72], [21.95, 38.95],
    ],
  },
  phocis: {
    parent: 'central-greece',
    ring: [
      [22.32, 38.7], [22.78, 38.72], [22.72, 38.3], [22.28, 38.3],
      [22.3, 38.52],
    ],
  },
  boeotia: {
    parent: 'central-greece',
    ring: [
      [22.78, 38.72], [22.85, 38.55], [23.25, 38.42], [23.65, 38.25],
      [23.4, 38.05], [22.9, 38.1], [22.72, 38.3],
    ],
  },
  'opuntian-locris': {
    parent: 'central-greece',
    ring: [
      [22.62, 38.92], [23.0, 38.75], [23.45, 38.45], [23.25, 38.42],
      [22.85, 38.55], [22.78, 38.72],
    ],
  },

  // ---- Thessaly ----
  hestiaeotis: {
    parent: 'thessaly',
    ring: [[21.3, 40.1], [22.05, 40.1], [22.15, 39.5], [21.4, 39.45]],
  },
  pelasgiotis: {
    parent: 'thessaly',
    ring: [[22.05, 40.1], [22.9, 40.0], [22.8, 39.45], [22.15, 39.5]],
  },
  magnesia: {
    parent: 'thessaly',
    ring: [
      [22.9, 40.0], [23.6, 39.8], [23.35, 38.85], [22.9, 39.0],
      [22.8, 39.45],
    ],
  },
  thessaliotis: {
    parent: 'thessaly',
    ring: [
      [21.25, 39.05], [21.4, 39.45], [22.15, 39.5], [22.2, 39.05],
      [21.55, 39.02],
    ],
  },
  phthia: {
    parent: 'thessaly',
    ring: [
      [22.15, 39.5], [22.8, 39.45], [22.9, 39.0], [22.3, 38.78],
      [21.7, 38.85], [21.55, 39.02], [22.2, 39.05],
    ],
  },

  // ---- Epirus ----
  chaonia: {
    parent: 'epirus',
    ring: [[19.8, 40.4], [20.88, 40.35], [20.62, 39.86], [19.85, 39.8]],
  },
  molossis: {
    parent: 'epirus',
    ring: [
      [20.88, 40.35], [21.55, 40.25], [21.4, 39.15], [21.0, 38.9],
      [20.65, 39.3], [20.62, 39.86],
    ],
  },
  thesprotia: {
    parent: 'epirus',
    ring: [
      [19.85, 39.8], [20.62, 39.86], [20.65, 39.3], [21.0, 38.9],
      [19.9, 38.95],
    ],
  },

  // ---- Macedonia (with Thrace) ----
  'upper-macedonia': {
    parent: 'macedonia',
    ring: [
      [20.8, 41.15], [21.95, 41.1], [22.1, 40.55], [22.0, 39.95],
      [21.0, 40.05],
    ],
  },
  pieria: {
    parent: 'macedonia',
    ring: [[22.1, 40.55], [22.85, 40.48], [22.7, 39.9], [22.0, 39.95]],
  },
  emathia: {
    parent: 'macedonia',
    ring: [[21.95, 41.1], [22.95, 41.0], [22.85, 40.48], [22.1, 40.55]],
  },
  paeonia: {
    parent: 'macedonia',
    ring: [[21.95, 41.6], [22.95, 41.5], [22.95, 41.0], [21.95, 41.1]],
  },
  mygdonia: {
    parent: 'macedonia',
    ring: [
      [22.95, 41.5], [23.95, 41.35], [23.9, 40.35], [22.85, 40.48],
      [22.95, 41.0],
    ],
  },
  thrace: {
    parent: 'macedonia',
    ring: [[23.95, 41.35], [26.8, 41.85], [26.55, 40.45], [23.9, 40.35]],
  },
  thasos: {
    parent: 'macedonia',
    ring: [[24.4, 40.9], [24.9, 40.9], [24.9, 40.5], [24.4, 40.5]],
  },
  samothrace: {
    parent: 'macedonia',
    ring: [[25.3, 40.6], [25.75, 40.6], [25.75, 40.3], [25.3, 40.3]],
  },

  // ---- Chalcidice (finger borders run through sea; only roots are shared) ----
  bottike: {
    parent: 'chalcidice',
    ring: [
      [22.8, 40.7], [24.15, 40.55], [24.1, 40.3], [23.92, 40.42],
      [23.85, 40.18], [23.62, 40.3], [23.45, 40.12], [23.25, 40.24],
      [22.82, 40.3],
    ],
  },
  pallene: {
    parent: 'chalcidice',
    ring: [[23.25, 40.24], [23.45, 40.12], [23.62, 39.85], [23.28, 39.9]],
  },
  sithonia: {
    parent: 'chalcidice',
    ring: [[23.62, 40.3], [23.85, 40.18], [24.1, 39.88], [23.7, 39.95]],
  },
  acte: {
    parent: 'chalcidice',
    ring: [[23.92, 40.42], [24.1, 40.3], [24.45, 39.98], [24.05, 40.12]],
  },

  // ---- Ionian islands ----
  corcyra: {
    parent: 'ionian-islands',
    ring: [[19.5, 39.9], [20.2, 39.9], [20.2, 39.3], [19.5, 39.3]],
  },
  leucas: {
    parent: 'ionian-islands',
    ring: [[20.45, 38.95], [20.85, 38.95], [20.85, 38.5], [20.45, 38.5]],
  },
  ithaca: {
    parent: 'ionian-islands',
    ring: [[20.602, 38.55], [20.9, 38.55], [20.9, 38.25], [20.602, 38.25]],
  },
  cephallenia: {
    parent: 'ionian-islands',
    ring: [
      [20.3, 38.55], [20.602, 38.55], [20.602, 38.25], [20.9, 38.25],
      [20.9, 37.9], [20.3, 37.9],
    ],
  },
  zacynthus: {
    parent: 'ionian-islands',
    ring: [[20.5, 38.0], [21.0, 38.0], [21.0, 37.55], [20.5, 37.55]],
  },

  // ---- North Aegean islands ----
  lesbos: {
    parent: 'north-aegean',
    ring: [[25.7, 39.5], [26.7, 39.5], [26.7, 38.9], [25.7, 38.9]],
  },
  lemnos: {
    parent: 'north-aegean',
    ring: [[24.9, 40.1], [25.55, 40.1], [25.55, 39.75], [24.9, 39.75]],
  },
  chios: {
    parent: 'north-aegean',
    ring: [[25.8, 38.7], [26.25, 38.7], [26.25, 38.05], [25.8, 38.05]],
  },
  samos: {
    parent: 'north-aegean',
    ring: [[26.45, 37.9], [27.15, 37.9], [27.15, 37.55], [26.45, 37.55]],
  },
  icaria: {
    parent: 'north-aegean',
    ring: [[25.9, 37.75], [26.42, 37.75], [26.42, 37.45], [25.9, 37.45]],
  },

  // ---- South Aegean islands ----
  delos: {
    parent: 'south-aegean',
    ring: [[25.245, 37.47], [25.305, 37.47], [25.305, 37.33], [25.245, 37.33]],
  },
  naxos: {
    parent: 'south-aegean',
    ring: [[25.3, 37.25], [25.7, 37.25], [25.7, 36.9], [25.3, 36.9]],
  },
  paros: {
    parent: 'south-aegean',
    ring: [[24.95, 37.25], [25.29, 37.25], [25.29, 36.95], [24.95, 36.95]],
  },
  thera: {
    parent: 'south-aegean',
    ring: [[25.25, 36.55], [25.55, 36.55], [25.55, 36.28], [25.25, 36.28]],
  },
  rhodes: {
    parent: 'south-aegean',
    ring: [[27.6, 36.55], [28.35, 36.55], [28.35, 35.8], [27.6, 35.8]],
  },
  cos: {
    parent: 'south-aegean',
    ring: [[26.75, 37.0], [27.45, 37.0], [27.45, 36.6], [26.75, 36.6]],
  },

  // ---- Anatolia (Batch B sub-regions — docs/ANATOLIA_REGIONS.md §4) ----
  dardania: {
    parent: 'troad',
    ring: [
      [26.5, 40.2], [28.0, 40.2], [28.0, 39.6], [27.9, 39.05],
      [26.8, 39.05], [26.5, 39.8],
    ],
  },
  aeolis: {
    parent: 'mysia',
    ring: [[26.0, 39.2], [27.8, 39.2], [27.8, 38.5], [26.0, 38.5]],
  },
  teuthrania: {
    parent: 'mysia',
    ring: [
      [26.5, 40.2], [28.8, 40.2], [28.8, 39.0], [27.8, 39.0],
      [27.8, 39.2], [26.5, 39.2],
    ],
  },
  maeonia: {
    parent: 'lydia',
    ring: [[27.0, 39.5], [29.5, 39.5], [29.5, 38.0], [27.0, 38.0]],
  },
  'hellespontine-phrygia': {
    parent: 'phrygia',
    ring: [[27.5, 40.5], [30.0, 40.5], [30.0, 38.5], [27.5, 38.5]],
  },
  ascania: {
    parent: 'phrygia',
    ring: [[30.0, 40.5], [32.5, 40.5], [32.5, 38.5], [30.0, 38.5]],
  },
};

/* ----------------------------- main ----------------------------- */

async function main() {
  const report = process.argv.includes('--report');
  mkdirSync(RAW_DIR, { recursive: true });

  const parsed = new Map<string, ExtractedPath[]>();
  for (const [region, file] of Object.entries(SERIES)) {
    const path = await download(file);
    parsed.set(region, parsePaths(readFileSync(path, 'utf8')));
  }

  const base = parsed.get(BASE_REGION)!;
  // Background frame panels span the whole canvas; real geography never does.
  const isFrame = (p: ExtractedPath) => {
    const pts = pathPoints(p.d, p.transform);
    if (pts.length === 0) return true;
    const [minX, maxX] = extent(pts.map((pt) => pt[0]));
    const [minY, maxY] = extent(pts.map((pt) => pt[1]));
    return (maxX - minX) * (maxY - minY) > 7459.75 * 7505.1875 * 0.5;
  };
  const usable = (p: ExtractedPath) =>
    !p.layers.some((l) => SKIP_LAYERS.has(l)) && !isFrame(p);
  const land = base.filter((p) => usable(p) && p.fill === LAND_FILL);
  const foreign = base.filter((p) => usable(p) && p.fill === FOREIGN_FILL);
  const lakes = base.filter(
    (p) => usable(p) && p.fill === WATER_FILL && p.layers.includes('Idro'),
  );
  // The source's own coastline strokes — the only outline free of modern borders.
  const coast = base.filter((p) => usable(p) && p.layers.includes('Coast'));

  const regions: Record<string, { d: string; transform: string }[]> = {};
  for (const [region, paths] of parsed) {
    regions[region] = paths
      .filter((p) => usable(p) && isHighlight(p.fill))
      .map(({ d, transform }) => ({ d, transform }));
  }

  if (report) {
    for (const [region, paths] of Object.entries(regions)) {
      const pts = paths.flatMap((p) => pathPoints(p.d, p.transform));
      if (pts.length === 0) {
        console.log(`${region}: NO HIGHLIGHT PATHS FOUND`);
        continue;
      }
      const fmt = (extreme: number, axis: 0 | 1) => {
        const p = pts.find((pt) => pt[axis] === extreme)!;
        return `(${p[0].toFixed(0)}, ${p[1].toFixed(0)})`;
      };
      const [minX, maxX] = extent(pts.map((p) => p[0]));
      const [minY, maxY] = extent(pts.map((p) => p[1]));
      console.log(
        `${region}: ${paths.length} paths, ${pts.length} pts | ` +
          `minX ${fmt(minX, 0)} maxX ${fmt(maxX, 0)} ` +
          `minY ${fmt(minY, 1)} maxY ${fmt(maxY, 1)}`,
      );
    }
    return;
  }

  // One decimal keeps sub-pixel fidelity on a ~7500-unit canvas and cuts ~35% size.
  const roundD = (d: string) =>
    d.replace(/-?\d+\.\d+(?:e-?\d+)?/gi, (n) => String(Math.round(Number(n) * 10) / 10));
  const strip = ({ d, transform }: { d: string; transform: string }) =>
    transform ? { d: roundD(d), transform } : { d: roundD(d) };
  const regionBounds: Record<string, { bbox: number[]; centroid: number[] }> = {};
  for (const [id, paths] of Object.entries(regions)) {
    const pts = paths.flatMap((p) => pathPoints(p.d, p.transform));
    if (pts.length === 0) continue;
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const [minX, maxX] = extent(xs);
    const [minY, maxY] = extent(ys);
    regionBounds[id] = {
      bbox: [minX, minY, maxX - minX, maxY - minY].map(Math.round),
      centroid: [
        Math.round(xs.reduce((a, b) => a + b, 0) / xs.length),
        Math.round(ys.reduce((a, b) => a + b, 0) / ys.length),
      ],
    };
  }
  // Authored extensions widen their region's bounds (zoom framing and the
  // clamp applied to sub-region bboxes below) before anything consumes them.
  const regionExtensions: Record<string, { points: [number, number][]; bbox: number[] }> = {};
  for (const [id, ring] of Object.entries(REGION_EXTENSIONS)) {
    const points = ring.map(project);
    const [minX, maxX] = extent(points.map((p) => p[0]));
    const [minY, maxY] = extent(points.map((p) => p[1]));
    regionExtensions[id] = { points, bbox: [minX, minY, maxX - minX, maxY - minY] };
    const bounds = regionBounds[id];
    if (bounds) {
      const [bx, by, bw, bh] = bounds.bbox;
      const x0 = Math.min(bx, minX);
      const y0 = Math.min(by, minY);
      const x1 = Math.max(bx + bw, maxX);
      const y1 = Math.max(by + bh, maxY);
      bounds.bbox = [x0, y0, x1 - x0, y1 - y0];
    } else {
      // Standalone synthetic region (no extracted geometry, e.g. the Troad).
      regionBounds[id] = {
        bbox: [minX, minY, maxX - minX, maxY - minY],
        centroid: [Math.round(minX + (maxX - minX) / 2), Math.round(minY + (maxY - minY) / 2)],
      };
    }
  }
  const out = {
    attribution: {
      source:
        'Adapted from the "Greece (ancient)" SVG map series by Pitichinaccio et al., Wikimedia Commons',
      url: 'https://commons.wikimedia.org/wiki/File:Greece_(ancient)_Peloponnesus.svg',
      license: 'CC BY-SA 3.0',
    },
    viewBox: '0 0 7459.75 7505.1875',
    cal: CAL,
    land: land.map(strip),
    foreign: foreign.map(strip),
    lakes: lakes.map(strip),
    coast: coast.map(strip),
    regions: Object.fromEntries(
      Object.entries(regions).map(([id, paths]) => [id, paths.map(strip)]),
    ),
    regionBounds,
    regionExtensions,
    subregions: Object.fromEntries(
      Object.entries(SUBREGIONS).map(([id, { parent, ring }]) => {
        const points = ring.map(project);
        const [minX, maxX] = extent(points.map((p) => p[0]));
        const [minY, maxY] = extent(points.map((p) => p[1]));
        // The ring overshoots the sea; clamp the zoom target to the parent's
        // real bounds so flights frame the visible (clipped) shape.
        const pb = regionBounds[parent]?.bbox ?? [minX, minY, maxX - minX, maxY - minY];
        const x0 = Math.max(minX, pb[0]);
        const y0 = Math.max(minY, pb[1]);
        const x1 = Math.min(maxX, pb[0] + pb[2]);
        const y1 = Math.min(maxY, pb[1] + pb[3]);
        return [
          id,
          {
            points,
            bbox: [x0, y0, x1 - x0, y1 - y0],
            centroid: [
              Math.round((x0 + x1) / 2),
              Math.round((y0 + y1) / 2),
            ],
          },
        ];
      }),
    ),
  };
  writeFileSync(OUT_FILE, JSON.stringify(out));
  const kb = (n: number) => `${Math.round(n / 1024)} KB`;
  console.log(
    `wrote ${OUT_FILE} (${kb(JSON.stringify(out).length)}) — ` +
      `${land.length} land, ${foreign.length} foreign, ${lakes.length} lake, ` +
      `${coast.length} coast paths, ` +
      `${Object.values(regions).reduce((n, r) => n + r.length, 0)} region paths`,
  );
  for (const [id, paths] of Object.entries(regions)) {
    if (paths.length === 0) console.warn(`WARNING: region "${id}" extracted 0 paths`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
