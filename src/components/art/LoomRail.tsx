'use client';

import { useMemo } from 'react';
import { MEDIA, MEDIUM_LABEL, type LoomDoor } from '@/features/art/door';
import { useLoomStore } from '@/features/art/store';

const RAIL_BUTTON =
  'relative block w-full py-[3px] pl-[15px] text-left font-body text-base leading-tight transition-colors hover:text-aether focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-star-olympian/50';
const HEADING = 'mb-[7px] font-display text-[10px] font-normal tracking-[0.28em] text-aether-faint';

function Dot({ on }: { on: boolean }) {
  return (
    <i
      className={`absolute left-px top-[11px] h-[5px] w-[5px] rounded-full ${
        on ? 'bg-star-olympian shadow-[0_0_8px_2px_rgba(252,211,77,.5)]' : 'ring-1 ring-inset ring-white/20'
      }`}
    />
  );
}

/** The right rail: turning the cloth, the Patterns and the medium filter on its face,
 *  and while a work is held, that work's threads. It floats on glass, since in the
 *  rotunda it stands over the walls of the room. */
export function LoomRail({
  door,
  onTurn,
  onPattern,
  onClearSubject,
  onAlong,
  onOpen,
  onRelease,
}: {
  door: LoomDoor;
  onTurn: () => void;
  /** Show a Pattern's gold thread, or none with null. */
  onPattern: (pattern: number | null) => void;
  /** Back to the whole cloth from a deep link's figure or story. */
  onClearSubject: () => void;
  /** Lift along one thread, or back to all of them with null. */
  onAlong: (thread: number | null) => void;
  onOpen: () => void;
  onRelease: () => void;
}) {
  const medium = useLoomStore((state) => state.medium);
  const pattern = useLoomStore((state) => state.pattern);
  const subject = useLoomStore((state) => state.subject);
  const setMedium = useLoomStore((state) => state.setMedium);
  const focus = useLoomStore((state) => state.focus);
  const only = useLoomStore((state) => state.only);
  const face = useLoomStore((state) => state.face);
  const setPeekThread = useLoomStore((state) => state.setPeekThread);
  const totals = useMemo(
    () => ({
      stitches: door.threads.reduce((sum, thread) => sum + thread.works.length - 1, 0),
      crossing: door.threads.filter((thread) => thread.crosses).length,
    }),
    [door],
  );

  const held = focus === null ? null : door.works[focus];
  const threads = held
    ? [...door.threadsOf[held.index]].sort((a, b) => door.threads[b].works.length - door.threads[a].works.length)
    : [];

  return (
    <aside
      className={`absolute right-[22px] top-[80px] z-10 w-[212px] rounded-2xl border border-glass-border bg-glass-heavy px-4 py-3.5 backdrop-blur-xl transition-opacity duration-300 max-[1080px]:hidden ${
        held ? '' : 'group-data-[view=quiet]/loom:pointer-events-none group-data-[view=quiet]/loom:opacity-0'
      }`}
    >
      {!held && (
        <button
          type="button"
          onClick={onTurn}
          className="mb-5 rounded-full border border-star-olympian/50 bg-star-olympian/[0.08] px-3.5 py-[7px] font-display text-[10px] tracking-[0.18em] text-star-olympian transition-colors hover:bg-star-olympian/[0.16] hover:text-[#fde68a]"
        >
          {face ? 'TURN IT BACK' : 'TURN THE CLOTH'}
        </button>
      )}
      {face && !held && (
        <p className="-mt-2 mb-[18px] font-body text-[14.5px] italic leading-[1.3] text-aether-muted">
          {`The back of the cloth: ${door.threads.length} figures, ${totals.stitches.toLocaleString('en')} stitches. Each thread falls from a figure’s oldest work to its newest. The bright ones cross the tear: ${totals.crossing} figures seen on both sides of it.`}
        </p>
      )}
      {!face && !held && subject && (
        <section className="mb-[22px]">
          <h2 className={HEADING}>SHOWING</h2>
          <p className="font-display text-[15px] leading-[1.28] tracking-[0.03em] text-star-olympian">{subject.label}</p>
          <p className="mt-1 font-body text-[14.5px] italic text-aether-muted">
            {`${subject.works.size} ${subject.works.size === 1 ? 'work' : 'works'} on the cloth`}
          </p>
          <button
            type="button"
            onClick={onClearSubject}
            className="mt-1.5 block font-body text-[14.5px] italic text-aether-faint transition-colors hover:text-aether"
          >
            The whole cloth · Esc
          </button>
        </section>
      )}
      {!face && !held && door.patterns.length > 0 && (
        <section className="mb-[22px]">
          <h2 className={HEADING}>PATTERNS</h2>
          {door.patterns.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={pattern === index}
              onClick={() => onPattern(pattern === index ? null : index)}
              className={`${RAIL_BUTTON} ${pattern === index ? 'text-star-olympian' : 'text-aether-muted'}`}
            >
              <Dot on={pattern === index} />
              {item.title}
            </button>
          ))}
          {pattern !== null && (
            <p className="mt-3 font-body text-[14.5px] italic leading-[1.3] text-aether-muted">
              {door.patterns[pattern].summary}
            </p>
          )}
        </section>
      )}
      {!face && !held && (
        <section>
          <h2 className={HEADING}>MEDIUM</h2>
          {MEDIA.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={medium === id}
              onClick={() => setMedium(medium === id ? null : id)}
              className={`${RAIL_BUTTON} ${medium === id ? 'text-star-olympian' : 'text-aether-muted'}`}
            >
              <Dot on={medium === id} />
              {MEDIUM_LABEL[id]}
            </button>
          ))}
        </section>
      )}
      {held && (
        <section aria-label="Threads of this work">
          <h2 className={HEADING}>THREADS OF THIS WORK</h2>
          <p className="font-display text-[15px] leading-[1.28] tracking-[0.03em] text-aether">{held.title}</p>
          <p className="mb-[13px] mt-[5px] font-body text-[15.5px] italic text-aether-muted">
            {held.artist}, {held.year}
          </p>
          {threads.length === 0 && (
            <p className="font-body text-[15px] italic text-aether-faint">No other work shares a figure with this one yet.</p>
          )}
          {threads.map((thread) => (
            <button
              key={thread}
              type="button"
              aria-pressed={only === thread}
              onPointerEnter={() => {
                if (only === null) setPeekThread(thread);
              }}
              onPointerLeave={() => setPeekThread(null)}
              onClick={() => onAlong(only === thread ? null : thread)}
              className={`${RAIL_BUTTON} text-[15.5px] ${only === thread ? 'text-star-olympian' : 'text-aether-muted'}`}
            >
              <Dot on={only === thread} />
              {door.threads[thread].name}
              <i className="ml-[5px] text-[13px] not-italic text-aether-faint">{door.threads[thread].works.length}</i>
            </button>
          ))}
          <button
            type="button"
            onClick={onOpen}
            className="mt-[13px] block font-body text-[16.5px] italic text-star-olympian transition-colors hover:text-[#fde68a]"
          >
            Open the plate
          </button>
          <button
            type="button"
            onClick={onRelease}
            className="mt-[3px] block font-body text-[14.5px] italic text-aether-faint transition-colors hover:text-aether"
          >
            Let go · Esc
          </button>
        </section>
      )}
    </aside>
  );
}
