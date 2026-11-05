'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GalaxyCanvas } from '@/components/galaxy/GalaxyCanvas';
import type { CameraAim } from '@/components/galaxy/CameraRig';
import type { GalaxySky } from '@/components/galaxy/GalaxyDoor';
import { discRadiusOf } from '@/components/galaxy/discRadius';
import { ATLAS_FILES } from '@/features/atlas/files';
import { useAtlasFile } from '@/features/atlas/useAtlasFile';
import type { Vec3 } from '@/features/galaxy/layout';
import { useGalaxyStore } from '@/features/galaxy/store';
import { useGalaxyPositions } from '@/features/galaxy/usePositions';
import { useReadingStore, type ReadingLens } from '@/features/library/reading-store';
import { useIsMobile } from '@/lib/useIsMobile';

/** The sky of First, Chaos (docs/LIBRARY_PLAN.md §8): the atlas's own galaxy, dark,
 *  lighting the figures Hesiod names in the order he sings them, with the parent
 *  lines he gives. At the end the lens turns to Homer: the stars he never names
 *  sink to a fifth, and Aphrodite's line leaves Uranus for Zeus and Dione. The
 *  sky is looked at, not touched — the column is read, and leads it. */

export interface SkyBeat {
  from: number;
  to: number;
  ignite: string[];
}

/** The focus sits in the open sky: right of the column on a wide screen, above the
 *  reading pane on a phone. */
const WIDE_AIM: CameraAim = { right: -0.26, up: 0 };
const PHONE_AIM: CameraAim = { right: 0, up: -0.25 };
const QUARREL = 'aphrodite-parentage';
const FINALE_CAST = ['aphrodite', 'uranus', 'zeus', 'dione'];
const THEOGONY_LINES = 1022;
const NONE: string[] = [];

const centroid = (points: Vec3[]): Vec3 => {
  const sum = points.reduce<Vec3>((acc, [x, y, z]) => [acc[0] + x, acc[1] + y, acc[2] + z], [0, 0, 0]);
  return [sum[0] / points.length, sum[1] / points.length, sum[2] / points.length];
};

function Reading({ sky, beats }: { sky: GalaxySky; beats: SkyBeat[] }) {
  const positions = useGalaxyPositions(sky.characters, sky.relations, sky.bakedLayout);
  const disc = useMemo(() => discRadiusOf(positions), [positions]);
  const isMobile = useIsMobile();
  const router = useRouter();
  const chosen = useReadingStore((s) => s.chosen);
  const [beat, setBeat] = useState(-1);
  const [finale, setFinale] = useState(false);
  const lens: ReadingLens = finale ? (chosen ?? 'homer') : 'hesiod';
  const [still] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const litBy = useMemo(() => {
    const lit = new Set<string>();
    return beats.map((entry) => {
      for (const id of entry.ignite) lit.add(id);
      return [...lit];
    });
  }, [beats]);
  const parents = useMemo(() => sky.relations.filter((relation) => relation.type === 'parent'), [sky.relations]);
  const told = useMemo(() => new Map(sky.characters.map((character) => [character.id, character.told])), [sky.characters]);
  const lit = beat >= 0 ? litBy[Math.min(beat, litBy.length - 1)] : NONE;

  // the beat under the reading line, and whether the finale has begun
  useEffect(() => {
    const pane = document.querySelector<HTMLElement>('[data-reading-pane]');
    let frame = 0;
    const trace = () => {
      frame = 0;
      const phone = window.matchMedia('(max-width: 767px)').matches;
      const line = window.innerHeight * (phone ? 0.62 : 0.45);
      let at = -1;
      const sections = document.querySelectorAll<HTMLElement>('[data-beat]');
      sections.forEach((section, index) => {
        if (section.getBoundingClientRect().top < line) at = index;
      });
      sections.forEach((section, index) => section.toggleAttribute('data-now', index === at));
      const end = document.querySelector('[data-finale]');
      setBeat(at);
      setFinale(Boolean(end && end.getBoundingClientRect().top < line));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(trace);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    pane?.addEventListener('scroll', schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      pane?.removeEventListener('scroll', schedule);
    };
  }, []);

  // what burns, what is drawn, and where the camera looks
  useEffect(() => {
    const store = useGalaxyStore.getState();
    const burning = new Set(lit);
    const drawn = parents.filter((relation) => relation.sources.includes(lens) && burning.has(relation.from) && burning.has(relation.to));
    store.setLens(lens);
    store.setLit({
      stars: lit,
      relations: drawn.map((relation) => relation.id),
      accent: finale ? drawn.filter((relation) => relation.topic === QUARREL).map((relation) => relation.id) : [],
    });
    if (still) return;
    const named = finale ? FINALE_CAST : beat >= 0 ? beats[beat].ignite : [];
    const points = named.map((id) => positions.get(id)).filter((point): point is Vec3 => point !== undefined);
    if (points.length === 0) {
      store.select(null);
      return;
    }
    const centre = centroid(points);
    const spread = Math.max(...points.map(([x, y, z]) => Math.hypot(x - centre[0], y - centre[1], z - centre[2])));
    const distance = Math.min(Math.max(spread * 2.6 + 24, 34), Math.max(60, disc * 1.4));
    // a phone's sky is the top two fifths of its screen: stand further off
    store.selectAt(named[0], centre, isMobile ? distance * 1.35 : distance);
  }, [beat, finale, lens, lit, parents, beats, positions, disc, still, isMobile]);

  // leaving puts the galaxy back as it was found
  useEffect(() => {
    const before = useGalaxyStore.getState().lens;
    return () => {
      const store = useGalaxyStore.getState();
      store.setLit(null);
      store.select(null);
      store.setLens(before);
      useReadingStore.getState().choose(null);
    };
  }, []);

  // Escape returns to the Theogony's reading page
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const store = useGalaxyStore.getState();
      if (store.searchOpen || store.settingsOpen) return;
      router.push('/library/hesiod/theogony');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router]);

  const shown = lens === 'homer' ? lit.filter((id) => told.get(id)?.includes('homer')).length : lit.length;
  const reached = beat < 0 ? 0 : finale ? THEOGONY_LINES : beats[beat].to;
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <GalaxyCanvas characters={sky.characters} relations={sky.relations} positions={positions} reading={{ aim: isMobile ? PHONE_AIM : WIDE_AIM }} />
      </div>
      <div className="theogony-thread" aria-hidden>
        <div className="theogony-thread-fill" style={{ height: `${(reached / THEOGONY_LINES) * 100}%` }} />
        {beats.map((entry) => (
          <div key={entry.from} className="theogony-thread-tick" style={{ top: `${(entry.from / THEOGONY_LINES) * 100}%` }} />
        ))}
      </div>
      <div className="theogony-hud" aria-live="polite">
        <div className="font-body text-[34px] font-medium text-aether drop-shadow-[0_0_20px_rgba(192,132,252,0.5)] max-md:text-[26px]">{shown}</div>
        <div className="font-display text-[9px] tracking-[0.26em] text-aether-faint">{lens === 'homer' ? 'OF THEM HOMER NAMES' : 'STARS LIT'}</div>
        <div className="mt-2.5 font-display text-[9.5px] tracking-[0.24em] text-star-olympian">{lens === 'homer' ? 'AS HOMER TELLS IT' : 'AS HESIOD SINGS IT'}</div>
      </div>
    </>
  );
}

export function TheogonySky({ beats }: { beats: SkyBeat[] }) {
  const { data: sky } = useAtlasFile<GalaxySky>(ATLAS_FILES.galaxy);
  if (!sky) return null;
  return <Reading sky={sky} beats={beats} />;
}
