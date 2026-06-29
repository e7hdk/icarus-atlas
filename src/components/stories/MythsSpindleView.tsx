'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import type { Chronology, Story, StoryCrossing, StoryKind } from '@/types/story';
import { buildChronologyYears } from '@/features/stories/chronology';
import { useGalaxyStore } from '@/features/galaxy/store';
import { useIsMobile } from '@/lib/useIsMobile';
import { childrenOf } from '@/features/stories/shelves';
import { hashString, mulberry32 } from '@/features/galaxy/layout';
import {
  buildSpindleLayout,
  isStoryAttested,
  SAGA_ACCENT,
  SAGA_LABEL,
  SAGA_ORDER,
  type SagaId,
  type SpindleNode,
  type Vec3,
} from '@/features/stories/spindle';
import { useAtlasSearchHotkey } from '@/components/hud/useAtlasSearchHotkey';
import { useElapsedRef } from '@/components/galaxy/useElapsedRef';
import { SpindleStars } from './SpindleStars';
import { SpindleLines } from './SpindleLines';
import { SpindleCrossings } from './SpindleCrossings';
import { SpindleRig } from './SpindleControls';
import { StorySearchOverlay } from './StorySearchOverlay';

/** The origin myth at the head of the tunnel — Chaos, the birth of the cosmos. */
const ORIGIN_ID = 'cosmogony';

/** The starry wall sits right *at* the myths on the inner surface, so the night
 *  sky and the world-lines share one skin — the stars read as set into the wall,
 *  not floating in front of it. A hair over 1 keeps the dark shell just behind. */
const UNIVERSE_SCALE = 1.04;

/** Wall starfield — the galaxy's point recipe plus a depth fade, so when we
 *  gaze down the tube the far wall dissolves into the dark instead of piling
 *  thousands of additive sprites into a white blob at the vanishing point. */
const WALL_VERT = /* glsl */ `
attribute vec3 aColor;
attribute float aSize;
attribute float aPhase;
attribute float aSpeed;
uniform float uTime;
uniform float uPixelRatio;
varying vec3 vColor;
varying float vDepth;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vColor = aColor * (0.82 + 0.18 * sin(uTime * aSpeed + aPhase));
  vDepth = -mv.z;
  gl_PointSize = clamp(aSize * uPixelRatio * (160.0 / -mv.z), 1.0, 14.0 * uPixelRatio);
  gl_Position = projectionMatrix * mv;
}
`;
const WALL_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vDepth;
uniform float uFadeNear;
uniform float uFadeFar;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d2 = dot(p, p);
  if (d2 > 1.0) discard;
  float fade = clamp(1.0 - (vDepth - uFadeNear) / (uFadeFar - uFadeNear), 0.0, 1.0);
  gl_FragColor = vec4(vColor * exp(-d2 * 4.5) * fade, 1.0);
}
`;

const KIND_COLOR: Record<StoryKind, string> = {
  cosmogony: '#c084fc',
  catastrophe: '#00e5ff',
  war: '#fb7185',
  saga: '#fcd34d',
  episode: '#aab4c8',
};

const KIND_LABEL: Record<StoryKind, string> = {
  cosmogony: 'cosmogony',
  catastrophe: 'catastrophe',
  war: 'war',
  saga: 'saga',
  episode: 'episode',
};

/** The enclosing universe: a huge inward-facing cylinder whose dark inner wall
 *  is the night sky. We live *inside* it — the camera can never leave — so the
 *  whole cosmos is the spindle, with the myth world-lines floating at its core. */
function SpindleUniverse({
  yTop,
  yBottom,
  radius,
}: {
  yTop: number;
  yBottom: number;
  radius: number;
}) {
  const { objects, pointsMaterial } = useMemo(() => {
    const out: THREE.Object3D[] = [];
    const yMid = (yTop + yBottom) / 2;
    const height = yTop - yBottom + radius * 2.4;

    // Dark inner shell — the void the stars are painted on. Closed at both ends
    // (no open mouths to glimpse the outside through) with a faint nebula
    // gradient that gives the wall a surface, so it reads as a wall, not space.
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, 96, 1, false),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTop: { value: new THREE.Color(0x0c0730) },
          uBottom: { value: new THREE.Color(0x05020f) },
        },
        vertexShader: /* glsl */ `
          varying float vY;
          void main() {
            vY = uv.y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop;
          uniform vec3 uBottom;
          varying float vY;
          void main() {
            gl_FragColor = vec4(mix(uBottom, uTop, vY), 1.0);
          }
        `,
      }),
    );
    shell.position.y = yMid;
    shell.renderOrder = -4;
    out.push(shell);

    // The night sky lives ON the inner wall: a dense, thin starry shell so the
    // eye reads a curved cylindrical surface around us. A thin inner scatter
    // adds just enough parallax without filling the tube's hollow core.
    const rng = mulberry32(hashString('spindle-universe'));
    // Scale the wall field with the tunnel's length so density stays constant
    // however long the corridor of time grows.
    const WALL = Math.min(22000, Math.max(8000, Math.round(height * 38)));
    const NEAR = Math.round(WALL * 0.06);
    const TOTAL = WALL + NEAR;
    const positions = new Float32Array(TOTAL * 3);
    const colors = new Float32Array(TOTAL * 3);
    const sizes = new Float32Array(TOTAL);
    const phases = new Float32Array(TOTAL);
    const speeds = new Float32Array(TOTAL);
    const color = new THREE.Color();

    const push = (i: number, x: number, y: number, z: number, bright: number, size: number) => {
      // Cool-to-warm low-saturation stars (mostly white).
      const hue = 0.55 + (rng() - 0.5) * 0.22;
      color.setHSL(hue, 0.35 * rng(), 0.7 + rng() * 0.25).convertSRGBToLinear();
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      colors[i * 3] = color.r * bright;
      colors[i * 3 + 1] = color.g * bright;
      colors[i * 3 + 2] = color.b * bright;
      sizes[i] = size;
      phases[i] = rng() * Math.PI * 2;
      speeds[i] = 0.4 + rng() * 1.4;
    };

    for (let i = 0; i < WALL; i += 1) {
      const a = rng() * Math.PI * 2;
      const rr = radius * (0.97 + rng() * 0.03); // thin shell glued to the wall
      const y = yMid + (rng() - 0.5) * height;
      const giant = rng() < 0.04;
      push(i, rr * Math.sin(a), y, rr * Math.cos(a), giant ? 1.5 + rng() : 0.35 + rng() * 0.75, giant ? 2.8 + rng() * 1.6 : 0.9 + rng() * 1.1);
    }
    for (let i = 0; i < NEAR; i += 1) {
      const a = rng() * Math.PI * 2;
      const rr = radius * (0.7 + rng() * 0.22);
      const y = yMid + (rng() - 0.5) * height * 0.95;
      push(WALL + i, rr * Math.sin(a), y, rr * Math.cos(a), 0.16 + rng() * 0.34, 0.7 + rng() * 0.7);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

    const pointsMaterial = new THREE.ShaderMaterial({
      vertexShader: WALL_VERT,
      fragmentShader: WALL_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1.75 },
        // Fade scales with the tube, so the far wall always dissolves into the
        // dark at the same proportion no matter how big the cylinder grows.
        uFadeNear: { value: radius * 2.0 },
        uFadeFar: { value: radius * 4.6 },
      },
    });

    const stars = new THREE.Points(geo, pointsMaterial);
    stars.renderOrder = -3;
    stars.frustumCulled = false;
    out.push(stars);

    return { objects: out, pointsMaterial };
  }, [yTop, yBottom, radius]);

  const elapsed = useElapsedRef();
  useFrame(({ gl }) => {
    pointsMaterial.uniforms.uTime.value = elapsed.current;
    pointsMaterial.uniforms.uPixelRatio.value = gl.getPixelRatio();
  });

  return (
    <>
      {objects.map((obj, i) => (
        <primitive key={i} object={obj} />
      ))}
    </>
  );
}

/** The age rings that mark the cosmic ages along the spindle's height. */
function AgeRings({
  ages,
  radius,
}: {
  ages: { y: number; label: string }[];
  radius: number;
}) {
  const ringObjs = useMemo(() => {
    return ages.map(({ y }) => {
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 72; k += 1) {
        const a = (k * Math.PI * 2) / 72;
        pts.push(new THREE.Vector3(radius * 1.05 * Math.sin(a), y, radius * 1.05 * Math.cos(a)));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 });
      return new THREE.Line(geo, mat);
    });
  }, [ages, radius]);

  return (
    <>
      {ringObjs.map((obj, i) => (
        <primitive key={i} object={obj} />
      ))}
      {ages.map((age) => (
        <Html
          key={age.label}
          position={[0, age.y, 0]}
          center
          distanceFactor={48}
          className="pointer-events-none select-none"
          zIndexRange={[5, 0]}
        >
          <div className="whitespace-nowrap font-display text-[10px] uppercase tracking-[0.26em] text-aether-faint">
            {age.label}
          </div>
        </Html>
      ))}
    </>
  );
}

/** Floating name labels — always-on for saga roots, plus the hovered story. */
function SpindleLabels({
  nodes,
  hoveredId,
  selectedId,
  lens,
}: {
  nodes: SpindleNode[];
  hoveredId: string | null;
  selectedId: string | null;
  lens: ReturnType<typeof useGalaxyStore.getState>['lens'];
}) {
  return (
    <>
      {nodes.map((node) => {
        const isRoot = node.isSagaRoot;
        const hovered = hoveredId === node.id;
        if (!isRoot && !hovered) return null;
        if (selectedId === node.id) return null;
        const attested = isStoryAttested(node, lens);
        return (
          <Html
            key={node.id}
            position={[node.pos[0], node.pos[1] - node.size - 1.1, node.pos[2]]}
            center
            distanceFactor={30}
            className="pointer-events-none select-none"
            zIndexRange={[10, 0]}
          >
            <div
              className="whitespace-nowrap font-display text-[11px] tracking-[0.16em]"
              style={{
                color: hovered ? node.color : attested ? 'rgb(241 245 249 / 0.66)' : 'rgb(241 245 249 / 0.28)',
                textShadow: '0 1px 6px rgba(0,0,0,0.7)',
              }}
            >
              {node.title}
            </div>
          </Html>
        );
      })}
    </>
  );
}

/** The side panel for a selected myth. Anchored to a FIXED top so it never shifts
 *  with content length; the summary clamps behind a Read more, and a long Episodes
 *  list collapses behind a "+N more" toggle (like the galaxy's relation read-more).
 *  Keyed by story id in the parent, so its expand state resets per myth. */
function StoryPanel({
  story,
  episodes,
  onClose,
  onSelectEpisode,
}: {
  story: Story;
  episodes: Story[];
  onClose: () => void;
  onSelectEpisode: (id: string) => void;
}) {
  const [showFullSummary, setShowFullSummary] = useState(false);
  const [showAllEpisodes, setShowAllEpisodes] = useState(false);
  const EP_LIMIT = 8;
  const summaryLong = story.summary.text.length > 240;
  const shownEpisodes = showAllEpisodes ? episodes : episodes.slice(0, EP_LIMIT);

  return (
    <aside className="fixed right-4 top-24 z-40 flex max-h-[calc(100vh-7.5rem)] w-[350px] max-w-[calc(100%-32px)] flex-col rounded-2xl border border-glass-border bg-glass-heavy p-6 shadow-[var(--shadow-panel-lg)] backdrop-blur-2xl sm:right-6">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full border border-glass-border bg-glass px-2.5 py-0.5 font-display text-[11px] text-aether-muted transition-colors hover:text-aether"
      >
        ✕
      </button>
      <span
        className="inline-flex w-fit items-center gap-2 rounded-full border px-2.5 py-1 font-display text-[10px] uppercase tracking-[0.16em]"
        style={{
          color: KIND_COLOR[story.kind],
          borderColor: `${KIND_COLOR[story.kind]}66`,
          background: `${KIND_COLOR[story.kind]}1a`,
        }}
      >
        <i className="h-1.5 w-1.5 rounded-full" style={{ background: KIND_COLOR[story.kind] }} />
        {KIND_LABEL[story.kind]}
      </span>
      <h2 className="mt-3 font-display text-2xl tracking-[0.08em] text-aether">{story.title}</h2>
      {story.greekTitle && (
        <p className="font-body text-base italic text-aether-muted">{story.greekTitle}</p>
      )}

      {/* Scrollable body so the fixed panel never overflows the screen. */}
      <div className="mt-3.5 min-h-0 flex-1 overflow-y-auto pr-1">
        <p
          className={`font-body text-[15px] leading-relaxed text-aether/90 ${
            summaryLong && !showFullSummary ? 'line-clamp-6' : ''
          }`}
        >
          {story.summary.text}
        </p>
        {summaryLong && (
          <button
            type="button"
            onClick={() => setShowFullSummary((v) => !v)}
            className="mt-1 font-display text-[10px] uppercase tracking-[0.16em] text-nebula-soft transition-colors hover:text-aether"
          >
            {showFullSummary ? 'Read less' : 'Read more'}
          </button>
        )}

        {episodes.length > 0 && (
          <>
            <p className="mt-4 font-display text-[10px] uppercase tracking-[0.2em] text-aether-faint">
              Episodes
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {shownEpisodes.map((ep) => (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => onSelectEpisode(ep.id)}
                  className="rounded-full border border-glass-border bg-glass px-2.5 py-1 font-body text-[13px] text-aether/85 transition-colors hover:border-nebula-soft/50 hover:text-aether"
                >
                  {ep.title}
                </button>
              ))}
              {episodes.length > EP_LIMIT && (
                <button
                  type="button"
                  onClick={() => setShowAllEpisodes((v) => !v)}
                  className="rounded-full border border-border-accent bg-nebula-violet/15 px-2.5 py-1 font-display text-[11px] uppercase tracking-[0.12em] text-nebula-soft transition-colors hover:bg-nebula-violet/25"
                >
                  {showAllEpisodes ? 'Show fewer' : `+${episodes.length - EP_LIMIT} more`}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <Link
        href={`/story/${story.id}`}
        className="mt-5 block w-full shrink-0 rounded-xl border border-border-accent bg-nebula-violet/15 py-3 text-center font-display text-[12px] uppercase tracking-[0.16em] text-nebula-soft transition-colors hover:bg-nebula-violet/25"
      >
        Enter the saga →
      </Link>
    </aside>
  );
}

export function MythsSpindleView({
  stories,
  crossings = [],
  chronology = null,
}: {
  stories: Story[];
  crossings?: StoryCrossing[];
  chronology?: Chronology | null;
}) {
  const lens = useGalaxyStore((s) => s.lens);
  const isMobile = useIsMobile();
  const [highPerf, setHighPerf] = useState(true);
  const dpr = isMobile ? (highPerf ? 1 : 0.75) : highPerf ? 1.75 : 1.5;

  // Real chronographic years drive the spindle's depth (see buildSpindleLayout); the
  // map is per-saga anchored + interpolated, with the timeless divine prologue null.
  const years = useMemo(() => buildChronologyYears(stories, chronology), [stories, chronology]);
  const layout = useMemo(() => buildSpindleLayout(stories, years), [stories, years]);
  const storyById = useMemo(() => new Map(stories.map((s) => [s.id, s])), [stories]);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // The journey opens bound to the origin myth (Chaos), not on an empty overview.
  const [selectedId, setSelectedId] = useState<string | null>(ORIGIN_ID);
  // Where on the selected myth the camera should rest. Clicking a thread sets the
  // exact point clicked (so we land where we clicked, not at the line's start);
  // every other way of selecting leaves it null → the camera aims at the star.
  // Kept valid only for its own id, so changing selection auto-reverts to the star.
  const [focusOverride, setFocusOverride] = useState<{ id: string; pos: Vec3 } | null>(null);
  const select = useCallback((id: string | null, focus?: Vec3) => {
    setSelectedId(id);
    setFocusOverride(id != null && focus ? { id, pos: focus } : null);
  }, []);
  const hitRef = useRef<THREE.InstancedMesh | null>(null);
  // The outer group the rig rolls (about Z) and slides (along Z) to travel.
  const rollRef = useRef<THREE.Group | null>(null);
  // Flag set by the rig while dragging, so a roll-drag never selects a star.
  const draggedRef = useRef(false);
  // Remembers where we last were, so an arrow after Escape resumes from there
  // (the myth we stepped out of) rather than flying all the way back to Chaos.
  const lastSelectedRef = useRef<string>(ORIGIN_ID);
  useEffect(() => {
    if (selectedId) lastSelectedRef.current = selectedId;
  }, [selectedId]);

  const selectedStory = selectedId ? storyById.get(selectedId) ?? null : null;
  const selectedNode = selectedId ? layout.byId.get(selectedId) ?? null : null;
  const originNode = layout.byId.get(ORIGIN_ID) ?? null;
  const episodes = selectedId ? childrenOf(stories, selectedId) : [];
  // The point the rig flies to: the clicked spot on the thread when set for this
  // very selection, otherwise the myth's star.
  const focusPos: Vec3 | null =
    focusOverride && focusOverride.id === selectedId
      ? focusOverride.pos
      : selectedNode
        ? selectedNode.pos
        : null;

  const presentSagas = useMemo(() => {
    const set = new Set<SagaId>();
    for (const node of layout.nodes) set.add(node.sagaId);
    return SAGA_ORDER.filter((id) => set.has(id));
  }, [layout.nodes]);

  // The opening story of each saga (its earliest-era node = the arm's root / first
  // chapter), so clicking a legend entry flies the camera to where that arm begins.
  const firstStoryBySaga = useMemo(() => {
    const m = new Map<SagaId, string>();
    const minEra = new Map<SagaId, number>();
    for (const node of layout.nodes) {
      const cur = minEra.get(node.sagaId);
      if (cur === undefined || node.era < cur) {
        minEra.set(node.sagaId, node.era);
        m.set(node.sagaId, node.id);
      }
    }
    return m;
  }, [layout.nodes]);

  const universeRadius = layout.radius * UNIVERSE_SCALE;

  // ⌘K / Ctrl+K opens the command palette (and Escape closes it) on this page too.
  useAtlasSearchHotkey();

  // Keyboard navigation, a 2-D grid over the tunnel:
  //  · Up/Down = TIME. Walk the current saga limb (nodes sorted by descending Y =
  //    earliest→latest down the tunnel); at the limb's end, hop to the globally
  //    next/previous story in time so a chain never dead-ends.
  //  · Left/Right = ARMS. Roll to the nearest star of another saga arm on that
  //    angular side (clockwise = Right), picked by 3-D proximity right now.
  //  · Escape = step out of the myth and STAY where you are (the rig freezes).
  useEffect(() => {
    const NAV = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape']);
    const onKey = (e: KeyboardEvent) => {
      if (!NAV.has(e.key)) return;
      // While the search palette is up, these keys belong to it.
      if (useGalaxyStore.getState().searchOpen) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

      if (e.key === 'Escape') {
        if (!selectedId) return;
        e.preventDefault();
        select(null); // the rig holds its position; no fly-back to origin
        return;
      }
      e.preventDefault();

      // No selection (stepped out): re-board at the myth we last stood in.
      if (!selectedId) {
        select(lastSelectedRef.current ?? originNode?.id ?? null);
        return;
      }
      const current = layout.byId.get(selectedId);
      if (!current) return;
      // Reference = where we actually ARE: the clicked point on the thread when one
      // is set (focusPos), else the myth's star. So "forward" continues from the
      // click, not from the thread's start.
      const ref = focusPos ?? current.pos;
      const curY = ref[1];

      // Y-EPS: siblings sharing a cross-section (the simultaneous returns) count as
      // the "same moment" — Up/Down steps PAST them in time; Left/Right walks among
      // them. Without this, Up/Down would cycle the same-ring siblings (the bug).
      const Y_EPS = 4;

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const forward = e.key === 'ArrowUp'; // forward = deeper/later in time = lower Y
        // The nearest node in this saga at a CLEARLY different time, in the chosen
        // direction (skips same-cross-section siblings).
        let best: SpindleNode | null = null;
        for (const n of layout.nodes) {
          if (n.id === current.id || n.sagaId !== current.sagaId) continue;
          if (forward ? n.pos[1] >= curY - Y_EPS : n.pos[1] <= curY + Y_EPS) continue;
          if (!best || (forward ? n.pos[1] > best.pos[1] : n.pos[1] < best.pos[1])) best = n;
        }
        // End of this saga's chain — continue to the nearest story ahead/behind in
        // time across every arm, so the journey carries on instead of stopping.
        if (!best) {
          for (const n of layout.nodes) {
            if (n.id === current.id) continue;
            if (forward ? n.pos[1] >= curY - Y_EPS : n.pos[1] <= curY + Y_EPS) continue;
            if (!best || (forward ? n.pos[1] > best.pos[1] : n.pos[1] < best.pos[1])) best = n;
          }
        }
        if (best) select(best.id);
        return;
      }

      // Left/Right: nearest star on the chosen angular side, ANY arm — so a fan of
      // simultaneous siblings (the returns) is walked left/right, and so are
      // neighbouring saga arms.
      const right = e.key === 'ArrowRight';
      const curAngle = Math.atan2(ref[0], ref[2]);
      let best: SpindleNode | null = null;
      let bestDist = Infinity;
      for (const n of layout.nodes) {
        if (n.id === current.id) continue;
        let d = Math.atan2(n.pos[0], n.pos[2]) - curAngle;
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d < -Math.PI) d += 2 * Math.PI;
        if (Math.abs(d) < 1e-3 || d > 0 !== right) continue; // wrong side
        const dx = n.pos[0] - ref[0];
        const dy = n.pos[1] - ref[1];
        const dz = n.pos[2] - ref[2];
        const dist = dx * dx + dy * dy + dz * dz;
        if (dist < bestDist) {
          bestDist = dist;
          best = n;
        }
      }
      if (best) select(best.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, originNode, layout, select, focusPos]);

  return (
    <>
      <div className="fixed inset-0 z-0">
        <Canvas
          dpr={dpr}
          camera={{ position: [0, 4, -40], fov: 60, near: 0.5, far: 12000 }}
          gl={{ antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false }}
          // Click on empty space (missing every star/thread) closes the open panel,
          // just like Escape — but never on a roll-drag release.
          onPointerMissed={() => {
            if (!draggedRef.current && selectedId) select(null);
          }}
        >
          <color attach="background" args={['#06031a']} />
          {/* Depth fog: stars and threads far down the corridor dissolve into the
              same dark as the background, so the tunnel reads as deep 3D space
              instead of a flat scatter. Density is the one knob — higher = the haze
              closes in sooner. The spindle materials opt in via fog:true; the galaxy
              reuses the star shaders but sets no fog, so it stays crisp. */}
          <fogExp2 attach="fog" args={['#06031a', 0.0011]} />
          <PerformanceMonitor onDecline={() => setHighPerf(false)} onIncline={() => setHighPerf(true)} />
          {/* The roll group: the rig spins it about its axis and slides it along
              to roll the chosen star down to the marble. Inside, the spindle is
              laid on its side into a horizontal tunnel of time, future ahead. */}
          <group ref={rollRef}>
            <group rotation={[-Math.PI / 2, 0, 0]}>
              <SpindleUniverse yTop={layout.yTop} yBottom={layout.yBottom} radius={universeRadius} />
              <AgeRings ages={layout.ages} radius={layout.radius} />
              <SpindleLines
                nodes={layout.nodes}
                lens={lens}
                hoveredId={hoveredId}
                selectedId={selectedId}
                onHover={setHoveredId}
                onSelect={select}
              />
              <SpindleCrossings
                crossings={crossings}
                byId={layout.byId}
                radius={layout.radius}
                lens={lens}
                hoveredId={hoveredId}
                selectedId={selectedId}
              />
              <SpindleStars
                nodes={layout.nodes}
                lens={lens}
                hoveredId={hoveredId}
                selectedId={selectedId}
                onHover={setHoveredId}
                onSelect={select}
                hitRef={hitRef}
                draggedRef={draggedRef}
              />
              <SpindleLabels nodes={layout.nodes} hoveredId={hoveredId} selectedId={selectedId} lens={lens} />
            </group>
          </group>
          <SpindleRig
            rollRef={rollRef}
            selectedPos={focusPos}
            originPos={originNode ? originNode.pos : null}
            radius={layout.radius}
            draggedRef={draggedRef}
          />
          {isMobile ? (
            <EffectComposer key="m" multisampling={0}>
              <Bloom mipmapBlur resolutionScale={0.5} intensity={0.7} luminanceThreshold={0.32} luminanceSmoothing={0.3} radius={0.7} />
              <Vignette eskil={false} offset={0.15} darkness={0.55} />
            </EffectComposer>
          ) : (
            <EffectComposer key="d" multisampling={4}>
              <Bloom mipmapBlur resolutionScale={0.5} intensity={0.7} luminanceThreshold={0.32} luminanceSmoothing={0.3} radius={0.7} />
              <Vignette eskil={false} offset={0.15} darkness={0.55} />
              <Noise premultiply={false} blendFunction={BlendFunction.SCREEN} opacity={0.018} />
            </EffectComposer>
          )}
        </Canvas>
      </div>

      {/* Title */}
      <div className="pointer-events-none fixed left-0 right-0 top-[84px] z-20 text-center">
        <h1 className="font-display text-sm tracking-[0.28em] text-aether [text-shadow:0_0_30px_rgba(192,132,252,.4)] sm:text-base">
          THE SPINDLE OF TIME
        </h1>
        <p className="mt-1 font-body text-[12px] italic text-aether-muted sm:text-[13px]">
          Νῆμα τοῦ Χρόνου — the myths wound on the spindle of mythic time
        </p>
      </div>

      {/* Legend — click an arm to fly to where it begins */}
      <div className="pointer-events-none fixed bottom-16 left-4 z-20 hidden flex-col gap-1.5 sm:flex">
        {presentSagas.map((id) => {
          const target = firstStoryBySaga.get(id);
          const active = selectedNode?.sagaId === id;
          return (
            <button
              key={id}
              type="button"
              disabled={!target}
              onClick={() => target && select(target)}
              title={`Fly to ${SAGA_LABEL[id]}`}
              className="group pointer-events-auto flex items-center gap-2 text-left disabled:cursor-default"
            >
              <i
                className="h-2 w-2 rounded-full transition-transform duration-200 group-hover:scale-150"
                style={{ background: SAGA_ACCENT[id], boxShadow: `0 0 8px ${SAGA_ACCENT[id]}` }}
              />
              <span
                className={`font-display text-[10px] uppercase tracking-[0.2em] transition-colors group-hover:text-aether ${
                  active ? '' : 'text-aether-faint'
                }`}
                style={active ? { color: SAGA_ACCENT[id] } : undefined}
              >
                {SAGA_LABEL[id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Hint */}
      <div className="pointer-events-none fixed bottom-5 left-0 right-0 z-20 text-center font-display text-[10px] uppercase tracking-[0.24em] text-aether-faint">
        ↑↓ travel through time · ←→ cross to the next arm · Esc to step out · drag &amp; scroll to roam
      </div>

      {/* Saga / story panel */}
      {selectedStory && selectedNode && (
        <StoryPanel
          key={selectedStory.id}
          story={selectedStory}
          episodes={episodes}
          onClose={() => select(null)}
          onSelectEpisode={select}
        />
      )}

      <StorySearchOverlay stories={stories} nodeById={layout.byId} onSelect={select} />
    </>
  );
}
