'use client';

import { useEffect, useRef } from 'react';
import { workImageUrl, type LoomDoor, type LoomWork } from '@/features/art/door';
import type { LoomCamera } from '@/features/art/loomCamera';
import { isDimmed, useLoomStore } from '@/features/art/store';

/** Past this many CSS pixels per cell a tile can be read, and the real image takes
 *  over from the woven one. */
const READABLE_SCALE = 58;
const IMAGE_STEPS = [250, 500, 960];
/** How far past its width an image may be stretched before the next one is worth it. */
const STRETCH = 1.2;
/** Commons refuses bursts, so images come a few at a time, nearest the centre first,
 *  and only once the view is still. A tile that leaves first never asks. */
const MAX_LOADING = 8;
/** The tiles nearest the centre that get a real image; the rest stay woven. */
const MAX_TILES = 80;

interface HiresTile {
  work: LoomWork;
  image: HTMLImageElement;
  wanted: number;
  /** The largest size asked of Commons so far. */
  asked: number;
  loading: boolean;
}

/** The reading layer: DOM images laid exactly over the tiles once the cloth lies flat. */
export function LoomHires({
  door,
  rig,
  subscribe,
}: {
  door: LoomDoor;
  rig: LoomCamera;
  subscribe: (listener: () => void) => () => void;
}) {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pool = new Map<number, HiresTile>();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    let loading = 0;
    let queued = false;
    let refiltered = false;

    const fromCentre = (work: LoomWork) => Math.hypot(work.x + work.w / 2 - rig.x, work.row + work.h / 2 - rig.y);

    const drop = (tile: HiresTile) => {
      if (tile.loading) loading--;
      tile.image.onload = null;
      tile.image.onerror = null;
      tile.image.remove();
      pool.delete(tile.work.index);
    };

    const finish = (tile: HiresTile) => {
      tile.loading = false;
      loading--;
      queued = true;
    };

    const add = (work: LoomWork, container: HTMLDivElement): HiresTile => {
      const image = new Image();
      image.alt = '';
      image.decoding = 'async';
      image.className = 'absolute left-0 top-0 origin-top-left object-cover opacity-0 transition-opacity duration-300';
      const tile: HiresTile = { work, image, wanted: 0, asked: 0, loading: false };
      image.onload = () => {
        image.classList.replace('opacity-0', 'opacity-100');
        finish(tile);
      };
      image.onerror = () => finish(tile);
      container.append(image);
      pool.set(work.index, tile);
      return tile;
    };

    const place = (container: HTMLDivElement) => {
      const size = rig.s;
      const [left, top] = rig.toCell(0, 0);
      const [right, bottom] = rig.toCell(rig.viewWidth, rig.viewHeight);
      const filters = useLoomStore.getState();
      const visible = door.works.filter(
        (work) =>
          work.x + work.w >= left && work.x <= right && work.row + work.h >= top && work.row <= bottom && !isDimmed(work, filters),
      );
      visible.sort((a, b) => fromCentre(a) - fromCentre(b));
      const keep = new Set<number>();
      for (const work of visible.slice(0, MAX_TILES)) {
        keep.add(work.index);
        const tile = pool.get(work.index) ?? add(work, container);
        const needed = size * Math.max(work.w, work.h) * pixelRatio;
        tile.wanted = IMAGE_STEPS.find((step) => step * STRETCH >= needed) ?? IMAGE_STEPS[IMAGE_STEPS.length - 1];
        const [x, y] = rig.toScreen(work.x, work.row);
        const gap = Math.max(1, size * 0.012);
        tile.image.style.width = `${work.w * size - gap * 2}px`;
        tile.image.style.height = `${work.h * size - gap * 2}px`;
        tile.image.style.transform = `translate(${x + gap}px, ${y + gap}px)`;
      }
      for (const tile of pool.values()) if (!keep.has(tile.work.index)) drop(tile);
      queued = true;
    };

    const load = () => {
      const waiting = [...pool.values()].filter((tile) => !tile.loading && tile.asked < tile.wanted);
      waiting.sort((a, b) => fromCentre(a.work) - fromCentre(b.work));
      for (const tile of waiting.slice(0, MAX_LOADING - loading)) {
        tile.asked = tile.wanted;
        tile.loading = true;
        loading++;
        tile.image.src = workImageUrl(tile.work, tile.wanted);
      }
    };

    const unsubscribe = subscribe(() => {
      const container = layer.current;
      if (!container) return;
      if (rig.s < READABLE_SCALE) {
        for (const tile of pool.values()) drop(tile);
        return;
      }
      if (rig.moving || refiltered || pool.size === 0) place(container);
      refiltered = false;
      if (queued && !rig.moving) {
        queued = false;
        load();
      }
    });
    const unsubscribeFilters = useLoomStore.subscribe((state, previous) => {
      if (state.hover !== previous.hover) return;
      refiltered = true;
    });
    return () => {
      unsubscribe();
      unsubscribeFilters();
      for (const tile of pool.values()) drop(tile);
    };
  }, [door, rig, subscribe]);

  return <div ref={layer} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" />;
}
