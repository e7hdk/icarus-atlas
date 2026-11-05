'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

/** The reading room's live parts (docs/LIBRARY_PLAN.md §6): the language switch,
 *  the deep link — `#l370-417`, `#s1.3.1`, `#t92` glow and settle on the reading
 *  line — and the reading line itself, which marks the block under the eyes
 *  (`data-now`) for the margin to follow. The text is server-rendered; this only
 *  sets attributes on it. */

type Language = 'both' | 'orig' | 'trans';
const READING_LINE = 0.42;

/** The block under the reading line (its `data-from`), for the margin and the strip. */
const NowContext = createContext<string | null>(null);
export const useReadingNow = () => useContext(NowContext);

/** 929 < 929a < 930; 1.9 < 1.10 */
function compareIds(a: string, b: string): number {
  const left = a.split('.');
  const right = b.split('.');
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const delta = Number.parseInt(left[i], 10) - Number.parseInt(right[i], 10);
    if (delta !== 0) return delta;
    const letter = left[i].replace(/^\d+/, '').localeCompare(right[i].replace(/^\d+/, ''));
    if (letter !== 0) return letter;
  }
  return 0;
}

const within = (id: string, from: string, to: string) => compareIds(id, from) >= 0 && compareIds(id, to) <= 0;

function targetsOf(root: HTMLElement, hash: string): HTMLElement[] {
  const lines = /^#l([\dA-Za-z]+)(?:-([\dA-Za-z]+))?$/.exec(hash);
  if (lines) {
    const [, from, to = lines[1]] = lines;
    return [...root.querySelectorAll<HTMLElement>('.lib-line')].filter((line) => within(line.dataset.n ?? '', from, to));
  }
  const sections = /^#s([\d.]+)(?:-([\d.]+))?$/.exec(hash);
  if (sections) {
    const [, from, to = sections[1]] = sections;
    return [...root.querySelectorAll<HTMLElement>('.lib-block')].filter((block) => {
      const id = block.dataset.from ?? '';
      return within(id, from, to) || id.startsWith(`${from}.`) || id.startsWith(`${to}.`);
    });
  }
  const tale = /^#t(.+)$/.exec(hash);
  if (tale) return [...root.querySelectorAll<HTMLElement>('.lib-block')].filter((block) => block.dataset.from === decodeURIComponent(tale[1]));
  return [];
}

export function ReadingLens({
  children,
  hasOriginal,
  showsTranslation,
  originalLabel,
  verse,
}: {
  children: ReactNode;
  hasOriginal: boolean;
  showsTranslation: boolean;
  originalLabel: string;
  /** Verse lines are short: the English column takes the wider share. */
  verse: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(hasOriginal && showsTranslation ? 'both' : hasOriginal ? 'orig' : 'trans');

  // the deep link: on arrival and on every new hash
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mark = () => {
      for (const node of root.querySelectorAll('[data-target]')) node.removeAttribute('data-target');
      const targets = targetsOf(root, window.location.hash);
      if (targets.length === 0) return;
      for (const target of targets) {
        target.setAttribute('data-target', '');
        target.closest('.lib-block')?.setAttribute('data-target', '');
        target.classList.remove('lib-flash');
        void target.offsetWidth;
        target.classList.add('lib-flash');
      }
      // blocks out of view are skipped by `content-visibility`, so their height is a
      // guess: lay every block out once, measure, scroll, and let them sleep again
      // (`contain-intrinsic-size: auto` keeps the heights they were measured at).
      // The Greek face arrives after the first paint and moves every line, so the
      // measuring waits for the fonts, and checks once more that the target held.
      root.setAttribute('data-full', '');
      const settle = () => {
        const off = targets[0].getBoundingClientRect().top - window.innerHeight * READING_LINE;
        if (Math.abs(off) > 24) window.scrollTo({ top: Math.max(0, window.scrollY + off + 4), behavior: 'auto' });
      };
      document.fonts.ready.then(() => {
        requestAnimationFrame(() => {
          settle();
          requestAnimationFrame(() => {
            root.removeAttribute('data-full');
            window.setTimeout(settle, 250);
          });
        });
      });
    };
    mark();
    window.addEventListener('hashchange', mark);
    return () => window.removeEventListener('hashchange', mark);
  }, []);

  // the reading line: one rAF per scroll, the block under it is `data-now`
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    let current: Element | null = null;
    // in the grid of tales, the tale the pointer or the keyboard is on
    let chosen: Element | null = null;
    const trace = () => {
      frame = 0;
      const line = window.innerHeight * READING_LINE;
      // the last row that has reached the line: one block, or a row of tales
      let row: Element[] = [];
      let rowTop = -Infinity;
      for (const block of root.querySelectorAll('.lib-block')) {
        const top = block.getBoundingClientRect().top;
        if (top > line) break;
        if (Math.abs(top - rowTop) > 1) {
          row = [];
          rowTop = top;
        }
        row.push(block);
      }
      const now = row.find((block) => block === chosen) ?? row.find((block) => block.hasAttribute('data-target')) ?? row[0] ?? null;
      if (now === current) return;
      current?.removeAttribute('data-now');
      now?.setAttribute('data-now', '');
      current = now;
      setNow(now instanceof HTMLElement ? (now.dataset.from ?? null) : null);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(trace);
    };
    const choose = (event: Event) => {
      const tale = event.target instanceof Element ? event.target.closest('.lib-tales .lib-block') : null;
      if (!tale || tale === chosen) return;
      chosen = tale;
      schedule();
    };
    trace();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', schedule);
    root.addEventListener('pointerover', choose);
    root.addEventListener('focusin', choose);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('hashchange', schedule);
      root.removeEventListener('pointerover', choose);
      root.removeEventListener('focusin', choose);
    };
  }, []);

  const choices: [Language, string][] = [
    ['orig', originalLabel],
    ['both', 'Both'],
    ['trans', 'English'],
  ];

  return (
    <div ref={rootRef} className="library-text" data-lang={language} data-verse={verse ? '' : undefined}>
      {hasOriginal && showsTranslation && (
        <div role="group" aria-label="Language" className="mb-6 flex w-max gap-1 rounded-full border border-glass-border bg-glass p-1 backdrop-blur-xl lg:ml-[204px]">
          {choices.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={language === value}
              onClick={() => setLanguage(value)}
              className={`rounded-full border px-3.5 py-1.5 transition-colors sm:px-4 ${
                language === value ? 'border-star-olympian/50 bg-star-olympian/10 text-star-olympian' : 'border-transparent text-aether-muted hover:text-aether'
              } ${value === 'orig' ? 'font-greek text-[13px]' : 'font-display text-[10px] tracking-[0.18em]'}`}
            >
              {value === 'orig' ? label : label.toUpperCase()}
            </button>
          ))}
        </div>
      )}
      <NowContext.Provider value={now}>{children}</NowContext.Provider>
    </div>
  );
}
