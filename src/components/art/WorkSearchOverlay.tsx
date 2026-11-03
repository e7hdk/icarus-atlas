'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import type { LoomDoor, LoomWork } from '@/features/art/door';
import { useWorkDetails } from '@/features/art/useWorkDetails';
import { useGalaxyStore } from '@/features/galaxy/store';
import { fold } from '@/features/search/match';
import { SAGA_ACCENT } from '@/features/stories/sagas';

const MAX_HITS = 40;

/** Command-palette search (⌘K) for the Loom: a title, a painter or a figure. Choosing
 *  one flies to the work, because the cloth is already somewhere to go. */
export function WorkSearchOverlay({ door, onSelect }: { door: LoomDoor; onSelect: (work: LoomWork) => void }) {
  const searchOpen = useGalaxyStore((state) => state.searchOpen);
  if (!searchOpen) return null;
  // Remount per open so query and selection start fresh.
  return <WorkSearchDialog door={door} onSelect={onSelect} />;
}

function WorkSearchDialog({ door, onSelect }: { door: LoomDoor; onSelect: (work: LoomWork) => void }) {
  const setSearchOpen = useGalaxyStore((state) => state.setSearchOpen);
  const details = useWorkDetails(true);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const list = useRef<HTMLDivElement>(null);

  const index = useMemo(
    () =>
      door.works.map((work) => ({
        work,
        text: fold(
          [work.title, work.artist, ...(details?.[work.id]?.figures.map((figure) => figure.name) ?? [])].join(' '),
        ),
      })),
    [door, details],
  );
  const hits = useMemo(() => {
    const terms = fold(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return index
      .filter((entry) => terms.every((term) => entry.text.includes(term)))
      .slice(0, MAX_HITS)
      .map((entry) => entry.work);
  }, [index, query]);
  const active = Math.min(activeIndex, Math.max(hits.length - 1, 0));

  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const travel = (work: LoomWork) => {
    setSearchOpen(false);
    onSelect(work);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setSearchOpen(false);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(hits.length ? (active + 1) % hits.length : 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(hits.length ? (active - 1 + hits.length) % hits.length : 0);
    } else if (event.key === 'Enter' && hits[active]) {
      event.preventDefault();
      travel(hits[active]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-cosmos-deep/55 px-4 pt-16 backdrop-blur-[6px]"
      onMouseDown={() => setSearchOpen(false)}
    >
      <GlassPanel
        className="w-full max-w-xl overflow-hidden bg-glass-heavy shadow-[0_24px_80px_rgba(5,2,15,0.85),0_0_48px_rgba(252,211,77,0.08)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-glass-border px-5 py-4">
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search a work, a painter, or a figure…"
            spellCheck={false}
            className="flex-1 bg-transparent font-body text-xl text-aether placeholder:text-aether-faint focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-glass-border bg-glass px-1.5 py-0.5 font-display text-[9px] tracking-[0.1em] text-aether-faint sm:block">
            ESC
          </kbd>
        </div>

        {query.trim() && hits.length === 0 && (
          <p className="px-5 py-6 text-center font-body text-[15px] italic text-aether-muted">
            Nothing on the cloth answers to &ldquo;{query.trim()}&rdquo;.
          </p>
        )}

        {hits.length > 0 && (
          <div ref={list} className="max-h-[46vh] overflow-y-auto py-1.5">
            {hits.map((work, position) => (
              <button
                key={work.id}
                type="button"
                data-index={position}
                onMouseEnter={() => setActiveIndex(position)}
                onClick={() => travel(work)}
                className={`flex w-full items-baseline gap-3 px-5 py-2 text-left ${position === active ? 'bg-white/[0.06]' : ''}`}
              >
                <i className="h-1.5 w-1.5 shrink-0 translate-y-[-2px] rounded-full" style={{ background: SAGA_ACCENT[work.saga] }} />
                <span className="min-w-0 flex-1 truncate font-body text-[17px] text-aether">{work.title}</span>
                <span className="max-w-[45%] shrink-0 truncate font-body text-sm italic text-aether-muted">
                  {work.artist}, {work.year}
                </span>
              </button>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
