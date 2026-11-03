'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { workImageUrl, type LoomDoor } from '@/features/art/door';
import type { LoomCamera } from '@/features/art/loomCamera';
import type { LoomWeb } from '@/features/art/loomWeb';
import { useLoomStore } from '@/features/art/store';

const FOCUS_IMAGE = 500;
const NEIGHBOUR_IMAGE = 250;

const LIFTED_CLASS =
  'pointer-events-auto absolute left-0 top-0 cursor-pointer bg-[#0b0718] will-change-transform shadow-[0_0_0_1.5px_rgba(252,211,77,.72),0_14px_38px_rgba(5,2,15,.72)] hover:shadow-[0_0_0_2px_#fde68a,0_18px_44px_rgba(5,2,15,.8)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-star-olympian data-[focus=true]:shadow-[0_0_0_2px_#fcd34d,0_0_0_7px_rgba(5,2,15,.82),0_0_0_8px_rgba(252,211,77,.42),0_34px_80px_rgba(0,0,0,.78)]';

interface Shown {
  button: HTMLButtonElement;
  image: HTMLImageElement;
  asked: number;
}

/** The pulled web's works, out of the cloth. DOM images, so they stay crisp at any
 *  size and take ordinary hover and click; each frame projects their 3D point. */
export function LoomLifted({
  door,
  web,
  rig,
  subscribe,
  onPick,
}: {
  door: LoomDoor;
  web: LoomWeb;
  rig: LoomCamera;
  subscribe: (listener: () => void) => () => void;
  /** A lifted work was clicked: the held one opens its plate, a neighbour is pulled. */
  onPick: RefObject<(index: number) => void>;
}) {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shown = new Map<number, Shown>();
    const create = (index: number, container: HTMLDivElement): Shown => {
      const work = door.works[index];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = LIFTED_CLASS;
      button.setAttribute('aria-label', `${work.title}, ${work.artist}, ${work.year}`);
      const image = new Image();
      image.alt = '';
      image.decoding = 'async';
      image.className = 'block h-full w-full object-cover';
      button.append(image);
      button.addEventListener('pointerenter', (event) =>
        useLoomStore.getState().setHover({ index, x: event.clientX, y: event.clientY }),
      );
      button.addEventListener('pointerleave', () => useLoomStore.getState().setHover(null));
      button.addEventListener('click', () => onPick.current(index));
      container.append(button);
      const entry = { button, image, asked: 0 };
      shown.set(index, entry);
      return entry;
    };

    const unsubscribe = subscribe(() => {
      const container = layer.current;
      if (!container) return;
      for (const [index, item] of web.items) {
        const work = door.works[index];
        const entry = shown.get(index) ?? create(index, container);
        const isFocus = index === web.focus;
        const wanted = isFocus ? FOCUS_IMAGE : NEIGHBOUR_IMAGE;
        if (entry.asked < wanted) {
          entry.asked = wanted;
          entry.image.src = workImageUrl(work, wanted);
        }
        entry.button.dataset.focus = String(isFocus);
        const [x, y, scale] = rig.toScreen(
          work.x + work.w / 2 + item.dx * item.k,
          work.row + work.h / 2 + item.dy * item.k,
          item.z * item.k,
        );
        const base = Math.max(work.w, work.h);
        const size = (base + (item.size - base) * item.k) * scale;
        const root = Math.sqrt(Math.min(1.7, Math.max(0.62, work.width / work.height)));
        const width = size * root;
        const height = size / root;
        const style = entry.button.style;
        style.width = `${width}px`;
        style.height = `${height}px`;
        style.transform = `translate(${x - width / 2}px, ${y - height / 2}px)`;
        style.opacity = String(Math.min(1, item.k * 2.4));
        style.zIndex = String(Math.round(item.z * 10));
      }
      for (const [index, entry] of shown) {
        if (web.items.has(index)) continue;
        entry.button.remove();
        shown.delete(index);
      }
    });
    return () => {
      unsubscribe();
      for (const entry of shown.values()) entry.button.remove();
      shown.clear();
    };
  }, [door, web, rig, subscribe, onPick]);

  return <div ref={layer} className="pointer-events-none absolute inset-0 z-[9] overflow-hidden" />;
}
