'use client';

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { BookEngine, type BookLanguage, type BookOptions, type BookSight } from '@/features/library/book/engine';
import { keepLanguage, keepTranslation, keptLanguage, keptTranslation, subscribeLanguage, subscribeTranslation } from '@/features/library/book/language';
import type { ReaderLanguage } from '@/types/library';
import { BookStrip } from './BookStrip';
import { LANGUAGE_NAMES, TranslationMenu } from './TranslationMenu';

/** The reading room's book (docs/LIBRARY_PLAN.md §6): the frame round the engine
 *  in `features/library/book`. The text, the cover and the two plates arrive
 *  rendered by the server, every translation the work has among them; this holds
 *  the language switch and the choice of translation, the fore-edge strip and the
 *  page count, and tells the margin which block the reader is on. */

/** The block the margin speaks of (its `data-from`). */
const NowContext = createContext<string | null>(null);
export const useReadingNow = () => useContext(NowContext);

const NO_SCRIPT = `
.book .bk{display:none}
.book .bk-source{position:static;visibility:visible;height:auto;width:auto;max-width:40rem;margin:0 auto;overflow:visible;pointer-events:auto}
.book .bk-tpl{display:block}
.book .bk-plate{position:static;margin:3rem 0}
.book-room{height:auto;overflow:visible}
.book .book-main{display:block}
`;

export function BookReader({
  storageKey,
  workId,
  headWork,
  headUnit,
  structure,
  hasOriginal,
  showsTranslation,
  translators,
  originalLabel,
  blocks,
  marginBase,
  crumb,
  cover,
  title,
  colophon,
  margin,
  children,
}: {
  storageKey: string;
  workId: string;
  headWork: string;
  headUnit: string;
  structure: BookOptions['structure'];
  hasOriginal: boolean;
  showsTranslation: boolean;
  /** The languages the work can be read in beside its original, each with its translator. */
  translators: Partial<Record<ReaderLanguage, string>>;
  originalLabel: string;
  /** Every block of the page, by its `data-from`, in order. */
  blocks: string[];
  marginBase: string;
  crumb: ReactNode;
  cover: ReactNode;
  title: ReactNode;
  colophon: ReactNode;
  margin: ReactNode;
  children: ReactNode;
}) {
  const facing = hasOriginal && showsTranslation;
  const rootRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BookEngine | null>(null);
  const router = useRouter();
  // the reader's last choice, where the work has both languages to choose between
  const kept = useSyncExternalStore(subscribeLanguage, keptLanguage, () => null);
  const language: BookLanguage = facing ? (kept ?? 'both') : hasOriginal ? 'orig' : 'trans';
  // the reader's translation where the work has it, else its English; the choice is kept for the next book
  const keptIn = useSyncExternalStore(subscribeTranslation, keptTranslation, () => null);
  const translation: ReaderLanguage = keptIn && translators[keptIn] ? keptIn : 'en';
  const [sight, setSight] = useState<BookSight | null>(null);
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const engine = new BookEngine(root, {
      key: storageKey,
      work: workId,
      heads: [headWork, headUnit],
      structure,
      facing,
      onSight: setSight,
      onNow: setNow,
      navigate: (href) => router.push(href),
    });
    engineRef.current = engine;
    void engine.start();
    return () => {
      engineRef.current = null;
      engine.destroy();
    };
  }, [storageKey, workId, headWork, headUnit, structure, facing, router]);

  // the languages are attributes of the book: once they are on, the pages are set again
  useEffect(() => {
    engineRef.current?.relayout();
  }, [language, translation]);

  const choices: [BookLanguage, string][] = [
    ['orig', originalLabel],
    ['both', 'Both'],
    ['trans', LANGUAGE_NAMES[translation]],
  ];
  const choose = (chosen: ReaderLanguage) => {
    keepTranslation(chosen);
    // a reader who picks a translation while reading the original alone wants to see it
    if (facing && language === 'orig') keepLanguage('both');
  };
  const count = !sight
    ? ''
    : sight.kind === 'title'
      ? 'Title page'
      : !sight.folios
        ? 'The end'
        : sight.folios[0] === sight.folios[1]
          ? `Page ${sight.folios[0]} of ${sight.pages}`
          : `Pages ${sight.folios[0]}–${sight.folios[1]} of ${sight.pages}`;
  const arrow =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-glass-border text-[15px] text-aether-muted transition-colors hover:border-star-olympian/50 hover:text-star-olympian disabled:pointer-events-none disabled:opacity-30';

  return (
    <div ref={rootRef} className="book" data-lang={language} data-tl={translation} data-structure={structure}>
      <noscript>
        <style>{NO_SCRIPT}</style>
      </noscript>
      <div className="book-top">
        <div className="min-w-0">{crumb}</div>
        {facing && (
          <TranslationMenu chosen={translation} translators={translators} onChoose={choose}>
            {choices.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={language === value}
                onClick={() => keepLanguage(value)}
                // the narrowest phones take the caret's room from the segments, so the crumb keeps its book
                className={`rounded-full border px-1.5 py-1 transition-colors min-[380px]:px-2 min-[420px]:px-3 sm:px-3.5 ${
                  language === value ? 'border-star-olympian/50 bg-star-olympian/10 text-star-olympian' : 'border-transparent text-aether-muted hover:text-aether'
                } ${value === 'orig' ? 'font-greek text-[12px] min-[380px]:text-[13px]' : 'font-display text-[10px] tracking-[0.1em] min-[380px]:tracking-[0.18em]'}`}
              >
                {value === 'orig' ? label : label.toUpperCase()}
              </button>
            ))}
          </TranslationMenu>
        )}
        {/* a work in translation alone (the Fabulae) still names its language, and offers the others */}
        {!facing && showsTranslation && (
          <TranslationMenu chosen={translation} translators={translators} onChoose={choose}>
            <span className="rounded-full border border-star-olympian/50 bg-star-olympian/10 px-2 py-1 font-display text-[10px] tracking-[0.18em] text-star-olympian min-[420px]:px-3 sm:px-3.5">
              {LANGUAGE_NAMES[translation].toUpperCase()}
            </span>
          </TranslationMenu>
        )}
      </div>

      <div className="book-main">
        <div className="book-stage">
          <div className="bk">
            <div className="bk-shift">
              <div className="bk-board" aria-hidden />
              <div className="bk-edge bk-edge-l" aria-hidden />
              <div className="bk-edge bk-edge-r" aria-hidden />
              <div className="bk-pages">
                <div className="bk-cover">{cover}</div>
                {/* the engine lays the faces of the pages here, before the spine */}
                <div className="bk-spine" aria-hidden />
                <div className="bk-castbox bk-castbox-l" aria-hidden>
                  <div className="bk-cast" />
                </div>
                <div className="bk-castbox bk-castbox-r" aria-hidden>
                  <div className="bk-cast" />
                </div>
                {/* the edges are for the hand; the keyboard has the arrows below and its own keys */}
                <button type="button" tabIndex={-1} aria-hidden className="bk-zone bk-zone-prev" />
                <button type="button" tabIndex={-1} aria-hidden className="bk-zone bk-zone-next" />
              </div>
            </div>
          </div>
          {/* the text as the server set it: measured here, shown as the pages above */}
          <div className="bk-source">
            <div className="bk-flow">{children}</div>
            <div className="bk-tpl" data-face="title">
              {title}
            </div>
            <div className="bk-tpl" data-face="colophon">
              {colophon}
            </div>
          </div>
        </div>
        <div className="book-foot">
          <button type="button" aria-label="Previous page" disabled={!sight || sight.view === 0} onClick={() => engineRef.current?.previous()} className={arrow}>
            ‹
          </button>
          <BookStrip base={marginBase} blocks={blocks} shown={sight?.blocks ?? []} onPick={(index) => engineRef.current?.goToRow(index)} />
          <p aria-live="polite" className="shrink-0 font-display text-[10px] tracking-[0.2em] text-aether-muted">
            {count.toUpperCase()}
          </p>
          <button type="button" aria-label="Next page" disabled={!sight || sight.view >= sight.views - 1} onClick={() => engineRef.current?.next()} className={arrow}>
            ›
          </button>
        </div>
        <NowContext.Provider value={now}>{margin}</NowContext.Provider>
      </div>
    </div>
  );
}
