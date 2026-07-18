'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { buildOracle } from '@/features/spotlight/oracle';
import { useEphemerisStore } from '@/features/spotlight/store';
import { useEphemerisPayload } from '@/features/spotlight/usePayload';

/** The Oracle stage (docs/EPHEMERIS_PLAN.md §11) — the day's second event.
 *  Where the Proem is a violet title sequence, the Oracle is a golden
 *  Delphic chamber: one question at a time, Greek-letter progress
 *  (Α΄ Β΄ Γ΄), a verdict after every answer, and the Pythia's pronouncement
 *  at the end. Questions stay deterministic and data-true (oracle.ts);
 *  answers persist for the day only. ESC returns to the card. */

const GREEK_NUMERALS = ['Α΄', 'Β΄', 'Γ΄'] as const;

const GOLD = '#fcd34d';

/** Delphic sparks — a smaller, warmer scatter than the proem's. */
const EMBERS = [
  { left: '16%', top: '20%', size: 9, delay: 0.4, duration: 4.2 },
  { left: '28%', top: '68%', size: 6, delay: 1.6, duration: 3.8 },
  { left: '46%', top: '12%', size: 8, delay: 2.4, duration: 4.6 },
  { left: '70%', top: '22%', size: 7, delay: 0.9, duration: 3.5 },
  { left: '84%', top: '58%', size: 9, delay: 1.9, duration: 4.9 },
  { left: '60%', top: '78%', size: 6, delay: 3.0, duration: 4.1 },
] as const;

function pronouncement(score: number, of: number): string {
  if (of > 0 && score === of) return 'The Pythia crowns you — the god himself could not have answered better.';
  if (score >= Math.ceil(of / 2)) return 'The oracle is pleased — truth outweighed the smoke.';
  if (score > 0) return 'One flame in the vapors — the tellers keep their secrets a while longer.';
  return 'The tripod stays silent today. Return tomorrow; the sky will teach you.';
}

export function OracleOverlay() {
  const pick = useEphemerisStore((s) => s.pick);
  const data = useEphemerisStore((s) => s.data);
  const open = useEphemerisStore((s) => s.oracleOpen);
  const setOracleOpen = useEphemerisStore((s) => s.setOracleOpen);
  const setCardOpen = useEphemerisStore((s) => s.setCardOpen);

  const { payload } = useEphemerisPayload(open ? (pick?.id ?? null) : null, open);
  const questions = useMemo(
    () => (payload && data && pick ? buildOracle(payload, data, pick.isoDate) : []),
    [payload, data, pick],
  );
  const storageKey = pick ? `ephemeris-oracle:${pick.isoDate}:${pick.id}` : null;

  const [picks, setPicks] = useState<(number | null)[] | null>(null);
  const [stage, setStage] = useState<'title' | 'question' | 'verdict'>('title');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open || !storageKey || questions.length === 0) return;
    const frame = requestAnimationFrame(() => {
      let stored: (number | null)[] | null = null;
      try {
        const raw = localStorage.getItem(storageKey);
        stored = raw ? (JSON.parse(raw) as (number | null)[]) : null;
      } catch {
        stored = null;
      }
      const loaded =
        stored && stored.length === questions.length ? stored : questions.map(() => null);
      setPicks(loaded);
      setStage(loaded.every((entry) => entry !== null) ? 'verdict' : 'title');
      setIndex(Math.max(0, loaded.findIndex((entry) => entry === null)));
    });
    return () => cancelAnimationFrame(frame);
  }, [open, storageKey, questions]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOracleOpen(false);
      setCardOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, setOracleOpen, setCardOpen]);

  if (!open || !pick || questions.length === 0) return null;

  const close = () => {
    setOracleOpen(false);
    setCardOpen(true);
  };

  const answer = (optionIndex: number) => {
    if (!picks || !storageKey || picks[index] !== null) return;
    const next = [...picks];
    next[index] = optionIndex;
    setPicks(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Private mode — the oracle simply forgets by tomorrow.
    }
  };

  const advance = () => {
    if (!picks) return;
    const nextUnanswered = picks.findIndex((entry, i) => entry === null && i > index);
    const anyUnanswered = picks.findIndex((entry) => entry === null);
    if (nextUnanswered !== -1) {
      setIndex(nextUnanswered);
    } else if (anyUnanswered !== -1) {
      setIndex(anyUnanswered);
    } else {
      setStage('verdict');
    }
  };

  const question = questions[index];
  const chosen = picks?.[index] ?? null;
  const score = picks
    ? questions.reduce(
        (sum, entry, i) => sum + (picks[i] === entry.correctIndex ? 1 : 0),
        0,
      )
    : 0;

  return (
    <div className="fixed inset-0 z-40 select-none">
      {/* The chamber: deep veil, a golden breath at the center. */}
      <div className="absolute inset-0 bg-cosmos-deep/85 backdrop-blur-[2px]" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, rgba(252,211,77,0.09) 0%, transparent 55%)' }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {EMBERS.map((ember, i) => (
          <span
            key={i}
            className="absolute select-none leading-none opacity-30 motion-safe:[animation:proem-twinkle_4s_ease-in-out_infinite]"
            style={{
              left: ember.left,
              top: ember.top,
              fontSize: ember.size,
              color: GOLD,
              textShadow: `0 0 8px ${GOLD}`,
              animationDelay: `${ember.delay}s`,
              animationDuration: `${ember.duration}s`,
            }}
          >
            ✦
          </span>
        ))}
      </div>

      {/* Chrome: name left, Greek-letter progress center, close right. */}
      <div className="absolute inset-x-0 top-0 z-10 flex h-16 items-center justify-between px-5 sm:h-20 sm:px-8">
        <span className="font-display text-[10px] uppercase tracking-[0.3em] text-aether-faint">
          The Oracle
          <span className="text-aether/30"> · </span>
          <span className="text-star-olympian">{payload?.name ?? '…'}</span>
        </span>
        <span aria-hidden className="absolute left-1/2 flex -translate-x-1/2 items-center gap-3">
          {questions.map((entry, i) => {
            const answered = picks?.[i] !== null && picks?.[i] !== undefined;
            const current = stage === 'question' && i === index;
            return (
              <span
                key={`${entry.kind}-${i}`}
                className="font-display text-[12px] tracking-[0.1em]"
                style={{
                  color: answered ? GOLD : current ? '#e9d5ff' : 'rgba(233,213,255,0.25)',
                  textShadow: answered ? `0 0 10px ${GOLD}` : undefined,
                }}
              >
                {GREEK_NUMERALS[i] ?? `${i + 1}΄`}
              </span>
            );
          })}
        </span>
        <button
          type="button"
          onClick={close}
          aria-label="Leave the oracle"
          className="pointer-events-auto font-display text-[10px] uppercase tracking-[0.24em] text-aether-muted transition-colors hover:text-aether"
        >
          Leave ✕
        </button>
      </div>

      {/* The chamber floor. */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="w-full max-w-2xl text-center">
          {stage === 'title' && (
            <div key="title">
              <p className="font-display text-[11px] uppercase tracking-[0.34em] text-aether-muted motion-safe:[animation:proem-fade-up_500ms_ease_both]">
                The tripod is lit
              </p>
              <h1
                className="mt-4 font-display text-4xl uppercase leading-tight tracking-[0.14em] text-star-olympian sm:text-5xl motion-safe:[animation:proem-title-in_900ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
                style={{ textShadow: `0 0 24px ${GOLD}55, 0 0 80px ${GOLD}30` }}
              >
                The Oracle Speaks
              </h1>
              <div aria-hidden className="mx-auto mt-5 flex w-full max-w-xs items-center gap-3 motion-safe:[animation:proem-fade-up_700ms_ease_150ms_both]">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-star-olympian/50" />
                <span className="text-[11px] leading-none" style={{ color: GOLD, textShadow: `0 0 8px ${GOLD}` }}>
                  ✦
                </span>
                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-star-olympian/50" />
              </div>
              <p className="mt-4 font-body text-lg italic text-aether/90 sm:text-xl motion-safe:[animation:proem-fade-up_700ms_ease_240ms_both]">
                {questions.length === 1 ? 'One question' : questions.length === 2 ? 'Two questions' : 'Three questions'} on{' '}
                {payload?.name}, star of the day.
              </p>
              <button
                type="button"
                onClick={() => setStage('question')}
                className="pointer-events-auto mt-7 rounded-xl border border-star-olympian/50 bg-star-olympian/10 px-8 py-3 font-display text-[12px] uppercase tracking-[0.2em] text-star-olympian backdrop-blur-xl transition-all hover:bg-star-olympian/20 motion-safe:[animation:proem-fade-up_700ms_ease_330ms_both]"
              >
                Step to the tripod
              </button>
            </div>
          )}

          {stage === 'question' && question && picks && (
            <div key={`question-${index}`} className="motion-safe:[animation:proem-fade-up_450ms_ease_both]">
              <p className="font-display text-[11px] uppercase tracking-[0.3em] text-star-olympian/80">
                {GREEK_NUMERALS[index] ?? `${index + 1}΄`} · question {index + 1} of {questions.length}
              </p>
              <h2 className="mt-4 font-body text-2xl leading-snug text-aether sm:text-[26px]">
                {question.prompt}
              </h2>
              <div className={`mt-7 grid gap-2.5 ${question.options.length > 2 ? 'sm:grid-cols-2' : ''}`}>
                {question.options.map((option, optionIndex) => {
                  const isCorrect = optionIndex === question.correctIndex;
                  const stateClass =
                    chosen === null
                      ? 'border-glass-border bg-glass text-aether/90 hover:border-star-olympian/50 hover:text-star-olympian'
                      : isCorrect
                        ? 'border-star-olympian/60 bg-star-olympian/10 text-star-olympian'
                        : chosen === optionIndex
                          ? 'border-star-titan/50 bg-star-titan/10 text-star-titan'
                          : 'border-glass-border/60 text-aether-faint opacity-50';
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={chosen !== null}
                      onClick={() => answer(optionIndex)}
                      className={`pointer-events-auto rounded-2xl border px-5 py-4 text-left font-body text-[15px] leading-snug backdrop-blur-xl transition-colors ${stateClass}`}
                      style={
                        chosen !== null && isCorrect
                          ? { boxShadow: `0 0 24px ${GOLD}22` }
                          : undefined
                      }
                    >
                      {option}
                      {chosen !== null && isCorrect && ' ✓'}
                    </button>
                  );
                })}
              </div>
              {chosen !== null && (
                <div className="mt-6 motion-safe:[animation:proem-fade-up_400ms_ease_both]">
                  <p className="font-body text-[15px] italic text-aether-muted">
                    {chosen === question.correctIndex
                      ? 'The oracle nods.'
                      : 'The tellers say otherwise.'}
                  </p>
                  <button
                    type="button"
                    onClick={advance}
                    className="pointer-events-auto mt-3 font-display text-[11px] uppercase tracking-[0.22em] text-star-olympian transition-colors hover:text-aether"
                  >
                    continue ▸
                  </button>
                </div>
              )}
            </div>
          )}

          {stage === 'verdict' && picks && (
            <div key="verdict">
              <p className="font-display text-[11px] uppercase tracking-[0.34em] text-aether-muted motion-safe:[animation:proem-fade-up_500ms_ease_both]">
                The smoke clears
              </p>
              <h1
                className="mt-4 font-display text-5xl uppercase tracking-[0.14em] text-star-olympian sm:text-6xl motion-safe:[animation:proem-title-in_900ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
                style={{ textShadow: `0 0 24px ${GOLD}55, 0 0 80px ${GOLD}30` }}
              >
                {score} of {questions.length}
              </h1>
              <p className="mt-5 font-body text-lg italic text-aether/90 sm:text-xl motion-safe:[animation:proem-fade-up_700ms_ease_200ms_both]">
                {pronouncement(score, questions.length)}
              </p>
              <div className="mx-auto mt-7 flex w-full max-w-sm flex-col gap-2 motion-safe:[animation:proem-fade-up_700ms_ease_320ms_both]">
                <Link
                  href={`/character/${pick.id}`}
                  onClick={() => setOracleOpen(false)}
                  className="pointer-events-auto rounded-xl border border-star-olympian/45 bg-star-olympian/10 px-6 py-3 text-center font-display text-[12px] uppercase tracking-[0.18em] text-star-olympian backdrop-blur-xl transition-all hover:bg-star-olympian/20"
                >
                  Descend into the codex
                </Link>
                <button
                  type="button"
                  onClick={close}
                  className="pointer-events-auto rounded-xl border border-glass-border bg-glass px-6 py-3 text-center font-display text-[12px] uppercase tracking-[0.18em] text-aether-muted backdrop-blur-xl transition-colors hover:border-star-olympian/40 hover:text-aether"
                >
                  Return to the card
                </button>
                <p className="mt-1.5 font-body text-[13px] text-aether-faint">
                  The tripod is lit again at midnight in Athens.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
