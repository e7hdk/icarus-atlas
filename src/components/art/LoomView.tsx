'use client';

import { Canvas } from '@react-three/fiber';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useAtlasSearchHotkey } from '@/components/hud/useAtlasSearchHotkey';
import { decodeDoor, MEDIA, MEDIUM_LABEL, type LoomDoor, type LoomWork } from '@/features/art/door';
import { LoomCamera } from '@/features/art/loomCamera';
import { useLoomStore } from '@/features/art/store';
import { useGalaxyStore } from '@/features/galaxy/store';
import { useIsMobile } from '@/lib/useIsMobile';
import type { LoomDoorData } from '@/types/art';
import { LoomHires } from './LoomHires';
import { LoomLabels } from './LoomLabels';
import { LoomScene } from './LoomScene';
import { paintSky } from './loomTextures';
import { WorkHoverCard } from './WorkHoverCard';
import { WorkPlate } from './WorkPlate';
import { WorkSearchOverlay } from './WorkSearchOverlay';

const REVEAL_KEY = 'loom-woven';
/** The cloth flies in first; the plate opens on arrival. */
const PLATE_DELAY_MS = 420;
const FLY_SCALE = 380;
const DRAG_SLOP = 4;
/** Past this zoom the title and the rail step aside. */
const QUIET_ZOOM = 1.9;

/** Arrow keys walk the cloth one work at a time. */
const WALK: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** The next work along a line of cells, across the holes in the tear. */
function stepFrom(door: LoomDoor, work: LoomWork, [dx, dy]: [number, number]): LoomWork {
  const { width, height } = door.layout;
  let x = work.x + (dx > 0 ? work.w : dx < 0 ? -1 : 0);
  let row = work.row + (dy > 0 ? work.h : dy < 0 ? -1 : 0);
  for (; x >= 0 && x < width && row >= 0 && row < height; x += dx, row += dy) {
    const index = door.cellOf[row * width + x];
    if (index >= 0) return door.works[index];
  }
  return work;
}

const noSubscription = () => () => {};
let webGlSupport: boolean | null = null;
const hasWebGl = () => (webGlSupport ??= Boolean(document.createElement('canvas').getContext('webgl2')));

function LoomSky() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      paintSky(element, element.clientWidth, element.clientHeight, Math.min(window.devicePixelRatio || 1, 2));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full" />;
}

function MediumRail() {
  const medium = useLoomStore((state) => state.medium);
  const setMedium = useLoomStore((state) => state.setMedium);
  return (
    <aside className="absolute right-[26px] top-[84px] z-10 w-44 transition-opacity duration-300 group-data-[view=quiet]/loom:pointer-events-none group-data-[view=quiet]/loom:opacity-0 max-[1080px]:hidden">
      <h2 className="mb-[7px] font-display text-[10px] font-normal tracking-[0.28em] text-aether-faint">MEDIUM</h2>
      {MEDIA.map((id) => (
        <button
          key={id}
          type="button"
          aria-pressed={medium === id}
          onClick={() => setMedium(medium === id ? null : id)}
          className={`relative block w-full py-[3px] pl-[15px] text-left font-body text-base leading-tight transition-colors hover:text-aether ${
            medium === id ? 'text-star-olympian' : 'text-aether-muted'
          }`}
        >
          <i
            className={`absolute left-px top-[11px] h-[5px] w-[5px] rounded-full ${
              medium === id ? 'bg-star-olympian shadow-[0_0_8px_2px_rgba(252,211,77,.5)]' : 'ring-1 ring-inset ring-white/20'
            }`}
          />
          {MEDIUM_LABEL[id]}
        </button>
      ))}
    </aside>
  );
}

function LoomTitle() {
  return (
    <section className="absolute bottom-[22px] left-7 z-10 w-[186px] transition-opacity duration-300 group-data-[view=quiet]/loom:pointer-events-none group-data-[view=quiet]/loom:opacity-0 max-[1080px]:hidden">
      <h1 className="font-display text-[25px] font-normal tracking-[0.14em] text-aether">The Loom</h1>
      <p className="mt-[9px] font-body text-[15px] leading-[1.32] text-aether-muted">
        Every image of the myths the atlas holds, woven into one cloth.
      </p>
      <div className="mt-[13px] grid grid-cols-[16px_1fr] gap-x-1.5 gap-y-[3px] font-body text-[13.5px] text-aether-faint">
        <b className="font-display text-[11px] font-normal leading-[19px] text-star-olympian">→</b>
        <span>the order of the myths</span>
        <b className="font-display text-[11px] font-normal leading-[19px] text-star-olympian">↓</b>
        <span>the order of the hands</span>
      </div>
      <p className="group/foot relative mt-[15px] font-body text-[14.5px] italic leading-[1.3] text-aether-faint">
        <span className="absolute bottom-full left-0 mb-2 hidden whitespace-nowrap rounded-lg border border-glass-border bg-glass-heavy px-[11px] py-[7px] not-italic text-aether backdrop-blur-xl group-hover/foot:block">
          Ovid, Metamorphoses 6.129–131
        </span>
        Arachne wove the crimes of heaven, and Athena tore the cloth.
        <sup className="cursor-help not-italic text-star-olympian">1</sup> Everything here is the mending.
      </p>
      <Link href="/art/list" className="sr-only focus-visible:not-sr-only focus-visible:mt-3 focus-visible:block focus-visible:font-body focus-visible:text-aether">
        Every work, as a plain list
      </Link>
    </section>
  );
}

/** The Art door (docs/LOOM_PLAN.md): the cloth, and the 2D layers that follow it. The
 *  plate's state lives in the URL, so a work has an address and Back closes it. */
export function LoomView() {
  useAtlasSearchHotkey();
  const webGl = useSyncExternalStore(noSubscription, hasWebGl, () => true);
  const phone = useIsMobile();
  const pathname = usePathname();
  const [data, setData] = useState<LoomDoorData | null>(null);
  const [failed, setFailed] = useState(false);
  const [announced, setAnnounced] = useState('');
  const [rig] = useState(() => new LoomCamera());
  const [reveal] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.location.pathname === '/art' &&
      !window.sessionStorage.getItem(REVEAL_KEY) &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const door = useMemo(() => (data ? decodeDoor(data, phone) : null), [data, phone]);

  const root = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const listeners = useRef(new Set<() => void>());
  const drag = useRef<{ x: number; y: number; fromX: number; fromY: number; moved: number } | null>(null);
  const pushedPlate = useRef(false);
  const flight = useRef<number | undefined>(undefined);
  const plateReturn = useRef<{ x: number; y: number; s: number } | null>(null);
  const origin = useRef({ left: 0, top: 0 });
  const shownView = useRef('');
  const walked = useRef<LoomWork | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/art/loom.json')
      .then((response) => response.json() as Promise<LoomDoorData>)
      .then((loaded) => {
        if (!cancelled) setData(loaded);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    try {
      window.sessionStorage.setItem(REVEAL_KEY, '1');
    } catch {
      // Without storage the cloth simply falls again on the next visit.
    }
    return () => {
      cancelled = true;
    };
  }, []);

  // The door's own box, not the window: the page keeps a scrollbar gutter on both
  // edges wherever scrollbars take up room.
  useEffect(() => {
    const element = root.current;
    if (!door || !element) return;
    const fit = (snap: boolean) => {
      const { left, top, width, height } = element.getBoundingClientRect();
      origin.current = { left, top };
      rig.fit(door.layout, width, height, snap);
    };
    fit(true);
    const observer = new ResizeObserver(() => fit(false));
    observer.observe(element);
    return () => observer.disconnect();
  }, [door, rig]);

  const subscribe = useCallback((listener: () => void) => {
    const all = listeners.current;
    all.add(listener);
    return () => {
      all.delete(listener);
    };
  }, []);

  const onFrame = useCallback(() => {
    for (const listener of listeners.current) listener();
    const view = rig.s > rig.home.s * QUIET_ZOOM ? 'quiet' : 'open';
    if (view === shownView.current) return;
    shownView.current = view;
    root.current?.setAttribute('data-view', view);
  }, [rig]);

  const plateWork = useMemo(() => {
    if (!door || !pathname.startsWith('/art/')) return null;
    return door.byId.get(decodeURIComponent(pathname.slice('/art/'.length))) ?? null;
  }, [door, pathname]);

  // However the plate closes, Back included, the cloth returns to where it was left.
  const plateOpen = plateWork !== null;
  useEffect(() => {
    if (plateOpen || !plateReturn.current) return;
    const { x, y, s } = plateReturn.current;
    plateReturn.current = null;
    rig.flyTo(x, y, s);
    surface.current?.focus({ preventScroll: true });
  }, [plateOpen, rig]);

  useEffect(
    () => () => {
      window.clearTimeout(flight.current);
      useLoomStore.getState().setHover(null);
      useLoomStore.getState().setPeekSaga(null);
    },
    [],
  );

  const openPlate = useCallback(
    (work: LoomWork) => {
      useLoomStore.getState().setHover(null);
      plateReturn.current ??= { ...rig.goal };
      rig.flyTo(work.x + work.w / 2, work.row + work.h / 2, Math.min((window.innerHeight * 0.62) / Math.max(work.w, work.h), FLY_SCALE));
      window.clearTimeout(flight.current);
      flight.current = window.setTimeout(() => {
        // From an open plate (a search hit) the new work takes the old one's place.
        const fromCloth = window.location.pathname === '/art';
        if (fromCloth) pushedPlate.current = true;
        window.history[fromCloth ? 'pushState' : 'replaceState'](null, '', `/art/${work.id}`);
      }, PLATE_DELAY_MS);
    },
    [rig],
  );

  const closePlate = useCallback(() => {
    if (pushedPlate.current) {
      pushedPlate.current = false;
      window.history.back();
    } else {
      window.history.replaceState(null, '', '/art');
    }
  }, []);

  const stepPlate = useCallback(
    (step: number) => {
      if (!door || !plateWork) return;
      const ordered = [...door.works].sort((a, b) => a.sortYear - b.sortYear || a.index - b.index);
      const at = ordered.findIndex((work) => work.index === plateWork.index);
      const next = ordered[(at + step + ordered.length) % ordered.length];
      window.history.replaceState(null, '', `/art/${next.id}`);
    },
    [door, plateWork],
  );

  const workAt = useCallback(
    (screenX: number, screenY: number): LoomWork | null => {
      if (!door) return null;
      const [x, y] = rig.toCell(screenX - origin.current.left, screenY - origin.current.top);
      const { width, height } = door.layout;
      if (x < 0 || y < 0 || x >= width || y >= height) return null;
      const index = door.cellOf[Math.floor(y) * width + Math.floor(x)];
      return index >= 0 ? door.works[index] : null;
    },
    [door, rig],
  );

  const walk = (event: React.KeyboardEvent) => {
    if (!door) return;
    if (event.key === 'Enter' && walked.current) openPlate(walked.current);
    const step = WALK[event.key];
    if (!step) return;
    event.preventDefault();
    const from = walked.current ?? workAt(origin.current.left + rig.viewWidth / 2, origin.current.top + rig.viewHeight / 2) ?? door.works[0];
    const next = walked.current ? stepFrom(door, from, step) : from;
    walked.current = next;
    setAnnounced(`${next.title}, ${next.artist}, ${next.year}`);
    const [x, y] = rig.toScreen(next.x + next.w / 2, next.row + next.h / 2);
    const inView = x > 80 && x < rig.viewWidth - 80 && y > 90 && y < rig.viewHeight - 80;
    if (!inView) rig.panTo(next.x + next.w / 2, next.row + next.h / 2);
    useLoomStore.getState().setHover({ index: next.index, x: x + origin.current.left, y: y + origin.current.top });
  };

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      pointer.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      };
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (useGalaxyStore.getState().searchOpen || useGalaxyStore.getState().settingsOpen) return;
      if (window.location.pathname === '/art') rig.goHome();
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [rig]);

  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      useLoomStore.getState().setHover(null);
      const factor = Math.exp(-event.deltaY * 0.0017 * (event.ctrlKey ? 3.2 : 1));
      rig.zoomAt(factor, event.clientX - origin.current.left, event.clientY - origin.current.top);
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [rig, door]);

  if (!webGl || failed) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center font-body text-lg text-aether-muted">
        <p>
          {failed ? 'The Loom could not be loaded.' : 'The Loom needs WebGL 2.'} The same works are listed on{' '}
          <Link href="/art/list" className="text-star-olympian underline underline-offset-4">
            a plain page
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div ref={root} className="group/loom absolute inset-0 bg-cosmos-deep">
      <LoomSky />
      <div
        ref={surface}
        role="application"
        tabIndex={0}
        aria-label="The cloth. Arrow keys walk the works, Enter opens one."
        className="absolute inset-0 cursor-grab touch-none focus:outline-none"
        onKeyDown={walk}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { x: event.clientX, y: event.clientY, fromX: rig.goal.x, fromY: rig.goal.y, moved: 0 };
          useLoomStore.getState().setHover(null);
        }}
        onPointerMove={(event) => {
          const held = drag.current;
          if (held) {
            const dx = event.clientX - held.x;
            const dy = event.clientY - held.y;
            held.moved = Math.max(held.moved, Math.hypot(dx, dy));
            if (held.moved > DRAG_SLOP) event.currentTarget.style.cursor = 'grabbing';
            rig.panTo(held.fromX - dx / rig.s, held.fromY - dy / rig.s);
            return;
          }
          const work = workAt(event.clientX, event.clientY);
          walked.current = null;
          event.currentTarget.style.cursor = work ? 'pointer' : 'grab';
          useLoomStore.getState().setHover(work ? { index: work.index, x: event.clientX, y: event.clientY } : null);
        }}
        onPointerLeave={() => useLoomStore.getState().setHover(null)}
        onPointerUp={(event) => {
          const clicked = drag.current !== null && drag.current.moved <= DRAG_SLOP;
          drag.current = null;
          event.currentTarget.style.cursor = 'grab';
          if (!clicked) return;
          const work = workAt(event.clientX, event.clientY);
          if (work) openPlate(work);
        }}
        onDoubleClick={() => rig.goHome()}
      >
        {door && (
          <Canvas flat gl={{ antialias: true, alpha: true }} dpr={[1, 2]} frameloop={plateOpen ? 'never' : 'always'}>
            <LoomScene door={door} rig={rig} pointer={pointer} phone={phone} reveal={reveal} onFrame={onFrame} />
          </Canvas>
        )}
      </div>
      {door && (
        <>
          <LoomHires door={door} rig={rig} subscribe={subscribe} />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cosmos-deep/90 to-transparent opacity-0 transition-opacity duration-300 group-data-[view=quiet]/loom:opacity-100"
          />
          <LoomLabels door={door} rig={rig} subscribe={subscribe} />
          <LoomTitle />
          <MediumRail />
          <WorkHoverCard door={door} />
          {plateWork && <WorkPlate work={plateWork} onClose={closePlate} onStep={stepPlate} />}
          <WorkSearchOverlay door={door} onSelect={openPlate} />
          <p className="sr-only" aria-live="polite">
            {announced}
          </p>
        </>
      )}
    </div>
  );
}
