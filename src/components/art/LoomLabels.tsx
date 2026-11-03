'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { LoomDoor } from '@/features/art/door';
import { FRINGE_ROWS, NARROW_WIDTH, type LoomCamera } from '@/features/art/loomCamera';
import { useLoomStore } from '@/features/art/store';
import { SAGA_ACCENT, SAGA_ORDER, type SagaId } from '@/features/stories/sagas';
import { weightPositions } from './LoomScene';

/** Zoomed in, the rail sits on the images: each label takes a chip of night. */
const ERA_ON_IMAGES =
  'group-data-[view=quiet]/loom:rounded-full group-data-[view=quiet]/loom:bg-cosmos-deep/65 group-data-[view=quiet]/loom:px-[9px] group-data-[view=quiet]/loom:pb-[3px] group-data-[view=quiet]/loom:pt-0.5 group-data-[view=quiet]/loom:text-aether-muted group-data-[view=quiet]/loom:backdrop-blur-[8px]';

export const WEIGHT_LABEL: Record<SagaId, string> = {
  primordial: 'Primordials',
  titan: 'Titans',
  olympian: 'Olympians',
  metamorphoses: 'Ovid',
  theban: 'Thebes',
  dionysus: 'Dionysus',
  perseus: 'Perseus',
  argonaut: 'Argo',
  heracles: 'Heracles',
  theseus: 'Theseus',
  trojan: 'Troy',
  returns: 'Returns',
  heroic: 'Other tales',
};

/** Where the era being read is pinned on a scrolling cloth: under the bar, at the left. */
const PINNED_ERA = { x: 12, y: 62 };

/** The two things pinned to the cloth from outside it: the era rail, which sticks to
 *  the screen's edge as you zoom, and the clay weights, one saga each. On a phone the
 *  rail becomes the one era being read, and the weights hang unlabelled at the warp's
 *  end while a chip strip does their work. */
export function LoomLabels({
  door,
  rig,
  subscribe,
}: {
  door: LoomDoor;
  rig: LoomCamera;
  subscribe: (listener: () => void) => () => void;
}) {
  const eras = useRef<(HTMLDivElement | null)[]>([]);
  const weights = useRef<(HTMLButtonElement | null)[]>([]);
  const saga = useLoomStore((state) => state.saga);
  const setSaga = useLoomStore((state) => state.setSaga);
  const setPeekSaga = useLoomStore((state) => state.setPeekSaga);

  const counts = useMemo(() => {
    const tally = new Map<SagaId, number>();
    for (const work of door.works) tally.set(work.saga, (tally.get(work.saga) ?? 0) + 1);
    return tally;
  }, [door]);

  // Two eras can start on one row (1400s and 1500s): nudge so they stack.
  const eraRows = useMemo(() => {
    const rows = door.layout.eras.map((era) =>
      era.row === door.layout.tearTop ? door.layout.tearTop + door.layout.tearRows / 2 : era.row,
    );
    for (let i = 1; i < rows.length; i++) if (rows[i] <= rows[i - 1] + 1) rows[i] = rows[i - 1] + 1.15;
    return rows;
  }, [door]);

  useEffect(() => {
    const { width, height } = door.layout;
    const positions = weightPositions(width);
    const widths: number[] = [];
    return subscribe(() => {
      const zoomed = rig.s > rig.home.s * 1.4;
      // Mid-turn the cloth is edge-on and its labels would float free of it.
      const square = Math.min(1, Math.max(0, (Math.abs(Math.cos(rig.yaw)) - 0.55) / 0.3));
      const held = useLoomStore.getState().focus !== null;
      const pinned = rig.scrolling;
      const nowY = pinned ? PINNED_ERA.y + 40 : rig.viewHeight / 2;
      let current = -1;
      let best = Infinity;
      eras.current.forEach((element, index) => {
        if (!element) return;
        const [ax, ay] = rig.toScreen(0, eraRows[index]);
        const [bx, by] = rig.toScreen(width, eraRows[index]);
        const left = ax < bx ? ax : bx;
        const y = ax < bx ? ay : by;
        if (y <= nowY && nowY - y < best) {
          best = nowY - y;
          current = index;
        }
        if (pinned) return;
        widths[index] ??= element.offsetWidth;
        element.style.transform = `translate(${Math.max(left - 14 - widths[index], 10)}px, ${y - 8}px)`;
        const hidden = rig.viewWidth <= NARROW_WIDTH || (zoomed && (y < 66 || y > rig.viewHeight - 8));
        element.style.opacity = hidden ? '0' : String(square);
      });
      if (pinned) {
        const read = Math.max(0, current);
        eras.current.forEach((element, index) => {
          if (!element) return;
          element.toggleAttribute('data-pinned', true);
          element.style.transform = `translate(${PINNED_ERA.x}px, ${PINNED_ERA.y}px)`;
          element.style.opacity = index === read && !held ? String(square) : '0';
        });
      }
      eras.current.forEach((element, index) => element?.toggleAttribute('data-now', zoomed && index === current));
      weights.current.forEach((element, index) => {
        if (!element) return;
        const [x, y] = rig.toScreen(positions[index], height + FRINGE_ROWS);
        const scale = Math.min(1.2, Math.max(0.82, rig.s / 15.5));
        element.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        element.style.visibility = y > rig.viewHeight + 10 ? 'hidden' : 'visible';
        element.style.opacity = String(square * (held ? 0.45 : 1));
      });
    });
  }, [door, rig, subscribe, eraRows]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-500 group-data-[view]/loom:opacity-100">
      {door.layout.eras.map((era, index) => (
        <div
          key={era.label}
          ref={(element) => {
            eras.current[index] = element;
          }}
          className={`group/era absolute left-0 top-0 flex items-baseline gap-[7px] whitespace-nowrap font-body text-[12.5px] transition-colors will-change-transform data-[now]:text-aether! data-[pinned]:rounded-full data-[pinned]:bg-cosmos-deep/75 data-[pinned]:px-[9px] data-[pinned]:pb-[3px] data-[pinned]:pt-0.5 data-[pinned]:backdrop-blur-[8px] ${ERA_ON_IMAGES} ${
            era.row === door.layout.tearTop ? 'text-star-olympian/75' : 'text-aether-faint'
          }`}
        >
          <b
            className={`font-display text-[10.5px] font-normal tracking-[0.14em] ${
              era.row === door.layout.tearTop ? 'text-star-olympian' : ''
            }`}
          >
            {era.label.toUpperCase()}
          </b>
          {era.sub && <i className="text-xs opacity-80">{era.sub}</i>}
          <span className="h-px w-3 self-center bg-current opacity-50 group-data-[pinned]/era:hidden group-data-[view=quiet]/loom:hidden" aria-hidden />
        </div>
      ))}
      {SAGA_ORDER.map((id, index) => (
        <button
          key={id}
          type="button"
          ref={(element) => {
            weights.current[index] = element;
          }}
          aria-label={`${WEIGHT_LABEL[id]}, ${counts.get(id) ?? 0} works`}
          aria-pressed={saga === id}
          onPointerEnter={() => setPeekSaga(id)}
          onPointerLeave={() => setPeekSaga(null)}
          onClick={() => setSaga(saga === id ? null : id)}
          className="group/weight pointer-events-auto absolute left-0 top-0 -ml-[38px] flex w-[76px] origin-top cursor-pointer flex-col items-center gap-0.5 will-change-transform focus-visible:outline-none"
        >
          <svg
            width="22"
            height="30"
            viewBox="0 0 22 30"
            aria-hidden
            className={`block overflow-visible transition-transform duration-300 ${saga === id ? 'translate-y-[5px]' : 'group-hover/weight:translate-y-0.5'}`}
          >
            <defs>
              <linearGradient id={`clay-${id}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#a86a43" />
                <stop offset="1" stopColor="#3b1c10" />
              </linearGradient>
            </defs>
            <path
              d="M7.4 1.4 h7.2 L19.6 27 Q20 28.6 18.4 28.6 H3.6 Q2 28.6 2.4 27 Z"
              fill={`url(#clay-${id})`}
              stroke={SAGA_ACCENT[id]}
              strokeWidth="1.05"
            />
            <circle cx="11" cy="6.2" r="1.45" fill="#05020f" stroke={SAGA_ACCENT[id]} strokeWidth=".7" />
          </svg>
          <span
            className={`hidden whitespace-nowrap font-body text-sm italic leading-none transition-colors group-hover/weight:text-aether group-focus-visible/weight:text-aether sm:block ${
              saga === id ? 'text-aether' : 'text-aether-muted'
            }`}
          >
            {WEIGHT_LABEL[id]}
          </span>
          <span
            className={`hidden font-display text-[8.5px] tracking-[0.1em] text-aether-faint transition-opacity group-hover/weight:opacity-100 sm:block ${
              saga === id ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {counts.get(id) ?? 0}
          </span>
        </button>
      ))}
    </div>
  );
}
