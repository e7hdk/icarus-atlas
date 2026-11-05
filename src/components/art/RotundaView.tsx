'use client';

import { Canvas } from '@react-three/fiber';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useAtlasSearchHotkey } from '@/components/hud/useAtlasSearchHotkey';
import { Link } from '@/components/ui/Link';
import { decodeDoor, stopsAt, subjectOf, type LoomDoor, type LoomWork } from '@/features/art/door';
import { LENS, STANCE_LENS, type Rotunda, type RotundaMode } from '@/features/art/rotunda/engine';
import { loadFullSheets, loadPreviewSheet, type FullSheets, type SheetImage } from '@/features/art/rotunda/textures';
import { isDimmed, litSets, useLoomStore } from '@/features/art/store';
import { ATLAS_FILES } from '@/features/atlas/files';
import { useAtlasFile } from '@/features/atlas/useAtlasFile';
import { useGalaxyStore } from '@/features/galaxy/store';
import { SAGA_LABEL, SAGA_ORDER, type SagaId } from '@/features/stories/sagas';
import type { LoomDoorData } from '@/types/art';
import { LoomRail } from './LoomRail';
import { LoomTitle } from './LoomView';
import { RotundaScene, type RotundaEvents, type RotundaSettings } from './RotundaScene';
import { WorkHoverCard } from './WorkHoverCard';
import { WorkPlate } from './WorkPlate';
import { WorkSearchOverlay } from './WorkSearchOverlay';

const REVEAL_KEY = 'loom-woven';
/** The lens and the stance inside, remembered for the next visit. */
const OPTICS_KEY = 'loom-optics';
const DRAG_SLOP = 4;

/** Arrow keys walk the cloth one work at a time. */
const WALK: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

const HINT: Record<RotundaMode, string> = {
  flat: 'Click any work to step inside beside it',
  entering: 'The cloth closes round you',
  inside: 'Drag to look around · scroll to drift toward what you see · Esc steps back',
  leaving: 'The cloth unrolls',
  turning: 'Through the cloth',
  outside: 'The back of the cloth: drag to walk round it · click a work to step back in beside it',
};

interface Optics {
  lens: number;
  centre: boolean;
}

function readOptics(): Optics {
  try {
    const saved = JSON.parse(window.localStorage.getItem(OPTICS_KEY) ?? 'null') as Partial<Optics> | null;
    if (saved && typeof saved.lens === 'number' && typeof saved.centre === 'boolean') {
      return { lens: Math.min(LENS.max, Math.max(LENS.min, Math.round(saved.lens))), centre: saved.centre };
    }
  } catch {
    // Without storage the room opens as it always does.
  }
  return { lens: STANCE_LENS.centre, centre: true };
}

function saveOptics(optics: Optics) {
  try {
    window.localStorage.setItem(OPTICS_KEY, JSON.stringify(optics));
  } catch {
    // The choice holds for this visit only.
  }
}

/** The next work along a line of cells, across the holes in the tear; round the drum
 *  when it is closed. */
function stepAround(door: LoomDoor, work: LoomWork, [dx, dy]: [number, number], wrap: boolean): LoomWork {
  const { width, height } = door.layout;
  let x = work.x + (dx > 0 ? work.w : dx < 0 ? -1 : 0);
  let row = work.row + (dy > 0 ? work.h : dy < 0 ? -1 : 0);
  for (let n = 0; n < width + height; n++, x += dx, row += dy) {
    if (wrap) x = (x + width) % width;
    if (x < 0 || x >= width || row < 0 || row >= height) break;
    const index = door.cellOf[row * width + x];
    if (index >= 0 && index !== work.index) return door.works[index];
  }
  return work;
}

/** What the door's chrome covers: the bar above, and on a wide screen the rail on the
 *  right and the title in the bottom corner; the dock below. The flat cloth hangs in
 *  the rest. */
function chromeInsets(width: number) {
  const wide = width > 1080;
  return { top: 76, right: wide ? 254 : 24, bottom: wide ? 270 : 150, left: 24 };
}

const noSubscription = () => () => {};
let webGlSupport: boolean | null = null;
const hasWebGl = () => (webGlSupport ??= Boolean(document.createElement('canvas').getContext('webgl2')));

/** The Art door on a desktop (docs/LOOM_PLAN.md §12): the cloth hangs flat, and closes
 *  into a rotunda round the visitor. The plate's state lives in the URL, as on the flat
 *  door, so a work has an address and Back closes it. */
export function RotundaView() {
  useAtlasSearchHotkey();
  const webGl = useSyncExternalStore(noSubscription, hasWebGl, () => true);
  const pathname = usePathname();
  const { data, failed } = useAtlasFile<LoomDoorData>(ATLAS_FILES.loom);
  const door = useMemo(() => (data ? decodeDoor(data, false) : null), [data]);
  const [preview, setPreview] = useState<SheetImage | null>(null);
  const [fullSheets, setFullSheets] = useState<FullSheets | null>(null);
  const [sheetsFailed, setSheetsFailed] = useState(false);
  const [rotunda, setRotunda] = useState<Rotunda | null>(null);
  const [mode, setMode] = useState<RotundaMode>('flat');
  const [readout, setReadout] = useState({ label: 'The Loom', sub: '' });
  const [opticsAtStart] = useState(readOptics);
  const [optics, setOptics] = useState(opticsAtStart);
  const [announced, setAnnounced] = useState('');
  const [reveal] = useState(
    () => window.location.pathname === '/art' && !window.sessionStorage.getItem(REVEAL_KEY),
  );
  const [motion] = useState(() => ({
    reduce: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData),
  }));

  const root = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; moved: number } | null>(null);
  const client = useRef({ x: 0, y: 0 });
  const hovered = useRef(-1);
  const walked = useRef<LoomWork | null>(null);
  const pushedPlate = useRef(false);
  const events = useRef<RotundaEvents | null>(null);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(REVEAL_KEY, '1');
    } catch {
      // Without storage the cloth simply falls again on the next visit.
    }
  }, []);

  // Both start with the door, beside its data: the room opens on the low-quality sheet,
  // and the full ones reweave it when they land. Without them the first cloth stays.
  useEffect(() => {
    let live = true;
    loadPreviewSheet().then(
      (sheet) => live && setPreview(sheet),
      () => live && setSheetsFailed(true),
    );
    loadFullSheets().then(
      (sheets) => live && setFullSheets(sheets),
      () => {},
    );
    return () => {
      live = false;
    };
  }, []);

  const settings = useMemo<RotundaSettings | null>(
    () =>
      door && preview
        ? {
            door,
            sheets: { lq: preview, full: null },
            insets: chromeInsets(window.innerWidth),
            lens: opticsAtStart.lens,
            centre: opticsAtStart.centre,
            reveal,
            reduceMotion: motion.reduce,
            saveData: motion.saveData,
          }
        : null,
    [door, preview, opticsAtStart, reveal, motion],
  );

  useEffect(() => {
    if (rotunda && fullSheets) rotunda.upgradeSheets(fullSheets);
  }, [rotunda, fullSheets]);

  // What the room tells the door: its state for the dock, the store's web and Pattern,
  // and the work or the clay weight under the pointer.
  useEffect(() => {
    const store = useLoomStore.getState;
    events.current = {
      onMode: (next) => {
        setMode(next);
        if (next === 'outside' || next === 'inside' || next === 'flat') store().setFace(next === 'outside');
      },
      onHover: (work, saga) => {
        hovered.current = work;
        store().setHover(work >= 0 ? { index: work, x: client.current.x, y: client.current.y } : null);
        if (store().peekSaga !== saga) store().setPeekSaga(saga);
        const element = surface.current;
        if (element && !drag.current) element.style.cursor = work >= 0 || saga ? 'pointer' : 'grab';
      },
      onReadout: (label, sub) => setReadout({ label, sub }),
      onWeb: (focus, along) => store().setWeb(focus, along),
      onPattern: (pattern) => store().setPattern(pattern),
    };
  });

  useEffect(() => {
    const element = root.current;
    if (!rotunda || !element) return;
    const observer = new ResizeObserver(() => {
      rotunda.setInsets(chromeInsets(element.getBoundingClientRect().width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [rotunda]);

  // The door's filters sink works in the cloth and light one clay weight.
  useEffect(() => {
    if (!rotunda || !door) return;
    let shown = '';
    const apply = (state: ReturnType<typeof useLoomStore.getState>) => {
      const key = [state.saga, state.peekSaga, state.medium, state.subject?.id, state.pattern, state.peekThread].join('|');
      if (key === shown) return;
      shown = key;
      const lit = litSets(door, state);
      rotunda.setFilters((index) => isDimmed(door.works[index], state, lit), state.peekSaga ?? state.saga);
      rotunda.isolate(state.peekThread);
    };
    apply(useLoomStore.getState());
    return useLoomStore.subscribe(apply);
  }, [rotunda, door]);

  useEffect(
    () => () => {
      const store = useLoomStore.getState();
      store.setHover(null);
      store.setPeekSaga(null);
      store.setWeb(null, null);
      store.setPattern(null);
      store.setFace(false);
    },
    [],
  );

  const plateWork = useMemo(() => {
    if (!door || !pathname.startsWith('/art/')) return null;
    return door.byId.get(decodeURIComponent(pathname.slice('/art/'.length))) ?? null;
  }, [door, pathname]);
  const plateOpen = plateWork !== null;
  const plateWasOpen = useRef(false);
  useEffect(() => {
    if (plateOpen) {
      plateWasOpen.current = true;
      return;
    }
    if (!plateWasOpen.current) return;
    plateWasOpen.current = false;
    surface.current?.focus({ preventScroll: true });
  }, [plateOpen]);

  const openPlate = useCallback((work: LoomWork) => {
    useLoomStore.getState().setHover(null);
    // From an open plate (a search hit) the new work takes the old one's place.
    const fromCloth = window.location.pathname === '/art';
    if (fromCloth) pushedPlate.current = true;
    window.history[fromCloth ? 'pushState' : 'replaceState'](null, '', `/art/${work.id}`);
  }, []);

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

  // A deep link opens the door on a figure, a story or a saga (LOOM_PLAN §7, Filters):
  // `/art?figure=perseus`, `/art?story=daedalus-icarus`, `/art?saga=trojan`.
  useEffect(() => {
    if (!door) return;
    const params = new URLSearchParams(window.location.search);
    const store = useLoomStore.getState();
    const saga = params.get('saga');
    if (saga && (SAGA_ORDER as readonly string[]).includes(saga)) store.setSaga(saga as SagaId);
    const figure = params.get('figure');
    const story = params.get('story');
    store.setSubject(figure ? subjectOf(door, 'figure', figure) : story ? subjectOf(door, 'story', story) : null);
  }, [door]);

  /** Back to the whole cloth from a deep link's subject, and the address with it. */
  const clearSubject = useCallback(() => {
    useLoomStore.getState().setSubject(null);
    if (window.location.pathname === '/art' && window.location.search) window.history.replaceState(null, '', '/art');
  }, []);

  /** Turn the cloth: from inside to its back and in again; from the flat cloth, in and through. */
  const turn = useCallback(() => {
    if (!rotunda) return;
    if (rotunda.mode === 'inside') rotunda.turnOut();
    else if (rotunda.mode === 'outside') rotunda.turnIn();
    else if (rotunda.mode === 'flat') rotunda.enter(-1, () => rotunda.turnOut());
  }, [rotunda]);

  const pull = useCallback(
    (work: LoomWork, along: number | null = null) => {
      if (!rotunda) return;
      useLoomStore.getState().setHover(null);
      if (rotunda.mode === 'flat') rotunda.enter(work.index);
      else if (rotunda.mode === 'outside') rotunda.turnIn(work.index);
      else rotunda.pull(work.index, along);
    },
    [rotunda],
  );

  const setLens = (lens: number) => {
    const next = { ...optics, lens };
    setOptics(next);
    saveOptics(next);
    rotunda?.setLens(lens);
  };
  const setStance = (centre: boolean) => {
    const next = { ...optics, centre };
    setOptics(next);
    saveOptics(next);
    rotunda?.setStance(centre);
  };

  const rootBox = () => root.current?.getBoundingClientRect() ?? { left: 0, top: 0, width: 1, height: 1 };

  const click = (clientX: number, clientY: number) => {
    if (!rotunda || !door) return;
    const box = rootBox();
    const pick = rotunda.pick(clientX - box.left, clientY - box.top);
    if (pick.saga) {
      const store = useLoomStore.getState();
      store.setSaga(store.saga === pick.saga ? null : pick.saga);
      return;
    }
    if (rotunda.mode === 'inside' && pick.lifted) {
      if (pick.work === rotunda.web.focus) openPlate(door.works[pick.work]);
      else rotunda.pull(pick.work);
      return;
    }
    if (pick.work >= 0) {
      pull(door.works[pick.work]);
      return;
    }
    if (rotunda.mode === 'inside') rotunda.release();
  };

  const walk = (event: React.KeyboardEvent) => {
    if (!door || !rotunda) return;
    if (event.key === 'Enter') {
      if (walked.current) openPlate(walked.current);
      else if (rotunda.mode === 'flat') rotunda.enter();
      return;
    }
    if (event.key === ' ' && walked.current) {
      event.preventDefault();
      pull(walked.current);
      return;
    }
    const step = WALK[event.key];
    if (!step) return;
    event.preventDefault();
    const box = rootBox();
    const ahead = rotunda.pick(box.width / 2, box.height / 2).work;
    const from = walked.current ?? (ahead >= 0 ? door.works[ahead] : door.works[0]);
    const next = walked.current ? stepAround(door, from, step, rotunda.mode !== 'flat') : from;
    walked.current = next;
    setAnnounced(`${next.title}, ${next.artist}, ${next.year}`);
    // Inside the view turns to the work, so its card waits in the middle of the view.
    rotunda.face(next.index);
    const at = rotunda.mode === 'inside' ? { x: box.width / 2, y: box.height / 2 } : rotunda.toScreen(next.x + next.w / 2, next.row + next.h / 2);
    if (at) useLoomStore.getState().setHover({ index: next.index, x: at.x + box.left, y: at.y + box.top });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!rotunda) return;
      if (useGalaxyStore.getState().searchOpen || useGalaxyStore.getState().settingsOpen) return;
      // With a plate open its own keys apply.
      if (window.location.pathname !== '/art') return;
      const typing = event.target instanceof HTMLElement && event.target.closest('input, textarea, [contenteditable]');
      if (event.key === 'Escape') {
        // Escape steps back one level: the web, the Pattern, the subject, the back of the
        // cloth, the visitor's place, then out of the room.
        const { focus, pattern, subject } = useLoomStore.getState();
        if (focus !== null) rotunda.release();
        else if (pattern !== null) rotunda.showPattern(null);
        else if (subject) clearSubject();
        else if (rotunda.mode === 'outside') rotunda.turnIn();
        else if (rotunda.mode === 'inside' && rotunda.away) rotunda.goHome();
        else if (rotunda.mode === 'inside') rotunda.leave();
      }
      if (!typing && !event.metaKey && !event.ctrlKey && event.key.toLowerCase() === 't') turn();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [rotunda, turn, clearSubject]);

  useEffect(() => {
    const element = surface.current;
    if (!element || !rotunda) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
      rotunda.wheel(event.deltaX * unit, event.deltaY * unit, event.ctrlKey);
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [rotunda]);

  const onReady = useCallback((room: Rotunda | null) => setRotunda(room), []);
  const onFrame = useCallback(() => {}, []);

  if (!webGl || failed || sheetsFailed) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center font-body text-lg text-aether-muted">
        <p>
          {webGl ? 'The Loom could not be loaded.' : 'The Loom needs WebGL 2.'} The same works are listed on{' '}
          <Link href="/art/list" className="text-star-olympian underline underline-offset-4">
            a plain page
          </Link>
          .
        </p>
      </div>
    );
  }

  const inside = mode === 'inside';
  return (
    <div ref={root} data-view="open" className="group/loom absolute inset-0 bg-cosmos-deep">
      <div
        ref={surface}
        role="application"
        tabIndex={0}
        aria-label="The cloth. Arrow keys walk the works, Enter opens one, Space lifts its web, T turns the cloth, Escape steps back."
        className="absolute inset-0 cursor-grab touch-none focus:outline-none"
        onKeyDown={walk}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { x: event.clientX, y: event.clientY, moved: 0 };
        }}
        onPointerMove={(event) => {
          client.current = { x: event.clientX, y: event.clientY };
          const box = rootBox();
          rotunda?.point(event.clientX - box.left, event.clientY - box.top);
          walked.current = null;
          const held = drag.current;
          if (held) {
            const dx = event.clientX - held.x;
            const dy = event.clientY - held.y;
            const moved = held.moved + Math.hypot(dx, dy);
            drag.current = { x: event.clientX, y: event.clientY, moved };
            if (moved <= DRAG_SLOP || !rotunda) return;
            rotunda.setDragging(true);
            event.currentTarget.style.cursor = 'grabbing';
            useLoomStore.getState().setHover(null);
            rotunda.drag(dx, dy);
            return;
          }
          if (hovered.current >= 0) {
            useLoomStore.getState().setHover({ index: hovered.current, x: event.clientX, y: event.clientY });
          }
        }}
        onPointerUp={(event) => {
          const held = drag.current;
          drag.current = null;
          rotunda?.setDragging(false);
          event.currentTarget.style.cursor = 'grab';
          if (held && held.moved <= DRAG_SLOP) click(event.clientX, event.clientY);
        }}
        onPointerCancel={() => {
          drag.current = null;
          rotunda?.setDragging(false);
        }}
        onPointerLeave={() => {
          rotunda?.unpoint();
          useLoomStore.getState().setHover(null);
        }}
        onDoubleClick={() => {
          if (rotunda?.mode !== 'inside') return;
          rotunda.release();
          rotunda.goHome();
        }}
      >
        {settings && (
          <Canvas
            flat
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            dpr={[1, 2]}
            camera={{ fov: 34, near: 0.05, far: 5000 }}
            frameloop={plateOpen ? 'never' : 'always'}
          >
            <RotundaScene settings={settings} events={events} onReady={onReady} onFrame={onFrame} />
          </Canvas>
        )}
      </div>
      {!rotunda && (
        <p className="pointer-events-none absolute inset-x-0 top-1/2 text-center font-body text-lg italic text-aether-muted">
          Weaving the cloth…
        </p>
      )}
      {door && rotunda && (
        <>
          {mode === 'flat' && <LoomTitle />}
          {mode === 'flat' && <RotundaWeights door={door} rotunda={rotunda} />}
          {mode !== 'flat' && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-cosmos-deep/90 via-cosmos-deep/45 to-transparent"
            />
          )}
          {(mode === 'flat' || inside) && (
            <LoomRail
              door={door}
              onTurn={turn}
              onPattern={(pattern) => rotunda.showPattern(pattern)}
              onClearSubject={clearSubject}
              onAlong={(thread) => {
                if (rotunda.web.focus >= 0) rotunda.pull(rotunda.web.focus, thread);
              }}
              onOpen={() => {
                if (rotunda.web.focus >= 0) openPlate(door.works[rotunda.web.focus]);
              }}
              onRelease={() => rotunda.release()}
            />
          )}
          <RotundaDock
            mode={mode}
            readout={readout}
            optics={optics}
            onLens={setLens}
            onStance={setStance}
            onEnter={() => (mode === 'flat' ? rotunda.enter() : rotunda.leave())}
            onTurn={turn}
          />
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
                closePlate();
                rotunda.showPattern(pattern);
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

/** The clay weights as buttons, for the keyboard and for screen readers, where they hang
 *  under the flat cloth; a pointer reaches them through the room's own picking. */
function RotundaWeights({ door, rotunda }: { door: LoomDoor; rotunda: Rotunda }) {
  const shown = useLoomStore((state) => state.saga);
  const [spots, setSpots] = useState<{ saga: SagaId; x: number; y: number }[]>([]);
  const counts = useMemo(() => {
    const tally = new Map<SagaId, number>();
    for (const work of door.works) tally.set(work.saga, (tally.get(work.saga) ?? 0) + 1);
    return tally;
  }, [door]);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      // after the room has drawn the flat cloth where it now hangs
      frame = requestAnimationFrame(() => setSpots(rotunda.weightsOnScreen()));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [rotunda]);
  return (
    <div role="group" aria-label="The clay weights: one saga each">
      {spots.map(({ saga, x, y }) => (
        <button
          key={saga}
          type="button"
          aria-pressed={shown === saga}
          aria-label={`${saga === 'heroic' ? 'Other tales' : SAGA_LABEL[saga]}, ${counts.get(saga) ?? 0} works`}
          onClick={() => {
            const store = useLoomStore.getState();
            store.setSaga(store.saga === saga ? null : saga);
          }}
          onFocus={() => useLoomStore.getState().setPeekSaga(saga)}
          onBlur={() => useLoomStore.getState().setPeekSaga(null)}
          className="pointer-events-none absolute h-10 w-7 -translate-x-1/2 -translate-y-1/2 rounded-md focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-star-olympian/70"
          style={{ left: x, top: y }}
        />
      ))}
    </div>
  );
}

/** Under the view: what the visitor faces, the lens and where they stand, and the ways
 *  in, through and out. */
function RotundaDock({
  mode,
  readout,
  optics,
  onLens,
  onStance,
  onEnter,
  onTurn,
}: {
  mode: RotundaMode;
  readout: { label: string; sub: string };
  optics: Optics;
  onLens: (lens: number) => void;
  onStance: (centre: boolean) => void;
  onEnter: () => void;
  onTurn: () => void;
}) {
  const settled = mode === 'flat' || mode === 'inside' || mode === 'outside';
  const button =
    'rounded-full border px-4 py-[7px] font-display text-[10px] tracking-[0.18em] transition-colors disabled:opacity-40';
  const quiet = `${button} border-glass-border bg-glass-heavy text-aether-muted hover:text-aether`;
  const gold = `${button} border-star-olympian/50 bg-star-olympian/[0.08] text-star-olympian hover:bg-star-olympian/[0.16] hover:text-[#fde68a]`;
  const stance = (on: boolean) =>
    `rounded-full px-2.5 py-[3px] font-display text-[9.5px] tracking-[0.16em] transition-colors ${
      on ? 'bg-star-olympian/[0.14] text-star-olympian' : 'text-aether-faint hover:text-aether'
    }`;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[22px] z-10 flex flex-col items-center gap-2.5 px-4">
      <div className="text-center" data-loom-readout>
        <p className="font-display text-[13px] tracking-[0.2em] text-aether">{readout.label}</p>
        {readout.sub && <p className="mt-0.5 font-body text-[14px] italic text-aether-muted">{readout.sub}</p>}
      </div>
      {mode === 'inside' && (
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 rounded-full border border-glass-border bg-glass-heavy px-4 py-1.5 font-body text-[13.5px] text-aether-faint backdrop-blur-xl">
          <span>Wide</span>
          <input
            type="range"
            min={LENS.min}
            max={LENS.max}
            step={1}
            dir="rtl"
            value={optics.lens}
            onChange={(event) => onLens(Number(event.target.value))}
            aria-label="Lens, in degrees"
            className="w-36 accent-[#fcd34d]"
          />
          <span>Long</span>
          <output className="w-8 font-display text-[11px] tracking-[0.1em] text-star-olympian">{optics.lens}°</output>
          <span className="flex gap-1" role="group" aria-label="Where you stand">
            <button type="button" aria-pressed={optics.centre} onClick={() => onStance(true)} className={stance(optics.centre)}>
              CENTRE
            </button>
            <button type="button" aria-pressed={!optics.centre} onClick={() => onStance(false)} className={stance(!optics.centre)}>
              STAND BACK
            </button>
          </span>
        </div>
      )}
      <div className="pointer-events-auto flex gap-2">
        {mode !== 'outside' && (
          <button type="button" disabled={!settled} onClick={onEnter} className={mode === 'flat' ? gold : quiet}>
            {mode === 'flat' || mode === 'entering' ? 'STEP INSIDE' : 'STEP OUT'}
          </button>
        )}
        {(mode === 'inside' || mode === 'outside' || mode === 'turning') && (
          <button type="button" disabled={!settled} onClick={onTurn} className={mode === 'outside' ? gold : quiet}>
            {mode === 'outside' ? 'TURN BACK IN' : 'TURN THE CLOTH'}
          </button>
        )}
      </div>
      <p className="font-body text-[13.5px] italic text-aether-faint" data-loom-hint>
        {HINT[mode]}
      </p>
    </div>
  );
}
