'use client';

import { Children, useState, type ReactNode } from 'react';

/** Clamps a list or a row of chips to `max` items; a pill reveals the rest and
 *  folds them back. It receives already-rendered children (the <li> cards, or the
 *  chips of a flex row), so the parent can stay a server component — no data
 *  crosses the client boundary, only React nodes. Used by the codex "Seen in the
 *  lands" / "Appears in the myths" strips and by the Library's long lists, so a
 *  figure, a teller or a work with many of them stays compact.
 *
 *  `as` is the pill's wrapper: an <li> inside a list, a <span> inside a row of
 *  chips. With a `noun` the pill counts like the codex's registers do —
 *  "ALL 165 FIGURES · 141 MORE". */
export function ClampList({
  max,
  children,
  as: Wrapper = 'li',
  noun,
}: {
  max: number;
  children: ReactNode;
  as?: 'li' | 'span';
  noun?: string;
}) {
  const [open, setOpen] = useState(false);
  const items = Children.toArray(children);
  if (items.length <= max) return <>{items}</>;
  const hidden = items.length - max;
  const more = noun ? `ALL ${items.length} ${noun} · ${hidden} MORE` : `READ MORE · ${hidden}`;
  return (
    <>
      {open ? items : items.slice(0, max)}
      <Wrapper className="flex items-center">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="rounded-full border border-nebula-soft/40 bg-nebula-violet/15 px-4 py-2 font-display text-[10px] tracking-[0.14em] text-nebula-soft transition-colors hover:border-nebula-soft/70 hover:bg-nebula-violet/25"
        >
          {open ? 'SHOW LESS' : more}
        </button>
      </Wrapper>
    </>
  );
}
