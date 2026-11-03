'use client';

import { SAGA_ACCENT, SAGA_ORDER } from '@/features/stories/sagas';
import { useLoomStore } from '@/features/art/store';
import { WEIGHT_LABEL } from './LoomLabels';

const CHIP =
  'flex shrink-0 items-center gap-1.5 rounded-full border px-3 pb-[5px] pt-1 font-body text-[14.5px] backdrop-blur-md transition-colors';

/** On a phone the clay weights become a strip of chips along the bottom, with turning
 *  the cloth one tap away at its start. It steps aside while a web is held. */
export function LoomChips({ onTurn }: { onTurn: () => void }) {
  const saga = useLoomStore((state) => state.saga);
  const setSaga = useLoomStore((state) => state.setSaga);
  const face = useLoomStore((state) => state.face);
  const focus = useLoomStore((state) => state.focus);
  if (focus !== null) return null;

  return (
    <nav
      aria-label="Sagas"
      className="fixed inset-x-0 bottom-[calc(10px+env(safe-area-inset-bottom))] z-20 flex gap-1.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none]! [touch-action:pan-x] [&::-webkit-scrollbar]:hidden"
    >
      <button
        type="button"
        onClick={onTurn}
        className="shrink-0 rounded-full border border-star-olympian/50 bg-cosmos-deep/80 px-3.5 py-1.5 font-display text-[10px] tracking-[0.16em] text-star-olympian backdrop-blur-md"
      >
        {face ? 'TURN IT BACK' : 'TURN THE CLOTH'}
      </button>
      {SAGA_ORDER.map((id) => (
        <button
          key={id}
          type="button"
          aria-pressed={saga === id}
          onClick={() => setSaga(saga === id ? null : id)}
          className={`${CHIP} ${
            saga === id ? 'border-star-olympian/60 bg-cosmos-deep/90 text-aether' : 'border-glass-border bg-cosmos-deep/70 text-aether-muted'
          }`}
        >
          <i className="h-1.5 w-1.5 rounded-full" style={{ background: SAGA_ACCENT[id] }} />
          {WEIGHT_LABEL[id]}
        </button>
      ))}
    </nav>
  );
}
