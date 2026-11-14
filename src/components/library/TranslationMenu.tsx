'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { READER_LANGUAGES, type ReaderLanguage } from '@/types/library';

/** The reading room's language switch and its choice of translation
 *  (docs/LIBRARY_PLAN.md §6): the switch's segments, then a caret that opens the
 *  reader's languages, each named in itself, with its translator. A language the
 *  work has no free translation in stays on the list, faint, and says so. The menu
 *  hangs outside the switch's frosted pill: a frosted panel inside another blurs
 *  nothing behind it, and the margin would read through. */

export const LANGUAGE_NAMES: Record<ReaderLanguage, string> = { en: 'English', de: 'Deutsch', tr: 'Türkçe' };

const MISSING: Record<ReaderLanguage, string> = {
  en: 'Read at ToposText for now',
  de: 'No free German translation of this work yet',
  tr: 'No Turkish translation of this work yet',
};

export function TranslationMenu({
  chosen,
  translators,
  onChoose,
  children,
}: {
  chosen: ReaderLanguage;
  /** The languages this work can be read in, each with its translator. */
  translators: Partial<Record<ReaderLanguage, string>>;
  onChoose: (language: ReaderLanguage) => void;
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
        aria-label={`Translation: ${LANGUAGE_NAMES[chosen]}. Choose another`}
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
          aria-label="Translation"
          onKeyDown={onKeyDown}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[15.5rem] max-w-[calc(100vw-2rem)] bg-glass-heavy py-1.5 shadow-[0_16px_48px_rgba(5,2,15,0.75)]"
        >
          <p className="px-3.5 pb-1.5 font-display text-[9px] tracking-[0.22em] text-aether-faint">TRANSLATION</p>
          {READER_LANGUAGES.map((language) => {
            const translator = translators[language];
            const checked = language === chosen;
            return (
              <button
                key={language}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                disabled={!translator}
                lang={language}
                onClick={() => {
                  onChoose(language);
                  close();
                }}
                className="flex w-full items-start gap-3 px-3.5 py-2 text-left outline-none transition-colors hover:bg-nebula-violet/10 focus-visible:bg-nebula-violet/10 disabled:pointer-events-none"
              >
                <span
                  aria-hidden
                  className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${checked ? 'bg-star-olympian shadow-[0_0_8px_var(--color-star-olympian)]' : 'border border-glass-border'}`}
                />
                <span className="min-w-0">
                  <span className={`block font-display text-[11px] tracking-[0.18em] ${!translator ? 'text-aether-faint' : checked ? 'text-star-olympian' : 'text-aether'}`}>
                    {LANGUAGE_NAMES[language].toUpperCase()}
                  </span>
                  <span lang="en" className={`block font-body text-[13px] leading-snug ${translator ? 'text-aether-muted' : 'italic text-aether-faint'}`}>
                    {translator ?? MISSING[language]}
                  </span>
                </span>
              </button>
            );
          })}
        </GlassPanel>
      )}
    </div>
  );
}
