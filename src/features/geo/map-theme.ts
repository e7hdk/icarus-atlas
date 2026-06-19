/**
 * MapLibre paint tokens — keep in sync with src/styles/theme.css (@theme).
 * WebGL cannot read CSS variables; duplicate hex values here deliberately.
 */
import type { ExpressionSpecification } from 'maplibre-gl';
export const MAP = {
  cosmos: '#08041d',
  cosmosDeep: '#05020f',
  aether: '#f1f5f9',
  aetherMuted: '#aab4c8',
  aetherFaint: '#6b7488',
  nebulaViolet: '#7c4dff',
  nebulaCyan: '#00e5ff',
  nebulaSoft: '#c084fc',
  starOlympian: '#fcd34d',
  labelHalo: 'rgba(5, 2, 15, 0.72)',
  riverGlowOpacity: 0.18,
  riverCoreOpacity: 0.45,
} as const;

/** Per-region accent for the labels — gives each region its own colour (like the
 *  galaxy's coloured zones) without region polygons. A deterministic golden-angle
 *  hue keeps neighbours distinct yet pastel/on-theme; sub-regions inherit their
 *  parent's hue (pass the parent id) so a region and its parts read as one family.
 *  Returns the resting colour, a bright hover colour, and a soft glow for the
 *  text-shadow — the missing "colour + glow" that makes the galaxy labels pop. */
export function regionLabelColors(seedId: string): { base: string; bright: string; glow: string } {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedId.length; i += 1) {
    h ^= seedId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hue = Math.round(((h >>> 0) * 137.508) % 360);
  return {
    base: `hsl(${hue}, 56%, 74%)`,
    bright: `hsl(${hue}, 72%, 90%)`,
    glow: `hsla(${hue}, 82%, 62%, 0.5)`,
  };
}

type ZoomStop = [zoom: number, value: number];

/** Exponential zoom curve — pin-sized at basin view, grows only when zoomed in. */
export function zoomExponential(stops: ZoomStop[]): unknown[] {
  const flat: number[] = [];
  for (const [z, v] of stops) flat.push(z, v);
  return ['interpolate', ['exponential', 1.75], ['zoom'], ...flat];
}

/** City marker radii — small pins at overview, growing only when zoomed in. */
export const CITY_CORE_RADIUS = zoomExponential([
  [3, 1.3],
  [5, 1.8],
  [7, 2.6],
  [10, 3.4],
]);

export const CITY_GLOW_RADIUS = zoomExponential([
  [3, 2.2],
  [5, 3.4],
  [7, 4.6],
  [10, 6.2],
]);

export const CITY_HIT_RADIUS = zoomExponential([
  [3, 9],
  [7, 14],
  [10, 18],
]);

/** Feature-state flag the selection effect sets on the clicked city, and the
 *  per-feature importance flag baked into the cities GeoJSON. Both live only in the
 *  stop OUTPUTS of the zoom curves below — never wrapped around ['zoom'], which
 *  MapLibre forbids outside a top-level step/interpolate. */
const CITY_SELECTED: unknown[] = ['boolean', ['feature-state', 'selected'], false];
// Must be an explicit boolean: a bare ['get','important'] is type `value`, which
// MapLibre rejects as a `case` condition — the whole opacity expression then falls
// back to the default (fully opaque), so minor dots never thinned out on zoom-out.
const CITY_IMPORTANT: unknown[] = ['==', ['get', 'important'], true];

/** Stroke widens a touch on the selected city. */
export const CITY_CORE_STROKE: unknown[] = [
  'interpolate',
  ['exponential', 1.75],
  ['zoom'],
  3,
  ['case', CITY_SELECTED, 1.4, 0.65],
  7,
  ['case', CITY_SELECTED, 1.4, 1],
  10,
  ['case', CITY_SELECTED, 1.4, 1.25],
];

/** Flagship + iconic cities — lit at basin overview; the rest of the cities only
 *  fade in as you zoom into a region (gated by the `important` feature property). */
export const IMPORTANT_CITY_IDS = new Set([
  'thebes',
  'mycenae',
  'argos',
  'athens',
  'sparta',
  'troy',
  'corinth',
  'pylos',
  'tiryns',
  'knossos',
  'delos',
  'iolcus',
  'calydon',
]);

/** Core opacity: the selected city is fully lit at any zoom; otherwise minor cities
 *  stay hidden until ~zoom 6 and fade in by ~7.5, while important cities show from
 *  the basin overview. */
export const CITY_CORE_OPACITY: unknown[] = [
  'interpolate',
  ['linear'],
  ['zoom'],
  3,
  ['case', CITY_SELECTED, 1, ['case', CITY_IMPORTANT, 0.5, 0]],
  5.5,
  ['case', CITY_SELECTED, 1, ['case', CITY_IMPORTANT, 0.66, 0]],
  7.5,
  ['case', CITY_SELECTED, 1, ['case', CITY_IMPORTANT, 0.82, 0.62]],
  9,
  ['case', CITY_SELECTED, 1, ['case', CITY_IMPORTANT, 0.9, 0.85]],
];

export const CITY_GLOW_OPACITY: unknown[] = [
  'interpolate',
  ['linear'],
  ['zoom'],
  3,
  ['case', CITY_SELECTED, 0.28, ['case', CITY_IMPORTANT, 0.06, 0]],
  5.5,
  ['case', CITY_SELECTED, 0.3, ['case', CITY_IMPORTANT, 0.11, 0]],
  7.5,
  ['case', CITY_SELECTED, 0.34, ['case', CITY_IMPORTANT, 0.15, 0.09]],
  9,
  ['case', CITY_SELECTED, 0.36, ['case', CITY_IMPORTANT, 0.18, 0.16]],
];

/** Zoom at which river and strait names appear along their geometry. */
export const ZOOM_FEATURE_LABELS = 5.5;

/** Sub-region hand-off — rivers fade in for the focused basin below global label zoom. */
export const ZOOM_RIVERS_REGIONAL = 5.2;

/** River/strait line opacity — faint at regional hand-off, full when zoomed in.
 *  MapLibre requires `zoom` only at the top level of `interpolate`/`step`. */
export function riverGlowOpacityExpr(hoverOpacity = 0.34): ExpressionSpecification {
  const stop = (value: number): ExpressionSpecification =>
    [
      'case',
      ['boolean', ['feature-state', 'show'], false],
      ['case', ['boolean', ['feature-state', 'hover'], false], hoverOpacity, value],
      0,
    ];

  return [
    'interpolate',
    ['linear'],
    ['zoom'],
    ZOOM_RIVERS_REGIONAL,
    stop(0.03),
    ZOOM_FEATURE_LABELS,
    stop(0.06),
    7,
    stop(0.1),
    9,
    stop(0.14),
  ];
}

export function riverCoreOpacityExpr(hoverOpacity = 0.6): ExpressionSpecification {
  const stop = (value: number): ExpressionSpecification =>
    [
      'case',
      ['boolean', ['feature-state', 'show'], false],
      ['case', ['boolean', ['feature-state', 'hover'], false], hoverOpacity, value],
      0,
    ];

  return [
    'interpolate',
    ['linear'],
    ['zoom'],
    ZOOM_RIVERS_REGIONAL,
    stop(0.08),
    ZOOM_FEATURE_LABELS,
    stop(0.2),
    7,
    stop(0.34),
    9,
    stop(0.46),
  ];
}

/** Invisible rivers get zero hit width; visible rivers keep a wide pick target. */
export function riverHitWidthExpr(): ExpressionSpecification {
  const stop = (width: number): ExpressionSpecification =>
    ['case', ['boolean', ['feature-state', 'show'], false], width, 0];

  return ['interpolate', ['linear'], ['zoom'], 3, stop(14), 12, stop(28)];
}

/** Myth-site / far-horizon markers — smaller than flagship cities. */
export const PLACE_MYTH_CORE_RADIUS = zoomExponential([
  [3, 1.05],
  [6, 1.5],
  [9, 2],
]);

export const PLACE_MYTH_GLOW_RADIUS = zoomExponential([
  [3, 1.9],
  [6, 2.7],
  [9, 3.5],
]);

export const PLACE_MYTH_HIT_RADIUS = zoomExponential([
  [3, 8],
  [7, 12],
  [10, 16],
]);
