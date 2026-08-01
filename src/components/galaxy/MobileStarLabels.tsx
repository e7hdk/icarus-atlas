'use client';

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Character } from '@/types/character';
import { IRIDESCENT_BASE_HUE, TYPE_GLOW } from '@/types/character';
import type { Vec3 } from '@/features/galaxy/layout';
import { useGalaxyStore } from '@/features/galaxy/store';
import { STAR_SIZE } from './starLook';

const LABEL_DISTANCE_FACTOR = 28;
const LABEL_FONT_SIZE = 11;
const LABEL_TRACKING = LABEL_FONT_SIZE * 0.22;
const LABEL_MARGIN = 300;
const SHIMMER_SAT = 0.82;
const SHIMMER_LIGHT = 0.62;

interface ProjectedLabel {
  distance: number;
  scale: number;
  x: number;
  y: number;
}

interface PreviousFrame {
  dpr: number;
  fontRevision: number;
  height: number;
  hoveredId: string | null;
  lens: string;
  positions: Map<string, Vec3> | null;
  projection: Float64Array;
  selectedId: string | null;
  stars: Character[] | null;
  view: Float64Array;
  width: number;
}

function copyMatrixIfChanged(source: readonly number[], target: Float64Array): boolean {
  let changed = false;
  for (let index = 0; index < 16; index++) {
    const value = source[index]!;
    if (target[index] !== value) changed = true;
    target[index] = value;
  }
  return changed;
}

/**
 * Mobile-only label renderer. The desktop keeps the original drei Html labels;
 * phones project the same labels into one DOM canvas instead of maintaining a
 * React root, frame callback and store subscriptions for every star.
 */
export function MobileStarLabels({
  canvasRef,
  characters,
  positions,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  characters: Character[];
  positions: Map<string, Vec3>;
}) {
  const hoveredId = useGalaxyStore((state) => state.hoveredId);
  const selectedId = useGalaxyStore((state) => state.selectedId);
  const lens = useGalaxyStore((state) => state.lens);

  const stars = useMemo(
    () => characters.filter((character) => positions.has(character.id)),
    [characters, positions],
  );
  const attested = useMemo(() => {
    const values = new Uint8Array(stars.length);
    for (let index = 0; index < stars.length; index++) {
      const character = stars[index]!;
      values[index] =
        lens === 'consensus' ||
        character.summary.some((entry) => entry.sources.includes(lens)) ||
        character.story.some((entry) => entry.sources.includes(lens))
          ? 1
          : 0;
    }
    return values;
  }, [lens, stars]);
  const hoverColors = useMemo(
    () =>
      stars.map((character) => {
        const hue = IRIDESCENT_BASE_HUE[character.id];
        return hue === undefined
          ? TYPE_GLOW[character.type].color
          : `#${new THREE.Color()
              .setHSL(hue, SHIMMER_SAT, SHIMMER_LIGHT)
              .getHexString()}`;
      }),
    [stars],
  );

  const worldPoint = useMemo(() => new THREE.Vector3(), []);
  const viewPoint = useMemo(() => new THREE.Vector3(), []);
  const projectedPoint = useMemo(() => new THREE.Vector3(), []);
  const projected = useRef<ProjectedLabel[]>([]);
  const visibleIndices = useRef<number[]>([]);
  const fontFamily = useRef('serif');
  const fontRevision = useRef(0);
  const previous = useRef<PreviousFrame>({
    dpr: 0,
    fontRevision: -1,
    height: 0,
    hoveredId: null,
    lens: '',
    positions: null,
    projection: new Float64Array(16),
    selectedId: null,
    stars: null,
    view: new Float64Array(16),
    width: 0,
  });

  useEffect(() => {
    let cancelled = false;
    const refreshFont = () => {
      if (cancelled) return;
      const resolved = getComputedStyle(document.documentElement)
        .getPropertyValue('--font-cinzel')
        .trim();
      fontFamily.current = resolved || 'serif';
      fontRevision.current += 1;
    };
    refreshFont();
    void document.fonts?.ready.then(refreshFont);
    return () => {
      cancelled = true;
    };
  }, []);

  useFrame(({ camera, gl, size }) => {
    const canvas = canvasRef.current;
    if (!canvas || !(camera instanceof THREE.PerspectiveCamera)) return;

    const dpr = Math.min(
      window.devicePixelRatio || 1,
      1.5,
      Math.max(1, gl.getPixelRatio() * 1.25),
    );
    const last = previous.current;
    const viewChanged = copyMatrixIfChanged(camera.matrixWorldInverse.elements, last.view);
    const projectionChanged = copyMatrixIfChanged(
      camera.projectionMatrix.elements,
      last.projection,
    );
    const cameraChanged = viewChanged || projectionChanged;
    const layoutChanged = last.positions !== positions || last.stars !== stars;
    const stateChanged =
      last.hoveredId !== hoveredId ||
      last.selectedId !== selectedId ||
      last.lens !== lens ||
      last.fontRevision !== fontRevision.current;
    const sizeChanged = last.width !== size.width || last.height !== size.height || last.dpr !== dpr;
    if (!cameraChanged && !layoutChanged && !stateChanged && !sizeChanged) return;

    last.width = size.width;
    last.height = size.height;
    last.dpr = dpr;
    last.hoveredId = hoveredId;
    last.selectedId = selectedId;
    last.lens = lens;
    last.fontRevision = fontRevision.current;
    last.positions = positions;
    last.stars = stars;

    const pixelWidth = Math.max(1, Math.round(size.width * dpr));
    const pixelHeight = Math.max(1, Math.round(size.height * dpr));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const context = canvas.getContext('2d');
    if (!context) return;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = `400 ${LABEL_FONT_SIZE}px ${fontFamily.current}, serif`;
    context.letterSpacing = `${LABEL_TRACKING}px`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    const halfWidth = size.width * 0.5;
    const halfHeight = size.height * 0.5;
    const fovScale = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5);
    const pool = projected.current;
    const visible = visibleIndices.current;
    let visibleCount = 0;

    for (let index = 0; index < stars.length; index++) {
      const character = stars[index]!;
      if (character.id === selectedId) continue;
      const position = positions.get(character.id)!;
      worldPoint.set(
        position[0],
        position[1] - STAR_SIZE[character.type] - 1.2,
        position[2],
      );
      viewPoint.copy(worldPoint).applyMatrix4(camera.matrixWorldInverse);
      if (viewPoint.z >= 0) continue;

      projectedPoint.copy(worldPoint).project(camera);
      if (projectedPoint.z < -1 || projectedPoint.z > 1) continue;
      const x = projectedPoint.x * halfWidth + halfWidth;
      const y = -projectedPoint.y * halfHeight + halfHeight;
      if (
        x < -LABEL_MARGIN ||
        x > size.width + LABEL_MARGIN ||
        y < -LABEL_MARGIN ||
        y > size.height + LABEL_MARGIN
      ) {
        continue;
      }

      const entry = pool[index] ?? (pool[index] = { distance: 0, scale: 0, x: 0, y: 0 });
      entry.distance = worldPoint.distanceTo(camera.position);
      entry.scale = LABEL_DISTANCE_FACTOR / (fovScale * entry.distance);
      entry.x = x;
      entry.y = y;
      visible[visibleCount++] = index;
    }

    visible.length = visibleCount;
    visible.sort((a, b) => pool[b]!.distance - pool[a]!.distance);
    for (const index of visible) {
      const character = stars[index]!;
      const entry = pool[index]!;
      context.setTransform(
        dpr * entry.scale,
        0,
        0,
        dpr * entry.scale,
        dpr * entry.x,
        dpr * entry.y,
      );
      if (character.id === hoveredId) {
        context.globalAlpha = 1;
        context.fillStyle = hoverColors[index]!;
      } else {
        context.globalAlpha = attested[index] ? 0.62 : 0.25;
        context.fillStyle = '#f1f5f9';
      }
      context.fillText(character.name.toUpperCase(), 0, 0);
    }
    context.globalAlpha = 1;
    context.setTransform(1, 0, 0, 1, 0, 0);
  }, -0.5);

  return null;
}
