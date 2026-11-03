'use client';

import Image from 'next/image';
import { workImageUrl, type LoomDoor } from '@/features/art/door';
import { useLoomStore } from '@/features/art/store';
import { SAGA_ACCENT, SAGA_LABEL } from '@/features/stories/sagas';

const CARD_WIDTH = 248;
const CARD_HEIGHT_GUESS = 280;

/** A tile under the pointer: what it is, before committing to the plate. */
export function WorkHoverCard({ door }: { door: LoomDoor }) {
  const hover = useLoomStore((state) => state.hover);
  if (!hover) return null;
  const work = door.works[hover.index];
  const left = hover.x + 20 + CARD_WIDTH > window.innerWidth - 12 ? hover.x - CARD_WIDTH - 20 : hover.x + 20;
  const top = Math.min(Math.max(66, hover.y - CARD_HEIGHT_GUESS / 2), window.innerHeight - CARD_HEIGHT_GUESS - 12);
  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-20 w-[248px] rounded-xl border border-glass-border bg-glass-heavy p-2.5 shadow-[0_22px_50px_rgba(5,2,15,0.6)] backdrop-blur-xl"
      style={{ transform: `translate(${left}px, ${top}px)` }}
    >
      <Image
        key={work.id}
        src={workImageUrl(work, 250)}
        alt=""
        width={work.width}
        height={work.height}
        unoptimized
        className="block max-h-[190px] w-full rounded-md bg-black/30 object-contain"
      />
      <div className="mt-2 flex items-center gap-1.5 font-display text-[9px] uppercase tracking-[0.2em] text-aether-faint">
        <i className="h-1.5 w-1.5 rounded-full" style={{ background: SAGA_ACCENT[work.saga] }} />
        <span>{SAGA_LABEL[work.saga]}</span>
      </div>
      <h3 className="mt-1 font-body text-lg font-medium leading-tight text-aether">{work.title}</h3>
      <p className="mt-0.5 font-body text-[14.5px] italic text-aether-muted">
        {work.artist}, {work.year}
      </p>
    </div>
  );
}
