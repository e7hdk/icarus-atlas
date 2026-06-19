'use client';

import { useCallback, useEffect, useRef } from 'react';
import maplibregl, { type Map as MaplibreMap } from 'maplibre-gl';
import type { FeatureCollection, Point } from 'geojson';
import { MAP, ZOOM_FEATURE_LABELS, regionLabelColors } from '@/features/geo/map-theme';
import { isLinearFeatureVisible } from '@/features/geo/feature-visibility';
import {
  pickTopRegionAtPoint,
  ZOOM_CITY_NAMES,
  ZOOM_SUBREGION,
  ZOOM_TOP_LABELS,
  type RegionsMetaFile,
} from '@/features/geo/region-drilldown';
import type { MapLayerVisibility } from '@/features/geo/map-layers';
import type { GeoCity, GeoFeature, GeoPlace, GeoRegion } from '@/types/geo';

const bboxArea = (b: [number, number, number, number]): number =>
  Math.max(0, b[2] - b[0]) * Math.max(0, b[3] - b[1]);

/** Per-region min zoom so a far-out view shows only the largest regions and the
 *  rest fade in as you approach the sub-region hand-off (declutters the basin). */
function topRegionMinZooms(meta: RegionsMetaFile | null): Map<string, number> {
  const out = new Map<string, number>();
  if (!meta) return out;
  const tops = Object.entries(meta.regions)
    .filter(([, e]) => e.level === 'region')
    .map(([id, e]) => ({ id, area: bboxArea(e.bbox) }))
    .sort((a, b) => b.area - a.area);
  const n = tops.length;
  tops.forEach((r, i) => {
    const frac = n > 1 ? i / (n - 1) : 0;
    out.set(r.id, frac < 0.4 ? 3 : frac < 0.7 ? 4 : 4.7);
  });
  return out;
}

/** Layer-toggle group that gates a label (undefined = always shown). */
type LabelGroup = keyof MapLayerVisibility;

/** Place kinds that carry a map label (mirrors the old SDF place-label layers). */
const LABELLED_PLACE_KINDS = new Set<GeoPlace['kind']>(['sanctuary', 'myth-site']);
/** Feature kinds that carry a map label. */
const LABELLED_FEATURE_KINDS = new Set<GeoFeature['kind']>(['river', 'strait', 'mountain-range']);

type LabelKind = 'city' | 'place' | 'region' | 'sub' | 'feature';

interface LabelMarker {
  marker: maplibregl.Marker;
  el: HTMLDivElement;
  kind: LabelKind;
  id: string;
  family?: string | null;
  parent?: string | null;
  featureKind?: GeoFeature['kind'];
  importance?: GeoFeature['importance'];
  group?: LabelGroup;
  regionMinZoom?: number;
}

/** Label anchor for a feature: midpoint of a line, centroid of a polygon ring. */
function featureCentroid(feature: GeoFeature): [number, number] | null {
  if (feature.geometry.type === 'LineString') {
    const coords = feature.geometry.coordinates as number[][];
    if (coords.length === 0) return null;
    const mid = coords[Math.floor(coords.length / 2)]!;
    return [mid[0]!, mid[1]!];
  }
  const ring = (feature.geometry.coordinates as number[][][])[0];
  if (!ring?.length) return null;
  const n = ring.length > 1 ? ring.length - 1 : ring.length;
  let sumLon = 0;
  let sumLat = 0;
  for (let i = 0; i < n; i++) {
    sumLon += ring[i]![0]!;
    sumLat += ring[i]![1]!;
  }
  return [sumLon / n, sumLat / n];
}

interface LabelState {
  focusedSubId: string | null;
  hoveredRegionId: string | null;
  selectedCityId: string | null;
  mapLayers: MapLayerVisibility;
}

/**
 * Renders the map's point labels (cities, sanctuaries/myth-sites, regions) as
 * DOM markers in the real Cinzel web font, so they match the rest of the atlas
 * exactly — MapLibre's WebGL SDF text can't reproduce a high-contrast serif at
 * label sizes. River/mountain labels stay as SDF symbol layers (curved, line
 * placement). Visibility tracks live zoom; colour mirrors the drill-down logic.
 */
export function MapLabels({
  map,
  cities,
  places,
  features,
  regionLabels,
  regionsMeta,
  regionById,
  focusedSubId,
  hoveredRegionId,
  selectedCityId,
  mapLayers,
  cityFamily,
}: {
  map: MaplibreMap | null;
  cities: GeoCity[];
  places: GeoPlace[];
  features: GeoFeature[];
  regionLabels: FeatureCollection<Point> | null;
  regionsMeta: RegionsMetaFile | null;
  regionById: Map<string, GeoRegion>;
  focusedSubId: string | null;
  hoveredRegionId: string | null;
  selectedCityId: string | null;
  mapLayers: MapLayerVisibility;
  cityFamily: (city: GeoCity) => string | null;
}) {
  const markersRef = useRef<LabelMarker[]>([]);
  const stateRef = useRef<LabelState>({
    focusedSubId,
    hoveredRegionId,
    selectedCityId,
    mapLayers,
  });

  /** Set every marker's visibility + colour from live zoom + centre + latest state.
   *  Drill-down is recomputed live (not from React state, which lags a gesture),
   *  so labels never flash all-on mid-zoom. */
  const apply = useCallback(() => {
    if (!map) return;
    const zoom = map.getZoom();
    const center = map.getCenter();
    const liveParent =
      regionsMeta && zoom >= ZOOM_SUBREGION
        ? pickTopRegionAtPoint(center.lng, center.lat, regionsMeta)
        : null;
    const s = stateRef.current;

    for (const label of markersRef.current) {
      let visible = false;
      let color: string = MAP.aetherMuted;
      let regionGlow: string | null = null;
      let glowHovered = false;

      if (label.kind === 'city') {
        visible = zoom >= ZOOM_CITY_NAMES || (liveParent !== null && label.family === liveParent);
        color = label.id === s.selectedCityId ? MAP.starOlympian : MAP.aether;
      } else if (label.kind === 'place') {
        visible = zoom >= ZOOM_FEATURE_LABELS;
        color = MAP.aetherMuted;
      } else if (label.kind === 'feature') {
        const feature = features.find((f) => f.id === label.id);
        if (feature && (feature.kind === 'river' || feature.kind === 'strait')) {
          visible = isLinearFeatureVisible(feature, zoom, liveParent, regionById, regionsMeta);
        } else {
          const min =
            label.featureKind === 'mountain-range'
              ? ZOOM_FEATURE_LABELS + 0.5
              : label.importance === 'minor'
                ? ZOOM_FEATURE_LABELS + 1.5
                : ZOOM_FEATURE_LABELS;
          visible = zoom >= min;
        }
        color = MAP.aetherMuted;
      } else if (label.kind === 'region') {
        visible = zoom >= (label.regionMinZoom ?? 3) && zoom < ZOOM_TOP_LABELS;
        // Each region in its own colour (like the galaxy's coloured zones), with a
        // soft hue glow; hover lifts it brighter.
        const hov = label.id === s.hoveredRegionId;
        const c = regionLabelColors(label.id);
        color = hov ? c.bright : c.base;
        regionGlow = c.glow;
        glowHovered = hov;
      } else {
        visible = zoom >= ZOOM_SUBREGION && label.parent === liveParent;
        // Sub-regions inherit their parent region's hue → one colour family.
        const hov = label.id === s.hoveredRegionId || label.id === s.focusedSubId;
        const c = regionLabelColors(label.parent ?? label.id);
        color = hov ? c.bright : c.base;
        regionGlow = c.glow;
        glowHovered = hov;
      }

      if (label.group && !s.mapLayers[label.group]) visible = false;

      label.el.style.opacity = visible ? '1' : '0';
      label.el.style.color = color;
      // Region/sub labels carry a coloured glow on top of the dark legibility
      // shadow; other labels keep the static CSS shadow untouched.
      if (regionGlow) {
        label.el.style.textShadow =
          `0 0 3px rgb(5 2 15 / 0.92), 0 0 7px rgb(5 2 15 / 0.7), 0 0 ${glowHovered ? 15 : 10}px ${regionGlow}`;
      }
    }
  }, [map, regionsMeta, regionById, features]);

  // Build markers once per map / data set, and track live zoom.
  useEffect(() => {
    if (!map) return;
    const markers: LabelMarker[] = [];

    const add = (
      kind: LabelKind,
      id: string,
      name: string,
      coords: [number, number],
      anchor: maplibregl.PositionAnchor,
      offset: [number, number],
      extra?: {
        family?: string | null;
        parent?: string | null;
        featureKind?: GeoFeature['kind'];
        importance?: GeoFeature['importance'];
        group?: LabelGroup;
        regionMinZoom?: number;
      },
    ) => {
      // MapLibre's Marker owns the root element's style.opacity (it resets it on
      // every render for terrain occlusion). So the marker root is a wrapper and
      // we control opacity/colour on an inner element MapLibre never touches.
      const wrap = document.createElement('div');
      wrap.style.pointerEvents = 'none';
      const el = document.createElement('div');
      el.className = `map-label map-label--${kind}`;
      el.style.pointerEvents = 'none';
      el.textContent = name.toUpperCase();
      wrap.appendChild(el);
      const marker = new maplibregl.Marker({ element: wrap, anchor, offset })
        .setLngLat(coords)
        .addTo(map);
      markers.push({ marker, el, kind, id, ...extra });
    };

    for (const city of cities) {
      add('city', city.id, city.name, [city.coordinates[0], city.coordinates[1]], 'top', [0, 9], {
        family: cityFamily(city),
        group: 'cities',
      });
    }

    for (const place of places) {
      if (!LABELLED_PLACE_KINDS.has(place.kind)) continue;
      add('place', place.id, place.name, [place.coordinates[0], place.coordinates[1]], 'top', [0, 8], {
        group: place.kind === 'sanctuary' ? 'sanctuaries' : undefined,
      });
    }

    for (const feature of features) {
      if (!LABELLED_FEATURE_KINDS.has(feature.kind)) continue;
      const coords = featureCentroid(feature);
      if (!coords) continue;
      add('feature', feature.id, feature.name, coords, 'center', [0, 0], {
        featureKind: feature.kind,
        importance: feature.importance,
        group: feature.kind === 'mountain-range' ? undefined : 'rivers',
      });
    }

    if (regionLabels) {
      const minZoomById = topRegionMinZooms(regionsMeta);
      for (const feature of regionLabels.features) {
        const props = feature.properties as {
          id: string;
          name: string;
          level: string;
          parent: string | null;
        };
        const [lon, lat] = feature.geometry.coordinates as [number, number];
        const kind: LabelKind = props.level === 'subregion' ? 'sub' : 'region';
        add(kind, props.id, props.name, [lon, lat], 'center', [0, 0], {
          parent: props.parent,
          regionMinZoom: kind === 'region' ? (minZoomById.get(props.id) ?? 3) : undefined,
        });
      }
    }

    markersRef.current = markers;
    apply();
    map.on('move', apply); // pan + zoom + flyTo all change live zoom/centre gating

    return () => {
      map.off('move', apply);
      for (const label of markers) label.marker.remove();
      markersRef.current = [];
    };
  }, [map, cities, places, features, regionLabels, regionsMeta, cityFamily, apply]);

  // Re-apply when interaction state (hover / selection / layers) changes. Also
  // bound to map 'zoom' in the build effect for live zoom/centre updates.
  useEffect(() => {
    stateRef.current = { focusedSubId, hoveredRegionId, selectedCityId, mapLayers };
    apply();
  }, [focusedSubId, hoveredRegionId, selectedCityId, mapLayers, apply]);

  return null;
}
