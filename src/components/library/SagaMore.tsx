'use client';

import { useRef, useState } from 'react';

/** A saga of the Quarrels shows its first few, and this pill opens the rest
 *  (docs/LIBRARY_PLAN.md §7). It only marks its section open: globals.css hides
 *  the rest while no teller is chosen, so the teller filter always sees every
 *  quarrel, and the pill steps aside while it does. */
export function SagaMore({ total, hidden }: { total: number; hidden: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const toggle = () => {
    const next = !open;
    ref.current?.closest('.quarrel-saga')?.toggleAttribute('data-open', next);
    setOpen(next);
  };
  return (
    <div className="saga-more mt-3">
      <button
        ref={ref}
        type="button"
        aria-expanded={open}
        onClick={toggle}
        className="rounded-full border border-nebula-soft/40 bg-nebula-violet/15 px-4 py-2 font-display text-[10px] tracking-[0.14em] text-nebula-soft transition-colors hover:border-nebula-soft/70 hover:bg-nebula-violet/25"
      >
        {open ? 'SHOW LESS' : `ALL ${total} QUARRELS · ${hidden} MORE`}
      </button>
    </div>
  );
}
