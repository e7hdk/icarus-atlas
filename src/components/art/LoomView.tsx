'use client';

import { Canvas } from '@react-three/fiber';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useAtlasSearchHotkey } from '@/components/hud/useAtlasSearchHotkey';
import { decodeDoor, stopsAt, type LoomDoor, type LoomWork } from '@/features/art/door';
import { ATLAS_FILES } from '@/features/atlas/files';
import { useAtlasFile } from '@/features/atlas/useAtlasFile';
import { LoomCamera, MAX_SCALE, WEB_MAX_SCALE } from '@/features/art/loomCamera';
import { LIFT, LoomWeb } from '@/features/art/loomWeb';
import { useLoomStore } from '@/features/art/store';
import { useGalaxyStore } from '@/features/galaxy/store';
import { MOBILE_TAP_SLOP, useIsMobile } from '@/lib/useIsMobile';
import type { LoomDoorData } from '@/types/art';
import { LoomChips } from './LoomChips';
import { LoomHires } from './LoomHires';
import { LoomLabels } from './LoomLabels';
import { LoomLifted } from './LoomLifted';
import { LoomPatternThread } from './LoomPatternThread';
import { LoomRail } from './LoomRail';
import { LoomSheet } from './LoomSheet';
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
/** Past this many pixels per cell a tile can be read, so a click opens its plate
 *  instead of pulling its web. */
const READ_SCALE = 46;
/** Radians of swing per pixel of drag, while the cloth is turned or a web is held. */
const ORBIT_YAW_PER_PX = 0.0042;
const ORBIT_PITCH_PER_PX = 0.0032;
/** The phone's thread sheet at its peek, as a share of the screen's height. */
const SHEET_PEEK = 0.3;
/** A fling is read from the last this-many milliseconds of a drag. */
const FLING_WINDOW_MS = 100;
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
        <b className="font-display text-[11px] font-normal leading-[19px] text-star-olympian">↗</b>
        <span>pull a work to lift its web</span>
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
  const { data, failed } = useAtlasFile<LoomDoorData>(ATLAS_FILES.loom);
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
  const web = useMemo(
    () => (door ? new LoomWeb(door, phone ? LIFT.phone : LIFT.desktop) : null),
    [door, phone],
  );

  const root = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const listeners = useRef(new Set<() => void>());
  const drag = useRef<{
    x: number;
    y: number;
    fromX: number;
    fromY: number;
    yaw: number;
    pitch: number;
    moved: number;
  } | null>(null);
  /** Every pointer down on the cloth, so two fingers can pinch. */
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; x: number; y: number } | null>(null);
  const trail = useRef<{ t: number; x: number; y: number }[]>([]);
  const pushedPlate = useRef(false);
  const flight = useRef<number | undefined>(undefined);
  const plateReturn = useRef<{ x: number; y: number; s: number } | null>(null);
  const origin = useRef({ left: 0, top: 0 });
  const shownView = useRef('');
  const walked = useRef<LoomWork | null>(null);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(REVEAL_KEY, '1');
    } catch {
      // Without storage the cloth simply falls again on the next visit.
    }
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
      // Over a held web the plate opens where it is; from the cloth the view flies in first.
      const held = useLoomStore.getState().focus !== null;
      if (!held) {
        plateReturn.current ??= { ...rig.goal };
        rig.flyTo(work.x + work.w / 2, work.row + work.h / 2, Math.min((window.innerHeight * 0.62) / Math.max(work.w, work.h), FLY_SCALE));
      }
      window.clearTimeout(flight.current);
      flight.current = window.setTimeout(() => {
        // From an open plate (a search hit) the new work takes the old one's place.
        const fromCloth = window.location.pathname === '/art';
        if (fromCloth) pushedPlate.current = true;
        window.history[fromCloth ? 'pushState' : 'replaceState'](null, '', `/art/${work.id}`);
      }, held ? 60 : PLATE_DELAY_MS);
    },
    [rig],
  );

  /** Lift a work out of the cloth with its web, along every thread or along one. */
  const pull = useCallback(
    (work: LoomWork, along: number | null = null) => {
      if (!web) return;
      const store = useLoomStore.getState();
      store.setHover(null);
      if (store.face) {
        rig.turn(false);
        store.setFace(false);
      }
      web.pull(work.index, along);
      store.setWeb(work.index, along);
      rig.holdWeb(work.x + work.w / 2, web.middle, phone ? window.innerHeight * SHEET_PEEK : 0);
    },
    [rig, web, phone],
  );

  const release = useCallback(() => {
    if (!web || web.focus === null) return;
    web.release();
    useLoomStore.getState().setWeb(null, null);
    rig.letGo();
  }, [rig, web]);

  /** Show a Pattern's gold thread, or none: the whole cloth where it fits the screen,
   *  and on a phone the rows its stops fall through. */
  const showPattern = useCallback(
    (index: number | null) => {
      if (!door) return;
      release();
      useLoomStore.getState().setPattern(index);
      if (index === null) return;
      const stops = door.patterns[index].stops.map(({ work }) => door.works[work]);
      rig.frameRows(Math.min(...stops.map((work) => work.row)), Math.max(...stops.map((work) => work.row + work.h)));
    },
    [door, release, rig],
  );

  const turn = useCallback(
    (face: boolean) => {
      release();
      rig.turn(face);
      useLoomStore.getState().setFace(face);
    },
    [release, rig],
  );

  // A lifted work: the held one opens its plate, a neighbour becomes the held one.
  const pick = useRef<(index: number) => void>(() => {});
  useEffect(() => {
    pick.current = (index) => {
      if (!door) return;
      if (web?.focus === index) openPlate(door.works[index]);
      else pull(door.works[index]);
    };
  }, [door, web, openPlate, pull]);

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

  /** The lifted work a tap meant, topmost first. Only a phone's taps reach the surface
   *  through them; elsewhere they take their own clicks. */
  const liftedAt = (screenX: number, screenY: number): number | null => {
    let found: { index: number; z: number } | null = null;
    for (const button of root.current?.querySelectorAll<HTMLButtonElement>('button[data-work]') ?? []) {
      const box = button.getBoundingClientRect();
      if (screenX < box.left || screenX > box.right || screenY < box.top || screenY > box.bottom) continue;
      // A work sinking back to the cloth is no longer there to take a tap.
      if (Number(button.style.opacity) < 0.5) continue;
      const z = Number(button.style.zIndex);
      if (!found || z > found.z) found = { index: Number(button.dataset.work), z };
    }
    return found?.index ?? null;
  };

  const beginDrag = (x: number, y: number, moved: number) => {
    drag.current = { x, y, fromX: rig.goal.x, fromY: rig.goal.y, yaw: rig.goal.yaw, pitch: rig.goal.pitch, moved };
    trail.current = [{ t: performance.now(), x, y }];
  };

  /** Where two fingers are: how far apart, and the point between them. */
  const spread = () => {
    const [a, b] = [...touches.current.values()];
    return { distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };

  const walk = (event: React.KeyboardEvent) => {
    if (!door) return;
    if (event.key === 'Enter' && walked.current) openPlate(walked.current);
    if (event.key === ' ' && walked.current) {
      event.preventDefault();
      pull(walked.current);
    }
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
      if (useGalaxyStore.getState().searchOpen || useGalaxyStore.getState().settingsOpen) return;
      // With a plate open its own keys apply.
      if (window.location.pathname !== '/art') return;
      const typing = event.target instanceof HTMLElement && event.target.closest('input, textarea, [contenteditable]');
      if (event.key === 'Escape') {
        // Escape steps back one level: the web, the Pattern, then the whole cloth.
        const { focus, pattern, setPattern } = useLoomStore.getState();
        if (focus !== null) release();
        else if (pattern !== null) setPattern(null);
        else rig.goHome();
      }
      if (!typing && !event.metaKey && !event.ctrlKey && event.key.toLowerCase() === 't') {
        turn(!useLoomStore.getState().face);
      }
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [rig, release, turn]);

  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      useLoomStore.getState().setHover(null);
      const factor = Math.exp(-event.deltaY * 0.0017 * (event.ctrlKey ? 3.2 : 1));
      const max = useLoomStore.getState().focus === null ? MAX_SCALE : WEB_MAX_SCALE;
      rig.zoomAt(factor, event.clientX - origin.current.left, event.clientY - origin.current.top, max);
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
        aria-label="The cloth. Arrow keys walk the works, Enter opens one, Space lifts its web, T turns the cloth."
        className="absolute inset-0 cursor-grab touch-none focus:outline-none"
        onKeyDown={walk}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          rig.stopFling();
          useLoomStore.getState().setHover(null);
          if (touches.current.size === 1) beginDrag(event.clientX, event.clientY, 0);
          if (touches.current.size === 2) {
            pinch.current = spread();
            // Two fingers never make a tap.
            if (drag.current) drag.current.moved = Infinity;
          }
        }}
        onPointerMove={(event) => {
          if (touches.current.has(event.pointerId)) {
            touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          }
          const pinched = pinch.current;
          if (pinched && touches.current.size >= 2) {
            const next = spread();
            const max = useLoomStore.getState().focus === null ? MAX_SCALE : WEB_MAX_SCALE;
            rig.zoomAt(next.distance / pinched.distance, next.x - origin.current.left, next.y - origin.current.top, max);
            rig.nudge(next.x - pinched.x, next.y - pinched.y);
            pinch.current = next;
            return;
          }
          const held = drag.current;
          if (held) {
            const dx = event.clientX - held.x;
            const dy = event.clientY - held.y;
            held.moved = Math.max(held.moved, Math.hypot(dx, dy));
            if (held.moved > DRAG_SLOP) event.currentTarget.style.cursor = 'grabbing';
            const now = performance.now();
            trail.current = [...trail.current.filter((sample) => now - sample.t < FLING_WINDOW_MS), { t: now, x: event.clientX, y: event.clientY }];
            // A held web or the turned cloth swings; the flat cloth slides.
            const { focus, face } = useLoomStore.getState();
            if (focus !== null || face) rig.orbitTo(held.yaw + dx * ORBIT_YAW_PER_PX, held.pitch + dy * ORBIT_PITCH_PER_PX);
            else rig.panBy(held.fromX, held.fromY, dx, dy);
            return;
          }
          // Hover is the mouse's: a finger only touches what it means to pull.
          if (event.pointerType !== 'mouse') return;
          const work = workAt(event.clientX, event.clientY);
          walked.current = null;
          event.currentTarget.style.cursor = work ? 'pointer' : 'grab';
          useLoomStore.getState().setHover(work ? { index: work.index, x: event.clientX, y: event.clientY } : null);
        }}
        onPointerLeave={() => useLoomStore.getState().setHover(null)}
        onPointerCancel={(event) => {
          touches.current.delete(event.pointerId);
          pinch.current = null;
          drag.current = null;
        }}
        onPointerUp={(event) => {
          const pinching = touches.current.size >= 2;
          touches.current.delete(event.pointerId);
          if (pinching) {
            pinch.current = null;
            // The finger left behind carries on dragging, never as a tap.
            const [rest] = [...touches.current.values()];
            if (rest) beginDrag(rest.x, rest.y, Infinity);
            else drag.current = null;
            return;
          }
          const held = drag.current;
          drag.current = null;
          event.currentTarget.style.cursor = 'grab';
          if (!held) return;
          if (held.moved > (event.pointerType === 'mouse' ? DRAG_SLOP : MOBILE_TAP_SLOP)) {
            // A released scroll glides on.
            const { focus, face } = useLoomStore.getState();
            const samples = trail.current;
            const span = samples.length > 1 ? (samples[samples.length - 1].t - samples[0].t) / 1000 : 0;
            if (event.pointerType !== 'mouse' && focus === null && !face && rig.scrolling && span > 0.01) {
              const last = samples[samples.length - 1];
              rig.flingFrom((last.x - samples[0].x) / span, (last.y - samples[0].y) / span);
            }
            return;
          }
          const lifted = liftedAt(event.clientX, event.clientY);
          if (lifted !== null) {
            pick.current(lifted);
            return;
          }
          const work = workAt(event.clientX, event.clientY);
          if (!work) {
            release();
            return;
          }
          if (!useLoomStore.getState().face && rig.s > READ_SCALE) openPlate(work);
          else pull(work);
        }}
        onTouchEnd={(event) => {
          // A tap is done on pointerup; the click a finger leaves behind would land on
          // whatever that tap just opened under it, like the sheet.
          if (event.cancelable) event.preventDefault();
        }}
        onDoubleClick={() => {
          release();
          rig.goHome();
        }}
      >
        {door && web && (
          <Canvas flat gl={{ antialias: true, alpha: true }} dpr={[1, 2]} frameloop={plateOpen ? 'never' : 'always'}>
            <LoomScene door={door} web={web} rig={rig} pointer={pointer} phone={phone} reveal={reveal} onFrame={onFrame} />
          </Canvas>
        )}
      </div>
      {door && web && (
        <>
          <LoomHires door={door} rig={rig} subscribe={subscribe} />
          <LoomPatternThread door={door} rig={rig} subscribe={subscribe} />
          <LoomLifted door={door} web={web} rig={rig} subscribe={subscribe} onPick={pick} phone={phone} />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cosmos-deep/90 to-transparent opacity-0 transition-opacity duration-300 group-data-[view=quiet]/loom:opacity-100"
          />
          <LoomLabels door={door} rig={rig} subscribe={subscribe} />
          <LoomTitle />
          {phone ? (
            <>
              <LoomChips door={door} onTurn={() => turn(!useLoomStore.getState().face)} onPattern={showPattern} />
              <LoomSheet
                door={door}
                onAlong={(thread) => {
                  if (web.focus !== null) pull(door.works[web.focus], thread);
                }}
                onOpen={() => {
                  if (web.focus !== null) openPlate(door.works[web.focus]);
                }}
                onRelease={release}
              />
            </>
          ) : (
            <LoomRail
              door={door}
              onTurn={() => turn(!useLoomStore.getState().face)}
              onPattern={showPattern}
              onAlong={(thread) => {
                if (web.focus !== null) pull(door.works[web.focus], thread);
              }}
              onOpen={() => {
                if (web.focus !== null) openPlate(door.works[web.focus]);
              }}
              onRelease={release}
            />
          )}
          <WorkHoverCard door={door} />
          {plateWork && (
            <WorkPlate
              work={plateWork}
              stops={stopsAt(door, plateWork.index).map(({ pattern, stop }) => ({
                pattern,
                title: door.patterns[pattern].title,
                stop,
              }))}
              onClose={closePlate}
              onStep={stepPlate}
              onFollow={(pattern) => {
                // The thread is seen from afar, not from where the plate was opened.
                plateReturn.current = null;
                closePlate();
                showPattern(pattern);
              }}
            />
          )}
          <WorkSearchOverlay door={door} onSelect={openPlate} />
          <p className="sr-only" aria-live="polite">
            {announced}
          </p>
        </>
      )}
    </div>
  );
}
