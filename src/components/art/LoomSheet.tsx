'use client';

import { useRef, useState } from 'react';
import type { LoomDoor } from '@/features/art/door';
import { useLoomStore } from '@/features/art/store';
import { SAGA_ACCENT } from '@/features/stories/sagas';

/** How far a swipe on the header must travel to change the sheet's height. */
const SWIPE = 36;

/** The held work's threads on a phone, in the house's two-detent bottom sheet: swipe
 *  the header up for the whole list, down for the peek. The rail does this on desktop.
 *  The peek keeps one height from work to work, so the web above it holds still. */
export function LoomSheet({
  door,
  onAlong,
  onOpen,
  onRelease,
}: {
  door: LoomDoor;
  onAlong: (thread: number | null) => void;
  onOpen: () => void;
  onRelease: () => void;
}) {
  const focus = useLoomStore((state) => state.focus);
  const only = useLoomStore((state) => state.only);
  const [expanded, setExpanded] = useState(false);
  // Every newly held work starts at the peek.
  const [shownFor, setShownFor] = useState(focus);
  if (shownFor !== focus) {
    setShownFor(focus);
    setExpanded(false);
  }
  const touchStart = useRef<number | null>(null);
  if (focus === null) return null;

  const held = door.works[focus];
  const threads = [...door.threadsOf[focus]].sort((a, b) => door.threads[b].works.length - door.threads[a].works.length);
  const swipe = {
    onTouchStart: (event: React.TouchEvent) => {
      touchStart.current = event.touches[0].clientY;
    },
    onTouchEnd: (event: React.TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (start === null) return;
      const delta = event.changedTouches[0].clientY - start;
      if (delta < -SWIPE) setExpanded(true);
      else if (delta > SWIPE) setExpanded(false);
    },
  };

  return (
    <aside
      aria-label="Threads of this work"
      className={`fixed inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden rounded-t-2xl border border-star-olympian/30 pb-[env(safe-area-inset-bottom)] shadow-[0_-18px_60px_rgba(5,2,15,0.85)] backdrop-blur-xl transition-[height] duration-300 ${
        expanded ? 'h-[80svh]' : 'h-[30svh]'
      }`}
      style={{ backgroundColor: 'rgba(5, 2, 18, 0.94)' }}
    >
      <button
        type="button"
        aria-label={expanded ? 'Collapse the threads' : 'Expand the threads'}
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        {...swipe}
        className="mx-auto mt-2 flex h-4 w-16 shrink-0 items-center justify-center"
      >
        <span className="h-1 w-10 rounded-full bg-white/15" />
      </button>
      <header className="shrink-0 px-5 pb-2 pt-1" {...swipe}>
        <div className="flex items-center gap-[7px] font-display text-[9.5px] tracking-[0.24em] text-aether-faint">
          <i className="h-1.5 w-1.5 rounded-full" style={{ background: SAGA_ACCENT[held.saga] }} />
          THREADS OF THIS WORK
        </div>
        <h2 className="mt-1.5 font-display text-[15px] font-normal leading-[1.25] tracking-[0.03em] text-aether">{held.title}</h2>
        <p className="mt-0.5 font-body text-[15px] italic text-aether-muted">
          {held.artist}, {held.year}
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2">
        {threads.length === 0 ? (
          <p className="font-body text-[15px] italic text-aether-faint">No other work shares a figure with this one yet.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {threads.map((thread) => (
              <button
                key={thread}
                type="button"
                aria-pressed={only === thread}
                onClick={() => onAlong(only === thread ? null : thread)}
                className={`rounded-full border px-2.5 pb-[3px] pt-0.5 font-body text-[15px] transition-colors ${
                  only === thread
                    ? 'border-star-olympian/60 bg-star-olympian/10 text-star-olympian'
                    : 'border-glass-border bg-glass text-aether'
                }`}
              >
                {door.threads[thread].name}
                <span className="ml-1 text-[12.5px] text-aether-faint">{door.threads[thread].works.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <footer className="flex shrink-0 items-baseline gap-5 border-t border-glass-border/50 px-5 pb-4 pt-2.5">
        <button type="button" onClick={onOpen} className="font-body text-[16.5px] italic text-star-olympian">
          Open the plate
        </button>
        <button type="button" onClick={onRelease} className="font-body text-[14.5px] italic text-aether-faint">
          Let go
        </button>
      </footer>
    </aside>
  );
}
