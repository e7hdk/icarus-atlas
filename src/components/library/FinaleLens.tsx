'use client';

import { useReadingStore, type ReadingLens } from '@/features/library/reading-store';

/** The finale's two tellers (docs/LIBRARY_PLAN.md §8): the sky as Hesiod sings it,
 *  or as Homer tells it. The scroll turns it to Homer; the reader may turn it back. */
export function FinaleLens() {
  const chosen = useReadingStore((s) => s.chosen);
  const choose = useReadingStore((s) => s.choose);
  const current: ReadingLens = chosen ?? 'homer';
  const button = (lens: ReadingLens, label: string) => (
    <button
      type="button"
      aria-pressed={current === lens}
      onClick={() => choose(lens)}
      className={`rounded-full border px-3.5 py-[7px] font-display text-[9.5px] tracking-[0.18em] transition-colors ${
        current === lens ? 'border-star-olympian/50 bg-star-olympian/[0.12] text-star-olympian' : 'border-transparent text-aether-muted hover:text-aether'
      }`}
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label="The teller the sky follows" className="mt-[18px] flex w-max gap-1 rounded-full border border-glass-border bg-glass p-1">
      {button('hesiod', 'AS HESIOD SINGS IT')}
      {button('homer', 'AS HOMER TELLS IT')}
    </div>
  );
}
