'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import { glowColorOf, type Dedication } from '@/features/galaxy/dedication';
import { lineSpans, type GiftScore } from '@/features/dedication/score';
import { stage } from '@/features/dedication/stage';
import { useDoorStore } from '@/features/dedication/store';
import type { CharacterType, SkyCharacter } from '@/types/character';

/** Greek-key hairline on the letterbox's inner edges, as the Proem carries it. */
const MEANDER =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='10' viewBox='0 0 20 10'%3E%3Cpath d='M0 9 H16 V1 H4 V6 H10' fill='none' stroke='%23f7c873' stroke-width='1.4'/%3E%3C/svg%3E\")";

interface Word {
  text: string;
  /** Its place among the line's words, for the order they kindle in; -1 is a space. */
  order: number;
  ref?: string;
}

function wordsOf(line: string): Word[] {
  const words: Word[] = [];
  let order = 0;
  for (const span of lineSpans(line)) {
    for (const piece of span.text.split(/(\s+)/)) {
      if (piece === '') continue;
      if (/^\s+$/.test(piece)) words.push({ text: ' ', order: -1 });
      else words.push({ text: piece, order: order++, ref: span.ref });
    }
  }
  return words;
}

/** The words of a performance: the poem, a line at a time, written in light over
 *  the sky that plays it. A line kindles word by word; the one before it rises
 *  and dims; a star's name burns in that star's colour. The letterbox carries
 *  the little chrome there is: the way out, and the thread of the poem's length.
 *  A touch holds the sky still, another lets it go on. */
export function GiftPerformance({
  gift,
  dedication,
  characters,
  onToggle,
  onStep,
  onLeave,
}: {
  gift: GiftScore;
  dedication: Dedication;
  characters: SkyCharacter[];
  onToggle: () => void;
  onStep: (by: 1 | -1) => void;
  onLeave: () => void;
}) {
  const spoken = useDoorStore((s) => s.spoken);
  const playing = useDoorStore((s) => s.playing);
  const linesRef = useRef<HTMLDivElement>(null);
  const nowRef = useRef<HTMLParagraphElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const types = useMemo(() => new Map<string, CharacterType>(characters.map((character) => [character.id, character.type])), [characters]);

  const rows = useMemo(() => {
    const hushed = spoken >= 0 && gift.track[spoken].n === null;
    const shown: { index: number; age: number; words: Word[]; step: number }[] = [];
    for (let index = Math.max(0, spoken - 2); index <= spoken; index++) {
      const entry = gift.track[index];
      if (entry.n === null) continue;
      const words = wordsOf(gift.poem[entry.n]);
      const count = words.filter((word) => word.order >= 0).length;
      const length = (gift.track[index + 1]?.t ?? gift.end) - entry.t;
      // The line is all alight a little before half its time is gone.
      shown.push({ index, age: hushed ? 2 : spoken - index, words, step: Math.min(0.17, (length * 0.42) / Math.max(1, count)) });
    }
    return shown;
  }, [spoken, gift]);

  // The line before rises by the height of the one now spoken, however it wraps.
  useLayoutEffect(() => {
    linesRef.current?.style.setProperty('--now', `${nowRef.current?.offsetHeight ?? 0}px`);
  }, [rows]);

  // The thread follows the stage's own time: no render for it.
  useEffect(() => {
    let frame = 0;
    const trace = () => {
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${Math.min(1, stage.time / gift.end)})`;
      frame = requestAnimationFrame(trace);
    };
    frame = requestAnimationFrame(trace);
    return () => cancelAnimationFrame(frame);
  }, [gift.end]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        event.preventDefault();
        onToggle();
      } else if (event.key === 'ArrowRight') onStep(1);
      else if (event.key === 'ArrowLeft') onStep(-1);
      else if (event.key === 'Escape') onLeave();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onToggle, onStep, onLeave]);

  /** A star's name in a line: its star's colour, the gift's own star in its two. */
  const named = (ref: string, text: string) => {
    if (ref === '@muses') return <span className="gift-name-muses">{text}</span>;
    if (ref === gift.star) {
      return (
        <span className="gift-name-clip" style={{ backgroundImage: `linear-gradient(90deg, ${dedication.from}, ${dedication.to})`, '--glow': dedication.color } as CSSProperties}>
          {text}
        </span>
      );
    }
    const type = types.get(ref);
    const color = type ? glowColorOf(ref, type) : dedication.to;
    return (
      <span className="gift-name" style={{ color, '--glow': color } as CSSProperties}>
        {text}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-40 cursor-pointer select-none overflow-hidden motion-safe:animate-[gift-veil-in_1200ms_ease-out_both]"
      onClick={onToggle}
      role="presentation"
      data-held={playing ? undefined : ''}
    >
      {/* The house: dark at the edges and under the words, the sky left clear above. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,transparent_34%,rgba(5,2,15,0.5)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[44vh] bg-gradient-to-t from-cosmos-deep/90 via-cosmos-deep/40 to-transparent" />

      <div className="gift-bar gift-bar-top" aria-hidden>
        <div className="absolute inset-x-0 bottom-0 h-[10px] opacity-30" style={{ backgroundImage: MEANDER, backgroundRepeat: 'repeat-x' }} />
      </div>
      <button
        type="button"
        aria-label="Leave"
        onClick={(event) => {
          event.stopPropagation();
          onLeave();
        }}
        className="absolute right-3 top-[max(0.4rem,env(safe-area-inset-top))] z-10 grid h-10 w-10 place-items-center rounded-full text-aether-faint transition-colors hover:text-aether sm:right-5"
      >
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
          <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.25" />
        </svg>
      </button>

      <div ref={linesRef} className="gift-lines" aria-live="polite">
        {rows.map((row) => (
          <p key={row.index} ref={row.age === 0 ? nowRef : undefined} className="gift-line" data-age={row.age} style={{ '--step': `${row.step}s` } as CSSProperties}>
            {row.words.map((word, at) => {
              if (word.order < 0) return ' ';
              return (
                <span key={at} className="gift-word" style={{ '--i': word.order } as CSSProperties}>
                  {word.ref ? named(word.ref, word.text) : word.text}
                </span>
              );
            })}
          </p>
        ))}
      </div>

      <p className={`gift-held ${playing ? 'opacity-0' : 'opacity-100'}`} aria-hidden={playing}>
        Held · touch to go on
      </p>

      <div className="gift-bar gift-bar-bottom">
        <div className="absolute inset-x-0 top-0 h-[10px] rotate-180 opacity-30" style={{ backgroundImage: MEANDER, backgroundRepeat: 'repeat-x' }} aria-hidden />
        <div className="gift-thread" aria-hidden>
          <div ref={fillRef} className="gift-thread-fill" style={{ backgroundImage: `linear-gradient(90deg, ${dedication.from}, ${dedication.to})` }} />
          {gift.marks.map((mark) => (
            <span key={mark} className="gift-thread-tick" style={{ left: `${(mark / gift.end) * 100}%` }} />
          ))}
        </div>
        <p className={`gift-hint ${spoken < 1 && playing ? 'opacity-100' : 'opacity-0'}`} aria-hidden>
          Touch to hold the sky still
        </p>
      </div>
    </div>
  );
}
