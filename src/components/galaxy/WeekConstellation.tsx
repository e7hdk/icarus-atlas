'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vec3 } from '@/features/galaxy/layout';
import { useGalaxyStore } from '@/features/galaxy/store';
import { weekContextFor } from '@/features/spotlight/weeks';
import { useEphemerisStore } from '@/features/spotlight/store';
import type { Constellation, SkyCatalogue } from '@/types/sky';
import catalogue from '../../../data/sky/constellations.json';
import { SkyStars, SkyThreads, type SkyPoint, type SkyThread } from './SkyChart';
import { discRadiusOf } from './discRadius';

/** The Greek sky (docs/EPHEMERIS_PLAN.md §5). Ptolemy's 48 constellations hang
 *  on a real celestial sphere around the galaxy — each star at its catalogue
 *  RA/Dec, each figure drawn with the lines the ancients drew — so the disc of
 *  myth sits inside the firmament rather than under a single floating badge.
 *  The sky is always there, faint and far.
 *
 *  Once a week one figure wakes: the saga the Ephemeris is telling lights the
 *  constellation the ancients set it in (Ursa Major for the Odyssey, the Bear
 *  Calypso told Odysseus to keep on his left hand). Its stars burn bright,
 *  carry the week's cast in narrative order — so the saga's lead stands at α —
 *  and a click opens that character's codex while a tether falls to the star's
 *  own place down in the galaxy. Weeks whose saga owns no attested catasterism
 *  light nothing: the sky simply stays the sky (hard rule 2).
 *
 *  Hidden while the Proem plays, absent from the city skies. */

const sky = catalogue as SkyCatalogue;

/** The celestial sphere's radius. The galaxy's disc reaches ~1,050 units, so
 *  this hangs the whole sky comfortably beyond it: constellations near the
 *  celestial equator stand off the disc's rim rather than inside it. */
const SKY_RADIUS = 3000;
/** Ordinary sky: far and faint, but always the same starlight — a figure does
 *  not flare because a pointer passed over it. The week's own constellation is
 *  what burns brighter, and it should be the only thing that does. */
const QUIET_THREAD = '#c9d2f5';
const QUIET_THREAD_OPACITY = 0.2;
const QUIET_THREAD_WIDTH = 1;
/** Seen through the galaxy's disc, a quiet thread or star keeps this much of itself. */
const QUIET_BEHIND_DISC = 0.2;
/** The week's figure: gold, the Gilded chrome's jewel for a focal point, with
 *  a soft halo — and it stays readable in front of the disc. */
const LIT_THREAD = '#fcd34d';
const LIT_THREAD_OPACITY = 0.8;
const LIT_THREAD_WIDTH = 1.4;
const LIT_THREAD_GLOW = 7;
const LIT_THREAD_GLOW_GAIN = 0.18;
const LIT_BEHIND_DISC = 0.6;
/** The week's stars are its jewels: drawn larger and hotter than the quiet sky. */
const LIT_STAR_SCALE = 2.6;
const LIT_STAR_BRIGHTNESS = 1.9;
/** The quiet sky's stars carry a touch more light than its threads. */
const QUIET_STAR_BRIGHTNESS = 1.3;
/** Every star brighter than this carries spikes while its figure is lit. */
const LIT_SPIKE_BELOW = 2.5;
const TODAY_SIZE = 40;
/** How far a star's pick sphere reaches. The sky is far, so a target has to be
 *  generous — but it must be a STAR, not a region: a bounding volume per figure
 *  covered the entire sky (the mean of points ON a sphere lies INSIDE it, so
 *  every figure became a ball reaching from the middle out), and every click
 *  anywhere landed on a constellation. At this radius the 554 stars cover some
 *  9% of the sky and the space between them stays empty, as it should be. */
const HIT_RADIUS = 80;
/** The tether that answers "which star down there is this?" */
const TETHER_SECONDS = 1.1;
const TETHER_RELEASE_PER_SECOND = 2.5;
const TETHER_OPACITY = 0.45;

const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** Catalogue RA/Dec (degrees) → a point on the celestial sphere. Declination
 *  climbs to +y, so the celestial pole stands over the galaxy's pole and the
 *  sky is oriented the way a star atlas is. */
function onSphere(ra: number, dec: number, radius = SKY_RADIUS): Vec3 {
  const a = (ra * Math.PI) / 180;
  const d = (dec * Math.PI) / 180;
  return [radius * Math.cos(d) * Math.cos(a), radius * Math.sin(d), -radius * Math.cos(d) * Math.sin(a)];
}

/** Where each figure hangs and how far it reaches — one invisible sphere per
 *  constellation is the pointer target, so the visitor hovers the FIGURE rather
 *  than hunting individual stars across the sky. */
interface SkyFigure {
  figure: Constellation;
  points: SkyPoint[];
  threads: SkyThread[];
  centre: Vec3;
  reach: number;
}

interface QuietSky {
  figures: SkyFigure[];
  /** Every star in the sky, and which figure it belongs to — the pick targets. */
  picks: SkyPick[];
}

interface SkyPick {
  at: Vec3;
  figure: number;
  name: string;
  character?: string;
}

/** The whole sky, prepared once: every figure's stars and threads, and its
 *  pick volume. */
function buildSky(): QuietSky {
  const figures: SkyFigure[] = [];
  const picks: SkyPick[] = [];
  for (const figure of sky.constellations) {
    const points: SkyPoint[] = figure.stars.map((star) => ({
      at: onSphere(star.ra, star.dec),
      mag: star.mag,
      ...(star.k ? { k: star.k } : {}),
    }));
    points.forEach((point, index) => {
      picks.push({
        at: point.at,
        figure: figures.length,
        name: figure.stars[index]!.name,
        ...(figure.stars[index]!.character
          ? { character: figure.stars[index]!.character }
          : {}),
      });
    });
    const threads: SkyThread[] = figure.lines.flatMap(([from, to]) =>
      points[from] && points[to] ? [{ from: points[from]!, to: points[to]! }] : [],
    );
    const placed = points.map((point) => point.at);
    const centre = placed
      .reduce((sum, p) => [sum[0] + p[0], sum[1] + p[1], sum[2] + p[2]] as Vec3, [0, 0, 0] as Vec3)
      .map((v) => v / placed.length) as Vec3;
    const reach = Math.max(
      ...placed.map((p) => Math.hypot(p[0] - centre[0], p[1] - centre[1], p[2] - centre[2])),
    );
    figures.push({ figure, points, threads, centre, reach: reach * 1.15 });
  }
  return { figures, picks };
}

const SKY = buildSky();

/** A star the sources actually name as a person — in the Greek sky, a Pleiad. */
interface StarDoor {
  character: string;
  starName: string;
  bayer: string;
  at: Vec3;
  /** Where that figure stands down in the galaxy — the tether's floor. */
  home: Vec3 | null;
}

interface LitFigure {
  figure: Constellation;
  points: SkyPoint[];
  threads: SkyThread[];
  doors: StarDoor[];
  centre: Vec3;
  labelAt: Vec3;
}

export function WeekConstellation({
  isMobile,
  positions,
}: {
  isMobile: boolean;
  positions: Map<string, Vec3>;
}) {
  const data = useEphemerisStore((s) => s.data);
  const pick = useEphemerisStore((s) => s.pick);
  const proemActive = useEphemerisStore((s) => s.proemActive);
  const setCardOpen = useEphemerisStore((s) => s.setCardOpen);
  const setRiddleOpen = useEphemerisStore((s) => s.setRiddleOpen);
  const selectAt = useGalaxyStore((s) => s.selectAt);
  const selectedId = useGalaxyStore((s) => s.selectedId);
  const skyFocus = useGalaxyStore((s) => s.skyFocus);
  const setSkyFocus = useGalaxyStore((s) => s.setSkyFocus);

  const [named, setNamed] = useState<string | null>(null);
  /** A star inside the figure in focus, under the pointer or tapped: it says
   *  its own name. Indices into SKY.picks. */
  const [starUnder, setStarUnder] = useState<number | null>(null);
  const [starTapped, setStarTapped] = useState<number | null>(null);

  const lit = useMemo<LitFigure | null>(() => {
    if (!data || !pick) return null;
    const context = weekContextFor(data, pick.isoDate);
    if (!context) return null;
    const cast = new Set(context.saga.cast);
    // A figure wakes when the week's own telling names it in the sky, or when
    // the figure IS one of the week's people. Nothing else is inferred.
    // A saga may look up at several figures — the Labours name both the Lion
    // and the Crab — so the one the week's own people ARE wins, and only then
    // the one their telling merely names.
    const isTheWeek = (candidate: SkyFigure) =>
      candidate.figure.catasterism?.characters?.some((character) => cast.has(character));
    const namesTheWeek = (candidate: SkyFigure) =>
      candidate.figure.namedIn?.some((named) => named.story === context.saga.storyId);
    const entry = SKY.figures.find(isTheWeek) ?? SKY.figures.find(namesTheWeek);
    if (!entry) return null;
    const placed = entry.points.map((point) => point.at);
    const doors: StarDoor[] = entry.figure.stars.flatMap((star, index) =>
      star.character
        ? [
            {
              character: star.character,
              starName: star.name,
              bayer: star.bayer,
              at: placed[index]!,
              home: positions.get(star.character) ?? null,
            },
          ]
        : [],
    );
    const top = placed.reduce((best, p) => (p[1] > best[1] ? p : best), placed[0]!);
    return {
      figure: entry.figure,
      points: entry.points,
      threads: entry.threads,
      doors,
      centre: entry.centre,
      labelAt: [top[0], top[1] + SKY_RADIUS * 0.06, top[2]],
    };
  }, [data, pick, positions]);

  // The lit figure is drawn in gold on its own; the quiet sky is every other.
  const quiet = useMemo(() => {
    const others = SKY.figures.filter((entry) => entry.figure.id !== lit?.figure.id);
    return {
      points: others.flatMap((entry) => entry.points),
      threads: others.flatMap((entry) => entry.threads),
    };
  }, [lit]);
  const discRadius = useMemo(() => discRadiusOf(positions), [positions]);

  const [hovered, setHovered] = useState<string | null>(null);
  const picks = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = picks.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    SKY.picks.forEach((pick, index) => {
      matrix.makeTranslation(pick.at[0], pick.at[1], pick.at[2]);
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, []);
  const awake = SKY.figures.find((entry) => entry.figure.id === hovered) ?? null;

  // The tether IS the selection: every way of letting a star go clears it.
  const tethered = lit ? lit.doors.findIndex((door) => door.character === selectedId && door.home) : -1;
  const tether = useRef({ index: -1, fall: 0, opacity: 0 });
  const tetherGeom = useRef<THREE.BufferGeometry>(null);
  const tetherAttr = useRef(new THREE.BufferAttribute(new Float32Array(6), 3));
  const tetherMat = useRef<THREE.LineBasicMaterial>(null);

  useFrame((_, delta) => {
    if (tetherGeom.current && !tetherGeom.current.getAttribute('position')) {
      tetherGeom.current.setAttribute('position', tetherAttr.current);
    }
    const state = tether.current;
    if (state.index !== tethered) {
      state.index = tethered;
      state.fall = 0;
    }
    const door = tethered >= 0 ? lit?.doors[tethered] : undefined;
    if (door?.home) {
      state.fall = Math.min(1, state.fall + delta / TETHER_SECONDS);
      state.opacity = Math.min(1, state.fall * 2);
      const reach = smoothstep(state.fall);
      const line = tetherAttr.current.array as Float32Array;
      line.set(door.at, 0);
      line.set(
        [
          door.at[0] + (door.home[0] - door.at[0]) * reach,
          door.at[1] + (door.home[1] - door.at[1]) * reach,
          door.at[2] + (door.home[2] - door.at[2]) * reach,
        ],
        3,
      );
      tetherAttr.current.needsUpdate = true;
    } else if (state.opacity > 0) {
      state.opacity = Math.max(0, state.opacity - delta * TETHER_RELEASE_PER_SECOND);
    }
    if (tetherMat.current) tetherMat.current.opacity = state.opacity * TETHER_OPACITY;
  });

  if (proemActive) return null;

  const nameIndex = starUnder ?? starTapped;
  const namedStar =
    nameIndex !== null &&
    SKY.figures[SKY.picks[nameIndex]!.figure]!.figure.id === skyFocus?.id
      ? SKY.picks[nameIndex]!
      : null;


  return (
    <group>
      {/* The sky itself: everything the ancients drew, far and quiet, and always
          the same starlight — nothing here flares because a pointer passed. */}
      <SkyThreads
        threads={quiet.threads}
        color={QUIET_THREAD}
        opacity={QUIET_THREAD_OPACITY}
        width={QUIET_THREAD_WIDTH}
        discRadius={discRadius}
        behindDisc={QUIET_BEHIND_DISC}
      />
      <SkyStars
        stars={quiet.points}
        brightness={QUIET_STAR_BRIGHTNESS}
        discRadius={discRadius}
        behindDisc={QUIET_BEHIND_DISC}
      />

      {/* The pick targets are the STARS, in one instanced draw — never a
          bounding volume per figure, which covered the whole sky. Invisible,
          never drawn, and always further off than any galaxy star. */}
      <instancedMesh
        ref={picks}
        args={[undefined, undefined, SKY.picks.length]}
        frustumCulled={false}
        onPointerOver={
          isMobile
            ? undefined
            : (event) => {
                event.stopPropagation();
                const index = event.instanceId;
                if (index === undefined) return;
                document.body.style.cursor = 'pointer';
                setHovered(SKY.figures[SKY.picks[index]!.figure]!.figure.id);
                setStarUnder(index);
              }
        }
        onPointerOut={
          isMobile
            ? undefined
            : (event) => {
                event.stopPropagation();
                document.body.style.cursor = 'auto';
                setHovered(null);
                setStarUnder(null);
              }
        }
        onClick={(event) => {
          const index = event.instanceId;
          if (index === undefined) return;
          event.stopPropagation();
          const skyPick = SKY.picks[index]!;
          const entry = SKY.figures[skyPick.figure]!;
          // First the constellation, then whatever stands inside it: once the
          // figure is in focus, a star the sources name as a person opens that
          // person, and any other star says its name. On a phone the week's
          // doors, which have no meshes of their own there, open at once.
          const inFocus = useGalaxyStore.getState().skyFocus?.id === entry.figure.id;
          const weeksDoor =
            isMobile && lit?.doors.some((door) => door.character === skyPick.character);
          if (skyPick.character && (inFocus || weeksDoor)) {
            selectAt(skyPick.character, skyPick.at, TODAY_SIZE * 16);
            return;
          }
          if (inFocus) {
            setStarTapped(index);
            return;
          }
          setStarTapped(null);
          useGalaxyStore.getState().select(null);
          setSkyFocus({
            id: entry.figure.id,
            at: entry.centre,
            distance: Math.max(entry.reach * 2.6, SKY_RADIUS * 0.12),
          });
        }}
      >
        <sphereGeometry args={[HIT_RADIUS, 6, 6]} />
        <meshBasicMaterial
          visible={!isMobile}
          transparent
          opacity={0}
          depthWrite={false}
          colorWrite={false}
        />
      </instancedMesh>

      {/* The figure under the pointer says its name — and only that. */}
      {/* No hover label for the figure whose card is already open. */}
      {awake && awake.figure.id !== skyFocus?.id && (
        <Html
          position={awake.centre}
          center
          distanceFactor={SKY_RADIUS * 0.34}
          className="pointer-events-none select-none"
          zIndexRange={[8, 0]}
        >
          <span className="block whitespace-nowrap text-center font-display text-[10px] uppercase tracking-[0.28em] text-aether-muted">
            {awake.figure.name}
          </span>
          <span className="mt-0.5 block whitespace-nowrap text-center font-body text-[9px] italic text-aether-faint">
            {awake.figure.figure}
          </span>
        </Html>
      )}

      {/* The week's figure, awake. */}
      {lit && (
        <group>
          <SkyThreads
            threads={lit.threads}
            starScale={LIT_STAR_SCALE}
            color={LIT_THREAD}
            opacity={LIT_THREAD_OPACITY}
            width={LIT_THREAD_WIDTH}
            glow={LIT_THREAD_GLOW}
            glowGain={LIT_THREAD_GLOW_GAIN}
            discRadius={discRadius}
            behindDisc={LIT_BEHIND_DISC}
          />
          <SkyStars
            stars={lit.points}
            scale={LIT_STAR_SCALE}
            brightness={LIT_STAR_BRIGHTNESS}
            spikeBelow={LIT_SPIKE_BELOW}
            discRadius={discRadius}
            behindDisc={LIT_BEHIND_DISC}
          />
          <Html
            position={lit.labelAt}
            center
            distanceFactor={SKY_RADIUS * 0.34}
            className="pointer-events-none select-none"
            zIndexRange={[10, 0]}
          >
            <button
              type="button"
              onClick={() => {
                // An unrevealed day routes through the Sphinx — the card would
                // name today's star one line down (docs/EPHEMERIS_PLAN.md §11).
                if (pick && localStorage.getItem('ephemeris-riddle') !== pick.isoDate) {
                  setRiddleOpen(true);
                  return;
                }
                setCardOpen(true);
              }}
              className="pointer-events-auto block cursor-pointer whitespace-nowrap text-center transition-opacity hover:opacity-100"
              style={{ opacity: 0.85 }}
            >
              <span className="block font-display text-[8px] uppercase tracking-[0.3em] text-aether-faint">
                The sky this week
              </span>
              <span className="mt-0.5 block font-display text-[12px] uppercase tracking-[0.2em] text-nebula-soft [text-shadow:0_0_12px_rgba(192,132,252,0.45)]">
                {lit.figure.name}
              </span>
              <span className="mt-0.5 block font-body text-[9px] italic text-aether-faint">
                {lit.figure.figure}
              </span>
            </button>
          </Html>
        </group>
      )}

      {/* Stars the sources name as people — the Pleiades and their like. Each is
          a door into that figure's codex; the rest of the sky is stars. */}
      {lit?.doors.map((door) => (
        <mesh
          key={door.character}
          position={door.at}
          onPointerOver={
            isMobile
              ? undefined
              : (event) => {
                  event.stopPropagation();
                  document.body.style.cursor = 'pointer';
                  setNamed(door.character);
                }
          }
          onPointerOut={
            isMobile
              ? undefined
              : (event) => {
                  event.stopPropagation();
                  document.body.style.cursor = 'auto';
                  setNamed((current) => (current === door.character ? null : current));
                }
          }
          onClick={
            isMobile
              ? undefined
              : (event) => {
                  event.stopPropagation();
                  selectAt(door.character, door.at, TODAY_SIZE * 16);
                }
          }
        >
          <sphereGeometry args={[HIT_RADIUS, 8, 8]} />
          <meshBasicMaterial
            visible={!isMobile}
            transparent
            opacity={0}
            depthWrite={false}
            colorWrite={false}
          />
        </mesh>
      ))}
      {/* Inside the figure in focus, a star says its own name. */}
      {namedStar && !named && (
        <Html
          position={namedStar.at}
          center
          distanceFactor={SKY_RADIUS * 0.34}
          className="pointer-events-none select-none"
          zIndexRange={[9, 0]}
        >
          <span className="block -translate-y-4 whitespace-nowrap text-center font-display text-[11px] uppercase tracking-[0.22em] text-aether [text-shadow:0_0_12px_rgba(233,213,255,0.55)]">
            {namedStar.name}
          </span>
        </Html>
      )}
      {named && lit && (
        <Html
          position={lit.doors.find((door) => door.character === named)!.at}
          center
          distanceFactor={SKY_RADIUS * 0.34}
          className="pointer-events-none select-none"
          zIndexRange={[9, 0]}
        >
          <span className="block whitespace-nowrap text-center font-display text-[11px] uppercase tracking-[0.22em] text-aether [text-shadow:0_0_12px_rgba(233,213,255,0.55)]">
            {lit.doors.find((door) => door.character === named)!.starName}
          </span>
        </Html>
      )}

      {/* The tether, shown only for the figure the visitor asked about. */}
      <lineSegments renderOrder={1} frustumCulled={false}>
        <bufferGeometry ref={tetherGeom} />
        <lineBasicMaterial
          ref={tetherMat}
          color={LIT_THREAD}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

    </group>
  );
}
