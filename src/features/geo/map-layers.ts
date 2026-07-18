/** User-toggleable overlay groups on the Lands map (M9.10). */

export const MAP_LAYER_IDS = ['cities', 'sanctuaries', 'rivers', 'relief'] as const;

export type MapLayerId = (typeof MAP_LAYER_IDS)[number];

/** Display names — shared by the bar's ellipsis menu (sm+) and the mobile
 *  settings-panel section. */
export const MAP_LAYER_LABELS: Record<MapLayerId, string> = {
  cities: 'Cities',
  sanctuaries: 'Sanctuaries',
  rivers: 'Rivers',
  relief: 'Relief',
};

export type MapLayerVisibility = Record<MapLayerId, boolean>;

export const DEFAULT_MAP_LAYERS: MapLayerVisibility = {
  cities: true,
  sanctuaries: true,
  rivers: true,
  relief: true,
};

/** MapLibre layer ids controlled by each toggle. Name labels are DOM markers
 *  (see MapLabels) gated by the same groups, so they are not listed here.
 *  Myth-site markers stay always visible. The relief toggle also drives the 3D
 *  terrain mesh (map.setTerrain), which is not a layer — see MapLibreView. */
export const MAP_LAYER_GROUPS: Record<MapLayerId, readonly string[]> = {
  cities: ['cities-glow', 'cities-hit', 'cities-core'],
  sanctuaries: ['places-sanctuary-glow', 'places-sanctuary-hit', 'places-sanctuary-core'],
  rivers: [
    'features-glow-major',
    'features-glow-minor',
    'features-line-major',
    'features-line-minor',
    'features-hit',
  ],
  // City beacons are 3D furniture — they follow the relief toggle so "relief
  // off" reads as the pure flat atlas. relief-baked (pre-shaded raster) and
  // dem-color-relief/dem-hillshade (runtime fallback) never coexist in one
  // style; applyMapLayerVisibility skips ids the style doesn't carry.
  relief: [
    'relief-baked',
    'dem-color-relief',
    'dem-hillshade',
    'city-beacons-core',
    'city-beacons-halo',
  ],
};

const MYTH_SITE_LAYER_IDS = ['places-myth-glow', 'places-myth-hit', 'places-myth-core'] as const;

export function parseMapLayersParam(raw: string | null): MapLayerVisibility {
  // Only an ABSENT param means "default (all on)". An empty/`none` param is the
  // explicit all-off state — otherwise turning every layer off round-trips back to
  // all-on (an empty string was being read as "no param").
  if (raw === null) return { ...DEFAULT_MAP_LAYERS };
  if (raw === 'none') {
    return Object.fromEntries(MAP_LAYER_IDS.map((id) => [id, false])) as MapLayerVisibility;
  }
  const enabled = new Set(
    raw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean),
  );
  return Object.fromEntries(
    MAP_LAYER_IDS.map((id) => [id, enabled.has(id)]),
  ) as MapLayerVisibility;
}

export function serializeMapLayersParam(layers: MapLayerVisibility): string | null {
  const active = MAP_LAYER_IDS.filter((id) => layers[id]);
  if (active.length === MAP_LAYER_IDS.length) return null; // all on → omit (default)
  if (active.length === 0) return 'none'; // all off → explicit sentinel, never ''
  return active.join(',');
}

export function layersEqual(a: MapLayerVisibility, b: MapLayerVisibility): boolean {
  return MAP_LAYER_IDS.every((id) => a[id] === b[id]);
}

export function applyMapLayerVisibility(
  map: { getLayer: (id: string) => unknown; setLayoutProperty: (id: string, name: 'visibility', value: 'visible' | 'none') => void },
  layers: MapLayerVisibility,
): void {
  for (const groupId of MAP_LAYER_IDS) {
    const visibility = layers[groupId] ? 'visible' : 'none';
    for (const layerId of MAP_LAYER_GROUPS[groupId]) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    }
  }
  for (const layerId of MYTH_SITE_LAYER_IDS) {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', 'visible');
    }
  }
}
