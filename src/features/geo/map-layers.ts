/** User-toggleable overlay groups on the Lands map (M9.10). */

export const MAP_LAYER_IDS = ['cities', 'sanctuaries', 'rivers'] as const;

export type MapLayerId = (typeof MAP_LAYER_IDS)[number];

export type MapLayerVisibility = Record<MapLayerId, boolean>;

export const DEFAULT_MAP_LAYERS: MapLayerVisibility = {
  cities: true,
  sanctuaries: true,
  rivers: true,
};

/** MapLibre layer ids controlled by each toggle. Name labels are DOM markers
 *  (see MapLabels) gated by the same groups, so they are not listed here.
 *  Myth-site markers stay always visible. */
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
};

const MYTH_SITE_LAYER_IDS = ['places-myth-glow', 'places-myth-hit', 'places-myth-core'] as const;

export function parseMapLayersParam(raw: string | null): MapLayerVisibility {
  if (!raw) return { ...DEFAULT_MAP_LAYERS };
  const enabled = new Set(
    raw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean),
  );
  return {
    cities: enabled.has('cities'),
    sanctuaries: enabled.has('sanctuaries'),
    rivers: enabled.has('rivers'),
  };
}

export function serializeMapLayersParam(layers: MapLayerVisibility): string | null {
  const active = MAP_LAYER_IDS.filter((id) => layers[id]);
  if (active.length === MAP_LAYER_IDS.length) return null;
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
