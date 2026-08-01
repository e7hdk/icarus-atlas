'use client';

import Link from 'next/link';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { useGalaxyStore } from '@/features/galaxy/store';
import { useIsMobile } from '@/lib/useIsMobile';
import { FigureChart } from '@/components/sky/FigureChart';
import type { Constellation, SkyCatalogue } from '@/types/sky';
import catalogue from '../../../data/sky/constellations.json';

const sky = catalogue as SkyCatalogue;

/** The gilded meander that runs under the head of every star panel. */
const GREEK_KEY_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='12' viewBox='0 0 32 12'%3E%3Cpath d='M0 11H27V1H5V8H21V4H9' fill='none' stroke='%23fcd34d' stroke-width='1' opacity='.78'/%3E%3C/svg%3E\")";

const PANEL_BACKGROUND = { backgroundColor: 'rgba(5, 2, 18, 0.94)' } as const;

/** Hairline, diamond, hairline — the star panel's own rule, reused so the sky
 *  and the codex read as one atlas. */
function GildedRule() {
  return (
    <div className="mx-auto flex w-28 items-center gap-2" aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-star-olympian/50" />
      <span className="h-1.5 w-1.5 rotate-45 border border-star-olympian/65 bg-star-olympian/15 shadow-[0_0_9px_rgba(252,211,77,0.36)]" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-star-olympian/50" />
    </div>
  );
}

function CloseButton({ onClose, className }: { onClose: () => void; className: string }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Back to the sky"
      className={`grid h-8 w-8 place-items-center rounded-full border border-transparent text-aether-faint transition-all hover:border-glass-border hover:bg-white/5 hover:text-aether ${className}`}
    >
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
        <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/** The card for one figure in the Greek sky (docs/EPHEMERIS_PLAN.md §5), in the
 *  same gilded dress as the star panel it stands beside — what the figure is,
 *  whose catasterism it is, which myths look up and name it, and where the
 *  sources go star by star, who stands in each star. Every claim shows the
 *  testimony under it: the sky says nothing the ancients did not say.
 *
 *  Opens when a constellation is picked out of the sky and the camera flies to
 *  it; the doors lead on into the codex and the myths. */
export function ConstellationCard() {
  const skyFocus = useGalaxyStore((s) => s.skyFocus);
  const setSkyFocus = useGalaxyStore((s) => s.setSkyFocus);
  const isMobile = useIsMobile();
  const figure: Constellation | undefined = skyFocus
    ? sky.constellations.find((entry) => entry.id === skyFocus.id)
    : undefined;
  if (!figure) return null;

  const close = () => setSkyFocus(null);
  const cast = figure.stars.filter((star) => star.character);
  const testimonia = [
    ...(figure.catasterism?.testimonia ?? []),
    ...(figure.namedIn ?? []).flatMap((named) => named.testimonia),
  ];
  const brightest = figure.stars.reduce((best, star) => (star.mag < best.mag ? star : best));
  const figures = figure.catasterism?.characters ?? [];
  const named = (id: string) => id.split('-')[0]!.replace(/^./, (c) => c.toUpperCase());

  // Mobile: the atlas-wide bottom-sheet grammar, so the figure stays visible
  // above and the doors land in the thumb zone.
  if (isMobile) {
    return (
      <div className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30">
        <GlassPanel
          className="relative overflow-hidden border-star-olympian/30 px-4 py-4 shadow-[0_18px_60px_rgba(5,2,15,0.85),0_0_34px_rgba(252,211,77,0.09)] animate-[search-panel-in_180ms_cubic-bezier(0.2,0.8,0.2,1)]"
          style={PANEL_BACKGROUND}
        >
          <div
            className="pointer-events-none absolute inset-x-12 top-0 h-3 opacity-25 [mask-image:linear-gradient(to_right,transparent,black_22%,black_78%,transparent)]"
            style={{ backgroundImage: GREEK_KEY_PATTERN, backgroundRepeat: 'repeat-x' }}
          />
          <CloseButton onClose={close} className="absolute right-2 top-2 z-10" />
          <div className="relative flex items-center gap-3 px-6">
            <FigureChart figure={figure} className="h-14 w-14 shrink-0" />
            <div className="min-w-0">
              <h2 className="truncate font-display text-lg tracking-[0.1em] text-aether">
                {figure.name.toUpperCase()}
              </h2>
              {figure.greekName && (
                <p className="truncate font-body text-[14px] italic text-star-olympian/75">
                  {figure.greekName}
                </p>
              )}
              <p className="truncate font-body text-[12.5px] italic text-aether-muted">
                {figure.figure}
              </p>
            </div>
          </div>
          <div className="relative mt-3 space-y-2 border-t border-star-olympian/15 pt-3">
            {figures.map((character) => (
              <Link
                key={character}
                href={`/character/${character}`}
                onClick={close}
                className="block border border-star-olympian/35 bg-star-olympian/[0.06] px-4 py-2.5 text-center font-display text-[11px] uppercase tracking-[0.18em] text-star-olympian transition-all hover:border-star-olympian/60 hover:bg-star-olympian/[0.12] hover:text-aether"
              >
                {named(character)}
              </Link>
            ))}
            {figure.namedIn?.map((named) => (
              <Link
                key={named.story}
                href={`/story/${named.story}`}
                onClick={close}
                className="block border border-star-olympian/15 bg-star-olympian/[0.035] px-4 py-2.5 text-center font-body text-[14px] text-aether/90 transition-all hover:border-star-olympian/40 hover:bg-star-olympian/[0.08] hover:text-aether"
              >
                Read the myth that names it
              </Link>
            ))}
            <Link
              href={`/constellation/${figure.id}`}
              onClick={close}
              className="block w-full border border-star-olympian/35 bg-star-olympian/[0.06] px-5 py-3 text-center font-display text-[11px] uppercase tracking-[0.2em] text-star-olympian transition-all hover:border-star-olympian/65 hover:bg-star-olympian/[0.12] hover:text-aether"
            >
              Step into the figure
            </Link>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <aside
      className="fixed bottom-0 right-0 top-14 z-30 w-[400px] max-w-full overflow-y-auto border-l border-t border-star-olympian/30 shadow-[-18px_24px_80px_rgba(5,2,15,0.88),0_0_34px_rgba(252,211,77,0.08),inset_0_0_42px_rgba(124,77,255,0.05)] backdrop-blur-2xl"
      style={PANEL_BACKGROUND}
    >
      <div className="pointer-events-none absolute inset-2 border border-star-olympian/[0.07]" />
      <div className="pointer-events-none absolute right-3 top-3 h-6 w-6 border-r border-t border-star-olympian/40" />
      <div className="pointer-events-none absolute bottom-3 left-3 h-6 w-6 border-b border-l border-star-olympian/20" />
      <div
        className="pointer-events-none absolute inset-x-16 top-0 h-3 opacity-25 [mask-image:linear-gradient(to_right,transparent,black_22%,black_78%,transparent)]"
        style={{ backgroundImage: GREEK_KEY_PATTERN, backgroundRepeat: 'repeat-x' }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_50%_-15%,rgba(252,211,77,0.1),transparent_56%),radial-gradient(circle_at_18%_18%,rgba(124,77,255,0.08),transparent_48%)]" />

      <div className="relative px-7 py-6">
        <CloseButton onClose={close} className="absolute right-5 top-5" />

        <GildedRule />

        {/* The plate: the figure as an atlas engraves it. */}
        <FigureChart figure={figure} className="mx-auto mt-5 h-32 w-32" />

        <h2 className="mt-4 text-center font-display text-2xl tracking-[0.14em] text-aether drop-shadow-[0_0_16px_rgba(252,211,77,0.12)]">
          {figure.name.toUpperCase()}
        </h2>
        {figure.greekName && (
          <p className="mt-1 text-center font-body text-lg italic text-star-olympian/75">
            {figure.greekName}
          </p>
        )}
        <p className="mt-2 text-center font-body text-sm italic text-aether-muted">
          {figure.figure}
          {figure.asterism ? ` · within ${figure.asterism}` : ''}
        </p>
        <p className="mt-1 text-center font-body text-[12px] text-aether-faint">
          {figure.iau.join(' · ')} — {figure.stars.length} stars, brightest {brightest.name}
        </p>

        {figure.catasterism && (
          <div className="mt-6 space-y-5 border-t border-star-olympian/15 pt-5">
            <div>
              <div className="mb-1 inline-block border border-nebula-soft/30 bg-nebula-violet/10 px-2.5 py-0.5 font-display text-[10px] uppercase tracking-[0.16em] text-nebula-soft">
                Set among the stars
              </div>
              <p className="font-body text-[16px] leading-relaxed text-aether/90">
                {figures.length > 0
                  ? `The ancients tell that ${figures.map(named).join(' and ')} ${
                      figures.length > 1 ? 'were' : 'was'
                    } placed in the sky as this figure.`
                  : 'The ancients tell that this thing itself was placed in the sky — whom or what exactly, they do not agree; the tellings stand below.'}
              </p>
              {figures.map((character) => (
                <Link
                  key={character}
                  href={`/character/${character}`}
                  onClick={close}
                  className="mt-2 mr-4 inline-block font-display text-[10px] uppercase tracking-[0.18em] text-star-olympian/75 transition-colors hover:text-star-olympian"
                >
                  {named(character)} →
                </Link>
              ))}
            </div>
          </div>
        )}

        {figure.namedIn && figure.namedIn.length > 0 && (
          <div className="mt-7 border-t border-star-olympian/15 pt-5">
            <div className="mb-1 inline-block border border-nebula-soft/30 bg-nebula-violet/10 px-2.5 py-0.5 font-display text-[10px] uppercase tracking-[0.16em] text-nebula-soft">
              Named in the telling
            </div>
            <p className="font-body text-[15px] italic leading-relaxed text-aether-muted">
              A myth looks up and calls this figure by name.
            </p>
            {figure.namedIn.map((named) => (
              <Link
                key={named.story}
                href={`/story/${named.story}`}
                onClick={close}
                className="mt-2 block font-display text-[10px] uppercase tracking-[0.18em] text-star-olympian/75 transition-colors hover:text-star-olympian"
              >
                Read the telling →
              </Link>
            ))}
          </div>
        )}

        {cast.length > 0 && (
          <div className="mt-7 border-t border-star-olympian/15 pt-5">
            <p className="font-display text-[10px] uppercase tracking-[0.18em] text-star-olympian/75">
              Star by star
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {cast.map((star) => (
                <Link
                  key={star.character}
                  href={`/character/${star.character}`}
                  onClick={close}
                  className="border border-star-olympian/15 bg-star-olympian/[0.035] px-3 py-1.5 text-left font-body text-[14px] text-aether/90 transition-all hover:border-star-olympian/40 hover:bg-star-olympian/[0.08] hover:text-aether"
                >
                  {star.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {testimonia.length > 0 && (
          <div className="mt-7 border-t border-star-olympian/15 pt-5">
            <p className="font-display text-[10px] uppercase tracking-[0.18em] text-aether-faint">
              Told by
            </p>
            <ul className="mt-2 space-y-2">
              {testimonia.map((line) => (
                <li
                  key={line}
                  className="border border-star-olympian/15 bg-star-olympian/[0.03] px-4 py-2.5 font-body text-[13px] italic leading-relaxed text-aether-muted"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="relative mt-8 border-t border-star-olympian/20 pb-4 pt-5">
          <div className="pointer-events-none absolute left-1/2 top-0 flex w-24 -translate-x-1/2 -translate-y-1/2 items-center gap-2">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-star-olympian/35" />
            <span className="h-1.5 w-1.5 rotate-45 border border-star-olympian/45 bg-cosmos-deep" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-star-olympian/35" />
          </div>
          <Link
            href={`/constellation/${figure.id}`}
            onClick={close}
            className="block w-full border border-star-olympian/35 bg-star-olympian/[0.06] px-5 py-3 text-center font-display text-[11px] uppercase tracking-[0.2em] text-star-olympian transition-all hover:border-star-olympian/65 hover:bg-star-olympian/[0.12] hover:text-aether hover:shadow-[0_0_26px_rgba(252,211,77,0.12)]"
          >
            Step into the figure
          </Link>
        </div>
      </div>
    </aside>
  );
}
