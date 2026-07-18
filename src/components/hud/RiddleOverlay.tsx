'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { pickSourced } from '@/lib/lens';
import { useGalaxyStore } from '@/features/galaxy/store';
import { foldName as fold, maskStarName } from '@/features/spotlight/oracle';
import { invocationLine } from '@/features/spotlight/proem';
import { useEphemerisStore } from '@/features/spotlight/store';
import { useEphemerisPayload } from '@/features/spotlight/usePayload';
import { TYPE_GLOW } from '@/types/character';

/** The Riddle — the default door to an unrevealed day (docs/EPHEMERIS_PLAN.md
 *  §11). Riddles belong to the Sphinx, so the stage is hers: where the Proem
 *  is violet and the Oracle gold, this chamber is moonlit cyan. Three
 *  guesses; naming the star or exhausting them lifts the veil either way —
 *  the Sphinx never keeps a day hostage. The guess box carries its own
 *  themed suggestion list (the browser datalist broke the theme, eleventh
 *  UX review) in the ⌘K search's visual language. */

const CYAN = '#00e5ff';
const ATTEMPTS = 3;
const SUGGESTION_CAP = 7;

export function RiddleOverlay() {
  const pick = useEphemerisStore((s) => s.pick);
  const data = useEphemerisStore((s) => s.data);
  const open = useEphemerisStore((s) => s.riddleOpen);
  const setRiddleOpen = useEphemerisStore((s) => s.setRiddleOpen);
  const setCardOpen = useEphemerisStore((s) => s.setCardOpen);
  const lens = useGalaxyStore((s) => s.lens);
  const pathname = usePathname();
  const router = useRouter();

  const { payload } = useEphemerisPayload(open ? (pick?.id ?? null) : null, open);
  const [guess, setGuess] = useState('');
  const [misses, setMisses] = useState(0);
  const [outcome, setOutcome] = useState<'named' | 'yielded' | null>(null);
  const [focused, setFocused] = useState(false);
  const [highlight, setHighlight] = useState(0);

  // A day already revealed (edge entry) skips straight to the card; a fresh
  // day resets the chamber. Read after paint — the server knows no "today".
  useEffect(() => {
    if (!open || !pick) return;
    const frame = requestAnimationFrame(() => {
      if (localStorage.getItem('ephemeris-riddle') === pick.isoDate) {
        setRiddleOpen(false);
        setCardOpen(true);
      } else {
        setOutcome(null);
        setMisses(0);
        setGuess('');
        setHighlight(0);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [open, pick, setRiddleOpen, setCardOpen]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRiddleOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, setRiddleOpen]);

  const suggestions = useMemo(() => {
    if (!data || outcome !== null) return [];
    const query = fold(guess.trim());
    if (!query) return [];
    const names = data.roster.map((entry) => entry.name);
    const starts = names.filter((name) => fold(name).startsWith(query));
    const contains = names.filter(
      (name) => !fold(name).startsWith(query) && fold(name).includes(query),
    );
    // Homonyms (the two Creons) collapse to one row: the guess is judged by
    // name, so a single entry serves them all — and React keys stay unique.
    const seen = new Set<string>();
    const unique = [...starts, ...contains].filter((name) => {
      const folded = fold(name);
      if (seen.has(folded)) return false;
      seen.add(folded);
      return true;
    });
    return unique.slice(0, SUGGESTION_CAP);
  }, [data, guess, outcome]);
  const showList = focused && suggestions.length > 0;

  if (!open || !pick) return null;

  const seal = () => {
    try {
      localStorage.setItem('ephemeris-riddle', pick.isoDate);
      localStorage.setItem('ephemeris-seen', pick.isoDate);
    } catch {
      // Private mode — the veil lifts for this visit only.
    }
  };

  /** One guess, typed or picked from the list. */
  const evaluate = (raw: string) => {
    if (!payload || outcome !== null) return;
    const attempt = raw.trim();
    if (!attempt) return;
    setFocused(false);
    if (fold(attempt) === fold(payload.name)) {
      seal();
      setOutcome('named');
      return;
    }
    const next = misses + 1;
    setMisses(next);
    setGuess('');
    setHighlight(0);
    if (next >= ATTEMPTS) {
      seal();
      setOutcome('yielded');
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (showList) {
      evaluate(suggestions[Math.min(highlight, suggestions.length - 1)] ?? guess);
      return;
    }
    evaluate(guess);
  };

  const onInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!showList) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((current) => Math.min(current + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Escape') {
      // Close the list first — the stage's own Escape stays one press away.
      event.stopPropagation();
      setFocused(false);
    }
  };

  const yieldToSphinx = () => {
    seal();
    setOutcome('yielded');
  };

  const close = () => setRiddleOpen(false);
  const openCard = () => {
    setRiddleOpen(false);
    setCardOpen(true);
  };
  const beginProem = () => {
    setRiddleOpen(false);
    if (pathname !== '/') {
      router.push('/?proem=1');
      return;
    }
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      useGalaxyStore.getState().select(pick.id);
    }
    useEphemerisStore.getState().startProem();
  };

  const flourish = payload
    ? (invocationLine(payload).split(' — ')[1]?.replace(/\.$/, '') ?? '')
    : '';
  const summary = payload ? (pickSourced(payload.summary, lens) ?? payload.summary[0]) : null;
  const masked = summary && payload ? maskStarName(summary.text, payload) : null;
  const glow = payload ? TYPE_GLOW[payload.type].color : CYAN;
  const remaining = ATTEMPTS - misses;

  return (
    <div className="fixed inset-0 z-40 select-none">
      {/* The Sphinx's chamber: deep veil, a cold moonlit breath, one vast question. */}
      <div className="absolute inset-0 bg-cosmos-deep/85 backdrop-blur-[2px]" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, rgba(0,229,255,0.07) 0%, transparent 55%)' }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[min(46vh,340px)] leading-none text-nebula-cyan opacity-[0.05]"
      >
        ?
      </span>

      {/* Chrome: the question left, the three guesses center, leave right. */}
      <div className="absolute inset-x-0 top-0 z-10 flex h-16 items-center justify-between px-5 sm:h-20 sm:px-8">
        <span className="font-display text-[10px] uppercase tracking-[0.3em] text-aether-faint">
          The Ephemeris
          <span className="text-aether/30"> · </span>
          <span style={{ color: CYAN }}>Who rises today?</span>
        </span>
        <span aria-hidden className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2.5 sm:flex">
          {Array.from({ length: ATTEMPTS }, (_, index) => {
            const alive = index < remaining && outcome === null;
            return (
              <span
                key={index}
                className="text-[12px] leading-none transition-opacity duration-500"
                style={{
                  color: alive ? CYAN : 'rgba(233,213,255,0.2)',
                  textShadow: alive ? `0 0 10px ${CYAN}` : undefined,
                }}
              >
                ✦
              </span>
            );
          })}
        </span>
        <button
          type="button"
          onClick={close}
          aria-label="Leave the riddle"
          className="pointer-events-auto font-display text-[10px] uppercase tracking-[0.24em] text-aether-muted transition-colors hover:text-aether"
        >
          Leave ✕
        </button>
      </div>

      {/* The chamber floor. */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="w-full max-w-2xl text-center">
          {!payload && (
            <div className="flex items-center justify-center gap-2" aria-hidden>
              <span className="h-2 w-2 animate-pulse rounded-full bg-aether-faint/40" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-aether-faint/40 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-aether-faint/40 [animation-delay:300ms]" />
            </div>
          )}

          {payload && outcome === null && (
            <div key="asking">
              <p
                className="font-display text-[11px] uppercase tracking-[0.34em] motion-safe:[animation:proem-fade-up_500ms_ease_both]"
                style={{ color: CYAN }}
              >
                The Sphinx asks
              </p>
              <h2 className="mt-5 font-body text-2xl italic leading-snug text-aether sm:text-3xl motion-safe:[animation:proem-fade-up_650ms_ease_120ms_both]">
                “{flourish} — who am I?”
              </h2>
              {masked && (
                <p className="mx-auto mt-5 max-w-xl font-body text-[16px] leading-relaxed text-aether-muted motion-safe:[animation:proem-fade-up_700ms_ease_240ms_both]">
                  {masked}
                </p>
              )}
              <form
                onSubmit={submit}
                className="mx-auto mt-7 flex w-full max-w-md gap-2 motion-safe:[animation:proem-fade-up_700ms_ease_340ms_both]"
              >
                <div className="relative min-w-0 flex-1">
                  <input
                    value={guess}
                    onChange={(event) => {
                      setGuess(event.target.value);
                      setHighlight(0);
                      setFocused(true);
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={onInputKeyDown}
                    placeholder="Name the star…"
                    aria-label="Name the star of the day"
                    autoComplete="off"
                    spellCheck={false}
                    className="pointer-events-auto w-full rounded-xl border border-glass-border bg-glass px-4 py-2.5 font-body text-[15px] text-aether backdrop-blur-xl placeholder:text-aether-faint focus:border-nebula-cyan/60 focus:outline-none"
                  />
                  {showList && (
                    <ul className="pointer-events-auto absolute inset-x-0 top-[calc(100%+8px)] z-10 max-h-60 overflow-y-auto rounded-xl border border-glass-border bg-glass-heavy text-left shadow-[0_24px_80px_rgba(5,2,15,0.85),0_0_48px_rgba(0,229,255,0.1)] backdrop-blur-xl">
                      {suggestions.map((name, index) => (
                        <li key={name}>
                          <button
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              evaluate(name);
                            }}
                            onMouseEnter={() => setHighlight(index)}
                            className={`block w-full px-4 py-2.5 text-left font-display text-[13px] uppercase tracking-[0.12em] transition-colors ${
                              index === highlight
                                ? 'bg-nebula-cyan/10 text-aether'
                                : 'text-aether-muted hover:text-aether'
                            }`}
                          >
                            {name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="submit"
                  className="pointer-events-auto rounded-xl border border-nebula-cyan/45 bg-nebula-cyan/10 px-6 py-2.5 font-display text-[12px] uppercase tracking-[0.18em] backdrop-blur-xl transition-all hover:bg-nebula-cyan/20"
                  style={{ color: CYAN }}
                >
                  Guess
                </button>
              </form>
              <div className="mx-auto mt-3 flex w-full max-w-md items-center justify-between">
                <span className="font-body text-[13px] text-aether-faint">
                  {misses > 0 ? `Not that star — ${remaining} ${remaining === 1 ? 'guess' : 'guesses'} left` : ' '}
                </span>
                <button
                  type="button"
                  onClick={yieldToSphinx}
                  className="pointer-events-auto font-display text-[10px] uppercase tracking-[0.2em] text-aether-muted transition-colors hover:text-aether"
                >
                  Yield →
                </button>
              </div>
            </div>
          )}

          {payload && outcome !== null && (
            <div key="revealed">
              <p className="font-display text-[11px] uppercase tracking-[0.34em] text-aether-muted motion-safe:[animation:proem-fade-up_500ms_ease_both]">
                {outcome === 'named' ? 'You named the star' : 'The Sphinx yields'}
              </p>
              <h1
                className="mt-4 font-display text-5xl uppercase leading-none tracking-[0.14em] sm:text-6xl motion-safe:[animation:proem-title-in_950ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
                style={{ color: glow, textShadow: `0 0 24px ${glow}66, 0 0 90px ${glow}40` }}
              >
                {payload.name.toUpperCase()}
              </h1>
              {flourish && (
                <p className="mt-4 font-body text-lg italic text-aether/90 sm:text-xl motion-safe:[animation:proem-fade-up_700ms_ease_200ms_both]">
                  {flourish}.
                </p>
              )}
              <div className="mx-auto mt-7 flex w-full max-w-sm flex-col gap-2 motion-safe:[animation:proem-fade-up_700ms_ease_320ms_both]">
                <button
                  type="button"
                  onClick={beginProem}
                  className="pointer-events-auto rounded-xl border border-nebula-soft/45 bg-nebula-violet/15 px-6 py-3 text-center font-display text-[12px] uppercase tracking-[0.18em] text-nebula-soft backdrop-blur-xl transition-all hover:bg-nebula-violet/30"
                >
                  Begin the proem
                </button>
                <button
                  type="button"
                  onClick={openCard}
                  className="pointer-events-auto rounded-xl border border-glass-border bg-glass px-6 py-3 text-center font-display text-[12px] uppercase tracking-[0.18em] text-aether-muted backdrop-blur-xl transition-colors hover:border-nebula-cyan/40 hover:text-aether"
                >
                  Open the card
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="pointer-events-auto rounded-xl border border-glass-border bg-glass px-6 py-3 text-center font-display text-[12px] uppercase tracking-[0.18em] text-aether-muted backdrop-blur-xl transition-colors hover:border-nebula-cyan/40 hover:text-aether"
                >
                  Return to the sky
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
