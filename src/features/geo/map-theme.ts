/**
 * MapLibre paint tokens — keep in sync with src/styles/theme.css (@theme).
 * WebGL cannot read CSS variables; duplicate hex values here deliberately.
 */
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
  riverGlowOpacity: 0.22,
  riverCoreOpacity: 0.5,
} as const;

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
