'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, {
  Map as MaplibreMap,
  type FlyToOptions,
  type StyleSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol as PmtilesProtocol } from 'pmtiles';

// The pinned DEM extract (public/geo/dem.pmtiles) is one archive read with
// range requests — register the pmtiles:// protocol the style sources use.
// Module scope is browser-only here (this file is dynamically imported with
// ssr: false); re-registration on HMR just overwrites the same handler.
maplibregl.addProtocol('pmtiles', new PmtilesProtocol().tile);
import { CityPanel } from '@/components/map/CityPanel';
import { FeaturePanel } from '@/components/map/FeaturePanel';
import { PlacePanel } from '@/components/map/PlacePanel';
import { MapLabels } from '@/components/map/MapLabels';
import { regionLabelsGeoJson } from '@/components/map/regionLayers';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { featuresToGeoJson } from '@/features/geo/features-geojson';
import { placesToGeoJson } from '@/features/geo/places-geojson';
import {
  pickRegionAtPoint,
  pickSubRegionAtPoint,
  pickTopRegionAtPoint,
  ZOOM_SUBREGION,
  type RegionsMetaFile,
} from '@/features/geo/region-drilldown';
import type { MapManifest } from '@/types/map';
import type { CharacterIndex } from '@/features/characters/load';
import type { GeoCity, GeoFeature, GeoPlace, GeoRegion, Lineage } from '@/types/geo';
import {
  FLY_ZOOM_CITY,
  FLY_ZOOM_MOUNTAIN,
  FLY_ZOOM_PLACE,
  FLY_ZOOM_RIVER,
  flyZoomForFeature,
  flyZoomFrom,
  MAX_PITCH_LIMIT,
  pitchForZoom,
  TERRAIN_ZOOM_HYSTERESIS,
  TERRAIN_ZOOM_ON,
  ZOOM_RETURN_VISIBLE,
} from '@/features/geo/map-nav';
import {
  applyMapLayerVisibility,
  DEFAULT_MAP_LAYERS,
  parseMapLayersParam,
  serializeMapLayersParam,
  type MapLayerVisibility,
} from '@/features/geo/map-layers';
import { useLandsStore, type LandsMapTarget } from '@/features/geo/lands-store';
import {
  liveGroundParent,
  screenCenterGround,
} from '@/features/geo/ground-focus';
import {
  BEACON_CORE_RADIUS_M,
  BEACON_FULL_ZOOM,
  BEACON_HALO_RADIUS_M,
  BEACON_HEIGHT_M,
  BEACON_HEIGHT_SELECTED_M,
  BEACON_MIN_ZOOM,
  CITY_CORE_OPACITY,
  CITY_CORE_RADIUS,
  CITY_CORE_STROKE,
  CITY_GLOW_OPACITY,
  CITY_GLOW_RADIUS,
  CITY_HIT_RADIUS,
  IMPORTANT_CITY_IDS,
  PLACE_MYTH_CORE_RADIUS,
  PLACE_MYTH_GLOW_RADIUS,
  PLACE_MYTH_HIT_RADIUS,
  MAP,
  TERRAIN_EXAGGERATION,
  riverCoreOpacityExpr,
  riverGlowOpacityExpr,
  riverHitWidthExpr,
} from '@/features/geo/map-theme';
import { isLinearFeatureVisible } from '@/features/geo/feature-visibility';

const STYLE_URL = '/geo/style.json';
const MANIFEST_URL = '/geo/manifest.json';
const REGIONS_META_URL = '/geo/regions-meta.json';
const PITCH_EASE_ID = 'lands-pitch-settle';

function targetPitchForMap(map: MaplibreMap, relief: boolean, zoom = map.getZoom()): number {
  return relief ? pitchForZoom(zoom) : 0;
}

/**
 * Settle the authored tilt only after a direct-manipulation gesture ends.
 *
 * MapLibre's centre-anchored wheel handler intentionally skips centre
 * correction because it assumes pitch is unchanged. Changing pitch later in
 * transformCameraUpdate violated that invariant and made the visible target
 * slide. easeTo's public `around` path updates zoom/pitch first and then calls
 * setLocationAtPoint on every frame, so the geographic centre remains pinned.
 */
function settlePitchAroundCenter(map: MaplibreMap, relief: boolean): void {
  const pitch = targetPitchForMap(map, relief);
  const delta = Math.abs(map.getPitch() - pitch);
  if (delta < 0.35) return;

  map.easeTo({
    zoom: map.getZoom(),
    pitch,
    around: map.getCenter(),
    duration: Math.min(420, 160 + delta * 5),
    easing: (t) => t * t * (3 - 2 * t),
    easeId: PITCH_EASE_ID,
  });
}

/** Programmatic navigation owns its whole pose in one camera transaction. */
function flyToWithPose(map: MaplibreMap, options: FlyToOptions, relief: boolean): void {
  const zoom = options.zoom ?? map.getZoom();
  map.flyTo({
    ...options,
    pitch: targetPitchForMap(map, relief, zoom),
  });
}

function readMapHash(): {
  center: [number, number] | null;
  zoom: number | null;
  place: string | null;
  city: string | null;
  feature: string | null;
  layers: MapLayerVisibility;
} {
  if (typeof window === 'undefined') {
    return {
      center: null,
      zoom: null,
      place: null,
      city: null,
      feature: null,
      layers: { ...DEFAULT_MAP_LAYERS },
    };
  }
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw) {
    return {
      center: null,
      zoom: null,
      place: null,
      city: null,
      feature: null,
      layers: { ...DEFAULT_MAP_LAYERS },
    };
  }
  const params = new URLSearchParams(raw);
  const lng = Number.parseFloat(params.get('lng') ?? '');
  const lat = Number.parseFloat(params.get('lat') ?? '');
  const zoom = Number.parseFloat(params.get('z') ?? '');
  const center =
    Number.isFinite(lng) && Number.isFinite(lat) ? ([lng, lat] as [number, number]) : null;
  return {
    center,
    zoom: Number.isFinite(zoom) ? zoom : null,
    place: params.get('place') || null,
    city: params.get('city') || null,
    feature: params.get('feature') || null,
    layers: parseMapLayersParam(params.get('layers')),
  };
}

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

function resolveHashView(
  hash: ReturnType<typeof readMapHash>,
  places: GeoPlace[],
  cities: GeoCity[],
  features: GeoFeature[],
  cfg: MapManifest,
): { center: [number, number]; zoom: number } {
  if (hash.center && hash.zoom != null) {
    return { center: hash.center, zoom: hash.zoom };
  }
  if (hash.place) {
    const place = places.find((p) => p.id === hash.place);
    if (place) {
      return {
        center: [place.coordinates[0], place.coordinates[1]],
        zoom: hash.zoom ?? FLY_ZOOM_PLACE,
      };
    }
  }
  if (hash.city) {
    const city = cities.find((c) => c.id === hash.city);
    if (city) {
      return {
        center: [city.coordinates[0], city.coordinates[1]],
        zoom: hash.zoom ?? FLY_ZOOM_CITY,
      };
    }
  }
  if (hash.feature) {
    const feature = features.find((f) => f.id === hash.feature);
    const centroid = feature ? featureCentroid(feature) : null;
    if (centroid) {
      return {
        center: centroid,
        zoom: hash.zoom ?? (feature ? flyZoomForFeature(feature) : FLY_ZOOM_RIVER),
      };
    }
  }
  return { center: cfg.center, zoom: hash.zoom ?? cfg.defaultZoom };
}

function writeMapHash(
  map: MaplibreMap,
  selection: { place: string | null; city: string | null; feature: string | null },
  layers: MapLayerVisibility,
) {
  const { lng, lat } = map.getCenter();
  const params = new URLSearchParams();
  params.set('lng', lng.toFixed(4));
  params.set('lat', lat.toFixed(4));
  params.set('z', map.getZoom().toFixed(2));
  if (selection.place) params.set('place', selection.place);
  if (selection.city) params.set('city', selection.city);
  if (selection.feature) params.set('feature', selection.feature);
  const layersParam = serializeMapLayersParam(layers);
  if (layersParam) params.set('layers', layersParam);
  const next = params.toString();
  if (window.location.hash.replace(/^#/, '') === next) return;
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${next}`);
}

/** Fallback if manifest fetch fails. */
const DEFAULT_MANIFEST: MapManifest = {
  version: 2,
  bounds: { west: -6, south: 22, east: 44, north: 47 },
  maxBounds: [
    [-6, 22],
    [44, 47],
  ],
  center: [24, 36],
  defaultZoom: 4.6,
  minZoom: 3,
  maxZoom: 14,
  attribution: [{ name: 'Natural Earth', url: 'https://www.naturalearthdata.com/', license: 'CC0' }],
};

const LINE_KINDS = ['river', 'strait'] as const;

function citiesGeoJson(cities: GeoCity[]) {
  return {
    type: 'FeatureCollection' as const,
    features: cities.map((city) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [city.coordinates[0], city.coordinates[1]],
      },
      properties: { id: city.id, name: city.name, important: IMPORTANT_CITY_IDS.has(city.id) },
    })),
  };
}

/** Hexagon ring (closed) of a given ground radius around a point. */
function hexRing(lng: number, lat: number, radiusM: number): number[][] {
  const latR = radiusM / 111320;
  const lonR = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
  const ring: number[][] = [];
  for (let i = 0; i <= 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    ring.push([lng + Math.cos(a) * lonR, lat + Math.sin(a) * latR]);
  }
  return ring;
}

/** Flagship-city beacon footprints: a core and a wider halo hexagon per city.
 *  Both share the city id, so one feature-state flag lights the whole pillar. */
function cityBeaconsGeoJson(cities: GeoCity[]) {
  const features = [];
  for (const city of cities) {
    if (!IMPORTANT_CITY_IDS.has(city.id)) continue;
    const [lng, lat] = city.coordinates;
    for (const [part, radius] of [
      ['core', BEACON_CORE_RADIUS_M],
      ['halo', BEACON_HALO_RADIUS_M],
    ] as const) {
      features.push({
        type: 'Feature' as const,
        geometry: { type: 'Polygon' as const, coordinates: [hexRing(lng, lat, radius)] },
        properties: { id: city.id, part },
      });
    }
  }
  return { type: 'FeatureCollection' as const, features };
}

export function MapLibreView({
  regions,
  cities,
  places,
  features,
  lineages,
  characterIndex,
}: {
  regions: GeoRegion[];
  cities: GeoCity[];
  places: GeoPlace[];
  features: GeoFeature[];
  lineages: Record<string, Lineage | null>;
  characterIndex: CharacterIndex;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const citiesRef = useRef(cities);
  const placesRef = useRef(places);
  const featuresRef = useRef(features);
  /** The city currently carrying the `selected` feature-state, so it can be cleared. */
  const selectedCityStateRef = useRef<string | null>(null);
  const hoveredFeatureIdRef = useRef<string | null>(null);
  const hoveredRegionIdRef = useRef<string | null>(null);
  const focusedSubIdRef = useRef<string | null>(null);
  const detailParentIdRef = useRef<string | null>(null);
  const regionsMetaRef = useRef<RegionsMetaFile | null>(null);

  useEffect(() => {
    citiesRef.current = cities;
  }, [cities]);
  useEffect(() => {
    placesRef.current = places;
  }, [places]);
  useEffect(() => {
    featuresRef.current = features;
  }, [features]);

  // Parse the hash ONCE per mount — this ran on every render, and since it
  // returns a fresh object each time, the layers-bootstrap effect below
  // re-fired on every render too (guarded, but noisy).
  const initialHash = useMemo(() => readMapHash(), []);
  const selectionRef = useRef({
    place: initialHash.place,
    city: initialHash.city,
    feature: initialHash.feature,
  });

  const [manifest, setManifest] = useState<MapManifest>(DEFAULT_MANIFEST);
  const [regionsMeta, setRegionsMeta] = useState<RegionsMetaFile | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapInstance, setMapInstance] = useState<MaplibreMap | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(initialHash.city);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(initialHash.feature);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(initialHash.place);
  const [hoveredFeatureId, setHoveredFeatureId] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [detailParentId, setDetailParentId] = useState<string | null>(null);
  const [focusedSubId, setFocusedSubId] = useState<string | null>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [returnVisible, setReturnVisible] = useState(false);
  const returnVisibleRef = useRef(false);
  const mapLayers = useLandsStore((s) => s.mapLayers);
  const setMapLayers = useLandsStore((s) => s.setMapLayers);
  const mapLayersRef = useRef(mapLayers);
  const layersBootstrapped = useRef(false);

  useEffect(() => {
    if (layersBootstrapped.current) return;
    layersBootstrapped.current = true;
    mapLayersRef.current = initialHash.layers;
    setMapLayers(initialHash.layers);
  }, [setMapLayers, initialHash.layers]);

  useEffect(() => {
    mapLayersRef.current = mapLayers;
  }, [mapLayers]);

  useEffect(() => {
    selectionRef.current = {
      place: selectedPlaceId,
      city: selectedCityId,
      feature: selectedFeatureId,
    };
  }, [selectedPlaceId, selectedCityId, selectedFeatureId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    writeMapHash(map, selectionRef.current, mapLayers);
  }, [selectedPlaceId, selectedCityId, selectedFeatureId, mapReady, mapLayers]);

  /** The 3D mesh follows the relief toggle AND the tilt band: outside it the
   *  mesh is pure cost (render-to-texture draping, elevation-aware marker
   *  projections) with zero visible payoff at pitch 0. Hysteresis on the way
   *  out so a zoom hovering at the threshold doesn't thrash setTerrain. */
  const applyTerrain = useCallback((map: MaplibreMap) => {
    if (!map.getSource('dem')) return;
    const zoom = map.getZoom();
    const has = !!map.getTerrain();
    const want =
      mapLayersRef.current.relief &&
      (has ? zoom > TERRAIN_ZOOM_ON - TERRAIN_ZOOM_HYSTERESIS : zoom >= TERRAIN_ZOOM_ON);
    if (want !== has) {
      map.setTerrain(
        want ? { source: 'dem', exaggeration: TERRAIN_EXAGGERATION } : null,
      );
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    applyMapLayerVisibility(map, mapLayers);
    applyTerrain(map);
    // Ease the camera to the pose the toggle implies (flat when relief is off).
    settlePitchAroundCenter(map, mapLayers.relief);
  }, [mapLayers, mapReady, applyTerrain]);

  const setMapTarget = useLandsStore((s) => s.setMapTarget);
  const mapTarget = useLandsStore((s) => s.mapTarget);

  const flyToMapTarget = useCallback((target: LandsMapTarget) => {
    const map = mapRef.current;
    if (!map) return;

    if (target.kind === 'city') {
      const city = citiesRef.current.find((c) => c.id === target.id);
      if (!city) return;
      setSelectedCityId(target.id);
      setSelectedPlaceId(null);
      setSelectedFeatureId(null);
      flyToWithPose(map, {
        center: [city.coordinates[0], city.coordinates[1]],
        zoom: flyZoomFrom(map.getZoom(), FLY_ZOOM_CITY),
        duration: 900,
        essential: true,
      }, mapLayersRef.current.relief);
      return;
    }

    if (target.kind === 'place') {
      const place = placesRef.current.find((p) => p.id === target.id);
      if (!place) return;
      setSelectedPlaceId(target.id);
      setSelectedCityId(null);
      setSelectedFeatureId(null);
      flyToWithPose(map, {
        center: [place.coordinates[0], place.coordinates[1]],
        zoom: flyZoomFrom(map.getZoom(), FLY_ZOOM_PLACE),
        duration: 900,
        essential: true,
      }, mapLayersRef.current.relief);
      return;
    }

    const feature = featuresRef.current.find((f) => f.id === target.id);
    const centroid = feature ? featureCentroid(feature) : null;
    if (!centroid) return;
    setSelectedFeatureId(target.id);
    setSelectedCityId(null);
    setSelectedPlaceId(null);
    flyToWithPose(map, {
      center: centroid,
      zoom: flyZoomFrom(map.getZoom(), flyZoomForFeature(feature!)),
      duration: 900,
      essential: true,
    }, mapLayersRef.current.relief);
  }, []);

  useEffect(() => {
    if (!mapTarget || !mapReady) return;
    flyToMapTarget(mapTarget);
    setMapTarget(null);
  }, [mapTarget, mapReady, flyToMapTarget, setMapTarget]);

  const byId = useMemo(() => new Map(regions.map((r) => [r.id, r])), [regions]);
  const featuresById = useMemo(() => new Map(features.map((f) => [f.id, f])), [features]);
  const placesById = useMemo(() => new Map(places.map((p) => [p.id, p])), [places]);
  const selectedCity = selectedCityId
    ? (cities.find((c) => c.id === selectedCityId) ?? null)
    : null;
  const selectedFeature = selectedFeatureId
    ? (featuresById.get(selectedFeatureId) ?? null)
    : null;
  const selectedPlace = selectedPlaceId ? (placesById.get(selectedPlaceId) ?? null) : null;
  const hoveredFeature = hoveredFeatureId ? (featuresById.get(hoveredFeatureId) ?? null) : null;
  const cityData = useMemo(() => citiesGeoJson(cities), [cities]);
  const beaconData = useMemo(() => cityBeaconsGeoJson(cities), [cities]);
  const placeData = useMemo(() => placesToGeoJson(places), [places]);
  const featureData = useMemo(() => featuresToGeoJson(features), [features]);
  const regionLabels = useMemo(
    () => (regionsMeta ? regionLabelsGeoJson(regions, regionsMeta) : null),
    [regions, regionsMeta],
  );

  /** Top-level region a city's sub-region belongs to (for label gating). */
  const cityFamily = useCallback(
    (city: GeoCity): string | null => {
      if (!city.region) return null;
      const region = byId.get(city.region);
      return region?.parent ?? city.region;
    },
    [byId],
  );

  useEffect(() => {
    fetch(MANIFEST_URL)
      .then((r) => (r.ok ? r.json() : DEFAULT_MANIFEST))
      .then((data: MapManifest) => setManifest(data))
      .catch(() => setManifest(DEFAULT_MANIFEST));
    fetch(REGIONS_META_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: RegionsMetaFile | null) => {
        if (data?.regions) {
          setRegionsMeta(data);
          regionsMetaRef.current = data;
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    detailParentIdRef.current = detailParentId;
  }, [detailParentId]);
  useEffect(() => {
    focusedSubIdRef.current = focusedSubId;
  }, [focusedSubId]);

  const manifestRef = useRef(manifest);
  useEffect(() => {
    manifestRef.current = manifest;
  }, [manifest]);

  const setFeatureHover = useCallback((map: MaplibreMap, id: string | null) => {
    const prev = hoveredFeatureIdRef.current;
    if (prev && prev !== id) {
      map.setFeatureState({ source: 'features', id: prev }, { hover: false });
    }
    if (id) {
      map.setFeatureState({ source: 'features', id }, { hover: true });
    }
    hoveredFeatureIdRef.current = id;
    setHoveredFeatureId(id);
  }, []);

  /** Last `show` feature-state per river/strait — setFeatureState invalidates
   *  (terrain-draped) tiles even when the value is unchanged, and this runs on
   *  every move frame, so only write real transitions. */
  const linearShowRef = useRef<Map<string, boolean>>(new Map());

  const syncLinearFeatureVisibility = useCallback(
    (map: MaplibreMap) => {
      if (!map.getSource('features') || !map.getLayer('features-line-major')) return;
      const zoom = map.getZoom();
      const liveParent = liveGroundParent(map, zoom, regionsMetaRef.current);
      const layers = mapLayersRef.current;

      for (const feature of featuresRef.current) {
        if (feature.kind !== 'river' && feature.kind !== 'strait') continue;
        const show =
          layers.rivers &&
          isLinearFeatureVisible(feature, zoom, liveParent, byId, regionsMetaRef.current);
        if (linearShowRef.current.get(feature.id) === show) continue;
        linearShowRef.current.set(feature.id, show);
        map.setFeatureState({ source: 'features', id: feature.id }, { show });
      }
    },
    [byId],
  );

  const syncDrilldownFromMap = useCallback((map: MaplibreMap) => {
    const meta = regionsMetaRef.current;
    if (!meta) return;

    // A stationary pointer must not leave a stale hovered region in charge
    // while the map moves underneath it. During pan/zoom, the screen-centred
    // focus is authoritative; hover resumes with the next pointer movement.
    if (hoveredRegionIdRef.current !== null) {
      hoveredRegionIdRef.current = null;
      setHoveredRegionId(null);
    }

    const zoom = map.getZoom();

    if (zoom < ZOOM_SUBREGION) {
      if (detailParentIdRef.current !== null) {
        detailParentIdRef.current = null;
        focusedSubIdRef.current = null;
        setDetailParentId(null);
        setFocusedSubId(null);
      }
      return;
    }

    // Read the literal centre pixel. On pitched terrain map.getCenter() can be
    // geographically offset from the ground the user sees at that pixel.
    const focus = screenCenterGround(map);
    const parentId = pickTopRegionAtPoint(focus.lng, focus.lat, meta);
    if (parentId !== detailParentIdRef.current) {
      detailParentIdRef.current = parentId;
      setDetailParentId(parentId);
    }

    const subId =
      parentId && zoom >= ZOOM_SUBREGION + 0.5
        ? pickSubRegionAtPoint(focus.lng, focus.lat, parentId, meta)
        : null;
    if (subId !== focusedSubIdRef.current) {
      focusedSubIdRef.current = subId;
      setFocusedSubId(subId);
    }
  }, []);

  const regionHandlersBound = useRef(false);

  const addFeatureLayers = useCallback(
    (map: MaplibreMap) => {
      if (map.getSource('features')) return;

      map.addSource('features', {
        type: 'geojson',
        data: featureData,
        promoteId: 'id',
      });

      const lineFilter: maplibregl.FilterSpecification = [
        'in',
        ['get', 'kind'],
        ['literal', [...LINE_KINDS]],
      ];

      const glowPaint = {
        'line-color': MAP.nebulaCyan,
        'line-opacity': riverGlowOpacityExpr(),
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          3,
          ['case', ['boolean', ['feature-state', 'hover'], false], 3, 1.4],
          8,
          ['case', ['boolean', ['feature-state', 'hover'], false], 5, 2.6],
          12,
          ['case', ['boolean', ['feature-state', 'hover'], false], 7, 4],
        ] as maplibregl.ExpressionSpecification,
        'line-blur': 0.35,
      };

      const corePaint = {
        'line-color': MAP.nebulaCyan,
        'line-opacity': riverCoreOpacityExpr(),
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          3,
          ['case', ['boolean', ['feature-state', 'hover'], false], 1.6, 0.85],
          8,
          ['case', ['boolean', ['feature-state', 'hover'], false], 2.2, 1.25],
          12,
          ['case', ['boolean', ['feature-state', 'hover'], false], 2.8, 1.7],
        ] as maplibregl.ExpressionSpecification,
      };

      for (const [suffix, importance] of [
        ['major', 'major'],
        ['minor', 'minor'],
      ] as const) {
        map.addLayer({
          id: `features-glow-${suffix}`,
          type: 'line',
          source: 'features',
          filter: ['all', lineFilter, ['==', ['get', 'importance'], importance]] as maplibregl.FilterSpecification,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: glowPaint,
        });
        map.addLayer({
          id: `features-line-${suffix}`,
          type: 'line',
          source: 'features',
          filter: ['all', lineFilter, ['==', ['get', 'importance'], importance]] as maplibregl.FilterSpecification,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: corePaint,
        });
      }

      map.addLayer({
        id: 'features-hit',
        type: 'line',
        source: 'features',
        filter: lineFilter,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-width': riverHitWidthExpr(),
          'line-opacity': 0,
        },
      });

      // River / strait name labels are DOM markers (real Cinzel) — see MapLabels.

      // Mountain ranges carry NO polygon layers anymore: the 3D terrain itself
      // is the mountain. Their Cinzel labels (MapLabels) are the click target.

      map.on('mouseenter', 'features-hit', (event) => {
        map.getCanvas().style.cursor = 'pointer';
        const id = event.features?.[0]?.properties?.id as string | undefined;
        if (id) setFeatureHover(map, id);
      });
      map.on('mouseleave', 'features-hit', () => {
        map.getCanvas().style.cursor = '';
        setFeatureHover(map, null);
      });

      map.on('click', 'features-hit', (event) => {
        const id = event.features?.[0]?.properties?.id as string | undefined;
        if (!id) return;
        event.originalEvent.stopPropagation();
        setSelectedCityId(null);
        setSelectedPlaceId(null);
        setSelectedFeatureId(id);
        const feature = featuresRef.current.find((f) => f.id === id);
        const centroid = feature ? featureCentroid(feature) : null;
        if (centroid) {
          flyToWithPose(map, {
            center: centroid,
            zoom: flyZoomFrom(map.getZoom(), flyZoomForFeature(feature!)),
            duration: 900,
            essential: true,
          }, mapLayersRef.current.relief);
        }
      });

    },
    [featureData, setFeatureHover],
  );

  /** Mountain ranges have no polygon on the map anymore — their Cinzel label
   *  is the click target (wired through MapLabels). */
  const handleFeatureLabelClick = useCallback((id: string) => {
    const map = mapRef.current;
    if (!map) return;
    setSelectedCityId(null);
    setSelectedPlaceId(null);
    setSelectedFeatureId(id);
    const feature = featuresRef.current.find((f) => f.id === id);
    const centroid = feature ? featureCentroid(feature) : null;
    if (centroid) {
      flyToWithPose(map, {
        center: centroid,
        zoom: flyZoomFrom(map.getZoom(), FLY_ZOOM_MOUNTAIN),
        duration: 900,
        essential: true,
      }, mapLayersRef.current.relief);
    }
  }, []);

  const addPlaceLayers = useCallback(
    (map: MaplibreMap) => {
      if (map.getSource('places')) return;

      map.addSource('places', { type: 'geojson', data: placeData, promoteId: 'id' });

      const bindPlaceClick = (hitLayerId: string) => {
        map.on('mouseenter', hitLayerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', hitLayerId, () => {
          map.getCanvas().style.cursor = '';
        });
        map.on('click', hitLayerId, (event) => {
          const id = event.features?.[0]?.properties?.id as string | undefined;
          if (!id) return;
          event.originalEvent.stopPropagation();
          setSelectedCityId(null);
          setSelectedFeatureId(null);
          setSelectedPlaceId(id);
          const place = placesRef.current.find((p) => p.id === id);
          if (place) {
            flyToWithPose(map, {
              center: [place.coordinates[0], place.coordinates[1]],
              zoom: flyZoomFrom(map.getZoom(), FLY_ZOOM_PLACE),
              duration: 900,
              essential: true,
            }, mapLayersRef.current.relief);
          }
        });
      };

      for (const [prefix, kind] of [
        ['places-sanctuary', 'sanctuary'],
        ['places-myth', 'myth-site'],
      ] as const) {
        const kindFilter: maplibregl.FilterSpecification = ['==', ['get', 'kind'], kind];

        map.addLayer({
          id: `${prefix}-glow`,
          type: 'circle',
          source: 'places',
          minzoom: 3,
          filter: kindFilter,
          paint: {
            'circle-radius': PLACE_MYTH_GLOW_RADIUS as maplibregl.ExpressionSpecification,
            'circle-color': MAP.nebulaSoft,
            // Hidden at basin overview, fading in only as you zoom into a region.
            'circle-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0, 5.5, 0, 7.5, 0.1, 9, 0.14],
            'circle-blur': 0.4,
          },
        });

        map.addLayer({
          id: `${prefix}-hit`,
          type: 'circle',
          source: 'places',
          minzoom: 3,
          filter: kindFilter,
          paint: {
            'circle-radius': PLACE_MYTH_HIT_RADIUS as maplibregl.ExpressionSpecification,
            'circle-color': MAP.cosmos,
            'circle-opacity': 0,
          },
        });

        map.addLayer({
          id: `${prefix}-core`,
          type: 'circle',
          source: 'places',
          minzoom: 3,
          filter: kindFilter,
          paint: {
            'circle-radius': PLACE_MYTH_CORE_RADIUS as maplibregl.ExpressionSpecification,
            'circle-color': MAP.cosmosDeep,
            'circle-stroke-color':
              kind === 'sanctuary' ? MAP.starOlympian : MAP.nebulaSoft,
            'circle-stroke-width': kind === 'sanctuary' ? 1 : 0.75,
            // The visible dot is the stroke ring — gate ITS opacity too, and hide the
            // whole marker at overview so it fades in only when you zoom into a region.
            'circle-stroke-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              3,
              0,
              5.5,
              0,
              7.5,
              0.78,
              9,
              0.9,
            ],
            'circle-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0, 5.5, 0, 7.5, 0.72, 9, 0.85],
          },
        });

        // Place name labels are DOM markers (real Cinzel) — see MapLabels.

        bindPlaceClick(`${prefix}-hit`);
      }
    },
    [placeData],
  );

  const addCityLayers = useCallback(
    (map: MaplibreMap) => {
      if (map.getSource('cities')) return;

      // promoteId so the string city id becomes the feature id for setFeatureState.
      map.addSource('cities', { type: 'geojson', data: cityData, promoteId: 'id' });

      map.addLayer({
        id: 'cities-glow',
        type: 'circle',
        source: 'cities',
        paint: {
          'circle-radius': CITY_GLOW_RADIUS as maplibregl.ExpressionSpecification,
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            MAP.starOlympian,
            MAP.nebulaViolet,
          ],
          'circle-opacity': CITY_GLOW_OPACITY as maplibregl.ExpressionSpecification,
          'circle-blur': 0.35,
        },
      });

      map.addLayer({
        id: 'cities-hit',
        type: 'circle',
        source: 'cities',
        paint: {
          'circle-radius': CITY_HIT_RADIUS as maplibregl.ExpressionSpecification,
          'circle-color': MAP.cosmos,
          'circle-opacity': 0,
        },
      });

      map.addLayer({
        id: 'cities-core',
        type: 'circle',
        source: 'cities',
        paint: {
          'circle-radius': CITY_CORE_RADIUS as maplibregl.ExpressionSpecification,
          'circle-color': MAP.cosmos,
          'circle-stroke-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            MAP.starOlympian,
            MAP.nebulaCyan,
          ],
          'circle-stroke-width': CITY_CORE_STROKE as maplibregl.ExpressionSpecification,
          // The visible "blue dot" is the cyan stroke ring — gate ITS opacity too
          // (circle-opacity only fades the dark fill), or minor dots never disappear.
          'circle-stroke-opacity': CITY_CORE_OPACITY as maplibregl.ExpressionSpecification,
          'circle-opacity': CITY_CORE_OPACITY as maplibregl.ExpressionSpecification,
        },
      });

      // City name labels are DOM markers (real Cinzel) — see MapLabels.

      map.on('mouseenter', 'cities-hit', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'cities-hit', () => {
        map.getCanvas().style.cursor = '';
      });

      map.on('click', 'cities-hit', (event) => {
        const id = event.features?.[0]?.properties?.id as string | undefined;
        if (!id) return;
        event.originalEvent.stopPropagation();
        setSelectedFeatureId(null);
        setSelectedPlaceId(null);
        setSelectedCityId(id);
        const city = citiesRef.current.find((c) => c.id === id);
        if (city) {
          flyToWithPose(map, {
            center: [city.coordinates[0], city.coordinates[1]],
            zoom: flyZoomFrom(map.getZoom(), FLY_ZOOM_CITY),
            duration: 900,
            essential: true,
          }, mapLayersRef.current.relief);
        }
      });
    },
    [cityData],
  );

  /** Flagship-city light pillars, visible only once the tilted camera closes in.
   *  Non-interactive: clicks fall through to the cities hit layer beneath. */
  const addCityBeaconLayers = useCallback(
    (map: MaplibreMap) => {
      if (map.getSource('city-beacons')) return;

      map.addSource('city-beacons', { type: 'geojson', data: beaconData, promoteId: 'id' });

      const selectedExpr: maplibregl.ExpressionSpecification = [
        'boolean',
        ['feature-state', 'selected'],
        false,
      ];
      const beaconColor: maplibregl.ExpressionSpecification = [
        'case',
        selectedExpr,
        MAP.starOlympian,
        MAP.nebulaCyan,
      ];

      for (const [part, opacity, heightScale] of [
        ['halo', 0.08, 0.55],
        ['core', 0.3, 1],
      ] as const) {
        map.addLayer({
          id: `city-beacons-${part}`,
          type: 'fill-extrusion',
          source: 'city-beacons',
          minzoom: BEACON_MIN_ZOOM,
          filter: ['==', ['get', 'part'], part],
          paint: {
            'fill-extrusion-color': beaconColor,
            'fill-extrusion-height': [
              'case',
              selectedExpr,
              BEACON_HEIGHT_SELECTED_M * heightScale,
              BEACON_HEIGHT_M * heightScale,
            ] as maplibregl.ExpressionSpecification,
            'fill-extrusion-base': 0,
            // Breathe in across the fade band instead of popping at minzoom.
            'fill-extrusion-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              BEACON_MIN_ZOOM,
              0,
              BEACON_FULL_ZOOM,
              opacity,
            ] as maplibregl.ExpressionSpecification,
          },
        });
      }
    },
    [beaconData],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const linearShow = linearShowRef.current;
    let map: MaplibreMap | null = null;
    let cancelled = false;
    let pitchSettleFrame: number | null = null;

    const scheduleResize = () => {
      requestAnimationFrame(() => {
        if (cancelled || !map) return;
        map.resize();
        requestAnimationFrame(() => {
          if (!cancelled && map) map.resize();
        });
      });
    };

    const boot = () => {
      if (cancelled || mapRef.current) return;
      if (container.clientWidth < 2 || container.clientHeight < 2) return;

      const cfg = manifestRef.current;
      const hash = readMapHash();
      const view = resolveHashView(hash, placesRef.current, citiesRef.current, featuresRef.current, cfg);
      map = new maplibregl.Map({
        container,
        style: STYLE_URL as unknown as StyleSpecification,
        // Cap the render resolution: on a 2x retina screen full DPR means ~4x
        // the fragments of 1x — with terrain render-to-texture and the glass
        // HUD compositing on top, that is the single biggest GPU line item.
        // 1.5 is visually indistinguishable on this dark, glow-heavy style.
        pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
        center: view.center,
        zoom: view.zoom,
        minZoom: cfg.minZoom,
        maxZoom: cfg.maxZoom,
        maxBounds: cfg.maxBounds,
        // The horizon band of the choreography leans past MapLibre's default
        // maxPitch (60) — lift the clamp to the authored limit.
        maxPitch: MAX_PITCH_LIMIT,
        // The tilt is a pure function of zoom (camera choreography) — restore
        // the same pose the hash zoom implies, flat when relief is off.
        pitch: hash.layers.relief ? pitchForZoom(view.zoom) : 0,
        bearing: 0,
        attributionControl: false,
        fadeDuration: 0,
      });

      map.dragRotate.disable();
      map.touchPitch.disable();
      map.keyboard.disableRotation();
      map.dragPan.enable({ linearity: 0.28, maxSpeed: 1600, deceleration: 2600 });
      // Direct manipulation owns zoom only. Pitch settles through a separate,
      // centre-anchored camera transition after the gesture; injecting pitch
      // into MapLibre's handler transaction breaks its anchor invariant.
      map.scrollZoom.enable({ around: 'center' });

      // NOTE: do NOT dynamically lower the pixel ratio during gestures.
      // setPixelRatio() runs resize(), and resize() calls stop() whenever the
      // camera isn't easing — handler-driven gestures (drag, wheel) keep
      // `_moving` false, so the resize killed the gesture it was reacting to
      // (panning became impossible). The fixed 1.5 cap above is the only safe
      // resolution lever through the public API.

      map.on('error', (event) => {
        const msg = event.error?.message ?? 'Map failed to load';
        console.error('[MapLibre]', msg);
        setMapError(msg);
      });

      map.on('load', () => {
        scheduleResize();
        addFeatureLayers(map!);
        addPlaceLayers(map!);
        addCityLayers(map!);
        addCityBeaconLayers(map!);
        setMapReady(true);
      });

      map.on('moveend', () => {
        if (map) {
          syncDrilldownFromMap(map);
          // setTerrain rebuilds the render pipeline — a guaranteed hitch. Fired
          // here (camera at rest) instead of mid-zoom-animation, it is invisible;
          // the raster relief carries the look until the gesture settles.
          applyTerrain(map);
          writeMapHash(map, selectionRef.current, mapLayersRef.current);
        }
      });
      // Centre focus is cheap (one unproject + bbox lookup), so keep the
      // panel/label highlight locked to the screen centre throughout zoom and
      // pan instead of updating only after the gesture settles.
      map.on('move', () => {
        if (map) syncDrilldownFromMap(map);
      });
      map.on('zoomend', () => {
        if (!map) return;
        syncDrilldownFromMap(map);
        // Let MapLibre finish and publish the direct-manipulation transaction
        // first. The following frame starts one supported, centre-anchored
        // camera ease for the authored pitch pose.
        if (pitchSettleFrame !== null) cancelAnimationFrame(pitchSettleFrame);
        pitchSettleFrame = requestAnimationFrame(() => {
          pitchSettleFrame = null;
          if (!cancelled && map) {
            settlePitchAroundCenter(map, mapLayersRef.current.relief);
          }
        });
      });

      // Keep the continuous zoom listener UI-only; camera choreography settles
      // once per completed gesture above.
      const syncReturnVisibility = () => {
        if (!map) return;
        const next = map.getZoom() > ZOOM_RETURN_VISIBLE;
        if (next === returnVisibleRef.current) return;
        returnVisibleRef.current = next;
        setReturnVisible(next);
      };
      map.on('zoom', syncReturnVisibility);
      syncReturnVisibility();

      mapRef.current = map;
      // Labels are DOM markers and only need projection, not style/tiles — hand
      // the map over immediately so names appear while DEM tiles still stream
      // (map `load` now waits on the S3 elevation tiles too).
      setMapInstance(map);
    };

    const ro = new ResizeObserver(() => {
      if (map) scheduleResize();
      else boot();
    });
    ro.observe(container);
    window.addEventListener('resize', scheduleResize);
    boot();

    return () => {
      cancelled = true;
      if (pitchSettleFrame !== null) cancelAnimationFrame(pitchSettleFrame);
      ro.disconnect();
      window.removeEventListener('resize', scheduleResize);
      map?.remove();
      mapRef.current = null;
      linearShow.clear();
      setMapReady(false);
      setMapInstance(null);
    };
  }, [
    addCityLayers,
    addCityBeaconLayers,
    addFeatureLayers,
    addPlaceLayers,
    syncDrilldownFromMap,
    applyTerrain,
  ]);

  // Region hover (point-in-bbox pick) drives both the info panel and the DOM
  // region label highlight. Bind once the map is ready.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (!regionHandlersBound.current) {
      map.on('mousemove', (event) => {
        const meta = regionsMetaRef.current;
        if (!meta) return;
        const id = pickRegionAtPoint(
          event.lngLat.lng,
          event.lngLat.lat,
          meta,
          detailParentIdRef.current,
          map.getZoom(),
        );
        if (id === hoveredRegionIdRef.current) return;
        hoveredRegionIdRef.current = id;
        setHoveredRegionId(id);
      });
      map.on('mouseleave', () => {
        hoveredRegionIdRef.current = null;
        setHoveredRegionId(null);
      });
      regionHandlersBound.current = true;
    }

    syncDrilldownFromMap(map);
  }, [mapReady, syncDrilldownFromMap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const source = map.getSource('cities') as maplibregl.GeoJSONSource | undefined;
    source?.setData(cityData);
  }, [cityData, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const source = map.getSource('features') as maplibregl.GeoJSONSource | undefined;
    source?.setData(featureData);
    syncLinearFeatureVisibility(map);
  }, [featureData, mapReady, syncLinearFeatureVisibility]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.getLayer('features-line-major')) return;

    const run = () => syncLinearFeatureVisibility(map);
    run();

    // Same 120ms cadence as the label collision pass: the full feature sweep
    // (point-in-bbox region pick per frame) is too heavy for every move frame,
    // and a ≤130ms settle on the fade-in of a river is imperceptible.
    let lastRun = 0;
    let trailing: number | null = null;
    const onMove = () => {
      const now = performance.now();
      if (now - lastRun >= 120) {
        lastRun = now;
        run();
        return;
      }
      if (trailing === null) {
        trailing = window.setTimeout(() => {
          trailing = null;
          lastRun = performance.now();
          run();
        }, 130);
      }
    };
    map.on('move', onMove);
    map.on('moveend', run);
    return () => {
      if (trailing !== null) window.clearTimeout(trailing);
      map.off('move', onMove);
      map.off('moveend', run);
    };
  }, [mapReady, syncLinearFeatureVisibility, mapLayers, regionsMeta, features]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const source = map.getSource('places') as maplibregl.GeoJSONSource | undefined;
    source?.setData(placeData);
  }, [placeData, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.getSource('cities')) return;
    // Only the clicked city carries the `selected` feature-state; the city layers
    // read it (gold stroke/glow, full opacity) per-feature, so no whole-layer repaint
    // turns every city gold. The zoom curves keep ['zoom'] at their top level.
    const prev = selectedCityStateRef.current;
    const hasBeacons = !!map.getSource('city-beacons');
    if (prev && prev !== selectedCityId) {
      map.setFeatureState({ source: 'cities', id: prev }, { selected: false });
      if (hasBeacons) {
        map.setFeatureState({ source: 'city-beacons', id: prev }, { selected: false });
      }
    }
    if (selectedCityId) {
      map.setFeatureState({ source: 'cities', id: selectedCityId }, { selected: true });
      if (hasBeacons) {
        map.setFeatureState({ source: 'city-beacons', id: selectedCityId }, { selected: true });
      }
    }
    selectedCityStateRef.current = selectedCityId;
  }, [selectedCityId, mapReady]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedCityId(null);
        setSelectedFeatureId(null);
        setSelectedPlaceId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Once drill-down is active, the viewport centre owns the information panel.
  // Hover remains useful for label feedback, but must never replace the place
  // the user is actually zooming into (a stray pointer was causing Euboea to
  // override a screen-centred Boeotia focus).
  const activeRegionId = focusedSubId ?? detailParentId ?? hoveredRegionId;
  const activeRegion = activeRegionId ? byId.get(activeRegionId) : undefined;
  /** Whichever elevation tier the style was built against (Mapterhorn extract
   *  or the AWS fallback) — the manifest carries its attribution entry. */
  const terrainAttribution =
    manifest.attribution.find((entry) => entry.name !== 'Natural Earth') ?? null;

  return (
    <div
      className="absolute inset-0"
      style={{
        // The sea: the Aether Nebula backdrop shows through the (now transparent)
        // map canvas, so the basin glows like the rest of the atlas instead of a
        // flat fill. Mirrors the body gradient in globals.css, a touch richer.
        backgroundColor: '#08041d',
        backgroundImage: [
          'radial-gradient(45% 38% at 70% 18%, rgb(124 77 255 / 0.34), transparent 70%)',
          'radial-gradient(50% 44% at 14% 80%, rgb(0 229 255 / 0.16), transparent 70%)',
          'radial-gradient(38% 34% at 90% 84%, rgb(255 64 129 / 0.16), transparent 70%)',
          'radial-gradient(34% 30% at 42% 46%, rgb(124 77 255 / 0.14), transparent 70%)',
        ].join(','),
      }}
    >
      <div
        ref={containerRef}
        className="h-full w-full"
        aria-label="Interactive lands map"
      />

      {/* Star dust + vignette in ONE overlay with normal blending. The old
          screen-blended layer forced the compositor to re-blend the whole
          viewport on every map frame; over this dark basin, low-alpha dots
          composited normally (alphas pre-multiplied by the old 0.45 layer
          opacity) are visually identical. Vignette gradient first = on top,
          so it still dims the dust at the far edges. */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          backgroundImage: [
            'radial-gradient(125% 105% at 50% 42%, transparent 52%, rgb(5 2 15 / 0.5) 100%)',
            'radial-gradient(1px 1px at 20% 30%, rgb(241 245 249 / 0.32), transparent)',
            'radial-gradient(1px 1px at 70% 62%, rgb(192 132 252 / 0.27), transparent)',
            'radial-gradient(1px 1px at 42% 82%, rgb(0 229 255 / 0.22), transparent)',
            'radial-gradient(1px 1px at 85% 24%, rgb(241 245 249 / 0.27), transparent)',
            'radial-gradient(1px 1px at 55% 14%, rgb(241 245 249 / 0.22), transparent)',
          ].join(','),
          backgroundSize:
            '100% 100%, 320px 320px, 280px 280px, 360px 360px, 300px 300px, 340px 340px',
          backgroundRepeat: 'no-repeat, repeat, repeat, repeat, repeat, repeat',
        }}
      />

      <MapLabels
        map={mapInstance}
        cities={cities}
        places={places}
        features={features}
        regionLabels={regionLabels}
        regionsMeta={regionsMeta}
        regionById={byId}
        focusedSubId={focusedSubId}
        hoveredRegionId={hoveredRegionId}
        selectedCityId={selectedCityId}
        mapLayers={mapLayers}
        cityFamily={cityFamily}
        onFeatureClick={handleFeatureLabelClick}
      />

      {mapError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
          <p className="max-w-md text-center font-body text-sm text-aether-muted">
            Map error: {mapError}. Run <code className="text-nebula-soft">pnpm build:map</code> and
            refresh.
          </p>
        </div>
      )}

      {selectedFeature && (
        <FeaturePanel
          feature={selectedFeature}
          region={selectedFeature.region ? byId.get(selectedFeature.region) : undefined}
          onClose={() => setSelectedFeatureId(null)}
        />
      )}

      {selectedPlace && (
        <PlacePanel
          place={selectedPlace}
          region={selectedPlace.region ? byId.get(selectedPlace.region) : undefined}
          onClose={() => setSelectedPlaceId(null)}
        />
      )}

      {!selectedCity && !selectedFeature && !selectedPlace && hoveredFeature && (
        <div
          data-map-overlay
          className="pointer-events-none absolute inset-x-4 bottom-16 z-10 flex justify-center sm:bottom-auto sm:left-1/2 sm:top-24 sm:-translate-x-1/2"
        >
          <GlassPanel className="px-4 py-2.5">
            <p className="font-display text-[11px] uppercase tracking-[0.18em] text-nebula-soft">
              {hoveredFeature.kind.replace('-', ' ')}
            </p>
            <p className="font-display text-sm tracking-[0.08em] text-aether">
              {hoveredFeature.name.toUpperCase()}
            </p>
          </GlassPanel>
        </div>
      )}

      {selectedCity && (
        <CityPanel
          city={selectedCity}
          region={selectedCity.region ? byId.get(selectedCity.region) : undefined}
          lineage={lineages[selectedCity.id] ?? null}
          characterIndex={characterIndex}
          onClose={() => setSelectedCityId(null)}
        />
      )}

      {!selectedCity && !selectedFeature && !selectedPlace && activeRegion && (
        <GlassPanel
          data-map-overlay
          className="pointer-events-none absolute inset-x-4 bottom-12 top-auto z-10 w-auto bg-glass-heavy px-5 py-4 sm:inset-x-auto sm:bottom-auto sm:right-5 sm:top-20 sm:w-80"
        >
          <h2 className="font-display text-base tracking-[0.1em] text-aether">
            {activeRegion.name.toUpperCase()}
            <span className="ml-2 font-body text-sm italic tracking-normal text-aether-muted">
              {activeRegion.greekName}
            </span>
          </h2>
          <p className="mt-2 font-body text-[15px] leading-relaxed text-aether/90">
            {activeRegion.blurb.text}
          </p>
          <div className="mt-3 border-t border-glass-border pt-2 font-display text-[10px] uppercase tracking-[0.2em] text-nebula-soft">
            {detailParentId ? 'Zoom out to return · drag to roam' : 'Zoom in to explore sub-regions'}
          </div>
        </GlassPanel>
      )}

      {returnVisible && !selectedCity && !selectedFeature && !selectedPlace && (
        <button
          type="button"
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            const cfg = manifestRef.current;
            flyToWithPose(map, {
              center: cfg.center,
              zoom: cfg.defaultZoom,
              duration: 1600,
              essential: true,
            }, mapLayersRef.current.relief);
          }}
          aria-label="Return to the basin overview"
          title="Return to the basin"
          className="absolute bottom-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-glass-border bg-glass text-aether-muted backdrop-blur-xl transition-colors hover:border-nebula-soft/50 hover:text-aether"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-4 w-4"
            aria-hidden
          >
            <path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9" strokeLinecap="round" />
            <path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9" strokeLinecap="round" />
            <path d="M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15" strokeLinecap="round" />
            <path d="M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15" strokeLinecap="round" />
            <circle cx="12" cy="12" r="2.25" fill="currentColor" stroke="none" />
          </svg>
        </button>
      )}

      <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 max-w-lg -translate-x-1/2 text-center font-body text-[11px] italic text-aether-faint">
        Basemap:{' '}
        <a
          href="https://www.naturalearthdata.com/"
          className="pointer-events-auto underline decoration-aether-faint/40 hover:text-aether-muted"
          target="_blank"
          rel="noopener noreferrer"
        >
          Natural Earth
        </a>
        {' · Rivers: '}
        <a
          href="https://www.openstreetmap.org/copyright"
          className="pointer-events-auto underline decoration-aether-faint/40 hover:text-aether-muted"
          target="_blank"
          rel="noopener noreferrer"
        >
          © OpenStreetMap contributors
        </a>
        {terrainAttribution && (
          <>
            {' · Terrain: '}
            <a
              href={terrainAttribution.url}
              className="pointer-events-auto underline decoration-aether-faint/40 hover:text-aether-muted"
              target="_blank"
              rel="noopener noreferrer"
            >
              {terrainAttribution.name}
            </a>
          </>
        )}
      </p>
    </div>
  );
}
