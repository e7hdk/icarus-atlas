'use client';

import type { LoomDoor } from '@/features/art/door';
import { useLoomStore } from '@/features/art/store';

/** The Patterns on a phone, in the house's bottom sheet; the rail lists them on
 *  desktop. Choosing one closes the sheet so its thread can be seen falling. */
export function LoomPatternSheet({
  door,
  onPattern,
  onClose,
}: {
  door: LoomDoor;
  onPattern: (pattern: number | null) => void;
  onClose: () => void;
}) {
  const pattern = useLoomStore((state) => state.pattern);

  return (
    <aside
      aria-label="Patterns"
      className="fixed inset-x-0 bottom-0 z-30 flex max-h-[72svh] flex-col overflow-hidden rounded-t-2xl border border-star-olympian/30 pb-[env(safe-area-inset-bottom)] shadow-[0_-18px_60px_rgba(5,2,15,0.85)] backdrop-blur-xl"
      style={{ backgroundColor: 'rgba(5, 2, 18, 0.94)' }}
    >
      <header className="flex shrink-0 items-baseline justify-between px-5 pb-1.5 pt-4">
        <h2 className="font-display text-[9.5px] font-normal tracking-[0.24em] text-aether-faint">PATTERNS</h2>
        <button type="button" onClick={onClose} className="font-body text-[14.5px] italic text-aether-faint">
          Close
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        <p className="mb-2.5 font-body text-[15px] italic leading-snug text-aether-muted">
          One gesture followed through time: a gold thread falls through the works that share it.
        </p>
        {door.patterns.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={pattern === index}
            onClick={() => {
              onPattern(pattern === index ? null : index);
              onClose();
            }}
            className="block w-full border-t border-glass-border py-2.5 text-left"
          >
            <span
              className={`font-display text-[15px] tracking-[0.03em] ${pattern === index ? 'text-star-olympian' : 'text-aether'}`}
            >
              {item.title}
            </span>
            <span className="mt-0.5 block font-body text-[14.5px] italic leading-snug text-aether-muted">
              {item.summary}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
