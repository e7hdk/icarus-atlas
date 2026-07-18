'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Character, Relation, Source, SourceId } from '@/types/character';
import { TYPE_GLOW } from '@/types/character';
import { RING_LABELS, RING_ORDER, ringsFor, type RingKey } from '@/features/characters/categories';
import { filterSourced, isVisibleUnderLens } from '@/lib/lens';
import { useGalaxyStore } from '@/features/galaxy/store';
import { getBakedLinkedProse, getCharacterStorySegments } from '@/features/linking/load-baked';
import { LinkedProse } from '@/features/linking/LinkedProse';
import { CodexIdentity, CodexRegisters, MarqueeCard, MarqueeHeading, Meander } from './codex-marquee';
import { CodexSeal } from './CodexSeal';
import { LensDropdown } from './LensDropdown';

/** The character codex in the myth page's approved language (Codex Marquee):
 *  identity, the miniature orrery ("the codex seal"), the one source lens,
 *  the passage list, the bonds and the registers fold into a sticky gold
 *  marquee card; the life marches down an igniting spine beside it. The seal
 *  follows the tale — the passage under the reader's eyes decides which stars
 *  burn — and hovering a bond lights every mention of them in the prose. */

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function roman(index: number): string {
  return ROMAN[index] ?? String(index + 1);
}

/** Short breviary label for the passage list: the paragraph's opening words. */
function excerpt(text: string): string {
  const words = text.split(/\s+/).slice(0, 5).join(' ');
  return `${words.replace(/[,;:.]$/, '')}…`;
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

const CATEGORY_CLAMP = 6;

export function CharacterTheatre({
  character,
  characters,
  relations,
  sources,
  residences,
  appearances,
}: {
  character: Character;
  characters: Pick<Character, 'id' | 'name' | 'type'>[];
  relations: Relation[];
  sources: Source[];
  /** Resolved residence links (city id + display label), order preserved. */
  residences: { city: string; label: string }[];
  /** Sagas/episodes whose cast includes this figure. */
  appearances: { id: string; title: string }[];
}) {
  const lens = useGalaxyStore((s) => s.lens);
  const bakedProse = useMemo(() => getBakedLinkedProse(), []);
  const [openCategories, setOpenCategories] = useState<Set<RingKey>>(new Set());

  const glow = TYPE_GLOW[character.type].color;
  const byId = useMemo(() => new Map(characters.map((c) => [c.id, c])), [characters]);
  const rings = useMemo(() => ringsFor(character.id, relations, lens), [character.id, relations, lens]);
  const activeRings = RING_ORDER.filter((key) => rings[key].length > 0);

  const sourceName = useMemo(
    () => new Map<SourceId, string>(sources.map((s) => [s.id, s.name])),
    [sources],
  );
  const footnote = (entrySources: SourceId[], citation?: string) =>
    `${entrySources.map((id) => sourceName.get(id) ?? id).join(' · ')}${citation ? ` — ${citation}` : ''}`;

  const summary = filterSourced(character.summary, lens)[0];
  const passageVisible = character.story.map((p) => isVisibleUnderLens(p.sources, lens));
  const visibleCount = passageVisible.filter(Boolean).length;

  /** Per passage: the bond ids whose stars burn while it is read — the linked
   *  names of the paragraph, intersected with the figures actually in orbit. */
  const passageBodies = useMemo(() => {
    const orbiting = new Set(RING_ORDER.flatMap((key) => rings[key].map((m) => m.id)));
    return character.story.map((_, index) => {
      const segments = bakedProse
        ? getCharacterStorySegments(bakedProse, character.id, index)
        : undefined;
      if (!segments) return [] as string[];
      return [
        ...new Set(
          segments.flatMap((s) => (s.kind === 'link' && orbiting.has(s.id) ? [s.id] : [])),
        ),
      ];
    });
  }, [bakedProse, character.id, character.story, rings]);

  /* ---------------- the igniting spine + the seal follows the tale ---------------- */
  const stageRef = useRef<HTMLDivElement | null>(null);
  const voyageRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const passRefs = useRef<(HTMLElement | null)[]>([]);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sealRef = useRef<HTMLDivElement | null>(null);
  const [activePassage, setActivePassage] = useState(0);
  const activeRef = useRef(0);
  const visibleRef = useRef(passageVisible);
  useEffect(() => {
    visibleRef.current = passageVisible;
  }, [passageVisible]);

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
      let current = -1;
      nodeRefs.current.forEach((node, index) => {
        const pass = passRefs.current[index];
        if (!node || !pass) return;
        const lit = node.getBoundingClientRect().top < anchor;
        pass.dataset.lit = lit ? 'true' : 'false';
        if (lit && visibleRef.current[index]) current = index;
      });
      const seal = sealRef.current;
      if (seal) {
        const keys = current >= 0 ? passageBodies[current] : null;
        seal.dataset.follow = keys ? 'true' : 'false';
        seal.querySelectorAll<HTMLElement>('[data-seal-body]').forEach((el) => {
          el.dataset.now = keys && keys.includes(el.dataset.sealBody ?? '') ? 'true' : 'false';
        });
      }
      const next = Math.max(current, 0);
      if (activeRef.current !== next) {
        activeRef.current = next;
        setActivePassage(next);
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
  }, [passageBodies]);

  /* ---------------- bond ↔ prose ↔ seal lighting ---------------- */
  const litLinks = useRef<Element[]>([]);
  const lightMentions = (id?: string) => {
    litLinks.current.forEach((el) => el.classList.remove('story-cast-lit'));
    litLinks.current = [];
    if (!id || !stageRef.current) return;
    const links = stageRef.current.querySelectorAll(`a[href="/character/${CSS.escape(id)}"]`);
    links.forEach((el) => el.classList.add('story-cast-lit'));
    litLinks.current = [...links];
  };
  const [hotBond, setHotBond] = useState<string | null>(null);
  const hoverBond = (id: string | null) => {
    setHotBond(id);
    lightMentions(id ?? undefined);
  };
  useEffect(() => () => lightMentions(undefined), []);

  const scrollToPassage = (index: number) => (event: React.MouseEvent) => {
    event.preventDefault();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    passRefs.current[index]?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[322px_minmax(0,1fr)] lg:gap-x-14">
      {/* ---------------- the marquee: the codex in hand ---------------- */}
      <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
        <MarqueeCard>
          <CodexIdentity character={character} />

          <CodexSeal
            characterId={character.id}
            glow={glow}
            characters={characters}
            relations={relations}
            lens={lens}
            hint="the heavens follow the tale — hover a star to name it"
            hotBond={hotBond}
            onBodyHover={(id) => lightMentions(id ?? undefined)}
            containerRef={sealRef}
          />

          <Meander />

          <MarqueeHeading>TOLD AFTER</MarqueeHeading>
          <LensDropdown sources={sources} />

          {character.story.length > 0 && (
            <>
              <MarqueeHeading>THE PASSAGES</MarqueeHeading>
              <nav aria-label="The passages">
                {character.story.map((passage, index) => {
                  const active = index === activePassage && passageVisible[index];
                  const gone = !passageVisible[index];
                  return (
                    <a
                      key={index}
                      href={`#passage-${index + 1}`}
                      onClick={scrollToPassage(index)}
                      className={`flex items-baseline gap-2.5 py-1.5 font-body text-[15.5px] transition-all ${
                        gone
                          ? 'text-aether-faint/60 line-through decoration-aether-faint/40 opacity-50'
                          : active
                            ? 'text-star-olympian'
                            : 'text-aether-muted hover:text-aether'
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
                        className={`min-w-[16px] font-display text-[10px] tracking-[0.14em] ${
                          active ? 'text-star-olympian' : 'text-aether-faint'
                        }`}
                      >
                        {roman(index)}
                      </span>
                      <span className="min-w-0 truncate italic">{excerpt(passage.text)}</span>
                    </a>
                  );
                })}
              </nav>
            </>
          )}

          {activeRings.length > 0 && (
            <>
              <MarqueeHeading>THE BONDS</MarqueeHeading>
              {activeRings.map((key) => {
                const members = rings[key];
                const open = openCategories.has(key);
                const shown = open ? members : members.slice(0, CATEGORY_CLAMP);
                return (
                  <div key={`cat-${key}`}>
                    <p
                      className="mb-0.5 mt-2.5 font-display text-[9px] tracking-[0.3em]"
                      style={{ color: `${glow}8c` }}
                    >
                      {RING_LABELS[key].toUpperCase()}
                    </p>
                    <ul>
                      {shown.map((member, index) => {
                        const other = byId.get(member.id);
                        if (!other) return null;
                        const color = TYPE_GLOW[other.type].color;
                        return (
                          <li key={`${key}-${member.id}-${index}`}>
                            <Link
                              href={`/character/${member.id}`}
                              className="flex items-center gap-2.5 py-[4.5px] font-body text-[15.5px] text-aether-muted transition-colors hover:text-star-olympian"
                              onMouseEnter={() => hoverBond(member.id)}
                              onMouseLeave={() => hoverBond(null)}
                            >
                              <span
                                className="h-[7px] w-[7px] shrink-0 rounded-full"
                                style={{ background: color, boxShadow: `0 0 6px 1px ${color}` }}
                              />
                              {other.name}
                              <span className="ml-auto min-w-0 truncate pl-3 text-right font-body text-[12.5px] italic text-aether-faint">
                                {member.role}
                                {member.disputed && <span className="ml-1 text-nebula-soft">⚖</span>}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                    {members.length > CATEGORY_CLAMP && (
                      <button
                        type="button"
                        onClick={() =>
                          setOpenCategories((prev) => {
                            const next = new Set(prev);
                            if (next.has(key)) next.delete(key);
                            else next.add(key);
                            return next;
                          })
                        }
                        className="mt-1 rounded-full border border-star-olympian/35 bg-star-olympian/10 px-3 py-1 font-display text-[9px] tracking-[0.14em] text-star-olympian transition-colors hover:border-star-olympian/70 hover:bg-star-olympian/20"
                      >
                        {open
                          ? 'SHOW LESS'
                          : `ALL ${members.length} · ${members.length - CATEGORY_CLAMP} MORE`}
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          )}

          <CodexRegisters residences={residences} appearances={appearances} />

          <p className="mt-4 text-center text-[15px] tracking-[0.5em] text-aether/35">⁂</p>
        </MarqueeCard>
      </aside>

      {/* ---------------- the stage: the life on the spine ---------------- */}
      <div ref={stageRef} className="max-w-[680px]">
        {summary && (
          <p
            className="border-l-2 pl-6 font-body text-xl italic leading-relaxed text-aether-muted"
            style={{ borderColor: `${glow}80` }}
          >
            {summary.text}
            <Footnote label="1" text={footnote(summary.sources, summary.citation)} />
          </p>
        )}

        <div ref={voyageRef} className={`relative pl-14 sm:pl-24 ${summary ? 'mt-14' : 'mt-2'}`}>
          <div className="absolute bottom-2 left-[19px] top-2 w-[2px] rounded-full bg-aether/10 sm:left-[31px]">
            <div
              ref={fillRef}
              className="absolute left-0 top-0 h-0 w-full rounded-full bg-gradient-to-b from-star-olympian to-nebula-soft shadow-[0_0_12px_1px_rgba(252,211,77,.5)]"
            />
          </div>

          {character.story.map((passage, index) => {
            const visible = passageVisible[index];
            const segments = bakedProse
              ? getCharacterStorySegments(bakedProse, character.id, index)
              : undefined;
            return (
              <section
                key={index}
                id={`passage-${index + 1}`}
                ref={(el) => {
                  passRefs.current[index] = el;
                }}
                data-lit="false"
                className={`gilded-prose group relative scroll-mt-6 pb-14 transition-opacity duration-300 last:pb-7 ${
                  visible ? '' : 'pointer-events-none opacity-[.13]'
                }`}
              >
                <div
                  ref={(el) => {
                    nodeRefs.current[index] = el;
                  }}
                  className="absolute -left-14 top-1 flex w-10 flex-col items-center gap-2 sm:-left-24 sm:w-16"
                >
                  <span className="h-[15px] w-[15px] rounded-full bg-aether/20 transition-all duration-500 group-data-[lit=true]:bg-star-olympian group-data-[lit=true]:shadow-[0_0_12px_4px_rgba(252,211,77,.6),0_0_34px_12px_rgba(252,211,77,.22)]" />
                  <span className="whitespace-nowrap font-display text-[10px] tracking-[0.15em] text-aether-faint transition-colors duration-500 group-data-[lit=true]:text-star-olympian">
                    {roman(index)}
                  </span>
                </div>

                <p className="font-body text-[19px] leading-[1.66] text-aether/90">
                  <LinkedProse text={passage.text} segments={segments} />
                  <Footnote
                    label={String(index + 2)}
                    text={footnote(passage.sources, passage.citation)}
                  />
                  {passage.topic && lens === 'consensus' && (
                    <span className="group/dq relative ml-1.5 cursor-default text-[15px] text-nebula-soft">
                      ⚖
                      <span className="pointer-events-none absolute bottom-full left-0 z-10 mb-1.5 hidden whitespace-nowrap rounded-lg border border-nebula-soft/40 bg-cosmos-raised px-2.5 py-1 font-body text-sm text-aether group-hover/dq:block">
                        Told differently in other tellings — change the lens on the card
                      </span>
                    </span>
                  )}
                </p>
              </section>
            );
          })}

          {visibleCount === 0 && (
            <p className="pb-8 font-body text-lg italic text-aether-faint">
              Nothing of this figure survives under this teller — choose another on the card.
            </p>
          )}

          {/* terminal star */}
          <div className="relative">
            <div className="absolute -left-14 top-0 flex w-10 justify-center sm:-left-24 sm:w-16">
              <span className="h-[21px] w-[21px] rounded-full bg-star-olympian shadow-[0_0_16px_5px_rgba(252,211,77,.6),0_0_48px_18px_rgba(252,211,77,.2)]" />
            </div>
            <p className="pt-0.5 text-[17px] tracking-[0.55em] text-aether/40">⁂</p>
          </div>
        </div>

        <p className="mt-12 text-center font-body text-[13.5px] italic text-aether-faint">
          the spine ignites as you read · hover a bond on the card — every mention of them lights in
          the story
        </p>
      </div>
    </div>
  );
}
