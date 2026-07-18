'use client';

import { useCallback, useEffect, useRef } from 'react';
import maplibregl, { type Map as MaplibreMap } from 'maplibre-gl';
import type { FeatureCollection, Point } from 'geojson';
import {
  IMPORTANT_CITY_IDS,
  MAP,
  ZOOM_FEATURE_LABELS,
  regionLabelColors,
} from '@/features/geo/map-theme';
import { isLinearFeatureVisible } from '@/features/geo/feature-visibility';
import { liveGroundParent } from '@/features/geo/ground-focus';
import {
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

/** Flagship cities surface this early so their names anchor the periphery even when
 *  zoomed out; minor cities wait for ZOOM_CITY_NAMES or for their region to be focused. */
const ZOOM_IMPORTANT_CITY = 4.3;

interface LabelMarker {
  marker: maplibregl.Marker;
  el: HTMLDivElement;
  kind: LabelKind;
  id: string;
  /** Whether the marker is currently added to the map. Hidden labels are fully
   *  detached instead of opacity-0: an attached marker costs a projection (and,
   *  under 3D terrain, an elevation + occlusion lookup) on every render frame. */
  attached: boolean;
  /** Marker placement, kept so the collision pass can rebuild the screen-space box. */
  anchor: maplibregl.PositionAnchor;
  offset: [number, number];
  /** Cached rendered size (fixed-size fonts → measure once, re-measure after fonts load). */
  w?: number;
  h?: number;
  important?: boolean;
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
  onFeatureClick,
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
  /** Click handler for labels that ARE the feature's interactive surface
   *  (mountain ranges — they no longer carry a map polygon). */
  onFeatureClick?: (id: string) => void;
}) {
  const markersRef = useRef<LabelMarker[]>([]);
  /** Hidden off-screen box for measuring detached labels (they have no DOM box). */
  const measurerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<LabelState>({
    focusedSubId,
    hoveredRegionId,
    selectedCityId,
    mapLayers,
  });

  /** Decide each label's eligibility + priority from live zoom/centre/state, then run
   *  a greedy priority-ranked collision pass (like MapLibre's symbol placement, but
   *  over our DOM labels) so nothing overlaps: high-priority labels claim their box
   *  first, lower ones hide when they'd collide. Importance also drives a level of
   *  detail — flagship cities/regions anchor the periphery, while minor places only
   *  surface when their region is focused or you've zoomed in close. */
  const apply = useCallback(() => {
    if (!map) return;
    const zoom = map.getZoom();
    // Region under the terrain point at the exact viewport centre.
    const liveParent = liveGroundParent(map, zoom, regionsMeta);
    const s = stateRef.current;
    const canvas = map.getCanvas();
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const centreX = W / 2;
    const centreY = H / 2;
    const focusRadius = Math.min(W, H) * 0.28;

    const hide = (label: LabelMarker) => {
      label.el.style.opacity = '0';
      if (label.attached) {
        label.marker.remove();
        label.attached = false;
      }
    };

    interface Candidate {
      label: LabelMarker;
      priority: number;
      color: string;
      glow: string | null;
      glowHovered: boolean;
    }
    const candidates: Candidate[] = [];

    for (const label of markersRef.current) {
      const screenPoint = map.project(label.marker.getLngLat());
      const distanceFromCentre = Math.hypot(
        screenPoint.x + label.offset[0] - centreX,
        screenPoint.y + label.offset[1] - centreY,
      );
      const centrality = Math.max(0, 1 - distanceFromCentre / focusRadius);
      let eligible = false;
      let priority = 0;
      let color: string = MAP.aetherMuted;
      let glow: string | null = null;
      let glowHovered = false;

      if (label.kind === 'city') {
        const inFocus = liveParent !== null && label.family === liveParent;
        eligible = label.important ? zoom >= ZOOM_IMPORTANT_CITY : zoom >= ZOOM_CITY_NAMES || inFocus;
        const selected = label.id === s.selectedCityId;
        color = selected ? MAP.starOlympian : MAP.aether;
        priority = selected ? 100 : label.important ? 72 : inFocus ? 56 : 50;
      } else if (label.kind === 'place') {
        eligible = zoom >= ZOOM_FEATURE_LABELS;
        color = MAP.aetherMuted;
        priority = 40;
      } else if (label.kind === 'feature') {
        const feature = features.find((f) => f.id === label.id);
        if (feature && (feature.kind === 'river' || feature.kind === 'strait')) {
          eligible = isLinearFeatureVisible(feature, zoom, liveParent, regionById, regionsMeta);
        } else {
          const min =
            label.featureKind === 'mountain-range'
              ? ZOOM_FEATURE_LABELS + 0.5
              : label.importance === 'minor'
                ? ZOOM_FEATURE_LABELS + 1.5
                : ZOOM_FEATURE_LABELS;
          eligible = zoom >= min;
        }
        color = MAP.aetherMuted;
        priority =
          label.featureKind === 'mountain-range' ? 36 : label.importance === 'minor' ? 30 : 38;
      } else if (label.kind === 'region') {
        eligible = zoom >= (label.regionMinZoom ?? 3) && zoom < ZOOM_TOP_LABELS;
        const hov = label.id === s.hoveredRegionId;
        const c = regionLabelColors(label.id);
        color = hov ? c.bright : c.base;
        glow = c.glow;
        glowHovered = hov;
        priority = hov ? 96 : 82;
      } else {
        eligible = zoom >= ZOOM_SUBREGION && label.parent === liveParent;
        const hov = label.id === s.hoveredRegionId || label.id === s.focusedSubId;
        const c = regionLabelColors(label.parent ?? label.id);
        color = hov ? c.bright : MAP.aetherFaint;
        glow = hov ? c.glow : null;
        glowHovered = hov;
        priority = hov ? 90 : 64;
      }

      if (label.group && !s.mapLayers[label.group]) eligible = false;

      if (eligible) {
        // Collision placement used to break equal priorities by data order, so
        // distant labels could hide the places the user was actually zooming
        // into. Screen distance is the final, generic tie-breaker: no city or
        // region receives a hand-authored exception.
        priority += centrality * 28;
        if ((label.kind === 'city' || label.kind === 'place') && centrality > 0) {
          color = MAP.aether;
          glow = 'rgb(0 229 255 / 0.55)';
          glowHovered = centrality > 0.45;
        }
        candidates.push({ label, priority, color, glow, glowHovered });
      } else {
        hide(label);
      }
    }

    // Greedy collision: place high-priority labels first; hide any that would overlap
    // an already-placed box (or fall off-screen).
    candidates.sort((a, b) => b.priority - a.priority);
    const placed: [number, number, number, number][] = [];
    const PAD_X = 3;
    const PAD_Y = 2;
    const MARGIN = 28;

    for (const cand of candidates) {
      const label = cand.label;
      if (label.w === undefined || label.h === undefined) {
        // A detached marker has no DOM box — measure inside the hidden measurer.
        const measurer = !label.attached ? measurerRef.current : null;
        const root = label.marker.getElement();
        if (measurer) measurer.appendChild(root);
        const rect = label.el.getBoundingClientRect();
        label.w = rect.width;
        label.h = rect.height;
        if (measurer) measurer.removeChild(root);
      }
      const p = map.project(label.marker.getLngLat());
      const ax = p.x + label.offset[0];
      const ay = p.y + label.offset[1];
      const halfW = label.w / 2;
      const x0 = ax - halfW;
      const x1 = ax + halfW;
      const y0 = label.anchor === 'top' ? ay : ay - label.h / 2;
      const y1 = label.anchor === 'top' ? ay + label.h : ay + label.h / 2;

      if (x1 < -MARGIN || x0 > W + MARGIN || y1 < -MARGIN || y0 > H + MARGIN) {
        hide(label);
        continue;
      }

      const box: [number, number, number, number] = [x0 - PAD_X, y0 - PAD_Y, x1 + PAD_X, y1 + PAD_Y];
      let collides = false;
      for (const b of placed) {
        if (box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]) {
          collides = true;
          break;
        }
      }
      if (collides) {
        hide(label);
        continue;
      }

      placed.push(box);
      if (!label.attached) {
        label.marker.addTo(map);
        label.attached = true;
      }
      label.el.style.opacity = '1';
      label.el.style.color = cand.color;
      if (cand.glow) {
        label.el.style.textShadow =
          `0 0 3px rgb(5 2 15 / 0.92), 0 0 7px rgb(5 2 15 / 0.7), 0 0 ${cand.glowHovered ? 15 : 10}px ${cand.glow}`;
      } else {
        label.el.style.textShadow =
          '0 0 3px rgb(5 2 15 / 0.92), 0 0 7px rgb(5 2 15 / 0.7), 0 1px 2px rgb(5 2 15 / 0.85)';
      }
    }
  }, [map, regionsMeta, regionById, features]);

  // Build markers once per map / data set, and track live zoom.
  useEffect(() => {
    if (!map) return;
    const markers: LabelMarker[] = [];

    const measurer = document.createElement('div');
    measurer.style.cssText =
      'position:fixed;left:-9999px;top:0;visibility:hidden;pointer-events:none;';
    document.body.appendChild(measurer);
    measurerRef.current = measurer;

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
        important?: boolean;
        onClick?: (id: string) => void;
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
      if (extra?.onClick) {
        const onClick = extra.onClick;
        wrap.style.pointerEvents = 'auto';
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';
        el.addEventListener('click', (event) => {
          event.stopPropagation();
          onClick(id);
        });
      }
      // Created detached: the collision pass attaches only the labels it places,
      // so hidden labels never cost a per-frame projection.
      // These are cartographic annotations, not physical objects. MapLibre's
      // default terrain-covered opacity is 0.2, which was multiplying away the
      // centre-focus colour/glow whenever a label's zero-height anchor fell a
      // fraction behind the exaggerated DEM. Collision placement already owns
      // visibility, so terrain must not independently dim the chosen labels.
      const marker = new maplibregl.Marker({
        element: wrap,
        anchor,
        offset,
        opacityWhenCovered: 1,
      }).setLngLat(coords);
      markers.push({ marker, el, kind, id, attached: false, anchor, offset, ...extra });
    };

    for (const city of cities) {
      add('city', city.id, city.name, [city.coordinates[0], city.coordinates[1]], 'top', [0, 9], {
        family: cityFamily(city),
        group: 'cities',
        important: IMPORTANT_CITY_IDS.has(city.id),
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
        // Mountain ranges have no map polygon — the label is the click target.
        onClick: feature.kind === 'mountain-range' ? onFeatureClick : undefined,
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

    // Pan/zoom/flyTo all change the live gating, but a full eligibility +
    // collision pass over every label is too heavy for every move frame.
    // Attached markers track the camera natively between passes, so placement
    // only needs to catch up a few times per second (plus a settle on moveend).
    let lastRun = 0;
    let trailing: number | null = null;
    const onMove = () => {
      const now = performance.now();
      if (now - lastRun >= 120) {
        lastRun = now;
        apply();
        return;
      }
      if (trailing === null) {
        trailing = window.setTimeout(() => {
          trailing = null;
          lastRun = performance.now();
          apply();
        }, 130);
      }
    };
    map.on('move', onMove);
    map.on('moveend', apply);

    // Sizes measured before Cinzel loads are off (fallback metrics) — re-measure once
    // the web font is ready so the collision boxes match what's actually drawn.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (cancelled) return;
      for (const m of markersRef.current) {
        m.w = undefined;
        m.h = undefined;
      }
      apply();
    });

    return () => {
      cancelled = true;
      if (trailing !== null) window.clearTimeout(trailing);
      map.off('move', onMove);
      map.off('moveend', apply);
      for (const label of markers) label.marker.remove();
      markersRef.current = [];
      measurer.remove();
      measurerRef.current = null;
    };
  }, [map, cities, places, features, regionLabels, regionsMeta, cityFamily, apply, onFeatureClick]);

  // Re-apply when interaction state (hover / selection / layers) changes. Also
  // bound to map 'zoom' in the build effect for live zoom/centre updates.
  useEffect(() => {
    stateRef.current = { focusedSubId, hoveredRegionId, selectedCityId, mapLayers };
    apply();
  }, [focusedSubId, hoveredRegionId, selectedCityId, mapLayers, apply]);

  return null;
}
