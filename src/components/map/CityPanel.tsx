'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { ReignRulerLinks } from '@/components/city/ReignRulerLinks';
import type { CharacterIndex } from '@/features/characters/load';
import type { GeoCity, GeoRegion, Lineage } from '@/types/geo';

const GREEK_KEY_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='12' viewBox='0 0 32 12'%3E%3Cpath d='M0 11H27V1H5V8H21V4H9' fill='none' stroke='%23fcd34d' stroke-width='1' opacity='.78'/%3E%3C/svg%3E\")";

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close city panel"
      className="grid h-8 w-8 place-items-center rounded-full border border-transparent text-aether-faint transition-all hover:border-glass-border hover:bg-white/5 hover:text-aether"
    >
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
        <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.25" />
      </svg>
    </button>
  );
}

function EmptyLineage() {
  return (
    <p className="mt-2 font-body text-[15px] italic text-aether-muted">
      The royal line of this city is still being researched — the atlas grows one throne at a
      time.
    </p>
  );
}

function HellenicFooter({ city }: { city: GeoCity }) {
  return (
    <footer className="relative border-t border-star-olympian/20 bg-cosmos-deep/55 px-6 pb-4 pt-4">
      <div className="pointer-events-none absolute left-1/2 top-0 flex w-24 -translate-x-1/2 -translate-y-1/2 items-center gap-2">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-star-olympian/35" />
        <span className="h-1.5 w-1.5 rotate-45 border border-star-olympian/45 bg-cosmos-deep" />
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-star-olympian/35" />
      </div>
      <Link
        href={`/city/${city.id}/sky`}
        className="group flex items-center justify-center gap-3 border border-star-olympian/35 bg-star-olympian/[0.06] px-4 py-3 font-display text-[10px] uppercase tracking-[0.22em] text-star-olympian transition-all hover:border-star-olympian/65 hover:bg-star-olympian/[0.12] hover:text-aether hover:shadow-[0_0_26px_rgba(252,211,77,0.12)]"
      >
        <span className="text-[8px]">◆</span>
        <span>Enter the city sky</span>
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </Link>
      <div className="mt-2 flex items-center justify-between px-1">
        <Link
          href={`/city/${city.id}`}
          className="font-display text-[8.5px] uppercase tracking-[0.18em] text-aether-faint transition-colors hover:text-nebula-soft"
        >
          Royal codex →
        </Link>
        <p className="font-body text-[10px] italic text-aether-faint">Pleiades · {city.pleiadesId}</p>
      </div>
    </footer>
  );
}

/** Lineage panel for a selected city: the royal succession as sourced facts.
 *  Citations live in hover footnotes; disputed reigns get the quiet ⚖ marker. */
export function CityPanel({
  city,
  region,
  lineage,
  characterIndex = {},
  onClose,
}: {
  city: GeoCity;
  region: GeoRegion | undefined;
  lineage: Lineage | null;
  characterIndex?: CharacterIndex;
  onClose: () => void;
}) {
  /* Two-detent mobile sheet: swipe the header up to open the full succession,
   * swipe down to duck back to the low peek (sm+ ignores all of this — the
   * desktop side panel keeps its fixed geometry). Gestures live on the header
   * only, so the scrolling body never fights the sheet. */
  const [expanded, setExpanded] = useState(false);
  const touchStartY = useRef<number | null>(null);
  /* A newly selected city starts at the low peek again (render-time state
   * adjustment — the documented pattern for prop-driven resets). */
  const [peekCityId, setPeekCityId] = useState(city.id);
  if (peekCityId !== city.id) {
    setPeekCityId(city.id);
    setExpanded(false);
  }
  const onSheetTouchStart = (event: React.TouchEvent) => {
    touchStartY.current = event.touches[0].clientY;
  };
  const onSheetTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartY.current;
    touchStartY.current = null;
    if (start === null) return;
    const delta = event.changedTouches[0].clientY - start;
    if (delta < -36) setExpanded(true);
    else if (delta > 36) setExpanded(false);
  };

  return (
    <GlassPanel
      data-map-overlay
      className={`absolute inset-x-4 bottom-4 top-auto z-10 flex w-auto touch-auto flex-col overflow-hidden overscroll-contain border-star-olympian/30 shadow-[0_26px_90px_rgba(5,2,15,0.9),0_0_38px_rgba(252,211,77,0.1),inset_0_0_42px_rgba(124,77,255,0.06)] transition-[max-height] duration-300 ease-out sm:inset-x-auto sm:bottom-auto sm:right-5 sm:top-20 sm:max-h-[calc(100%-7rem)] sm:w-[24rem] ${
        expanded ? 'max-h-[88%]' : 'max-h-[42%]'
      }`}
      style={{ backgroundColor: 'rgba(5, 2, 18, 0.94)' }}
    >
      <button
        type="button"
        aria-label={expanded ? 'Collapse the city panel' : 'Expand the city panel'}
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        onTouchStart={onSheetTouchStart}
        onTouchEnd={onSheetTouchEnd}
        className="mx-auto mt-2 flex h-4 w-16 shrink-0 items-center justify-center sm:hidden"
      >
        <span className="h-1 w-10 rounded-full bg-white/15" />
      </button>
      <div className="pointer-events-none absolute inset-2 rounded-xl border border-star-olympian/[0.08]" />
      <div className="pointer-events-none absolute right-3 top-3 h-6 w-6 border-r border-t border-star-olympian/45" />
      <div className="pointer-events-none absolute bottom-3 left-3 h-6 w-6 border-b border-l border-star-olympian/25" />
      <div
        className="pointer-events-none absolute inset-x-14 top-0 h-3 opacity-25 [mask-image:linear-gradient(to_right,transparent,black_22%,black_78%,transparent)]"
        style={{ backgroundImage: GREEK_KEY_PATTERN, backgroundRepeat: 'repeat-x' }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_50%_-15%,rgba(252,211,77,0.14),transparent_56%),radial-gradient(circle_at_18%_18%,rgba(124,77,255,0.13),transparent_48%)]" />

      <header
        className="relative px-6 pb-5 pt-3 text-center sm:pt-7"
        onTouchStart={onSheetTouchStart}
        onTouchEnd={onSheetTouchEnd}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-left font-display text-[8px] uppercase tracking-[0.24em] text-star-olympian/70">
            {region?.name ?? 'City of the atlas'}
          </p>
          <CloseButton onClose={onClose} />
        </div>
        <div className="mx-auto mt-3 flex w-28 items-center gap-2">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-star-olympian/55" />
          <span className="h-1.5 w-1.5 rotate-45 border border-star-olympian/70 bg-star-olympian/20 shadow-[0_0_10px_rgba(252,211,77,0.42)]" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-star-olympian/55" />
        </div>

        <h2 className="mt-4 font-display text-[23px] tracking-[0.16em] text-aether drop-shadow-[0_0_16px_rgba(252,211,77,0.16)]">
          {city.name.toUpperCase()}
        </h2>
        <p className="mt-1 font-body text-[18px] italic text-star-olympian/80">{city.greekName}</p>

        <div className="mx-auto mt-4 inline-flex items-center gap-2 border-y border-star-olympian/15 px-4 py-1.5 font-display text-[8px] uppercase tracking-[0.2em] text-aether-faint">
          <span className="text-star-olympian">✦</span>
          {lineage ? `${lineage.reigns.length} sovereign names` : 'Lineage under study'}
          <span className="text-star-olympian">✦</span>
        </div>
      </header>

      <div className="relative mx-6 flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-star-olympian/30 to-star-olympian/50" />
        <svg viewBox="0 0 40 12" className="h-3 w-10 text-star-olympian/60" fill="none">
          <path d="M2 10h36M7 10V5h26v5M11 5l9-4 9 4" stroke="currentColor" strokeWidth="0.9" />
        </svg>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent via-star-olympian/30 to-star-olympian/50" />
      </div>

      <section className="relative min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-6 py-5">
        <h3 className="text-center font-display text-[9px] uppercase tracking-[0.3em] text-aether-muted">
          Royal succession
        </h3>

        {lineage ? (
          <ol className="mt-5 space-y-1">
            {lineage.reigns.map((reign, index) => (
              <li
                key={`${reign.ruler}-${index}`}
                title={reign.citation}
                className="group grid grid-cols-[2rem_1fr] gap-3 border-b border-star-olympian/[0.1] py-4 first:pt-0 last:border-b-0 last:pb-0"
              >
                <div className="pt-0.5 text-center">
                  <span className="font-display text-[9px] tracking-[0.08em] text-star-olympian/70">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="mx-auto mt-2 block h-7 w-px bg-gradient-to-b from-star-olympian/45 to-transparent transition-all group-hover:h-9 group-hover:from-star-olympian/75" />
                </div>
                <div className="border-l border-star-olympian/20 pl-4">
                  <div className="flex items-center gap-2">
                    <ReignRulerLinks
                      reign={reign}
                      characterIndex={characterIndex}
                      className="font-display text-[16px] tracking-[0.1em] text-aether transition-colors group-hover:text-star-olympian"
                    />
                    {reign.topic && (
                      <span
                        className="text-[11px] text-nebula-soft"
                        title="The sources disagree about this reign."
                        aria-label="Disputed reign"
                      >
                        ⚖
                      </span>
                    )}
                  </div>
                  {reign.note && (
                    <p className="mt-2 font-body text-[14px] leading-[1.48] text-aether-muted">
                      {reign.note}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyLineage />
        )}
      </section>

      <HellenicFooter city={city} />
    </GlassPanel>
  );
}
