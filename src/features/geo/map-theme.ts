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

/** City marker radii — match MapViewSvg counter-scaled star (~4px core at overview). */
export const CITY_CORE_RADIUS = zoomExponential([
  [3, 1.75],
  [5, 2.4],
  [7, 3.4],
  [10, 4.2],
]);

export const CITY_GLOW_RADIUS = zoomExponential([
  [3, 3],
  [5, 4.5],
  [7, 6],
  [10, 8],
]);

export const CITY_HIT_RADIUS = zoomExponential([
  [3, 9],
  [7, 14],
  [10, 18],
]);

export const CITY_CORE_STROKE = zoomExponential([
  [3, 0.65],
  [7, 1],
  [10, 1.25],
]);

export const CITY_CORE_OPACITY = zoomExponential([
  [3, 0.45],
  [6, 0.68],
  [9, 0.88],
]);

export const CITY_GLOW_OPACITY = zoomExponential([
  [3, 0.05],
  [6, 0.11],
  [9, 0.18],
]);

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
  [3, 1.4],
  [6, 2],
  [9, 2.6],
]);

export const PLACE_MYTH_GLOW_RADIUS = zoomExponential([
  [3, 2.5],
  [6, 3.5],
  [9, 4.5],
]);

export const PLACE_MYTH_HIT_RADIUS = zoomExponential([
  [3, 8],
  [7, 12],
  [10, 16],
]);
