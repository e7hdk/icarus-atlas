'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Story page layout "Marquee & Path": the playbill folds into a sticky gold
 *  marquee card (title, live act list, dramatis personae, scenes, tellers)
 *  riding beside the tale, which marches down an igniting constellation
 *  spine — the fill and the act stars follow the reader's place, and the
 *  act under the eyes glows on the card. Chapter prose arrives pre-rendered
 *  (server-linked) as React nodes; this component only orchestrates. */

export interface TheatreChapter {
  title: string;
  /** Sources ⚖ disagree on this episode (chapter.topic set). */
  disputed: boolean;
  /** Hover footnote: teller names + citation, prebuilt server-side. */
  footnote: string;
  prose: ReactNode;
}

export interface TheatreCast {
  name: string;
  role: string;
  /** Character id when the figure is a star in the galaxy. */
  id?: string;
  linked: boolean;
}

export interface TheatrePlace {
  name: string;
  role?: string;
  /** City id when the place is on the atlas. */
  id?: string;
  linked: boolean;
}

export interface TheatreAttestation {
  sourceName: string;
  work: string;
  citation?: string;
}

export interface TheatreEpisode {
  id: string;
  title: string;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
const NUMBER_WORDS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE'];

function roman(index: number): string {
  return ROMAN[index] ?? String(index + 1);
}

/** "A TALE IN FOUR ACTS" — words up to twelve, digits beyond, singular for one. */
function actsLine(count: number): string {
  const word = NUMBER_WORDS[count - 1] ?? String(count);
  return `A TALE IN ${word} ${count === 1 ? 'ACT' : 'ACTS'}`;
}

/** Small gold meander ornament between marquee sections. */
function Meander() {
  return (
    <div className="my-4 flex items-center gap-2.5 text-star-olympian/55" aria-hidden>
      <span className="h-px flex-1 bg-star-olympian/25" />
      <svg width="64" height="12" viewBox="0 0 64 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M1 11V1h10v7H8V4H5v7h18V1h10v7h-3V4h-3v7h18V1h10v7h-3V4h-3v7h11"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
      <span className="h-px flex-1 bg-star-olympian/25" />
    </div>
  );
}

function MarqueeHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2 mt-5 font-display text-[10px] tracking-[0.32em] text-aether-faint">
      {children}
    </h2>
  );
}

/** Gold "show the rest" pill for the marquee's clamped registers. */
function ClampPill({
  open,
  hidden,
  label,
  onToggle,
}: {
  open: boolean;
  hidden: number;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mt-2 rounded-full border border-star-olympian/35 bg-star-olympian/10 px-3.5 py-1.5 font-display text-[9.5px] tracking-[0.14em] text-star-olympian transition-colors hover:border-star-olympian/70 hover:bg-star-olympian/20"
    >
      {open ? 'SHOW LESS' : `ALL ${label} · ${hidden} MORE`}
    </button>
  );
}

/** Hover footnote superscript (tellers + citation), the codex idiom. */
function Footnote({ label, text }: { label: string; text: string }) {
  return (
    <span className="group/fn relative ml-0.5 cursor-default align-super font-body text-[13px] not-italic text-aether-faint">
      {label}
      <span className="pointer-events-none absolute bottom-full right-0 z-10 mb-1.5 hidden max-w-[80vw] whitespace-nowrap rounded-lg border border-star-olympian/40 bg-cosmos-raised px-2.5 py-1 font-body text-sm not-italic text-aether group-hover/fn:block sm:max-w-none">
        {text}
      </span>
    </span>
  );
}

const CAST_CLAMP = 8;
const PLACE_CLAMP = 6;

export function StoryTheatre({
  title,
  greekTitle,
  parent,
  summaryProse,
  summaryFootnote,
  chapters,
  cast,
  places,
  attestations,
  episodes,
}: {
  title: string;
  greekTitle?: string;
  parent?: { id: string; title: string };
  summaryProse: ReactNode;
  summaryFootnote: string;
  chapters: TheatreChapter[];
  cast: TheatreCast[];
  places: TheatrePlace[];
  attestations: TheatreAttestation[];
  episodes: TheatreEpisode[];
}) {
  const [activeAct, setActiveAct] = useState(0);
  const [allCast, setAllCast] = useState(false);
  const [allPlaces, setAllPlaces] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const voyageRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const actRefs = useRef<(HTMLElement | null)[]>([]);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeRef = useRef(0);

  /* The igniting spine: fill and act stars track the reading line at 42% of
   * the viewport. Imperative (refs + data attributes) so scrolling never
   * re-renders — the 60fps bar. The act under the line also drives the
   * marquee's live list (state, but only on change). */
  useEffect(() => {
    let raf = 0;
    const trace = () => {
      raf = 0;
      const voyage = voyageRef.current;
      const fill = fillRef.current;
      if (!voyage || !fill) return;
      const anchor = window.innerHeight * 0.42;
      const rect = voyage.getBoundingClientRect();
      const k = Math.min(Math.max((anchor - rect.top) / rect.height, 0), 1);
      fill.style.height = `${k * 100}%`;
      let current = 0;
      nodeRefs.current.forEach((node, index) => {
        const act = actRefs.current[index];
        if (!node || !act) return;
        const lit = node.getBoundingClientRect().top < anchor;
        act.dataset.lit = lit ? 'true' : 'false';
        if (lit) current = index;
      });
      if (activeRef.current !== current) {
        activeRef.current = current;
        setActiveAct(current);
      }
    };
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
    };
  }, []);

  /* Hovering a player on the programme lights every mention of them in the
   * prose (the linked names carry their codex href). */
  const litLinks = useRef<Element[]>([]);
  const lightCast = (id?: string) => {
    litLinks.current.forEach((el) => el.classList.remove('story-cast-lit'));
    litLinks.current = [];
    if (!id || !stageRef.current) return;
    const links = stageRef.current.querySelectorAll(`a[href="/character/${CSS.escape(id)}"]`);
    links.forEach((el) => el.classList.add('story-cast-lit'));
    litLinks.current = [...links];
  };
  useEffect(() => () => lightCast(undefined), []);

  const scrollToAct = (index: number) => (event: React.MouseEvent) => {
    event.preventDefault();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    actRefs.current[index]?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  const shownCast = allCast ? cast : cast.slice(0, CAST_CLAMP);
  const shownPlaces = allPlaces ? places : places.slice(0, PLACE_CLAMP);

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-x-14">
      {/* ---------------- The marquee: the programme in hand ---------------- */}
      <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
        <div className="border border-star-olympian/30 bg-cosmos-raised/40 p-[7px] shadow-[0_22px_60px_rgba(5,2,15,.5)] backdrop-blur-xl">
          <div className="border border-star-olympian/15 px-6 py-7">
            <p className="text-center font-display text-[9.5px] tracking-[0.44em] text-aether-faint">
              <span className="text-star-olympian/60">ICARUS ATLAS</span> · PRESENTS
            </p>

            {parent && (
              <Link
                href={`/story/${parent.id}`}
                className="mt-3.5 block text-center font-display text-[9.5px] uppercase tracking-[0.22em] text-nebula-soft transition-colors hover:text-aether"
              >
                An episode of {parent.title} ↗
              </Link>
            )}

            <h1 className="mt-2 text-center font-display text-[22px] leading-snug tracking-[0.12em] text-aether [text-shadow:0_0_30px_rgba(252,211,77,.35)]">
              {title.toUpperCase()}
            </h1>
            {greekTitle && (
              <p className="mt-1 text-center font-body text-[15.5px] italic text-aether-muted">
                {greekTitle}
              </p>
            )}
            <p className="mt-2 text-center font-display text-[9.5px] tracking-[0.3em] text-star-olympian/60">
              {actsLine(chapters.length)}
            </p>

            <Meander />

            <MarqueeHeading>THE ACTS</MarqueeHeading>
            <nav aria-label="The acts">
              {chapters.map((chapter, index) => {
                const active = index === activeAct;
                return (
                  <a
                    key={chapter.title}
                    href={`#act-${index + 1}`}
                    onClick={scrollToAct(index)}
                    className={`flex items-baseline gap-2.5 py-1.5 font-body text-[16px] transition-colors ${
                      active ? 'text-star-olympian' : 'text-aether-muted hover:text-aether'
                    }`}
                  >
                    <span
                      className={`h-[7px] w-[7px] shrink-0 self-center rounded-full transition-all duration-300 ${
                        active
                          ? 'bg-star-olympian shadow-[0_0_9px_2px_rgba(252,211,77,.65)]'
                          : 'bg-aether/20'
                      }`}
                    />
                    <span
                      className={`min-w-[44px] font-display text-[10px] tracking-[0.14em] ${
                        active ? 'text-star-olympian' : 'text-aether-faint'
                      }`}
                    >
                      ACT {roman(index)}
                    </span>
                    {chapter.title}
                  </a>
                );
              })}
            </nav>

            <MarqueeHeading>DRAMATIS PERSONAE</MarqueeHeading>
            <ul>
              {shownCast.map((member) => {
                const row = (
                  <>
                    <span
                      className={`h-[7px] w-[7px] shrink-0 rounded-full ${
                        member.linked
                          ? 'bg-star-mortal shadow-[0_0_6px_1px_rgba(229,231,235,.7)]'
                          : 'bg-aether-faint'
                      }`}
                    />
                    <span className={member.linked ? 'text-aether/90' : 'text-aether-muted'}>
                      {member.name}
                    </span>
                    <span
                      className="ml-auto min-w-0 truncate pl-3 text-right font-body text-[12.5px] italic text-aether-faint"
                      title={member.role}
                    >
                      {member.role}
                    </span>
                  </>
                );
                const rowClass =
                  'flex items-center gap-2.5 py-[5px] font-body text-[15.5px] transition-colors';
                return (
                  <li key={member.name}>
                    {member.linked && member.id ? (
                      <Link
                        href={`/character/${member.id}`}
                        className={`${rowClass} hover:text-star-olympian`}
                        onMouseEnter={() => lightCast(member.id)}
                        onMouseLeave={() => lightCast(undefined)}
                      >
                        {row}
                      </Link>
                    ) : (
                      <span className={rowClass} title="Not yet a star in the galaxy">
                        {row}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {cast.length > CAST_CLAMP && (
              <ClampPill
                open={allCast}
                hidden={cast.length - CAST_CLAMP}
                label={`${cast.length} PLAYERS`}
                onToggle={() => setAllCast((value) => !value)}
              />
            )}

            {places.length > 0 && (
              <>
                <MarqueeHeading>THE SCENES</MarqueeHeading>
                <ul>
                  {shownPlaces.map((place) => {
                    const row = (
                      <>
                        <span
                          className={`h-[7px] w-[7px] shrink-0 rounded-full ${
                            place.linked
                              ? 'bg-star-olympian shadow-[0_0_6px_1px_rgba(252,211,77,.7)]'
                              : 'bg-aether-faint'
                          }`}
                        />
                        <span className={place.linked ? 'text-star-olympian/90' : 'text-aether-muted'}>
                          {place.name}
                        </span>
                        {place.role && (
                          <span
                            className="ml-auto min-w-0 truncate pl-3 text-right font-body text-[12.5px] italic text-aether-faint"
                            title={place.role}
                          >
                            {place.role}
                          </span>
                        )}
                      </>
                    );
                    const rowClass =
                      'flex items-center gap-2.5 py-[5px] font-body text-[15.5px] transition-colors';
                    return (
                      <li key={place.name}>
                        {place.linked && place.id ? (
                          <Link href={`/city/${place.id}`} className={`${rowClass} hover:text-star-olympian`}>
                            {row}
                          </Link>
                        ) : (
                          <span className={rowClass}>{row}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {places.length > PLACE_CLAMP && (
                  <ClampPill
                    open={allPlaces}
                    hidden={places.length - PLACE_CLAMP}
                    label={`${places.length} SCENES`}
                    onToggle={() => setAllPlaces((value) => !value)}
                  />
                )}
              </>
            )}

            <div className="mt-5 border-t border-dotted border-star-olympian/25 pt-3.5 font-body text-[13.5px] leading-relaxed text-aether-faint">
              <span className="font-display text-[11px] tracking-[0.06em] text-aether-muted">
                Told in
              </span>{' '}
              —{' '}
              {attestations.map((attestation, index) => (
                <span key={`${attestation.sourceName}-${attestation.work}`}>
                  {index > 0 && ' · '}
                  <em>{attestation.work}</em>
                  {attestation.citation ? ` ${attestation.citation}` : ''}
                </span>
              ))}
            </div>

            <p className="mt-4 text-center font-display text-[10px] tracking-[0.44em] text-star-olympian/60">
              · EXEUNT ·
            </p>
          </div>
        </div>
      </aside>

      {/* ---------------- The stage: the tale on the igniting spine ---------------- */}
      <div ref={stageRef} className="max-w-[680px]">
        <p className="border-l-2 border-star-olympian/45 pl-6 font-body text-xl italic leading-relaxed text-aether-muted">
          {summaryProse}
          <Footnote label="1" text={summaryFootnote} />
        </p>

        <div ref={voyageRef} className="relative mt-14 pl-14 sm:pl-24">
          {/* the constellation spine */}
          <div className="absolute bottom-2 left-[19px] top-2 w-[2px] rounded-full bg-aether/10 sm:left-[31px]">
            <div
              ref={fillRef}
              className="absolute left-0 top-0 h-0 w-full rounded-full bg-gradient-to-b from-star-olympian to-nebula-soft shadow-[0_0_12px_1px_rgba(252,211,77,.5)]"
            />
          </div>

          {chapters.map((chapter, index) => (
            <section
              key={chapter.title}
              id={`act-${index + 1}`}
              ref={(el) => {
                actRefs.current[index] = el;
              }}
              data-lit="false"
              className="gilded-prose group relative scroll-mt-6 pb-16 last:pb-7"
            >
              <div
                ref={(el) => {
                  nodeRefs.current[index] = el;
                }}
                className="absolute -left-14 top-0.5 flex w-10 flex-col items-center gap-2 sm:-left-24 sm:w-16"
              >
                <span className="h-[15px] w-[15px] rounded-full bg-aether/20 transition-all duration-500 group-data-[lit=true]:bg-star-olympian group-data-[lit=true]:shadow-[0_0_12px_4px_rgba(252,211,77,.6),0_0_34px_12px_rgba(252,211,77,.22)]" />
                <span className="whitespace-nowrap font-display text-[10px] tracking-[0.15em] text-aether-faint transition-colors duration-500 group-data-[lit=true]:text-star-olympian">
                  ACT {roman(index)}
                </span>
              </div>

              <h3 className="font-display text-[22px] tracking-[0.1em] text-aether">
                {chapter.title}
                {chapter.disputed && (
                  <span className="group/dq relative ml-2.5 cursor-default align-middle text-[15px] text-nebula-soft">
                    ⚖
                    <span className="pointer-events-none absolute bottom-full left-0 z-10 mb-1.5 hidden whitespace-nowrap rounded-lg border border-nebula-soft/40 bg-cosmos-raised px-2.5 py-1 font-body text-sm tracking-normal text-aether group-hover/dq:block">
                      The sources disagree here.
                    </span>
                  </span>
                )}
              </h3>
              <p className="mt-3 font-body text-[18.5px] leading-[1.66] text-aether/90">
                {chapter.prose}
                <Footnote label={String(index + 2)} text={chapter.footnote} />
              </p>
            </section>
          ))}

          {/* terminal star */}
          <div className="relative">
            <div className="absolute -left-14 top-0 flex w-10 justify-center sm:-left-24 sm:w-16">
              <span className="h-[21px] w-[21px] rounded-full bg-star-olympian shadow-[0_0_16px_5px_rgba(252,211,77,.6),0_0_48px_18px_rgba(252,211,77,.2)]" />
            </div>
            <p className="pt-0.5 font-display text-[12px] tracking-[0.5em] text-star-olympian/60">
              · EXEUNT ·
            </p>
          </div>
        </div>

        {episodes.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-[12px] uppercase tracking-[0.3em] text-aether-faint">
              Episodes
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {episodes.map((episode) => (
                <Link
                  key={episode.id}
                  href={`/story/${episode.id}`}
                  className="rounded-full border border-glass-border bg-glass px-4 py-1.5 font-body text-[15px] text-aether/85 transition-colors hover:border-star-olympian/50 hover:text-aether"
                >
                  {episode.title}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
