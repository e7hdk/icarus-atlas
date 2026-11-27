'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadAtlasFile } from '@/features/atlas/useAtlasFile';
import type { Dedication, DedicationDoor } from '@/features/galaxy/dedication';
import { giftSchema, type GiftScore } from '@/features/dedication/score';
import { canUnseal, dayPassphrase, deriveKey, openSealed, type Sealed } from '@/features/dedication/seal';

type Hearing = 'idle' | 'listening' | 'unknown' | 'insecure' | 'unreachable';

const SAID: Record<Exclude<Hearing, 'idle'>, string> = {
  listening: 'The sky is listening…',
  unknown: 'The sky does not know that day.',
  insecure: 'This door opens only over a secure connection.',
  unreachable: 'The sky is out of reach. Try again in a moment.',
};

const digits = (value: string, length: number) => value.replace(/\D/g, '').slice(0, length);

/** The door's question. Its answer is a day, given as three numbers; the day
 *  is never compared with anything kept here. It is turned into a key, and the
 *  sealed gift either opens under that key or does not. */
export function DoorLock({
  dedication,
  door,
  onOpen,
}: {
  dedication: Dedication;
  door: DedicationDoor;
  onOpen: (gift: GiftScore, key: CryptoKey) => void;
}) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [hearing, setHearing] = useState<Hearing>('idle');
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const complete = day.length > 0 && month.length > 0 && year.length === 4;

  const attempt = useCallback(async () => {
    if (!canUnseal()) {
      setHearing('insecure');
      return;
    }
    setHearing('listening');
    let sealed: Sealed;
    try {
      sealed = await loadAtlasFile<Sealed>(door.sealed);
    } catch {
      setHearing('unreachable');
      return;
    }
    try {
      const key = await deriveKey(dayPassphrase(Number(day), Number(month), Number(year)), sealed.kdf);
      onOpen(giftSchema.parse(await openSealed<unknown>(sealed, key)), key);
    } catch {
      setHearing('unknown');
    }
  }, [day, month, year, door.sealed, onOpen]);

  // The last digit of the year is the asking: no button stands between.
  useEffect(() => {
    if (!complete || hearing !== 'idle') return;
    const timer = window.setTimeout(() => void attempt(), 420);
    return () => window.clearTimeout(timer);
  }, [complete, hearing, attempt]);

  // A day the sky does not know is taken back, and the door asks again.
  useEffect(() => {
    if (hearing !== 'unknown') return;
    const timer = window.setTimeout(() => {
      setDay('');
      setMonth('');
      setYear('');
      setHearing('idle');
      dayRef.current?.focus();
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [hearing]);

  const busy = hearing === 'listening' || hearing === 'unknown';
  const slot = (
    label: string,
    value: string,
    length: number,
    ref: React.RefObject<HTMLInputElement | null>,
    set: (value: string) => void,
    next: React.RefObject<HTMLInputElement | null> | null,
    previous: React.RefObject<HTMLInputElement | null> | null,
  ) => (
    <label className="flex flex-col items-center">
      <input
        ref={ref}
        value={value}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        aria-label={label}
        disabled={busy}
        maxLength={length}
        placeholder={'·'.repeat(length)}
        onChange={(event) => {
          const entered = digits(event.target.value, length);
          set(entered);
          if (hearing !== 'idle' && hearing !== 'listening') setHearing('idle');
          if (entered.length === length) next?.current?.focus();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Backspace' && value === '') previous?.current?.focus();
        }}
        className="gift-slot"
        style={{ width: `${length + 0.9}ch`, caretColor: dedication.color }}
      />
      <span className="mt-2.5 font-display text-[9px] uppercase tracking-[0.32em] text-aether-faint">{label}</span>
    </label>
  );

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-end px-6 pb-[max(11vh,4.5rem)] motion-safe:animate-[gift-rise_1400ms_cubic-bezier(0.2,0.7,0.2,1)_900ms_both]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_36%,transparent_20%,rgba(5,2,15,0.74)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[58vh] bg-gradient-to-t from-cosmos-deep/95 via-cosmos-deep/55 to-transparent" />
      <form
        className="relative flex flex-col items-center"
        onSubmit={(event) => {
          event.preventDefault();
          if (complete && !busy) void attempt();
        }}
      >
        <div className="flex w-28 items-center gap-2.5" aria-hidden>
          <span className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${dedication.from}99)` }} />
          <span className="h-1.5 w-1.5 rotate-45 border" style={{ borderColor: `${dedication.to}cc`, background: `${dedication.from}33`, boxShadow: `0 0 10px ${dedication.color}88` }} />
          <span className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${dedication.to}99)` }} />
        </div>
        <p
          className="mt-4 font-display text-[10px] uppercase tracking-[0.36em]"
          style={{ backgroundImage: `linear-gradient(90deg, ${dedication.from}, ${dedication.to})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
        >
          {door.whisper}
        </p>
        <p className="mt-3 max-w-[22rem] text-center font-body text-[23px] italic leading-snug text-aether [text-shadow:0_2px_22px_rgba(5,2,15,0.95)] sm:max-w-none sm:text-[27px]">
          {door.prompt}
        </p>
        <div className={`mt-8 flex items-start gap-3.5 transition-opacity duration-500 sm:gap-5 ${hearing === 'listening' ? 'opacity-45' : ''} ${hearing === 'unknown' ? 'motion-safe:animate-[gift-refuse_520ms_ease-in-out]' : ''}`}>
          {slot('Day', day, 2, dayRef, setDay, monthRef, null)}
          <span className="pt-2.5 font-display text-[22px] text-aether-faint" aria-hidden>·</span>
          {slot('Month', month, 2, monthRef, setMonth, yearRef, dayRef)}
          <span className="pt-2.5 font-display text-[22px] text-aether-faint" aria-hidden>·</span>
          {slot('Year', year, 4, yearRef, setYear, null, monthRef)}
        </div>
        <p className="mt-6 h-7 text-center font-body text-[17px] italic text-aether-muted" aria-live="polite">
          {hearing === 'idle' ? '' : SAID[hearing]}
        </p>
        <button type="submit" className="sr-only">
          Open
        </button>
      </form>
    </div>
  );
}
