'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { WorkCredit } from '@/components/art/WorkCredit';
import { MEDIUM_LABEL, workImageUrl, type LoomPatternStop, type LoomWork } from '@/features/art/door';
import { useWorkDetails } from '@/features/art/useWorkDetails';
import { SAGA_ACCENT, SAGA_LABEL } from '@/features/stories/sagas';

const FRAME_SHADOW =
  'shadow-[0_0_0_1px_rgba(252,211,77,.4),0_0_0_6px_#05020f,0_0_0_7px_rgba(252,211,77,.16),0_34px_90px_rgba(0,0,0,.7)]';
const CHIP =
  'rounded-full border border-glass-border bg-glass px-2.5 pb-[3px] pt-0.5 font-body text-[15px] text-aether transition-colors hover:border-star-olympian/50 hover:text-star-olympian';
const KICKER = 'mb-[7px] font-display text-[10px] font-normal tracking-[0.24em] text-aether-faint';

/** Hover footnote superscript (tellers + citation), the codex idiom. */
function Footnote({ text }: { text: string }) {
  return (
    <span className="group/fn relative ml-0.5 cursor-default align-super font-body text-[13px] not-italic text-aether-faint">
      1
      <span className="pointer-events-none absolute bottom-full right-0 z-10 mb-1.5 hidden whitespace-nowrap rounded-lg border border-star-olympian/40 bg-cosmos-raised px-2.5 py-1 font-body text-sm not-italic text-aether group-hover/fn:block">
        {text}
      </span>
    </span>
  );
}

/** One work, full height: the end of the zoom, and of the Loom's reading path. Arrow
 *  keys walk to the neighbouring work in time; Escape returns to the cloth. A stop on a
 *  Pattern says what the thread finds there, and the thread can be followed from it. */
export function WorkPlate({
  work,
  stops,
  onClose,
  onStep,
  onFollow,
}: {
  work: LoomWork;
  /** The Patterns whose thread passes through this work. */
  stops: { pattern: number; title: string; stop: LoomPatternStop }[];
  onClose: () => void;
  onStep: (step: number) => void;
  onFollow: (pattern: number) => void;
}) {
  const details = useWorkDetails(true);
  const detail = details?.[work.id];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') onStep(1);
      if (event.key === 'ArrowLeft') onStep(-1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, onStep]);

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label={work.title}
      className="fixed inset-0 z-40 grid grid-cols-[minmax(0,1fr)_372px] gap-[34px] bg-cosmos-deep/90 px-11 pb-10 pt-[68px] backdrop-blur-md [animation:artwork-veil-in_.25s_ease] max-[1080px]:grid-cols-1 max-[1080px]:grid-rows-[55%_1fr] max-[1080px]:gap-4 max-[1080px]:px-4 max-[1080px]:pb-4 max-[1080px]:pt-[60px]"
    >
      <div className="flex min-h-0 min-w-0 items-center justify-center [container-type:size]">
        {/* The small image is usually cached from the hover, and holds the frame's shape
            until the large one lands. */}
        <div
          className={`relative bg-black/30 ${FRAME_SHADOW}`}
          style={{
            width: `min(100cqw, ${(work.width / work.height) * 100}cqh)`,
            aspectRatio: `${work.width} / ${work.height}`,
          }}
        >
          <Image key={`${work.id}-small`} src={workImageUrl(work, 250)} alt="" fill unoptimized className="object-cover" />
          <Image
            key={work.id}
            src={workImageUrl(work, work.width >= work.height ? 1280 : 960)}
            alt={work.title}
            fill
            unoptimized
            priority
            onLoad={(event) => event.currentTarget.classList.replace('opacity-0', 'opacity-100')}
            className="object-cover opacity-0 transition-opacity duration-500"
          />
        </div>
      </div>
      <div className="max-h-full self-center overflow-auto pr-1.5">
        <div className="flex items-center gap-[7px] font-display text-[10px] uppercase tracking-[0.24em] text-aether-faint">
          <i className="h-[7px] w-[7px] rounded-full" style={{ background: SAGA_ACCENT[work.saga] }} />
          <span>
            {SAGA_LABEL[work.saga]} · {MEDIUM_LABEL[work.medium]}
          </span>
        </div>
        <h2 className="mt-3 font-display text-[25px] font-normal leading-tight tracking-[0.03em] text-aether">{work.title}</h2>
        <p className="mt-[7px] font-body text-[19px] italic text-aether-muted">
          {work.artist}, {work.year}
        </p>
        {detail && (
          <>
            <p className="mt-[18px] font-body text-[19px] leading-[1.42] text-aether/90">{detail.caption}</p>
            <WorkCredit credit={detail.credit} className="mt-3" />
            {stops.map(({ pattern, title, stop }) => (
              <div key={pattern} className="mt-5 border-t border-white/10 pt-[13px]">
                <h4 className={KICKER}>{`PATTERN · ${title.toUpperCase()}`}</h4>
                {stop.note && (
                  <p className="font-body text-[17.5px] leading-[1.4] text-aether/90">
                    {stop.note}
                    {stop.footnote && <Footnote text={stop.footnote} />}
                  </p>
                )}
                {stop.evidence && (
                  <a
                    href={stop.evidence}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block font-body text-[14px] italic text-aether-faint transition-colors hover:text-aether"
                  >
                    Evidence ↗
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => onFollow(pattern)}
                  className="mt-2 block font-body text-[16.5px] italic text-star-olympian transition-colors hover:text-[#fde68a]"
                >
                  Follow the thread through the cloth
                </button>
              </div>
            ))}
            {(detail.figures.length > 0 || detail.stories.length > 0) && (
              <div className="mt-5 border-t border-white/10 pt-[13px]">
                {detail.figures.length > 0 && (
                  <>
                    <h4 className={KICKER}>STARS IN THIS WORK</h4>
                    <div className="flex flex-wrap gap-[5px]">
                      {detail.figures.map((figure) => (
                        <Link key={figure.id} href={`/character/${figure.id}`} className={CHIP}>
                          {figure.name}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
                {detail.stories.length > 0 && (
                  <>
                    <h4 className="mb-[7px] mt-3 font-display text-[10px] font-normal tracking-[0.24em] text-aether-faint">
                      THE MYTH
                    </h4>
                    <div className="flex flex-wrap gap-[5px]">
                      {detail.stories.map((story) => (
                        <Link key={story.id} href={`/story/${story.id}`} className={CHIP}>
                          {story.title}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <button
        type="button"
        autoFocus
        onClick={onClose}
        className="absolute right-11 top-[68px] rounded-full border border-glass-border bg-glass px-[13px] py-1.5 font-display text-[10px] tracking-[0.18em] text-aether-muted transition-colors hover:text-aether focus:outline-none focus-visible:border-aether-muted max-[1080px]:right-4 max-[1080px]:top-[60px]"
      >
        CLOSE · ESC
      </button>
      <p className="absolute bottom-[15px] left-11 font-body text-sm italic text-aether-faint max-[1080px]:hidden">
        ← → the neighbouring works in time
      </p>
    </section>
  );
}
