'use client';

import { useState } from 'react';

/** The Quarrels by teller (docs/LIBRARY_PLAN.md §7): one teller at a time, or all.
 *  The list is the server's; the filter only names a teller on the wrapper, and
 *  globals.css hides the quarrels, and the sagas, that teller takes no part in. */
export function QuarrelFilter({ tellers, total, children }: { tellers: { id: string; name: string; count: number }[]; total: number; children: React.ReactNode }) {
  const [active, setActive] = useState<string | null>(null);
  const chip = (selected: boolean) =>
    `rounded-full border px-3 py-1 font-display text-[9.5px] tracking-[0.18em] transition-colors ${
      selected ? 'border-nebula-soft/60 bg-nebula-violet/15 text-aether' : 'border-glass-border text-aether-faint hover:text-aether-muted'
    }`;
  return (
    <div className="quarrel-index" data-teller={active ?? undefined}>
      <div role="group" aria-label="Show the quarrels one teller takes part in" className="flex flex-wrap gap-1.5">
        <button type="button" aria-pressed={active === null} onClick={() => setActive(null)} className={chip(active === null)}>
          ALL · {total}
        </button>
        {tellers.map((teller) => (
          <button key={teller.id} type="button" aria-pressed={active === teller.id} onClick={() => setActive(active === teller.id ? null : teller.id)} className={chip(active === teller.id)}>
            {teller.name.toUpperCase()} · {teller.count}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
