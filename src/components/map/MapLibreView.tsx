'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { Map as MaplibreMap, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
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
import type { GeoCity, GeoFeature, GeoPlace, GeoRegion, Lineage } from '@/types/geo';
import {
  FLY_ZOOM_CITY,
  FLY_ZOOM_MOUNTAIN,
  FLY_ZOOM_PLACE,
  FLY_ZOOM_RIVER,
  flyZoomForFeature,
  flyZoomFrom,
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
  riverCoreOpacityExpr,
  riverGlowOpacityExpr,
  riverHitWidthExpr,
} from '@/features/geo/map-theme';
import {
  isLinearFeatureVisible,
  liveMapParent,
} from '@/features/geo/feature-visibility';

const STYLE_URL = '/geo/style.json';
const MANIFEST_URL = '/geo/manifest.json';
const REGIONS_META_URL = '/geo/regions-meta.json';

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
const MOUNTAIN_KIND = 'mountain-range';

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

export function MapLibreView({
  regions,
  cities,
  places,
  features,
  lineages,
}: {
  regions: GeoRegion[];
  cities: GeoCity[];
  places: GeoPlace[];
  features: GeoFeature[];
  lineages: Record<string, Lineage | null>;
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

  const initialHash = readMapHash();
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
  const mapLayers = useLandsStore((s) => s.mapLayers);
  const setMapLayers = useLandsStore((s) => s.setMapLayers);
  const mapLayersRef = useRef(mapLayers);
  const layersBootstrapped = useRef(false);

  useEffect(() => {
    if (layersBootstrapped.current) return;
    layersBootstrapped.current = true;
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    applyMapLayerVisibility(map, mapLayers);
  }, [mapLayers, mapReady]);

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
      map.flyTo({
        center: [city.coordinates[0], city.coordinates[1]],
        zoom: flyZoomFrom(map.getZoom(), FLY_ZOOM_CITY),
        duration: 900,
        essential: true,
      });
      return;
    }

    if (target.kind === 'place') {
      const place = placesRef.current.find((p) => p.id === target.id);
      if (!place) return;
      setSelectedPlaceId(target.id);
      setSelectedCityId(null);
      setSelectedFeatureId(null);
      map.flyTo({
        center: [place.coordinates[0], place.coordinates[1]],
        zoom: flyZoomFrom(map.getZoom(), FLY_ZOOM_PLACE),
        duration: 900,
        essential: true,
      });
      return;
    }

    const feature = featuresRef.current.find((f) => f.id === target.id);
    const centroid = feature ? featureCentroid(feature) : null;
    if (!centroid) return;
    setSelectedFeatureId(target.id);
    setSelectedCityId(null);
    setSelectedPlaceId(null);
    map.flyTo({
      center: centroid,
      zoom: flyZoomFrom(map.getZoom(), flyZoomForFeature(feature!)),
      duration: 900,
      essential: true,
    });
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

  const syncLinearFeatureVisibility = useCallback(
    (map: MaplibreMap) => {
      if (!map.getSource('features') || !map.getLayer('features-line-major')) return;
      const zoom = map.getZoom();
      const center = map.getCenter();
      const liveParent = liveMapParent(zoom, center, regionsMetaRef.current);
      const layers = mapLayersRef.current;

      for (const feature of featuresRef.current) {
        if (feature.kind !== 'river' && feature.kind !== 'strait') continue;
        const show =
          layers.rivers &&
          isLinearFeatureVisible(feature, zoom, liveParent, byId, regionsMetaRef.current);
        map.setFeatureState({ source: 'features', id: feature.id }, { show });
      }
    },
    [byId],
  );

  const syncDrilldownFromMap = useCallback((map: MaplibreMap) => {
    const meta = regionsMetaRef.current;
    if (!meta) return;

    const zoom = map.getZoom();
    const { lng, lat } = map.getCenter();

    if (zoom < ZOOM_SUBREGION) {
      if (detailParentIdRef.current !== null) {
        setDetailParentId(null);
        setFocusedSubId(null);
      }
      return;
    }

    const parentId = pickTopRegionAtPoint(lng, lat, meta);
    if (parentId !== detailParentIdRef.current) {
      setDetailParentId(parentId);
    }

    const subId =
      parentId && zoom >= ZOOM_SUBREGION + 0.5
        ? pickSubRegionAtPoint(lng, lat, parentId, meta)
        : null;
    if (subId !== focusedSubIdRef.current) {
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

      const mountainFilter: maplibregl.FilterSpecification = [
        '==',
        ['get', 'kind'],
        MOUNTAIN_KIND,
      ];

      map.addLayer({
        id: 'features-mountain-fill',
        type: 'fill',
        source: 'features',
        minzoom: 4,
        filter: mountainFilter,
        paint: {
          'fill-color': MAP.nebulaViolet,
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4,
            0.04,
            7,
            0.08,
            10,
            0.12,
          ] as maplibregl.ExpressionSpecification,
          'fill-outline-color': MAP.nebulaSoft,
        },
      });

      map.addLayer({
        id: 'features-mountain-hit',
        type: 'fill',
        source: 'features',
        minzoom: 4,
        filter: mountainFilter,
        paint: {
          'fill-color': MAP.cosmos,
          'fill-opacity': 0,
        },
      });

      // Mountain-range labels are DOM markers (real Cinzel) — see MapLabels.

      map.on('mouseenter', 'features-hit', (event) => {
        map.getCanvas().style.cursor = 'pointer';
        const id = event.features?.[0]?.properties?.id as string | undefined;
        if (id) setFeatureHover(map, id);
      });
      map.on('mouseleave', 'features-hit', () => {
        map.getCanvas().style.cursor = '';
        setFeatureHover(map, null);
      });

      map.on('mouseenter', 'features-mountain-hit', (event) => {
        map.getCanvas().style.cursor = 'pointer';
        const id = event.features?.[0]?.properties?.id as string | undefined;
        if (id) setFeatureHover(map, id);
      });
      map.on('mouseleave', 'features-mountain-hit', () => {
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
          map.flyTo({
            center: centroid,
            zoom: flyZoomFrom(map.getZoom(), flyZoomForFeature(feature!)),
            duration: 900,
            essential: true,
          });
        }
      });

      map.on('click', 'features-mountain-hit', (event) => {
        const id = event.features?.[0]?.properties?.id as string | undefined;
        if (!id) return;
        event.originalEvent.stopPropagation();
        setSelectedCityId(null);
        setSelectedPlaceId(null);
        setSelectedFeatureId(id);
        const feature = featuresRef.current.find((f) => f.id === id);
        const centroid = feature ? featureCentroid(feature) : null;
        if (centroid) {
          map.flyTo({
            center: centroid,
            zoom: flyZoomFrom(map.getZoom(), FLY_ZOOM_MOUNTAIN),
            duration: 900,
            essential: true,
          });
        }
      });
    },
    [featureData, setFeatureHover],
  );

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
            map.flyTo({
              center: [place.coordinates[0], place.coordinates[1]],
              zoom: flyZoomFrom(map.getZoom(), FLY_ZOOM_PLACE),
              duration: 900,
              essential: true,
            });
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
          map.flyTo({
            center: [city.coordinates[0], city.coordinates[1]],
            zoom: flyZoomFrom(map.getZoom(), FLY_ZOOM_CITY),
            duration: 900,
            essential: true,
          });
        }
      });
    },
    [cityData],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    let map: MaplibreMap | null = null;
    let cancelled = false;

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
        center: view.center,
        zoom: view.zoom,
        minZoom: cfg.minZoom,
        maxZoom: cfg.maxZoom,
        maxBounds: cfg.maxBounds,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
        fadeDuration: 0,
      });

      map.dragRotate.disable();
      map.touchPitch.disable();
      map.keyboard.disableRotation();
      map.dragPan.enable({ linearity: 0.28, maxSpeed: 1600, deceleration: 2600 });

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
        setMapReady(true);
        setMapInstance(map);
      });

      map.on('moveend', () => {
        if (map) {
          syncDrilldownFromMap(map);
          writeMapHash(map, selectionRef.current, mapLayersRef.current);
        }
      });
      map.on('zoomend', () => {
        if (!map) return;
        syncDrilldownFromMap(map);
      });

      mapRef.current = map;
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
      ro.disconnect();
      window.removeEventListener('resize', scheduleResize);
      map?.remove();
      mapRef.current = null;
      setMapReady(false);
      setMapInstance(null);
    };
  }, [addCityLayers, addFeatureLayers, addPlaceLayers, syncDrilldownFromMap]);

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
    map.on('move', run);
    return () => {
      map.off('move', run);
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
    if (prev && prev !== selectedCityId) {
      map.setFeatureState({ source: 'cities', id: prev }, { selected: false });
    }
    if (selectedCityId) {
      map.setFeatureState({ source: 'cities', id: selectedCityId }, { selected: true });
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

  const activeRegionId = hoveredRegionId ?? focusedSubId ?? detailParentId;
  const activeRegion = activeRegionId ? byId.get(activeRegionId) : undefined;

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

      {/* Faint star dust over the basin — screen-blended so it only adds light,
          echoing the galaxy's starfield without competing with the labels. */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          opacity: 0.45,
          mixBlendMode: 'screen',
          backgroundImage: [
            'radial-gradient(1px 1px at 20% 30%, rgb(241 245 249 / 0.7), transparent)',
            'radial-gradient(1px 1px at 70% 62%, rgb(192 132 252 / 0.6), transparent)',
            'radial-gradient(1px 1px at 42% 82%, rgb(0 229 255 / 0.5), transparent)',
            'radial-gradient(1px 1px at 85% 24%, rgb(241 245 249 / 0.6), transparent)',
            'radial-gradient(1px 1px at 55% 14%, rgb(241 245 249 / 0.5), transparent)',
          ].join(','),
          backgroundSize: '320px 320px, 280px 280px, 360px 360px, 300px 300px, 340px 340px',
        }}
      />

      {/* Vignette — darkens only the far edges to focus the basin, matching the
          galaxy's Vignette. Center stays clear so labels there are untouched. */}
      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            'radial-gradient(125% 105% at 50% 42%, transparent 52%, rgb(5 2 15 / 0.5) 100%)',
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
      </p>
    </div>
  );
}
