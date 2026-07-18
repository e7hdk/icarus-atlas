'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { CharacterType } from '@/types/character';
import { TYPE_GLOW } from '@/types/character';
import { MarqueeCard, MarqueeHeading, Meander } from '@/components/character/codex-marquee';

/** The city codex in the marquee language (city concept A — Dynasty Spine):
 *  the marquee card carries the city's identity, a miniature of her sky
 *  (real dwellers as the seal) and the live reign index; the royal
 *  succession marches down the igniting spine beside it — a dynasty read
 *  like a tale. Cities without a recorded line keep an honest empty stage. */

export interface TheatreReign {
  /** Plain ruler label for the marquee index. */
  label: string;
  /** Server-rendered ruler name(s) with type-colored codex links. */
  title: ReactNode;
  note?: string;
  /** Hover footnote: teller names + citation, prebuilt server-side. */
  footnote: string;
  disputed: boolean;
}

export interface SealResident {
  id: string;
  name: string;
  type: CharacterType;
}

/** 1..3999 — Argos alone needs XXX. */
function roman(value: number): string {
  const TABLE: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let rest = value;
  let out = '';
  for (const [n, glyph] of TABLE) {
    while (rest >= n) {
      out += glyph;
      rest -= n;
    }
  }
  return out;
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

const SEAL_RINGS = [35, 63, 91];
const SEAL_SPIN_SECONDS = [110, 155, 200];

/** Her sky in miniature: real dwellers scattered on slow rings (golden-angle,
 *  deterministic), each in its type glow — a living preview of the sky tab. */
function CitySeal({ residents }: { residents: SealResident[] }) {
  const router = useRouter();
  const [tip, setTip] = useState<string | null>(null);
  return (
    <div className="orrery relative mt-4 h-[210px]">
      <span
        className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 whitespace-nowrap font-body text-[13.5px] italic text-nebula-soft transition-opacity duration-200"
        style={{ opacity: tip ? 1 : 0 }}
      >
        {tip ?? ' '}
      </span>
      {SEAL_RINGS.map((radius, index) => (
        <span
          key={radius}
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
          style={{
            width: radius * 2,
            height: radius * 2,
            borderStyle: index % 2 ? 'dashed' : 'solid',
          }}
        />
      ))}
      <span
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: 14,
          height: 14,
          background: 'radial-gradient(circle at 38% 34%, #fef3c7, #fcd34d 55%, #b45309)',
          boxShadow: '0 0 14px 5px rgba(252,211,77,.7), 0 0 46px 18px rgba(252,211,77,.25)',
          animation: 'orrery-pulse 4s ease-in-out infinite',
          transform: 'translate(-50%, -50%)',
        }}
      />
      {residents.map((resident, index) => {
        const color = TYPE_GLOW[resident.type].color;
        const radius = SEAL_RINGS[index % SEAL_RINGS.length];
        return (
          <span
            key={resident.id}
            data-orrery-ring
            className="absolute left-1/2 top-1/2 h-0 w-0"
            style={{
              animation: `${index % 2 ? 'orrery-spin-reverse' : 'orrery-spin'} ${SEAL_SPIN_SECONDS[index % 3]}s linear infinite`,
              transform: `rotate(${(index * 137.5) % 360}deg)`,
            }}
          >
            <button
              type="button"
              aria-label={`${resident.name} — dweller of this city`}
              className="absolute cursor-pointer rounded-full transition-shadow duration-300"
              style={{
                left: radius,
                top: 0,
                width: 5 + (index % 3),
                height: 5 + (index % 3),
                background: color,
                boxShadow: `0 0 5px 1.5px ${color}, 0 0 12px 4px ${color}4d`,
                transform: 'translate(-50%, -50%)',
              }}
              onMouseEnter={() => setTip(resident.name)}
              onMouseLeave={() => setTip(null)}
              onClick={() => router.push(`/character/${resident.id}`)}
            />
          </span>
        );
      })}
    </div>
  );
}

export function CityTheatre({
  city,
  regionLabel,
  residentCount,
  sealResidents,
  reigns,
}: {
  city: { id: string; name: string; greekName: string; pleiadesId: string };
  regionLabel?: string;
  residentCount: number;
  sealResidents: SealResident[];
  reigns: TheatreReign[];
}) {
  const [activeReign, setActiveReign] = useState(0);
  const voyageRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const reignRefs = useRef<(HTMLElement | null)[]>([]);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeRef = useRef(0);

  /* The igniting spine: same imperative trace as the story/character stages —
   * fill height + node stars via data attributes, state only on change. */
  useEffect(() => {
    if (reigns.length === 0) return;
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
        const reign = reignRefs.current[index];
        if (!node || !reign) return;
        const lit = node.getBoundingClientRect().top < anchor;
        reign.dataset.lit = lit ? 'true' : 'false';
        if (lit) current = index;
      });
      if (activeRef.current !== current) {
        activeRef.current = current;
        setActiveReign(current);
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
  }, [reigns.length]);

  const scrollToReign = (index: number) => (event: React.MouseEvent) => {
    event.preventDefault();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    reignRefs.current[index]?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[322px_minmax(0,1fr)] lg:gap-x-14">
      {/* ---------------- the marquee: the city in hand ---------------- */}
      <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
        <MarqueeCard>
          <p className="text-center font-display text-[9.5px] tracking-[0.44em] text-aether-faint">
            <span className="text-star-olympian/60">ICARUS ATLAS</span> · THE CITY OF
          </p>
          <h1 className="mt-3 text-center font-display text-[28px] leading-snug tracking-[0.17em] text-aether [text-shadow:0_0_16px_rgba(252,211,77,.6),0_0_46px_rgba(252,211,77,.28)]">
            {city.name.toUpperCase()}
          </h1>
          <p className="mt-1.5 text-center font-body text-[15.5px] italic text-aether-muted">
            {city.greekName}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            {regionLabel && (
              <span className="rounded-full border border-star-olympian/45 bg-star-olympian/10 px-3 py-0.5 font-display text-[10px] uppercase tracking-[0.16em] text-star-olympian">
                {regionLabel}
              </span>
            )}
            <span className="rounded-full border border-glass-border bg-glass px-3 py-0.5 font-display text-[10px] uppercase tracking-[0.16em] text-aether-muted">
              Pleiades {city.pleiadesId}
            </span>
          </div>

          {sealResidents.length > 0 && (
            <>
              <CitySeal residents={sealResidents} />
              <p className="mt-1 text-center font-body text-[12.5px] italic text-aether-faint">
                her sky in miniature —{' '}
                <span className="not-italic text-star-olympian/85">{residentCount} stars</span> dwell
                here
              </p>
            </>
          )}

          <Meander />

          {reigns.length > 0 && (
            <>
              <MarqueeHeading>THE REIGNS</MarqueeHeading>
              <nav aria-label="The reigns">
                {reigns.map((reign, index) => {
                  const active = index === activeReign;
                  return (
                    <a
                      key={`${reign.label}-${index}`}
                      href={`#reign-${index + 1}`}
                      onClick={scrollToReign(index)}
                      className={`flex items-baseline gap-2.5 py-[4.5px] font-body text-[15px] transition-colors ${
                        active ? 'text-star-olympian' : 'text-aether-muted hover:text-aether'
                      }`}
                    >
                      <span
                        className={`h-[6px] w-[6px] shrink-0 self-center rounded-full transition-all duration-300 ${
                          active
                            ? 'bg-star-olympian shadow-[0_0_8px_2px_rgba(252,211,77,.6)]'
                            : 'bg-aether/20'
                        }`}
                      />
                      <span
                        className={`min-w-[30px] font-display text-[9.5px] tracking-[0.1em] ${
                          active ? 'text-star-olympian' : 'text-aether-faint'
                        }`}
                      >
                        {roman(index + 1)}
                      </span>
                      <span className="min-w-0 truncate">{reign.label}</span>
                      {reign.disputed && <span className="text-[12px] text-nebula-soft">⚖</span>}
                    </a>
                  );
                })}
              </nav>
            </>
          )}

          <p className="mt-4 text-center text-[15px] tracking-[0.5em] text-aether/35">⁂</p>
        </MarqueeCard>
      </aside>

      {/* ---------------- the stage: the succession on the spine ---------------- */}
      <div className="max-w-[680px]">
        {reigns.length > 0 ? (
          <>
            <div ref={voyageRef} className="relative pl-14 sm:pl-24">
              <div className="absolute bottom-2 left-[19px] top-2 w-[2px] rounded-full bg-aether/10 sm:left-[31px]">
                <div
                  ref={fillRef}
                  className="absolute left-0 top-0 h-0 w-full rounded-full bg-gradient-to-b from-star-olympian to-nebula-soft shadow-[0_0_12px_1px_rgba(252,211,77,.5)]"
                />
              </div>

              {reigns.map((reign, index) => (
                <section
                  key={`${reign.label}-${index}`}
                  id={`reign-${index + 1}`}
                  ref={(el) => {
                    reignRefs.current[index] = el;
                  }}
                  data-lit="false"
                  className="group relative scroll-mt-20 pb-12 last:pb-7"
                >
                  <div
                    ref={(el) => {
                      nodeRefs.current[index] = el;
                    }}
                    className="absolute -left-14 top-0.5 flex w-10 flex-col items-center gap-2 sm:-left-24 sm:w-16"
                  >
                    <span className="h-[14px] w-[14px] rounded-full bg-aether/20 transition-all duration-500 group-data-[lit=true]:bg-star-olympian group-data-[lit=true]:shadow-[0_0_12px_4px_rgba(252,211,77,.6),0_0_32px_11px_rgba(252,211,77,.2)]" />
                    <span className="whitespace-nowrap font-display text-[10px] tracking-[0.13em] text-aether-faint transition-colors duration-500 group-data-[lit=true]:text-star-olympian">
                      {roman(index + 1)}
                    </span>
                  </div>

                  <h3 className="font-display text-[20px] tracking-[0.07em] text-aether">
                    {reign.title}
                    {reign.disputed && (
                      <span className="group/dq relative ml-2 cursor-default align-middle text-[14px] text-nebula-soft">
                        ⚖
                        <span className="pointer-events-none absolute bottom-full left-0 z-10 mb-1.5 hidden whitespace-nowrap rounded-lg border border-nebula-soft/40 bg-cosmos-raised px-2.5 py-1 font-body text-sm tracking-normal text-aether group-hover/dq:block">
                          The tellers disagree about this reign.
                        </span>
                      </span>
                    )}
                  </h3>
                  {reign.note && (
                    <p className="mt-1.5 font-body text-[17.5px] leading-relaxed text-aether/88">
                      {reign.note}
                      <Footnote label={String(index + 1)} text={reign.footnote} />
                    </p>
                  )}
                  {!reign.note && <Footnote label={String(index + 1)} text={reign.footnote} />}
                </section>
              ))}

              {/* terminal star */}
              <div className="relative">
                <div className="absolute -left-14 top-0 flex w-10 justify-center sm:-left-24 sm:w-16">
                  <span className="h-[20px] w-[20px] rounded-full bg-star-olympian shadow-[0_0_16px_5px_rgba(252,211,77,.6),0_0_48px_18px_rgba(252,211,77,.2)]" />
                </div>
                <p className="pt-0.5 text-[17px] tracking-[0.55em] text-aether/40">⁂</p>
              </div>
            </div>

            <p className="mt-12 text-center font-body text-[13.5px] italic text-aether-faint">
              the spine ignites as you read · the reign index on the card follows your place ·
              starred rulers link to their codices
            </p>
          </>
        ) : (
          <p className="font-body text-lg italic text-aether-faint">
            No royal line is recorded for this city yet — her sky still shines below.
          </p>
        )}
      </div>
    </div>
  );
}
