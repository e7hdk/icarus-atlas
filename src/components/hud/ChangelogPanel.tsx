'use client';

import { useState } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { CHANGELOG, type ChangelogEntry } from '@/lib/changelog';

function ReleaseDate({ date }: { date: string }) {
  return (
    <span className="font-body text-xs italic text-aether-faint">
      {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
    </span>
  );
}

/** The atlas's chronicle, opened from the version stamp in the settings footer.
 *  The log keeps each release compact (its poetic lines clamped); "Read more"
 *  opens a focused detail panel with that release's full stanza. */
export function ChangelogPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [detail, setDetail] = useState<ChangelogEntry | null>(null);

  if (!open) return null;

  const close = () => {
    setDetail(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(5,2,15,0.55)] px-4"
      onMouseDown={close}
    >
      <GlassPanel
        role="dialog"
        aria-modal="true"
        aria-labelledby="atlas-changelog-title"
        className="max-h-[calc(100dvh-3rem)] w-[min(34rem,calc(100vw-1.5rem))] overflow-y-auto overscroll-contain bg-glass-heavy shadow-[0_24px_80px_rgba(5,2,15,0.85),0_0_46px_rgba(124,77,255,0.16)] animate-[search-panel-in_200ms_cubic-bezier(0.2,0.8,0.2,1)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-glass-border px-5 py-4 sm:px-6">
          <div>
            <h2 id="atlas-changelog-title" className="font-display text-sm tracking-[0.2em] text-aether">
              THE CHRONICLE
            </h2>
            <p className="mt-1 font-body text-sm italic text-aether-faint">
              Each release a stanza in the making of the sky.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chronicle"
            className="rounded-full px-2 py-1 font-display text-xs text-aether-faint transition-colors hover:text-aether"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6">
          {CHANGELOG.map((release, index) => (
            <section key={release.version} className={index > 0 ? 'mt-8' : ''}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <span className="font-display text-base tracking-[0.12em] text-nebula-soft drop-shadow-[0_0_12px_rgba(192,132,252,0.5)]">
                  v{release.version}
                </span>
                <span className="font-display text-[12px] tracking-[0.12em] text-aether">
                  {release.codename}
                </span>
                <span className="ml-auto">
                  <ReleaseDate date={release.date} />
                </span>
              </div>
              <p className="mt-2 line-clamp-2 border-l border-glass-border pl-4 font-body text-[14px] leading-relaxed text-aether/80">
                {release.lines[0]}
              </p>
              <button
                type="button"
                onClick={() => setDetail(release)}
                className="mt-2 ml-4 font-display text-[10px] uppercase tracking-[0.18em] text-nebula-soft/90 transition-colors hover:text-nebula-soft hover:underline"
              >
                Read more →
              </button>
            </section>
          ))}
        </div>

        <footer className="border-t border-glass-border px-6 py-3 text-center font-body text-[13px] italic text-aether-muted">
          Written in the same fire as the rest of the sky.
        </footer>
      </GlassPanel>

      {/* Focused detail — one release's full stanza, opened over the chronicle. */}
      {detail && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(5,2,15,0.62)] px-4"
          onMouseDown={(event) => {
            // Close ONLY the detail (back to the list) — don't bubble to the
            // chronicle backdrop, which would close everything in one click.
            event.stopPropagation();
            setDetail(null);
          }}
        >
          <GlassPanel
            role="dialog"
            aria-modal="true"
            className="max-h-[calc(100dvh-3rem)] w-[min(38rem,calc(100vw-1.5rem))] overflow-y-auto overscroll-contain bg-glass-heavy shadow-[0_24px_80px_rgba(5,2,15,0.88),0_0_46px_rgba(124,77,255,0.18)] animate-[search-panel-in_200ms_cubic-bezier(0.2,0.8,0.2,1)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-glass-border px-5 py-4 sm:px-6">
              <div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <span className="font-display text-lg tracking-[0.12em] text-nebula-soft drop-shadow-[0_0_12px_rgba(192,132,252,0.5)]">
                    v{detail.version}
                  </span>
                  <span className="font-display text-[13px] tracking-[0.12em] text-aether">
                    {detail.codename}
                  </span>
                </div>
                <p className="mt-1">
                  <ReleaseDate date={detail.date} />
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                aria-label="Back to chronicle"
                className="rounded-full px-2 py-1 font-display text-xs text-aether-faint transition-colors hover:text-aether"
              >
                ×
              </button>
            </div>
            <ul className="space-y-3.5 border-l border-glass-border px-5 py-5 pl-6 sm:px-6 sm:pl-7">
              {detail.lines.map((line, lineIndex) => (
                <li key={lineIndex} className="font-body text-[15px] leading-relaxed text-aether/90">
                  {line}
                </li>
              ))}
            </ul>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
