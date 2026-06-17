'use client';

import { Children, useState, type ReactNode } from 'react';

/** Clamps a flex-wrap card grid to `max` items; a pill reveals the rest and
 *  folds them back. It receives already-rendered children (the <li> cards), so
 *  the parent can stay a server component — no data crosses the client boundary,
 *  only React nodes. Used by the codex "Seen in the lands" / "Appears in the
 *  myths" strips so a figure with many residences or myths stays compact. */
export function ClampList({ max, children }: { max: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const items = Children.toArray(children);
  if (items.length <= max) return <>{items}</>;
  const hidden = items.length - max;
  return (
    <>
      {open ? items : items.slice(0, max)}
      <li className="flex items-center">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-full border border-nebula-soft/40 bg-nebula-violet/15 px-4 py-2 font-display text-[10px] tracking-[0.14em] text-nebula-soft transition-colors hover:border-nebula-soft/70 hover:bg-nebula-violet/25"
        >
          {open ? 'SHOW LESS' : `READ MORE · ${hidden}`}
        </button>
      </li>
    </>
  );
}
