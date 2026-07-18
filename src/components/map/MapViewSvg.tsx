'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { BackArrow } from '@/components/ui/BackArrow';
import { CityPanel } from '@/components/map/CityPanel';
import { useIsMobile } from '@/lib/useIsMobile';
import type { BasemapData, GeoCity, GeoRegion, Lineage } from '@/types/geo';

/** Padding around a focused region, as a fraction of its bounding box. */
const FOCUS_PADDING = 0.22;
/** Camera zoom limits (1 = the whole map fitted to the container). */
const MIN_ZOOM = 0.7;
const MAX_ZOOM = 28;
/** Above this zoom the top-level labels get out of the way. */
const LABEL_ZOOM_LIMIT = 2.1;
/** Above this zoom city names appear even without a focused region. */
const CITY_NAME_ZOOM = 4.5;
/** Label sizes in map units (the viewBox is ~7460 wide). */
const LABEL_SIZE = 132;
const SUB_LABEL_SIZE = 64;

/** Hand nudges for labels whose centroid sits awkwardly (map units). */
const LABEL_NUDGE: Record<string, [number, number]> = {
  'central-greece': [-160, 120],
  'ionian-islands': [0, -240],
  'south-aegean': [380, 60],
  'north-aegean': [240, -120],
  euboea: [260, 200],
  chalcidice: [80, -200],
};

/** Hand nudges for sub-region labels (map units). */
const SUB_LABEL_NUDGE: Record<string, [number, number]> = {
  acarnania: [-240, 80],
  aetolia: [200, -60],
  phthia: [140, 60],
};

/** Region tint per id — neighbors get different nebula hues so borders read
 *  from color alone (the source polygons carry modern interior seams, so the
 *  fill is flattened at group level and strokes are avoided entirely). */
const REGION_HUE: Record<string, string> = {
  macedonia: '#7c4dff',
  epirus: '#00e5ff',
  thessaly: '#ff4081',
  'central-greece': '#7c4dff',
  attica: '#00e5ff',
  euboea: '#ff4081',
  peloponnese: '#ff4081',
  'ionian-islands': '#c084fc',
  chalcidice: '#00e5ff',
  'north-aegean': '#c084fc',
  'south-aegean': '#00e5ff',
  crete: '#7c4dff',
  troad: '#fcd34d',
  // Peloponnese sub-regions (arcadia gold: the heart of the peninsula).
  arcadia: '#fcd34d',
  laconia: '#7c4dff',
  messenia: '#00e5ff',
  argolis: '#c084fc',
  corinthia: '#ff4081',
  achaea: '#00e5ff',
  elis: '#7c4dff',
  // Attica
  'attica-proper': '#7c4dff',
  megaris: '#ff4081',
  salamis: '#00e5ff',
  aegina: '#c084fc',
  // Central Greece
  acarnania: '#00e5ff',
  aetolia: '#7c4dff',
  'ozolian-locris': '#ff4081',
  doris: '#00e5ff',
  phocis: '#fcd34d',
  boeotia: '#7c4dff',
  'opuntian-locris': '#ff4081',
  malis: '#c084fc',
  // Thessaly
  hestiaeotis: '#00e5ff',
  pelasgiotis: '#7c4dff',
  magnesia: '#ff4081',
  thessaliotis: '#c084fc',
  phthia: '#fcd34d',
  // Epirus
  chaonia: '#7c4dff',
  molossis: '#ff4081',
  thesprotia: '#00e5ff',
  // Macedonia & Thrace
  'upper-macedonia': '#00e5ff',
  pieria: '#ff4081',
  emathia: '#7c4dff',
  paeonia: '#fcd34d',
  mygdonia: '#c084fc',
  thrace: '#7c4dff',
  thasos: '#ff4081',
  samothrace: '#00e5ff',
  // Chalcidice
  bottike: '#7c4dff',
  pallene: '#ff4081',
  sithonia: '#00e5ff',
  acte: '#c084fc',
  // Ionian islands
  corcyra: '#7c4dff',
  leucas: '#ff4081',
  cephallenia: '#00e5ff',
  ithaca: '#fcd34d',
  zacynthus: '#c084fc',
  // North Aegean islands
  lesbos: '#7c4dff',
  lemnos: '#ff4081',
  chios: '#00e5ff',
  samos: '#c084fc',
  icaria: '#fcd34d',
  // South Aegean islands
  delos: '#fcd34d',
  naxos: '#7c4dff',
  paros: '#00e5ff',
  thera: '#ff4081',
  rhodes: '#7c4dff',
  cos: '#ff4081',
};

interface Camera {
  k: number;
  x: number;
  y: number;
}

const HOME: Camera = { k: 1, x: 0, y: 0 };

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function MapView({
  basemap,
  regions,
  cities,
  lineages,
}: {
  basemap: BasemapData;
  regions: GeoRegion[];
  cities: GeoCity[];
  lineages: Record<string, Lineage | null>;
}) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const worldRef = useRef<SVGGElement>(null);
  const camera = useRef<Camera>({ ...HOME });
  const flight = useRef<number | null>(null);
  const isFlying = useRef(false);
  const flightFailsafe = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drag = useRef<{
    sx: number;
    sy: number;
    ox: number;
    oy: number;
    pointerId: number;
    captured: boolean;
  } | null>(null);
  /** Live touch points by id, for one-finger pan vs two-finger pinch. */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  /** Pinch baseline: finger distance, camera scale, and the world point anchored
   *  under the gesture's midpoint at the moment the second finger landed. */
  const pinch = useRef<{ dist: number; k: number; worldX: number; worldY: number } | null>(null);
  const movedInDrag = useRef(false);
  const zoomedRef = useRef(false);

  const deepZoomRef = useRef(false);
  /** Base viewBox→container scale; markers divide by s0·k to size in true pixels. */
  const s0Ref = useRef(1);

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [detailParentId, setDetailParentId] = useState<string | null>(null);
  const [zoomedIn, setZoomedIn] = useState(false);
  const [deepZoom, setDeepZoom] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

  const [vbX, vbY, vbW, vbH] = useMemo(
    () => basemap.viewBox.split(/\s+/).map(Number),
    [basemap.viewBox],
  );
  const byId = useMemo(() => new Map(regions.map((r) => [r.id, r])), [regions]);
  const topLevel = useMemo(() => regions.filter((r) => r.parent === null), [regions]);
  const subRegions = useMemo(() => regions.filter((r) => r.parent !== null), [regions]);

  /** The top-level region whose sub-regions are currently revealed. */
  const openParent = focusedId ? (byId.get(focusedId)?.parent ?? focusedId) : null;

  /** Cities projected into map units via the basemap's plate-carrée calibration. */
  const cityPoints = useMemo(() => {
    const { lonScale, lonOffset, latScale, latOffset } = basemap.cal;
    return cities.map((city) => ({
      city,
      x: lonScale * city.coordinates[0] + lonOffset,
      y: latOffset - latScale * city.coordinates[1],
      /** Top-level region this city's name is gated on (null = far-myth place). */
      family: city.region ? (byId.get(city.region)?.parent ?? city.region) : null,
    }));
  }, [cities, basemap.cal, byId]);
  const selectedCity = selectedCityId
    ? cityPoints.find((p) => p.city.id === selectedCityId)?.city ?? null
    : null;
  const visibleSubs = useMemo(
    () => subRegions.filter((r) => r.parent === detailParentId && basemap.subregions?.[r.id]),
    [subRegions, detailParentId, basemap.subregions],
  );
  const subsShown = visibleSubs.length > 0;

  const applyCamera = useCallback(() => {
    const c = camera.current;
    const svg = svgRef.current;
    const world = worldRef.current;
    if (svg && world) {
      const width = svg.clientWidth;
      const height = svg.clientHeight;
      const s0 = Math.max(Math.min(width / vbW, height / vbH), 1e-6);
      const offX = (width - vbW * s0) / 2;
      const offY = (height - vbH * s0) / 2;
      const tx = c.x / s0 + (c.k - 1) * (offX / s0 - vbX);
      const ty = c.y / s0 + (c.k - 1) * (offY / s0 - vbY);

      world.setAttribute('transform', `translate(${tx} ${ty}) scale(${c.k})`);
      // City markers counter-scale through this var so their radii are true pixels.
      svg.style.setProperty('--marker-scale', String(1 / (s0Ref.current * c.k)));
    }
    const zoomed = c.k > LABEL_ZOOM_LIMIT;
    if (zoomed !== zoomedRef.current) {
      zoomedRef.current = zoomed;
      setZoomedIn(zoomed);
    }
    const deep = c.k > CITY_NAME_ZOOM;
    if (deep !== deepZoomRef.current) {
      deepZoomRef.current = deep;
      setDeepZoom(deep);
    }
  }, [vbX, vbY, vbW, vbH]);

  const cancelFlight = useCallback(() => {
    isFlying.current = false;
    if (flight.current !== null) {
      cancelAnimationFrame(flight.current);
      flight.current = null;
    }
    if (flightFailsafe.current !== null) {
      clearTimeout(flightFailsafe.current);
      flightFailsafe.current = null;
    }
  }, []);

  /** Capture a pinch baseline from the two live touch points: finger distance,
   *  current zoom, and the world point anchored under the gesture midpoint. */
  const seedPinch = useCallback((node: HTMLElement) => {
    const rect = node.getBoundingClientRect();
    const pts = [...pointers.current.values()];
    const mx = (pts[0].x + pts[1].x) / 2 - rect.left;
    const my = (pts[0].y + pts[1].y) / 2 - rect.top;
    const c = camera.current;
    return {
      dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1,
      k: c.k,
      worldX: (mx - c.x) / c.k,
      worldY: (my - c.y) / c.k,
    };
  }, []);

  const flyTo = useCallback(
    (target: Camera, duration = 800, onLand?: () => void) => {
      cancelFlight();
      isFlying.current = true;
      setHoveredId(null);
      let landed = false;
      const finish = () => {
        if (landed) return;
        landed = true;
        isFlying.current = false;
        onLand?.();
      };
      // Hidden tabs never fire animation frames — snap instead of stalling.
      if (document.visibilityState === 'hidden') {
        camera.current = { ...target };
        applyCamera();
        finish();
        return;
      }
      const from = { ...camera.current };
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const e = easeInOutCubic(t);
        camera.current = {
          k: from.k + (target.k - from.k) * e,
          x: from.x + (target.x - from.x) * e,
          y: from.y + (target.y - from.y) * e,
        };
        applyCamera();
        flight.current = t < 1 ? requestAnimationFrame(step) : null;
        if (t >= 1) finish();
        if (t >= 1 && flightFailsafe.current !== null) {
          clearTimeout(flightFailsafe.current);
          flightFailsafe.current = null;
        }
      };
      flight.current = requestAnimationFrame(step);
      // Throttled/occluded tabs may starve animation frames — land the flight anyway.
      flightFailsafe.current = setTimeout(() => {
        flightFailsafe.current = null;
        if (flight.current !== null) {
          cancelAnimationFrame(flight.current);
          flight.current = null;
          camera.current = { ...target };
          applyCamera();
          finish();
        }
      }, duration + 100);
    },
    [applyCamera, cancelFlight],
  );

  const cameraForBBox = useCallback(
    (bbox: number[]): Camera => {
      if (size.w === 0 || size.h === 0) return { ...HOME };
      const [bx, by, bw, bh] = bbox;
      const s0 = Math.min(size.w / vbW, size.h / vbH);
      const offX = (size.w - vbW * s0) / 2;
      const offY = (size.h - vbH * s0) / 2;
      const padW = bw * (1 + FOCUS_PADDING * 2);
      const padH = bh * (1 + FOCUS_PADDING * 2);
      const k = Math.min(
        Math.min(size.w / (padW * s0), size.h / (padH * s0)),
        MAX_ZOOM,
      );
      const cx = (bx + bw / 2 - vbX) * s0 + offX;
      const cy = (by + bh / 2 - vbY) * s0 + offY;
      return { k, x: size.w / 2 - cx * k, y: size.h / 2 - cy * k };
    },
    [size, vbX, vbY, vbW, vbH],
  );

  const boundsFor = useCallback(
    (id: string) => basemap.subregions?.[id]?.bbox ?? basemap.regionBounds[id]?.bbox,
    [basemap],
  );

  const focusRegion = useCallback(
    (id: string | null) => {
      setFocusedId(id);
      if (id === null) {
        setDetailParentId(null);
        flyTo({ ...HOME });
        return;
      }
      const bbox = boundsFor(id);
      const parentId = byId.get(id)?.parent ?? id;
      // Keep sibling sub-region geometry mounted while flying inside one region.
      // Only swap detail layers when the top-level parent actually changes.
      if (parentId !== detailParentId) setDetailParentId(null);
      if (bbox) flyTo(cameraForBBox(bbox), 800, () => setDetailParentId(parentId));
    },
    [boundsFor, byId, cameraForBBox, detailParentId, flyTo],
  );

  /** ESC and background clicks step one level up: sub-region → parent → overview. */
  const stepUp = useCallback(() => {
    if (focusedId === null) return;
    const parent = byId.get(focusedId)?.parent ?? null;
    if (parent) {
      setFocusedId(parent);
      const bbox = boundsFor(parent);
      if (bbox) flyTo(cameraForBBox(bbox), 800, () => setDetailParentId(parent));
      return;
    }
    setDetailParentId(null);
    setFocusedId(null);
    flyTo({ ...HOME });
  }, [focusedId, byId, boundsFor, cameraForBBox, flyTo]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    // Seed synchronously: ResizeObserver callbacks ride the render loop and
    // never fire in hidden/occluded tabs, which would leave size at 0×0.
    const update = (width: number, height: number) => {
      s0Ref.current = Math.max(Math.min(width / vbW, height / vbH), 1e-6);
      setSize({ w: width, h: height });
      applyCamera();
    };
    const rect = node.getBoundingClientRect();
    update(rect.width, rect.height);
    const observer = new ResizeObserver(([entry]) => {
      update(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [vbW, vbH, applyCamera]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setSelectedCityId((current) => {
        if (current === null) stepUp();
        return null;
      });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stepUp]);

  // Wheel zoom toward the cursor. Registered manually: React wheel listeners
  // are passive, and we must preventDefault to stop page/browser zoom.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      // Let panels (e.g. the city lineage) scroll instead of zooming the map.
      if ((event.target as Element | null)?.closest('[data-map-overlay]')) return;
      event.preventDefault();
      cancelFlight();
      const rect = node.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      const c = camera.current;
      // Trackpad pinch arrives as ctrl+wheel with small deltas.
      const factor = Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.0022));
      const k = Math.min(Math.max(c.k * factor, MIN_ZOOM), MAX_ZOOM);
      const r = k / c.k;
      camera.current = { k, x: mx - (mx - c.x) * r, y: my - (my - c.y) * r };
      applyCamera();
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [applyCamera, cancelFlight]);

  useEffect(() => {
    applyCamera();
  }, [applyCamera]);

  const activeId = hoveredId ?? focusedId;
  const active = activeId ? byId.get(activeId) : undefined;
  const showTopLabels = !zoomedIn && focusedId === null;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full cursor-grab touch-none overflow-hidden active:cursor-grabbing"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        // Touches that begin on a panel scroll it — never pan/pinch the map.
        if ((event.target as Element).closest('[data-map-overlay]')) return;
        cancelFlight();
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (pointers.current.size >= 2) {
          // Second finger down — switch from pan to a two-finger pinch.
          drag.current = null;
          movedInDrag.current = true; // a pinch is never a tap
          pinch.current = seedPinch(event.currentTarget);
        } else {
          drag.current = {
            sx: event.clientX,
            sy: event.clientY,
            ox: camera.current.x,
            oy: camera.current.y,
            pointerId: event.pointerId,
            captured: false,
          };
          movedInDrag.current = false;
        }
      }}
      onPointerMove={(event) => {
        if (pointers.current.has(event.pointerId)) {
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        }
        // Two fingers: pinch-zoom toward the moving midpoint.
        if (pinch.current && pointers.current.size >= 2) {
          const rect = event.currentTarget.getBoundingClientRect();
          const pts = [...pointers.current.values()];
          const mx = (pts[0].x + pts[1].x) / 2 - rect.left;
          const my = (pts[0].y + pts[1].y) / 2 - rect.top;
          const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          const p = pinch.current;
          const k = Math.min(Math.max((p.k * dist) / p.dist, MIN_ZOOM), MAX_ZOOM);
          camera.current = { k, x: mx - p.worldX * k, y: my - p.worldY * k };
          applyCamera();
          return;
        }
        // One finger: drag-pan.
        const d = drag.current;
        if (!d) return;
        const dx = event.clientX - d.sx;
        const dy = event.clientY - d.sy;
        if (Math.abs(dx) + Math.abs(dy) > 4) {
          movedInDrag.current = true;
          // Capture only once a real drag starts — capturing on pointerdown
          // retargets the eventual click to the container and breaks region clicks.
          if (!d.captured) {
            d.captured = true;
            event.currentTarget.setPointerCapture(d.pointerId);
          }
        }
        if (!movedInDrag.current) return;
        camera.current = { ...camera.current, x: d.ox + dx, y: d.oy + dy };
        applyCamera();
      }}
      onPointerUp={(event) => {
        pointers.current.delete(event.pointerId);
        if (pointers.current.size >= 2) {
          // Re-seed the pinch from the fingers that remain (e.g. 3→2).
          pinch.current = seedPinch(event.currentTarget);
        } else if (pointers.current.size === 1) {
          // One finger left mid-pinch — resume panning with it, no jump.
          pinch.current = null;
          const [id, pt] = [...pointers.current.entries()][0];
          drag.current = {
            sx: pt.x,
            sy: pt.y,
            ox: camera.current.x,
            oy: camera.current.y,
            pointerId: id,
            captured: false,
          };
        } else {
          pinch.current = null;
          drag.current = null;
        }
      }}
      onPointerCancel={(event) => {
        pointers.current.delete(event.pointerId);
        if (pointers.current.size < 2) pinch.current = null;
        if (pointers.current.size === 0) drag.current = null;
      }}
      onClick={(event) => {
        if (movedInDrag.current) {
          movedInDrag.current = false;
          return;
        }
        // Clicks inside an open panel are its own business.
        if ((event.target as Element).closest('[data-map-overlay]')) return;
        // An open city panel closes on the next click anywhere else.
        if (selectedCityId) {
          setSelectedCityId(null);
          return;
        }
        stepUp();
      }}
    >
      <svg
        ref={svgRef}
        viewBox={basemap.viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
        // Skip anti-aliasing on phones: rasterising ~900 paths every pan/zoom
        // frame is the map's heaviest cost; jaggier edges buy a smooth gesture.
        shapeRendering={isMobile ? 'optimizeSpeed' : undefined}
      >
        <defs>
          {/* Greek land plus the foreign (Anatolian) coast — synthetic regions
              like the Troad live on the foreign layer. */}
          <clipPath id="terrain-clip">
            {basemap.land.map((p, i) => (
              <path key={`l${i}`} d={p.d} transform={p.transform} />
            ))}
            {basemap.foreign.map((p, i) => (
              <path key={`f${i}`} d={p.d} transform={p.transform} />
            ))}
          </clipPath>
          {detailParentId && basemap.regions[detailParentId] && (
            <clipPath id="open-parent-clip">
              {basemap.regions[detailParentId].map((p, i) => (
                <path key={i} d={p.d} transform={p.transform} />
              ))}
              {basemap.regionExtensions?.[detailParentId] && (
                <polygon
                  points={basemap.regionExtensions[detailParentId].points
                    .map((pt) => pt.join(','))
                    .join(' ')}
                />
              )}
            </clipPath>
          )}
        </defs>

        <g ref={worldRef}>
        <g className="opacity-45">
          {basemap.foreign.map((p, i) => (
            <path key={`f${i}`} d={p.d} transform={p.transform} className="fill-[#0d0726]" />
          ))}
        </g>
        <g>
          {basemap.land.map((p, i) => (
            // Self-colored stroke seals seams between the source's interior
            // land pieces without drawing their (modern) borders.
            <path
              key={`l${i}`}
              d={p.d}
              transform={p.transform}
              fill="#170e38"
              stroke="#170e38"
              strokeWidth={3}
            />
          ))}
        </g>
        {basemap.regionExtensions && (
          // Synthetic-region terrain (e.g. the Troad on the Anatolian coast)
          // painted like Greek land, so region tints above read identically.
          <g clipPath="url(#terrain-clip)">
            {Object.entries(basemap.regionExtensions).map(([id, ext]) => (
              <polygon
                key={`ext-land-${id}`}
                points={ext.points.map((pt) => pt.join(',')).join(' ')}
                fill="#170e38"
                stroke="#170e38"
                strokeWidth={3}
              />
            ))}
          </g>
        )}
        <g>
          {/* The soft purple coast halo doubles the stroked-path count — skip it
              on phones and keep only the thin coastline below. */}
          {!isMobile &&
            basemap.coast.map((p, i) => (
              <path
                key={`halo-${i}`}
                d={p.d}
                transform={p.transform}
                fill="none"
                stroke="#7c4dff"
                strokeOpacity={0.18}
                strokeWidth={4}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          {basemap.coast.map((p, i) => (
            <path
              key={`c${i}`}
              d={p.d}
              transform={p.transform}
              fill="none"
              className="stroke-aether/25"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
        <g>
          {basemap.lakes.map((p, i) => (
            <path key={`w${i}`} d={p.d} transform={p.transform} className="fill-cosmos-deep/90" />
          ))}
        </g>

        {topLevel.map((region) => {
          const paths = basemap.regions[region.id] ?? [];
          const hue = REGION_HUE[region.id] ?? '#7c4dff';
          const isHovered = hoveredId === region.id;
          const isFocused = focusedId === region.id;
          const isOpenParent = openParent === region.id;
          const dimmed = focusedId !== null && !isFocused && !isOpenParent;
          return (
            <g
              key={region.id}
              data-region={region.id}
              className="cursor-pointer"
              style={{
                opacity: isOpenParent
                  ? 0.05
                  : dimmed
                    ? 0.05
                    : isHovered
                      ? 0.32
                      : isFocused
                        ? 0.18
                        : 0.16,
                filter:
                  (isHovered || isFocused) && !isOpenParent
                    ? `drop-shadow(0 0 ${isHovered ? 14 : 8}px ${hue})`
                    : undefined,
                pointerEvents: isOpenParent ? 'none' : undefined,
                transition: 'opacity 0.3s',
              }}
              onMouseEnter={() => {
                if (!isFlying.current) setHoveredId(region.id);
              }}
              onMouseLeave={() => {
                if (!isFlying.current) setHoveredId((id) => (id === region.id ? null : id));
              }}
              onClick={(event) => {
                event.stopPropagation();
                if (movedInDrag.current) {
                  movedInDrag.current = false;
                  return;
                }
                focusRegion(region.id);
              }}
            >
              {paths.map((p, i) => (
                // Same-hue stroke seals antialiasing seams between the source's
                // interior polygon pieces; group opacity flattens it all to one tint.
                <path key={i} d={p.d} transform={p.transform} fill={hue} stroke={hue} strokeWidth={3} />
              ))}
              {basemap.regionExtensions?.[region.id] && (
                <g clipPath="url(#terrain-clip)">
                  <polygon
                    points={basemap.regionExtensions[region.id].points
                      .map((pt) => pt.join(','))
                      .join(' ')}
                    fill={hue}
                    stroke={hue}
                    strokeWidth={3}
                  />
                </g>
              )}
            </g>
          );
        })}

        {subsShown && (
          // The outer land clip is only needed when the parent has an authored
          // extension ring that overshoots the sea. Applying it unconditionally
          // trips Chromium's nested-clip complexity limit on path-heavy parents
          // (e.g. the 40-piece Peloponnese), which silently clips to nothing.
          <g
            clipPath={
              detailParentId && basemap.regionExtensions?.[detailParentId]
                ? 'url(#terrain-clip)'
                : undefined
            }
          >
            <g clipPath="url(#open-parent-clip)">
            {visibleSubs.map((sub) => {
              const shape = basemap.subregions![sub.id];
              const hue = REGION_HUE[sub.id] ?? '#7c4dff';
              const isHovered = hoveredId === sub.id;
              const isFocused = focusedId === sub.id;
              const dimmed = focusedId !== null && focusedId !== openParent && !isFocused;
              return (
                <g
                  key={sub.id}
                  data-region={sub.id}
                  className="cursor-pointer"
                  onMouseEnter={() => {
                    if (!isFlying.current) setHoveredId(sub.id);
                  }}
                  onMouseLeave={() => {
                    if (!isFlying.current) setHoveredId((id) => (id === sub.id ? null : id));
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (movedInDrag.current) {
                      movedInDrag.current = false;
                      return;
                    }
                    focusRegion(sub.id);
                  }}
                >
                  <polygon
                    points={shape.points.map((pt) => pt.join(',')).join(' ')}
                    style={{
                      fill: hue,
                      fillOpacity: dimmed ? 0.05 : isHovered ? 0.3 : isFocused ? 0.16 : 0.13,
                      stroke: '#f1f5f9',
                      strokeOpacity: dimmed ? 0.08 : 0.3,
                      strokeWidth: 1,
                      transition: 'fill-opacity 0.25s, stroke-opacity 0.25s',
                    }}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })}
            </g>
          </g>
        )}

        {showTopLabels &&
          topLevel.map((region) => {
            const bounds = basemap.regionBounds[region.id];
            if (!bounds) return null;
            const [nx, ny] = LABEL_NUDGE[region.id] ?? [0, 0];
            return (
              <text
                key={`label-${region.id}`}
                x={bounds.centroid[0] + nx}
                y={bounds.centroid[1] + ny}
                textAnchor="middle"
                className="pointer-events-none select-none uppercase"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: LABEL_SIZE,
                  letterSpacing: '0.22em',
                  fill:
                    hoveredId === region.id ? 'rgb(241 245 249 / 0.95)' : 'rgb(170 180 200 / 0.66)',
                  paintOrder: 'stroke',
                  stroke: 'rgb(5 2 15 / 0.55)',
                  strokeWidth: 14,
                  transition: 'fill 0.25s',
                }}
              >
                {region.name}
              </text>
            );
          })}

        {cityPoints.map(({ city, x, y, family }, cityIndex) => {
          const isSelected = selectedCityId === city.id;
          const showName = deepZoom || (family !== null && openParent === family);
          return (
            <g key={`city-${city.id}`} data-city={city.id} transform={`translate(${x} ${y})`}>
              {/* Counter-scaled so the star stays a tiny screen-constant spark. */}
              <g
                className="cursor-pointer"
                style={{
                  transform: 'scale(var(--marker-scale, 1))',
                  transformOrigin: '0 0',
                  transformBox: 'view-box',
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  if (movedInDrag.current) {
                    movedInDrag.current = false;
                    return;
                  }
                  setSelectedCityId(city.id);
                }}
              >
                <circle r={24} fill="transparent" />
                <circle
                  r={7}
                  fill="#7c4dff"
                  opacity={isSelected ? 0.24 : 0.14}
                  style={
                    isMobile
                      ? undefined
                      : {
                          animation: 'city-twinkle 3.2s ease-in-out infinite',
                          animationDelay: `${cityIndex * 0.55}s`,
                          transformOrigin: '0 0',
                          transformBox: 'view-box',
                        }
                  }
                />
                <circle
                  r={4.2}
                  fill="#08041d"
                  stroke={isSelected ? '#fcd34d' : '#00e5ff'}
                  strokeWidth={isSelected ? 1.2 : 0.8}
                  opacity={isSelected ? 0.95 : 0.72}
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d="M0 -3.4 1 -1 3.4 0 1 1 0 3.4 -1 1 -3.4 0 -1 -1Z"
                  fill={isSelected ? '#fcd34d' : '#c084fc'}
                  style={{
                    filter: isSelected
                      ? 'drop-shadow(0 0 3px rgb(252 211 77 / 0.8))'
                      : 'drop-shadow(0 0 3px rgb(0 229 255 / 0.7))',
                  }}
                />
                <circle
                  r={1.15}
                  fill="#f1f5f9"
                  style={{ filter: 'drop-shadow(0 0 2px rgb(241 245 249 / 0.9))' }}
                />
                {showName && (
                  <text
                    y={26}
                    textAnchor="middle"
                    className="pointer-events-none select-none uppercase"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 13,
                      letterSpacing: '0.2em',
                      fill: isSelected ? 'rgb(252 211 77 / 0.95)' : 'rgb(241 245 249 / 0.85)',
                      paintOrder: 'stroke',
                      stroke: 'rgb(5 2 15 / 0.7)',
                      strokeWidth: 2.5,
                    }}
                  >
                    {city.name}
                  </text>
                )}
              </g>
            </g>
          );
        })}

        {subsShown &&
          visibleSubs.map((sub) => {
            const shape = basemap.subregions![sub.id];
            const [nx, ny] = SUB_LABEL_NUDGE[sub.id] ?? [0, 0];
            return (
              <text
                key={`sublabel-${sub.id}`}
                x={shape.centroid[0] + nx}
                y={shape.centroid[1] + ny}
                textAnchor="middle"
                className="pointer-events-none select-none uppercase"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: SUB_LABEL_SIZE,
                  letterSpacing: '0.2em',
                  fill:
                    hoveredId === sub.id ? 'rgb(241 245 249 / 0.95)' : 'rgb(190 198 215 / 0.72)',
                  paintOrder: 'stroke',
                  stroke: 'rgb(5 2 15 / 0.6)',
                  strokeWidth: 8,
                  transition: 'fill 0.25s',
                }}
              >
                {sub.name}
              </text>
            );
          })}
        </g>
      </svg>

      {selectedCity && (
        <CityPanel
          city={selectedCity}
          region={selectedCity.region ? byId.get(selectedCity.region) : undefined}
          lineage={lineages[selectedCity.id] ?? null}
          onClose={() => setSelectedCityId(null)}
        />
      )}

      {!selectedCity && active && (
        <GlassPanel className="pointer-events-none absolute inset-x-4 bottom-12 top-auto z-10 w-auto bg-glass-heavy px-5 py-4 sm:inset-x-auto sm:bottom-auto sm:right-5 sm:top-5 sm:w-80">
          <h2 className="font-display text-base tracking-[0.1em] text-aether">
            {active.name.toUpperCase()}
            <span className="ml-2 font-body text-sm italic tracking-normal text-aether-muted">
              {active.greekName}
            </span>
          </h2>
          <p className="mt-2 font-body text-[15px] leading-relaxed text-aether/90">
            {active.blurb.text}
          </p>
          <div className="mt-3 border-t border-glass-border pt-2 font-display text-[10px] uppercase tracking-[0.2em] text-nebula-soft">
            {focusedId === active.id ? 'ESC to pull back · drag & scroll to roam' : 'Click to travel'}
          </div>
        </GlassPanel>
      )}

      {focusedId && (
        <div
          className="absolute left-5 top-5 z-10"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <BackArrow
            onClick={stepUp}
            label={
              byId.get(focusedId)?.parent
                ? `Back to ${byId.get(byId.get(focusedId)!.parent!)?.name}`
                : 'Back to all regions'
            }
          />
        </div>
      )}

      <p className="pointer-events-none absolute bottom-1.5 left-1/2 z-10 w-[94vw] -translate-x-1/2 truncate text-center font-body text-[10px] italic text-aether-faint sm:bottom-3 sm:w-auto sm:whitespace-normal sm:text-[11px]">
        Basemap adapted from the &ldquo;Greece (ancient)&rdquo; series, Wikimedia Commons · CC
        BY-SA 3.0
      </p>
    </div>
  );
}
