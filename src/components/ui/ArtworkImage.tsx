'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/** Clickable image for the Legacy shelves (artworks and museum artifacts).
 *  Opens the piece full size in an Aether Nebula lightbox — deep-cosmos veil,
 *  glass close pill, museum caption — dismissed by the veil, the ✕ or Escape.
 *  `meta` is the caption line under the title ("artist, year" / "museum · period"). */
export function ArtworkImage({
  src,
  title,
  meta,
  className,
}: {
  src: string;
  title: string;
  meta: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View "${title}" full size`}
        className={`group relative block cursor-zoom-in overflow-hidden rounded-2xl border border-glass-border ${className ?? ''}`}
      >
        <Image
          src={src}
          alt={title}
          fill
          unoptimized
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-cosmos-deep/90 p-5 backdrop-blur-md [animation:artwork-veil-in_.25s_ease] sm:p-8"
          >
            <button
              type="button"
              autoFocus
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-5 top-5 rounded-full border border-glass-border bg-glass px-4 py-2 font-display text-[12px] tracking-[0.1em] text-aether-muted backdrop-blur-xl transition-colors hover:border-nebula-soft/50 hover:text-aether"
            >
              ✕
            </button>
            <figure
              onClick={(event) => event.stopPropagation()}
              className="flex max-h-full w-full max-w-6xl flex-col items-center gap-5 [animation:artwork-zoom-in_.3s_cubic-bezier(.2,.8,.2,1)]"
            >
              <div className="relative h-[70vh] w-full sm:h-[76vh]">
                <Image
                  src={src}
                  alt={title}
                  fill
                  unoptimized
                  sizes="92vw"
                  className="object-contain drop-shadow-[0_24px_60px_rgba(5,2,15,.8)]"
                />
              </div>
              <figcaption className="text-center">
                <p className="font-display text-lg tracking-[0.06em] text-aether">{title}</p>
                <p className="mt-1 font-body text-[15px] italic text-aether-muted">{meta}</p>
              </figcaption>
            </figure>
          </div>,
          document.body,
        )}
    </>
  );
}
