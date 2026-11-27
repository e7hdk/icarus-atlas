'use client';

import { useMemo, type CSSProperties } from 'react';
import { Link } from '@/components/ui/Link';
import { glowColorOf, type Dedication } from '@/features/galaxy/dedication';
import { lineSpans, type GiftScore } from '@/features/dedication/score';
import type { CharacterType, SkyCharacter } from '@/types/character';

const doorClass =
  'pointer-events-auto border px-6 py-3 text-center font-display text-[11px] uppercase tracking-[0.2em] transition-all';

/** The poem as it stays: one leaf, set as the Library sets its books, every
 *  fifth line numbered in the margin as an edition numbers them. A star's name
 *  keeps its star's colour and leads to its codex; the passages the poem
 *  echoes are listed under it, each a way into the Library. */
export function GiftLeaf({
  gift,
  dedication,
  characters,
  onWatch,
  onLeave,
}: {
  gift: GiftScore;
  dedication: Dedication;
  characters: SkyCharacter[];
  onWatch: () => void;
  onLeave: () => void;
}) {
  const types = useMemo(() => new Map<string, CharacterType>(characters.map((character) => [character.id, character.type])), [characters]);
  const clip: CSSProperties = { backgroundImage: `linear-gradient(90deg, ${dedication.from}, ${dedication.to})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

  const name = (ref: string, text: string, key: number) => {
    if (ref === '@muses') return <span key={key} className="gift-name-muses">{text}</span>;
    if (ref.startsWith('@')) return <span key={key} style={{ color: dedication.to }}>{text}</span>;
    if (ref === gift.star) return <span key={key} style={clip}>{text}</span>;
    const type = types.get(ref);
    if (!type) return text;
    return (
      <Link key={key} href={`/character/${ref}`} className="hover:underline" style={{ color: glowColorOf(ref, type) }}>
        {text}
      </Link>
    );
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto overscroll-contain motion-safe:animate-[gift-veil-in_900ms_ease-out_both]">
      <div className="pointer-events-none fixed inset-0 bg-cosmos-deep/80" />
      <article className="gift-leaf" style={{ '--leaf-from': dedication.from, '--leaf-to': dedication.to } as CSSProperties}>
        <header className="flex flex-col items-center">
          <div className="flex w-28 items-center gap-2.5" aria-hidden>
            <span className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${dedication.from}99)` }} />
            <span className="h-1.5 w-1.5 rotate-45 border" style={{ borderColor: `${dedication.to}cc`, background: `${dedication.from}33` }} />
            <span className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${dedication.to}99)` }} />
          </div>
          <h1 className="mt-5 font-display text-[30px] tracking-[0.3em] sm:text-[38px]" style={{ ...clip, paddingLeft: '0.3em' }}>
            {gift.title.toUpperCase()}
          </h1>
        </header>

        <ol className="gift-poem">
          {gift.poem.map((line, index) => (
            <li key={index} data-n={(index + 1) % 5 === 0 ? index + 1 : undefined}>
              {lineSpans(line).map((span, at) => (span.ref ? name(span.ref, span.text, at) : span.text))}
            </li>
          ))}
        </ol>

        {gift.signature && <p className="gift-signature">{gift.signature}</p>}

        {gift.notes.length > 0 && (
          <section className="mt-12 border-t border-white/10 pt-7">
            <h2 className="text-center font-display text-[10px] uppercase tracking-[0.3em] text-aether-faint">What it echoes</h2>
            <ul className="mt-5 space-y-3">
              {gift.notes.map((note) => {
                const lines = note.from === note.to ? `${note.from}` : `${note.from}–${note.to}`;
                const cite = <span className="italic text-star-olympian/80 group-hover:underline">{note.cite}</span>;
                return (
                  <li key={`${note.from}-${note.cite}`} className="grid grid-cols-[3.3rem_1fr] items-baseline font-body text-[16px] leading-snug">
                    <span className="font-display text-[10px] tracking-[0.14em] text-aether-faint">{lines}</span>
                    <span>
                      <span className="text-aether/90">{note.text}</span>
                      <span className="mx-2 text-aether-faint" aria-hidden>
                        ·
                      </span>
                      {note.href ? (
                        <Link href={note.href} className="group">
                          {cite}
                        </Link>
                      ) : (
                        cite
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <footer className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onWatch}
            className={doorClass}
            style={{ borderColor: `${dedication.color}73`, color: dedication.color, background: `${dedication.color}14` }}
          >
            Watch it again
          </button>
          <button type="button" onClick={onLeave} className={`${doorClass} border-glass-border text-aether-muted hover:border-white/30 hover:text-aether`}>
            Return to the galaxy
          </button>
        </footer>
      </article>
    </div>
  );
}

/** The two ways on, over the sky: after the performance, and for the one who
 *  comes back with the door already open. */
export function GiftDoors({
  dedication,
  greeting,
  onWatch,
  onRead,
  onLeave,
}: {
  dedication: Dedication;
  greeting?: string;
  onWatch: () => void;
  onRead: () => void;
  onLeave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-end px-6 pb-[max(12vh,4.5rem)] motion-safe:animate-[gift-rise_1400ms_cubic-bezier(0.2,0.7,0.2,1)_500ms_both]">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[52vh] bg-gradient-to-t from-cosmos-deep/95 via-cosmos-deep/50 to-transparent" />
      {greeting && <p className="relative mb-7 text-center font-body text-[24px] italic text-aether [text-shadow:0_2px_22px_rgba(5,2,15,0.95)]">{greeting}</p>}
      <div className="relative flex flex-col items-stretch gap-3 sm:flex-row">
        <button type="button" onClick={onRead} className={doorClass} style={{ borderColor: `${dedication.color}73`, color: dedication.color, background: `${dedication.color}14` }}>
          Read the poem
        </button>
        <button type="button" onClick={onWatch} className={`${doorClass} border-glass-border bg-glass text-aether-muted backdrop-blur-xl hover:border-white/30 hover:text-aether`}>
          {greeting ? 'Watch it' : 'Watch it again'}
        </button>
      </div>
      <button type="button" onClick={onLeave} className="relative mt-6 font-display text-[10px] uppercase tracking-[0.26em] text-aether-faint transition-colors hover:text-aether">
        Return to the galaxy
      </button>
    </div>
  );
}
