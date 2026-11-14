'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import type { LeftPage } from '@/features/library/book/language';
import { READER_LANGUAGES, type ReaderLanguage } from '@/types/library';

/** The reading room's language switch and its choice of languages
 *  (docs/LIBRARY_PLAN.md §6): the switch's segments, then a caret that opens the
 *  reader's languages, each named in itself, with its translator. A language the
 *  work has no translation in stays on the list, faint, and says so. Where the work
 *  faces its original with a translation, the menu chooses both pages: the left
 *  page (above, on a phone) holds the original or any translation, so a reader can
 *  set German beside Turkish. The menu hangs outside the switch's frosted pill: a
 *  frosted panel inside another blurs nothing behind it, and the margin would read
 *  through. */

export const LANGUAGE_NAMES: Record<ReaderLanguage, string> = { en: 'English', de: 'Deutsch', tr: 'Türkçe' };
export const LANGUAGE_CODES: Record<ReaderLanguage, string> = { en: 'EN', de: 'DE', tr: 'TR' };

const MISSING: Record<ReaderLanguage, string> = {
  en: 'Read at ToposText for now',
  de: 'No free German translation of this work yet',
  tr: 'No Turkish translation of this work yet',
};

/** One language on the menu: its name in itself, and its translator or why it is faint. */
function Choice({
  checked,
  disabled,
  name,
  note,
  lang,
  greek,
  onPick,
}: {
  checked: boolean;
  disabled: boolean;
  name: string;
  note: string;
  lang: string;
  greek?: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      disabled={disabled}
      lang={lang}
      onClick={onPick}
      className="flex w-full items-start gap-3 px-3.5 py-2 text-left outline-none transition-colors hover:bg-nebula-violet/10 focus-visible:bg-nebula-violet/10 disabled:pointer-events-none"
    >
      <span
        aria-hidden
        className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${checked ? 'bg-star-olympian shadow-[0_0_8px_var(--color-star-olympian)]' : 'border border-glass-border'}`}
      />
      <span className="min-w-0">
        <span
          className={`block ${greek ? 'font-greek text-[14px] leading-tight' : 'font-display text-[11px] tracking-[0.18em]'} ${disabled ? 'text-aether-faint' : checked ? 'text-star-olympian' : 'text-aether'}`}
        >
          {greek ? name : name.toUpperCase()}
        </span>
        <span lang="en" className={`block font-body text-[13px] leading-snug ${disabled ? 'italic text-aether-faint' : 'text-aether-muted'}`}>
          {note}
        </span>
      </span>
    </button>
  );
}

/** A section's head, named for the page it sets: left or right on facing pages, above or below on a phone. */
function SectionHead({ wide, narrow }: { wide: string; narrow: string }) {
  return (
    <p className="px-3.5 pb-1.5 font-display text-[9px] tracking-[0.22em] text-aether-faint">
      <span className="bk-name-wide">{wide}</span>
      <span className="bk-name-narrow">{narrow}</span>
    </p>
  );
}

export function TranslationMenu({
  chosen,
  translators,
  onChoose,
  left,
  children,
}: {
  chosen: ReaderLanguage;
  /** The languages this work can be read in, each with its translator. */
  translators: Partial<Record<ReaderLanguage, string>>;
  onChoose: (language: ReaderLanguage) => void;
  /** Where the work faces its original with a translation: what the other page holds. */
  left?: { chosen: LeftPage; originalLabel: string; originalLang: string; onChoose: (page: LeftPage) => void };
  /** The switch's segments, before the caret. */
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    // the reader's language comes first under the hand
    menuRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    caretRef.current?.focus();
  };

  // the arrows walk the languages the work has; the book's own keys stay out of it
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]:not(:disabled)') ?? [])];
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const to =
      event.key === 'ArrowDown' ? (at + 1) % items.length
      : event.key === 'ArrowUp' ? (at - 1 + items.length) % items.length
      : event.key === 'Home' ? 0
      : event.key === 'End' ? items.length - 1
      : null;
    if (event.key === 'Escape' || event.key === 'Tab') {
      if (event.key === 'Escape') event.preventDefault();
      close();
      return;
    }
    // the book turns its pages on these: not while the reader is choosing a language
    if (['ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(event.key)) {
      event.preventDefault();
      return;
    }
    if (to === null || items.length === 0) return;
    event.preventDefault();
    items[to].focus();
  };

  return (
    <div ref={rootRef} className="relative z-30 shrink-0">
      <div role="group" aria-label="Language" className="flex gap-0.5 rounded-full border border-glass-border bg-glass p-0.5 backdrop-blur-xl">
        {children}
        <button
        ref={caretRef}
        type="button"
        aria-label={left ? `Languages: ${left.chosen === 'orig' ? left.originalLabel : LANGUAGE_NAMES[left.chosen]} and ${LANGUAGE_NAMES[chosen]}. Choose others` : `Translation: ${LANGUAGE_NAMES[chosen]}. Choose another`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex w-5 items-center justify-center rounded-full border transition-colors min-[380px]:w-6 min-[420px]:w-7 ${
          open ? 'border-star-olympian/50 text-star-olympian' : 'border-transparent text-aether-muted hover:text-aether'
        }`}
      >
          <svg viewBox="0 0 12 12" fill="none" aria-hidden className={`h-2.5 w-2.5 transition-transform ${open ? 'rotate-180' : ''}`}>
            <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {open && (
        <GlassPanel
          ref={menuRef}
          role="menu"
          aria-label={left ? 'Languages' : 'Translation'}
          onKeyDown={onKeyDown}
          className={`absolute right-0 top-[calc(100%+0.5rem)] z-50 max-h-[calc(100dvh-8rem)] max-w-[calc(100vw-2rem)] overflow-y-auto bg-glass-heavy py-1.5 shadow-[0_16px_48px_rgba(5,2,15,0.75)] ${
            left ? 'grid w-[15.5rem] sm:w-[30rem] sm:grid-cols-2' : 'w-[15.5rem]'
          }`}
        >
          {left && (
            <div role="group" aria-label="Left page">
              <SectionHead wide="LEFT PAGE" narrow="ABOVE" />
              <Choice
                checked={left.chosen === 'orig'}
                disabled={false}
                name={left.originalLabel}
                note="The original"
                lang={left.originalLang}
                greek
                onPick={() => {
                  left.onChoose('orig');
                  close();
                }}
              />
              {READER_LANGUAGES.map((language) => (
                <Choice
                  key={language}
                  checked={left.chosen === language}
                  // a translation can face another only where the work has two
                  disabled={!translators[language] || Object.keys(translators).length < 2}
                  name={LANGUAGE_NAMES[language]}
                  note={translators[language] ?? MISSING[language]}
                  lang={language}
                  onPick={() => {
                    left.onChoose(language);
                    close();
                  }}
                />
              ))}
            </div>
          )}
          <div role="group" aria-label={left ? 'Right page' : 'Translation'}>
            {left ? <SectionHead wide="RIGHT PAGE" narrow="BELOW" /> : <p className="px-3.5 pb-1.5 font-display text-[9px] tracking-[0.22em] text-aether-faint">TRANSLATION</p>}
            {READER_LANGUAGES.map((language) => (
              <Choice
                key={language}
                checked={language === chosen}
                disabled={!translators[language]}
                name={LANGUAGE_NAMES[language]}
                note={translators[language] ?? MISSING[language]}
                lang={language}
                onPick={() => {
                  onChoose(language);
                  close();
                }}
              />
            ))}
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
