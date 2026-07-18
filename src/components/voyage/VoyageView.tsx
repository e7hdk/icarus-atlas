'use client';

import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import { ArtworkImage } from '@/components/ui/ArtworkImage';
import { PinnedEpigraph } from '@/components/voyage/PinnedEpigraph';
import { StarSea } from '@/components/voyage/StarSea';
import { VoyageAudio } from '@/components/voyage/VoyageAudio';
import { useVoyageAudioStore } from '@/features/voyage/store';
import type { VoyageMood } from '@/types/story';

/** Nostos — the Odyssey told as a constellation being drawn (docs/NOSTOS_PLAN.md §4–6).
 *  A single rAF drives everything on scroll — the igniting spine, the station
 *  stars, and Penelope's thread at the screen edge — through refs and data
 *  attributes only, so scrolling never re-renders React (the 60fps bar).
 *  All myth prose arrives pre-rendered from the server (sourced episode
 *  chapters); epigraphs are verbatim bilingual quotations with citations. */

export interface VoyageViewEpigraph {
  grc: string;
  en: string;
  citation: string;
}

export interface VoyageViewChapter {
  title: string;
  disputed: boolean;
  /** Teller names + citation, prebuilt server-side. */
  citeline: string;
  prose: ReactNode;
}

export interface VoyageViewArtwork {
  title: string;
  artist: string;
  year: string;
  imageUrl: string;
  description: string;
}

export interface VoyageViewCastChip {
  name: string;
  id?: string;
  linked: boolean;
}

export interface VoyageViewStation {
  id: string;
  movement: 1 | 2 | 3;
  title: string;
  kicker?: string;
  told?: boolean;
  /** Pinned scroll-scrubbed epigraph scene (NOSTOS_PLAN D12 experiment B). */
  pinned?: boolean;
  /** Drives the mood-stem mixer as the reading line crosses the station. */
  mood: VoyageMood;
  /** First station of the apologoi — render the register-shift rubric above it. */
  showToldRubric?: boolean;
  epigraph: VoyageViewEpigraph;
  chapters: VoyageViewChapter[];
  art: VoyageViewArtwork[];
  cast: VoyageViewCastChip[];
  castMore: number;
  episodeId: string;
  episodeTitle: string;
  place?: { id: string; name: string };
}

export interface VoyageViewMovement {
  n: 1 | 2 | 3;
  roman: string;
  title: string;
  books: string;
}

export interface VoyageViewProps {
  movements: VoyageViewMovement[];
  stations: VoyageViewStation[];
  finaleEpigraph?: VoyageViewEpigraph;
  finaleCast: VoyageViewCastChip[];
}

function EpigraphFragment({ epigraph }: { epigraph: VoyageViewEpigraph }) {
  return (
    <figure className="gilded-prose voyage-reveal my-10 max-w-3xl border-y border-star-olympian/15 px-2 py-8 sm:px-6">
      <blockquote lang="grc" className="whitespace-pre-line font-body text-lg leading-relaxed text-aether-muted sm:text-xl">
        {epigraph.grc}
      </blockquote>
      <blockquote className="mt-6 font-body text-xl italic leading-relaxed text-aether sm:text-2xl">
        {epigraph.en}
      </blockquote>
      <figcaption className="mt-5 font-display text-[10px] tracking-[0.24em] text-star-olympian/70">
        {epigraph.citation} · TRANS. A. T. MURRAY, 1919
      </figcaption>
    </figure>
  );
}

function CastChips({
  cast,
  castMore,
  episodeId,
  episodeTitle,
  place,
}: {
  cast: VoyageViewCastChip[];
  castMore: number;
  episodeId: string;
  episodeTitle: string;
  place?: { id: string; name: string };
}) {
  const chip =
    'rounded-full border border-glass-border bg-glass px-3 py-1 font-display text-[10px] tracking-[0.12em] backdrop-blur-sm transition-colors';
  return (
    <div className="voyage-reveal mt-9 flex flex-wrap items-center gap-2">
      {cast.map((member) =>
        member.linked && member.id ? (
          <Link
            key={member.name}
            href={`/character/${member.id}`}
            className={`${chip} text-aether-muted hover:border-star-olympian/50 hover:text-aether`}
          >
            {member.name}
          </Link>
        ) : (
          <span key={member.name} className={`${chip} text-aether-faint`}>
            {member.name}
          </span>
        ),
      )}
      {place && (
        <Link
          href={`/city/${place.id}`}
          className={`${chip} text-nebula-soft hover:border-nebula-soft/60 hover:text-aether`}
        >
          ◈ {place.name}
        </Link>
      )}
      <Link
        href={`/story/${episodeId}`}
        className={`${chip} text-star-olympian/80 hover:border-star-olympian/60 hover:text-star-olympian`}
        title={`Read "${episodeTitle}" in the codex`}
      >
        {castMore > 0 ? `+${castMore} more · ` : ''}FULL EPISODE ↗
      </Link>
    </div>
  );
}

function StationSection({
  station,
  sectionRef,
}: {
  station: VoyageViewStation;
  sectionRef: (el: HTMLElement | null) => void;
}) {
  return (
    <section
      ref={sectionRef}
      aria-labelledby={`station-${station.id}`}
      className="relative isolate pb-32 pt-2"
    >
      {/* Reading scrim: the sky dims softly behind the prose so the words own
          the contrast, and melts back to open stars at every edge — gateways
          and the overture masthead stay under naked sky. No backdrop-filter
          (a column-sized blur repaints on scroll); a pure gradient is free. */}
      <div
        aria-hidden
        className="absolute -inset-x-6 -top-6 bottom-6 -z-[1] rounded-[2.5rem] bg-[linear-gradient(180deg,transparent,rgba(5,2,15,0.68)_6%,rgba(5,2,15,0.68)_94%,transparent)] [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)] sm:-inset-x-12"
      />
      {station.showToldRubric && (
        <p className="voyage-reveal mb-6 max-w-2xl border-l-2 border-nebula-soft/40 pl-4 font-body text-[15px] italic text-nebula-soft">
          From here the voice changes: shipwrecked at the Phaeacian court, Odysseus tells the
          wanderings himself — a survivor narrating his own past. (Od. 9–12)
        </p>
      )}

      {/* The landfall: the station announces itself with a whole held breath
          of sky before the fragment begins. Pinned stations skip this — their
          title opens INSIDE the held scene, as part of its choreography. */}
      {!station.pinned && (
        <header className="voyage-reveal flex min-h-[46vh] flex-col justify-center">
          {station.kicker && (
            <p className="font-display text-[11px] tracking-[0.32em] text-aether-faint">
              {station.kicker}
              {station.told && <span className="text-nebula-soft/80"> · HE TELLS IT</span>}
            </p>
          )}
          <h3
            id={`station-${station.id}`}
            className="mt-3 font-display text-4xl tracking-[0.04em] text-aether sm:text-5xl"
          >
            {station.title}
          </h3>
        </header>
      )}

      {station.pinned ? (
        <PinnedEpigraph
          stationId={station.id}
          title={station.title}
          kicker={station.kicker}
          told={station.told}
          epigraph={station.epigraph}
          underworld={station.id === 'the-house-of-the-dead' || station.id === 'the-oar-and-the-sea'}
        />
      ) : (
        <EpigraphFragment epigraph={station.epigraph} />
      )}

      <div className="max-w-3xl space-y-10">
        {station.chapters.map((chapter) => (
          <div key={chapter.title} className="voyage-reveal">
            <h4 className="font-display text-[14px] tracking-[0.18em] text-star-olympian/85">
              {chapter.title.toUpperCase()}
              {chapter.disputed && (
                <span className="ml-2 cursor-default text-aether-faint" title="The sources disagree here.">
                  ⚖
                </span>
              )}
            </h4>
            <div className="mt-2 font-body text-[18px] leading-[1.75] text-aether-muted sm:text-[19px] sm:leading-[1.8]">
              {chapter.prose}
            </div>
            <p className="mt-2 font-display text-[10.5px] tracking-[0.2em] text-aether-faint/80">
              {chapter.citeline}
            </p>
          </div>
        ))}
      </div>

      {station.art.length > 0 && (
        <div className="mt-14 space-y-14">
          {station.art.map((artwork) => (
            <figure key={`${artwork.artist} — ${artwork.title}`} className="voyage-reveal">
              <ArtworkImage
                src={artwork.imageUrl}
                title={artwork.title}
                meta={`${artwork.artist}, ${artwork.year}`}
                className="aspect-[16/10] w-full"
              />
              <figcaption className="mt-3">
                <p className="font-display text-[13px] tracking-[0.08em] text-aether">{artwork.title}</p>
                <p className="font-body text-[14px] italic text-aether-faint">
                  {artwork.artist}, {artwork.year}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <CastChips
        cast={station.cast}
        castMore={station.castMore}
        episodeId={station.episodeId}
        episodeTitle={station.episodeTitle}
        place={station.place}
      />
    </section>
  );
}

/* Penelope's thread as actual yarn: a gently waving SVG path. The knots ride
 * the same sine, so thread and knots always agree. */
const THREAD_WAVES = 4.5;
const THREAD_AMP = 4.4;
const threadX = (t: number) => 7 + THREAD_AMP * Math.sin(t * THREAD_WAVES * 2 * Math.PI);
const THREAD_PATH = (() => {
  const steps = 72;
  const points: string[] = [];
  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    points.push(`${threadX(t).toFixed(2)} ${(t * 1000).toFixed(1)}`);
  }
  return `M${points.join(' L')}`;
})();

const DOORS = [
  { href: '/', title: 'ENTER THE GALAXY', line: 'Every figure of this story is a star. Go meet them.' },
  { href: '/story/odyssey', title: 'THE SAGA CODEX', line: 'The full telling — every episode, every teller, every dispute.' },
  { href: '/story/telegony', title: 'HOW IT ENDS ⚖', line: 'The poets could not agree how his story ends.' },
  { href: '/stories', title: 'ALL THE MYTHS', line: 'The Spindle of Time holds every saga in the atlas.' },
];

export function VoyageView({ movements, stations, finaleEpigraph, finaleCast }: VoyageViewProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const threadRef = useRef<SVGPathElement | null>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const knotRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /* One rAF for the whole voyage: spine fill, star ignition, Penelope's thread,
   * and the mood under the reading line (dispatched to the stem mixer only on
   * change). Scroll back and the thread unweaves — the fill just retreats. */
  useEffect(() => {
    const audioStore = useVoyageAudioStore.getState();
    audioStore.setActive(true);
    document.documentElement.classList.add('voyage-hide-scrollbar');
    const moods = stations.map((station) => station.mood);
    const stationMovements = stations.map((station) => station.movement);
    let currentMood: VoyageMood | null = null;
    const setMood = (mood: VoyageMood) => {
      if (mood !== currentMood) {
        currentMood = mood;
        useVoyageAudioStore.getState().setMood(mood);
      }
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const trace = () => {
      raf = 0;
      const anchor = window.innerHeight * 0.42;
      let current = -1;
      let within = 0;
      sectionRefs.current.forEach((section, index) => {
        if (!section) return;
        const rect = section.getBoundingClientRect();
        if (rect.top < anchor) {
          current = index;
          within = Math.min(Math.max((anchor - rect.top) / rect.height, 0), 1);
        }
      });
      /* The thread weaves in station-space: each knot is one station, the fill
       * between knots is progress inside the current one. Scroll back and the
       * weaving comes undone (the stroke retracts along the yarn). */
      const thread = threadRef.current;
      if (thread) {
        const k = current < 0 ? 0 : Math.min((current + within) / moods.length, 1);
        thread.style.strokeDashoffset = String(1 - k);
      }
      knotRefs.current.forEach((knot, index) => {
        if (!knot) return;
        const state = index < current ? 'passed' : index === current ? 'current' : 'ahead';
        if (knot.dataset.state !== state) knot.dataset.state = state;
      });
      setMood(current >= 0 ? (moods[current] ?? 'silence') : 'silence');
      /* The sky changes country with the poem's movements (tint crossfade). */
      const movement = String(current >= 0 ? (stationMovements[current] ?? 1) : 1);
      if (rootRef.current && rootRef.current.dataset.movement !== movement) {
        rootRef.current.dataset.movement = movement;
      }
    };

    const teardownStore = () => {
      document.documentElement.classList.remove('voyage-hide-scrollbar');
      const store = useVoyageAudioStore.getState();
      store.setMood(null);
      store.setActive(false);
    };

    if (reduced) {
      /* Reduced motion: the thread arrives fully woven, every knot passed —
       * no scroll-driven animation; the sea bed plays steadily. */
      const thread = threadRef.current;
      if (thread) thread.style.strokeDashoffset = '0';
      knotRefs.current.forEach((knot) => {
        if (knot) knot.dataset.state = 'passed';
      });
      setMood('open-sea');
      return teardownStore;
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(trace);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
      teardownStore();
    };
  }, [stations]);

  /* Arrival reveals: every .voyage-reveal block is stamped once as it enters. */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.shown = 'true';
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    root.querySelectorAll('.voyage-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [stations]);

  const indexById = new Map(stations.map((station, index) => [station.id, index]));

  const sailTo = (index: number) => () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    sectionRefs.current[index]?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <div ref={rootRef} data-movement="1" className="group/voyage relative">
      <StarSea />
      <VoyageAudio />

      {/* Per-movement sky tint: each part of the poem is a different country —
          cool Ithacan night, the violet sea of the tale, gold homecoming dawn. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-[5]">
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_10%,rgba(96,165,250,0.07),transparent_60%)] opacity-0 transition-opacity duration-[3000ms] group-data-[movement=1]/voyage:opacity-100" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,rgba(192,132,252,0.09),transparent_65%)] opacity-0 transition-opacity duration-[3000ms] group-data-[movement=2]/voyage:opacity-100" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_85%,rgba(252,211,77,0.06),transparent_60%)] opacity-0 transition-opacity duration-[3000ms] group-data-[movement=3]/voyage:opacity-100" />
      </div>

      {/* Overture masthead. */}
      <header className="mx-auto flex min-h-[86vh] w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-[11px] tracking-[0.5em] text-star-olympian/70">ICARUS ATLAS · PRESENTS</p>
        <h1 className="mt-6 font-display text-5xl tracking-[0.08em] text-aether sm:text-7xl">
          THE ODYSSEY
        </h1>
        <p className="mt-3 font-body text-2xl italic text-aether-muted" lang="grc">
          Ὀδύσσεια
        </p>
        <p className="mt-8 max-w-md font-body text-lg italic leading-relaxed text-aether-muted">
          Twenty years. A man sailing home by the stars; a house holding its breath. This is the
          story of a return — told station by station, in the poem&apos;s own words.
        </p>
        <p className="mt-14 animate-pulse font-display text-[10px] tracking-[0.4em] text-aether-faint motion-reduce:animate-none">
          SCROLL TO SET SAIL ↓
        </p>
      </header>

      {/* Penelope's thread — hanging yarn at the screen's left hand, clear of
          every line of text. A gently waving strand that WEAVES itself as the
          voyage advances (and unweaves backward); the knots ride the same wave,
          one per station — click to sail there. Hovering the thread reveals all
          the station names; the current station's name always glows quietly.
          Fixed above the pinned veils: the thread never breaks, even in the dark. */}
      <nav
        aria-label="Voyage stations"
        className="group/thread fixed left-3 top-1/2 z-20 hidden h-[66vh] w-4 -translate-y-1/2 sm:block lg:left-5"
      >
        <svg
          aria-hidden
          viewBox="0 0 14 1000"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-[14px] overflow-visible"
        >
          <defs>
            <linearGradient id="voyage-thread-weave" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(252,211,77,0.95)" />
              <stop offset="0.45" stopColor="rgba(192,132,252,0.8)" />
              <stop offset="1" stopColor="rgba(252,211,77,0.95)" />
            </linearGradient>
          </defs>
          <path
            d={THREAD_PATH}
            fill="none"
            stroke="rgba(229,231,235,0.16)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          <path
            ref={threadRef}
            d={THREAD_PATH}
            fill="none"
            stroke="url(#voyage-thread-weave)"
            strokeWidth="2.4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
          />
        </svg>
        {stations.map((station, index) => {
          const t = (index + 0.5) / stations.length;
          return (
            <button
              key={station.id}
              ref={(el) => {
                knotRefs.current[index] = el;
              }}
              type="button"
              data-state="ahead"
              onClick={sailTo(index)}
              aria-label={`Sail to ${station.title}`}
              className="group/knot absolute hidden -translate-x-1/2 -translate-y-1/2 p-1.5 lg:block"
              style={{ top: `${t * 100}%`, left: `${threadX(t).toFixed(1)}px` }}
            >
              <span className="block size-2 rotate-45 border border-aether-faint/60 bg-cosmos-raised transition-all duration-500 group-hover/thread:scale-110 group-hover/knot:!scale-150 group-data-[state=current]/knot:scale-[1.6] group-data-[state=current]/knot:border-star-olympian group-data-[state=current]/knot:bg-star-olympian group-data-[state=current]/knot:shadow-[0_0_12px_3px_rgba(252,211,77,0.45)] group-data-[state=passed]/knot:border-star-olympian/70 group-data-[state=passed]/knot:bg-star-olympian/60" />
              <span className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap font-display text-[9.5px] tracking-[0.2em] text-aether-muted opacity-0 transition-all duration-300 group-hover/thread:opacity-70 group-hover/knot:!text-star-olympian group-hover/knot:!opacity-100 group-data-[state=current]/knot:text-star-olympian/90 group-data-[state=current]/knot:opacity-80">
                {station.title.toUpperCase()}
              </span>
            </button>
          );
        })}
      </nav>

      {/* The voyage column — wide enough to breathe, prose kept to a readable
          measure inside it. */}
      <div className="relative mx-auto w-full max-w-4xl px-6 pl-12 sm:pl-16">

        {movements.map((movement) => (
          <div key={movement.n}>
            {/* The gateway: a whole screen for each part of the poem — a new
                country begins here, under a new colour of sky. */}
            <section className="relative flex min-h-[92vh] flex-col items-center justify-center text-center">
              <span
                aria-hidden
                className="pointer-events-none absolute select-none font-display text-[11rem] leading-none text-star-olympian/[0.05] sm:text-[18rem]"
              >
                {movement.roman}
              </span>
              <div className="voyage-reveal relative">
                <p className="font-display text-[11px] tracking-[0.5em] text-star-olympian/70">
                  MOVEMENT {movement.roman}
                </p>
                <h2 className="mt-5 font-display text-5xl tracking-[0.1em] text-aether sm:text-6xl">
                  {movement.title.toUpperCase()}
                </h2>
                <p className="mt-4 font-display text-[11px] tracking-[0.34em] text-aether-faint">
                  {movement.books.toUpperCase()}
                </p>
              </div>
            </section>
            {stations
              .filter((station) => station.movement === movement.n)
              .map((station) => {
                const index = indexById.get(station.id) ?? 0;
                return (
                  <StationSection
                    key={station.id}
                    station={station}
                    sectionRef={(el) => {
                      sectionRefs.current[index] = el;
                    }}
                  />
                );
              })}
          </div>
        ))}
      </div>

      {/* Finale: the constellation is complete — every door leads deeper in. */}
      <footer className="mx-auto w-full max-w-3xl px-6 pb-32 pt-16 text-center">
        <p className="font-display text-[11px] tracking-[0.44em] text-star-olympian/70">
          THE CONSTELLATION IS COMPLETE
        </p>
        <h2 className="mt-4 font-display text-3xl tracking-[0.08em] text-aether sm:text-4xl">
          HE SAILED HOME BY THE STARS
        </h2>
        {finaleEpigraph && (
          <div className="mx-auto mt-4 max-w-2xl text-left">
            <EpigraphFragment epigraph={finaleEpigraph} />
          </div>
        )}
        <p className="mx-auto mt-2 max-w-xl font-body text-lg italic leading-relaxed text-aether-muted">
          Calypso told him to keep the Bear on his left hand. In this atlas the whole of Greek myth
          is a sky — and the people of his story are stars in it, waiting.
        </p>

        <div className="voyage-reveal mt-12 grid gap-4 sm:grid-cols-2">
          {DOORS.map((door) => (
            <Link
              key={door.href}
              href={door.href}
              className="group border border-star-olympian/30 bg-cosmos-raised/40 px-6 py-6 text-left backdrop-blur-xl transition-colors hover:border-star-olympian/70"
            >
              <p className="font-display text-[12px] tracking-[0.26em] text-star-olympian group-hover:text-star-olympian">
                {door.title} →
              </p>
              <p className="mt-2 font-body text-[15px] italic text-aether-muted">{door.line}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
          {finaleCast.map((member) =>
            member.linked && member.id ? (
              <Link
                key={member.name}
                href={`/character/${member.id}`}
                className="rounded-full border border-glass-border bg-glass px-3.5 py-1.5 font-display text-[10px] tracking-[0.12em] text-aether-muted backdrop-blur-sm transition-colors hover:border-star-olympian/50 hover:text-aether"
              >
                ✦ {member.name}
              </Link>
            ) : null,
          )}
        </div>
      </footer>
    </div>
  );
}
