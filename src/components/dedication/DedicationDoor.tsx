'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GalaxyCanvas } from '@/components/galaxy/GalaxyCanvas';
import type { CameraAim } from '@/components/galaxy/CameraRig';
import type { GalaxySky } from '@/components/galaxy/GalaxyDoor';
import { discRadiusOf } from '@/components/galaxy/discRadius';
import { DoorUnavailable } from '@/components/ui/DoorUnavailable';
import { Link } from '@/components/ui/Link';
import { ATLAS_FILES } from '@/features/atlas/files';
import { loadAtlasFile, useAtlasFile } from '@/features/atlas/useAtlasFile';
import { Director, StageClock, resolveShot, type StagePiece, type StageSky } from '@/features/dedication/director';
import { GiftMusic } from '@/features/dedication/music';
import { giftSchema, type GiftScore } from '@/features/dedication/score';
import { canUnseal, exportKey, importKey, openSealed, type Sealed } from '@/features/dedication/seal';
import { resetStage, stage } from '@/features/dedication/stage';
import { useDoorStore } from '@/features/dedication/store';
import { dedicationOf, type Dedication, type DedicationDoor as DoorConfig } from '@/features/galaxy/dedication';
import { useGalaxyStore } from '@/features/galaxy/store';
import { useGalaxyPositions } from '@/features/galaxy/usePositions';
import { DoorLock } from './DoorLock';
import { GiftDoors, GiftLeaf } from './GiftLeaf';
import { GiftPerformance } from './GiftPerformance';
import { StagePieces } from './pieces/StagePieces';

/** The page behind a dedicated star's door (src/features/galaxy/dedication.ts).
 *  It is the atlas's own galaxy, hushed round the one star, and over it in turn:
 *  the door's question, the performance of the gift, and the leaf it stays on.
 *  The gift arrives sealed (src/features/dedication/seal.ts) and is opened here,
 *  in the visitor's browser, by the answer; the device then keeps the key, so
 *  the door asks once. */

type Phase = 'arriving' | 'lock' | 'welcome' | 'playing' | 'ended' | 'reading';

interface Show {
  director: Director;
  clock: StageClock;
  music: GiftMusic | null;
}

/** The light the rest of the sky keeps while the star waits, and how near the camera stands. */
const REST_FLOOR = 0.3;
const REST_DISTANCE = 30;
const CENTRE: CameraAim = { right: 0, up: 0 };
const KEPT = 'icarus-dedication:';

/** Runs the show inside the canvas, a frame at a time, before the stars are drawn. */
function StageDriver({ show }: { show: RefObject<Show | null> }) {
  useFrame((_, delta) => {
    const current = show.current;
    if (!current) return;
    const { director, clock } = current;
    clock.tick(delta);
    director.frame(clock.time);
    const door = useDoorStore.getState();
    const spoken = director.spoken(clock.time);
    if (door.spoken !== spoken) door.setSpoken(spoken);
    if (clock.time >= clock.end && !door.ended) door.setEnded(true);
  }, -2);
  return null;
}

/** The stage's night: a black shell round the camera, drawn over the backdrop
 *  (dome, field stars, nebula) and under the atlas's own stars and lines. */
function StageVeil() {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ camera }) => {
    const shell = mesh.current;
    if (!shell || !material.current) return;
    const darkness = stage.active ? stage.veil : 0;
    shell.visible = darkness > 0.002;
    shell.position.copy(camera.position);
    material.current.opacity = darkness;
  });
  return (
    <mesh ref={mesh} renderOrder={2} frustumCulled={false} visible={false}>
      <sphereGeometry args={[40, 16, 12]} />
      <meshBasicMaterial ref={material} color="#000000" transparent opacity={0} depthTest={false} depthWrite={false} side={THREE.BackSide} toneMapped={false} />
    </mesh>
  );
}

function Stage({ sky, starId, dedication, door }: { sky: GalaxySky; starId: string; dedication: Dedication; door: DoorConfig }) {
  const positions = useGalaxyPositions(sky.characters, sky.relations, sky.bakedLayout);
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('arriving');
  const [gift, setGift] = useState<GiftScore | null>(null);
  const [risen, setRisen] = useState(false);
  /** The set pieces of the show now running, drawn in the canvas. */
  const [pieces, setPieces] = useState<StagePiece[]>([]);
  const show = useRef<Show | null>(null);
  const music = useRef<GiftMusic | null>(null);

  const view = useCallback(
    (): StageSky => ({
      characters: sky.characters,
      positions,
      discRadius: discRadiusOf(positions),
      aspect: window.innerWidth / Math.max(1, window.innerHeight),
    }),
    [sky.characters, positions],
  );

  /** The sky at rest: hushed round the one star, the camera drawn up to it.
   *  `inside` begins within the star's own light and draws back out of it. */
  const rest = useCallback(
    (inside: boolean): number => {
      const sight = view();
      const galaxy = useGalaxyStore.getState();
      stage.active = true;
      stage.floor = REST_FLOOR;
      stage.veil = 0;
      stage.gains.clear();
      galaxy.setLit({ stars: [starId], relations: [], accent: [] });
      const framing = resolveShot({ t: 0, kind: 'shot', focus: [starId], distance: REST_DISTANCE, elevation: 14, ease: 1.7, drift: 0.5 }, sight);
      if (!inside) {
        galaxy.setShot(framing);
        return 0;
      }
      galaxy.setShot({ ...resolveShot({ t: 0, kind: 'shot', focus: [starId], distance: 3.5, elevation: 14 }, sight), jump: true });
      return window.setTimeout(() => useGalaxyStore.getState().setShot(framing), 160);
    },
    [view, starId],
  );

  // Arrive: take the stage, and try the key this device may already keep.
  useEffect(() => {
    useDoorStore.getState().setCurtain(true);
    // Whoever came through the star's panel still has it selected: the stage
    // wants no ring round it, and no dive left running.
    useGalaxyStore.getState().select(null);
    const drawBack = rest(true);
    const rise = window.setTimeout(() => setRisen(true), 80);
    // The gift's music loads while the door still asks; a visitor who has the
    // atlas's music off hears none, and the show keeps its own time.
    const { musicEnabled, musicVolume } = useGalaxyStore.getState();
    const tune = door.music && musicEnabled ? new GiftMusic(door.music, Math.min(1, musicVolume * 1.8)) : null;
    music.current = tune;
    const bless = () => tune?.bless();
    const gestures = ['pointerup', 'touchend', 'click', 'keydown'] as const;
    for (const gesture of gestures) window.addEventListener(gesture, bless, { capture: true });
    // A music that cannot be had is done without.
    const lost = () => {
      music.current = null;
      show.current?.clock.follow(null);
    };
    tune?.audio.addEventListener('error', lost);
    let live = true;
    void (async () => {
      const kept = canUnseal() ? localStorage.getItem(KEPT + starId) : null;
      if (kept) {
        try {
          const sealed = await loadAtlasFile<Sealed>(door.sealed);
          const opened = giftSchema.parse(await openSealed<unknown>(sealed, await importKey(kept)));
          if (!live) return;
          setGift(opened);
          setPhase('welcome');
          return;
        } catch {
          // A gift sealed anew no longer opens under the old key: ask again.
          localStorage.removeItem(KEPT + starId);
        }
      }
      if (live) setPhase('lock');
    })();
    return () => {
      live = false;
      window.clearTimeout(drawBack);
      window.clearTimeout(rise);
      for (const gesture of gestures) window.removeEventListener(gesture, bless, { capture: true });
      tune?.audio.removeEventListener('error', lost);
      tune?.dispose();
      music.current = null;
      show.current = null;
      resetStage();
      const galaxy = useGalaxyStore.getState();
      galaxy.setLit(null);
      galaxy.setShot(null);
      const doorState = useDoorStore.getState();
      doorState.setCurtain(false);
      doorState.setPlaying(false);
      doorState.setSpoken(-1);
      doorState.setEnded(false);
    };
  }, [rest, starId, door.sealed, door.music]);

  // The performance reaching its end opens the ways on.
  useEffect(
    () =>
      useDoorStore.subscribe((state, before) => {
        if (state.ended && !before.ended) setPhase((current) => (current === 'playing' ? 'ended' : current));
      }),
    [],
  );

  const begin = useCallback(
    (score: GiftScore) => {
      const clock = new StageClock(score.end);
      clock.playing = true;
      const director = new Director(score, view(), { lit: [starId], floor: REST_FLOOR });
      const tune = music.current;
      show.current = { director, clock, music: tune };
      setPieces(director.pieces);
      // The show keeps the music's time. Where the browser will not let it
      // sound yet, the show holds, and the next touch starts both.
      clock.follow(tune?.audio ?? null);
      tune?.start().catch(() => {
        if (show.current?.clock !== clock) return;
        clock.playing = false;
        useDoorStore.getState().setPlaying(false);
      });
      // A handle for automated checks, as the galaxy keeps one: the running show's clock.
      (window as unknown as { __door?: unknown }).__door = show.current;
      const doorState = useDoorStore.getState();
      doorState.setSpoken(-1);
      doorState.setEnded(false);
      doorState.setPlaying(true);
      setPhase('playing');
    },
    [view, starId],
  );

  const open = useCallback(
    (score: GiftScore, key: CryptoKey) => {
      exportKey(key).then(
        (raw) => localStorage.setItem(KEPT + starId, raw),
        () => {},
      );
      setGift(score);
      begin(score);
    },
    [begin, starId],
  );

  const toggle = useCallback(() => {
    const current = show.current;
    if (!current) return;
    current.clock.playing = !current.clock.playing;
    if (current.clock.playing) current.music?.resume();
    else current.music?.pause();
    useDoorStore.getState().setPlaying(current.clock.playing);
  }, []);

  // A show nobody is looking at holds, music and all, until they come back to it.
  useEffect(() => {
    const onHidden = () => {
      const current = show.current;
      if (!document.hidden || !current?.clock.playing || useDoorStore.getState().ended) return;
      current.clock.playing = false;
      current.music?.pause();
      useDoorStore.getState().setPlaying(false);
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => document.removeEventListener('visibilitychange', onHidden);
  }, []);

  const step = useCallback((by: 1 | -1) => {
    const current = show.current;
    if (current) current.clock.seek(current.director.step(current.clock.time, by));
  }, []);

  /** Out of the performance before its end: the sky goes back to rest. */
  const fold = useCallback(() => {
    show.current?.music?.stop();
    show.current = null;
    setPieces([]);
    useDoorStore.getState().setPlaying(false);
    rest(false);
    setPhase('ended');
  }, [rest]);

  const leave = useCallback(() => router.push(`/?fly=${starId}`), [router, starId]);

  return (
    <div className="fixed inset-0 bg-cosmos-deep">
      <div className={`pointer-events-none fixed inset-0 transition-opacity duration-[1800ms] ease-out ${risen ? 'opacity-100' : 'opacity-0'}`} aria-hidden>
        <GalaxyCanvas characters={sky.characters} relations={sky.relations} positions={positions} reading={{ aim: CENTRE, labels: false }}>
          <StageVeil />
          <StageDriver show={show} />
          <StagePieces pieces={pieces} positions={positions} dedication={dedication} />
        </GalaxyCanvas>
      </div>

      {(phase === 'lock' || phase === 'welcome') && (
        <Link
          href={`/?fly=${starId}`}
          className="fixed left-4 top-[max(0.9rem,env(safe-area-inset-top))] z-50 font-display text-[10px] uppercase tracking-[0.26em] text-aether-faint transition-colors hover:text-aether sm:left-6"
        >
          ← The galaxy
        </Link>
      )}
      {phase === 'lock' && <DoorLock dedication={dedication} door={door} onOpen={open} />}
      {phase === 'welcome' && gift && (
        <GiftDoors dedication={dedication} greeting={`Welcome back, ${gift.title}.`} onWatch={() => begin(gift)} onRead={() => setPhase('reading')} onLeave={leave} />
      )}
      {phase === 'playing' && gift && (
        <GiftPerformance gift={gift} dedication={dedication} characters={sky.characters} onToggle={toggle} onStep={step} onLeave={fold} />
      )}
      {phase === 'ended' && gift && <GiftDoors dedication={dedication} onWatch={() => begin(gift)} onRead={() => setPhase('reading')} onLeave={leave} />}
      {phase === 'reading' && gift && <GiftLeaf gift={gift} dedication={dedication} characters={sky.characters} onWatch={() => begin(gift)} onLeave={leave} />}
    </div>
  );
}

export function DedicationDoor({ starId }: { starId: string }) {
  const { data: sky, failed } = useAtlasFile<GalaxySky>(ATLAS_FILES.galaxy);
  const dedication = dedicationOf(starId);
  if (!dedication?.door) return null;
  if (failed) return <DoorUnavailable what="The sky" />;
  if (!sky) return <div className="fixed inset-0 bg-cosmos-deep" />;
  return <Stage sky={sky} starId={starId} dedication={dedication} door={dedication.door} />;
}
