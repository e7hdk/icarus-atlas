'use client';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { CHANGELOG } from '@/lib/changelog';

/** The atlas's chronicle, opened from the version stamp in the settings footer. */
export function ChangelogPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(5,2,15,0.55)] px-4"
      onMouseDown={onClose}
    >
      <GlassPanel
        role="dialog"
        aria-modal="true"
        aria-labelledby="atlas-changelog-title"
        className="max-h-[calc(100dvh-3rem)] w-[min(34rem,calc(100vw-1.5rem))] overflow-y-auto overscroll-contain bg-glass-heavy shadow-[0_24px_80px_rgba(5,2,15,0.85),0_0_46px_rgba(124,77,255,0.16)] animate-[search-panel-in_200ms_cubic-bezier(0.2,0.8,0.2,1)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-glass-border px-6 py-4">
          <div>
            <h2
              id="atlas-changelog-title"
              className="font-display text-sm tracking-[0.2em] text-aether"
            >
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

        <div className="px-6 py-5">
          {CHANGELOG.map((release, index) => (
            <section key={release.version} className={index > 0 ? 'mt-8' : ''}>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-base tracking-[0.12em] text-nebula-soft drop-shadow-[0_0_12px_rgba(192,132,252,0.5)]">
                  v{release.version}
                </span>
                <span className="font-display text-[12px] tracking-[0.12em] text-aether">
                  {release.codename}
                </span>
                <span className="ml-auto font-body text-xs italic text-aether-faint">
                  {new Date(release.date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <ul className="mt-3 space-y-2.5 border-l border-glass-border pl-4">
                {release.lines.map((line, lineIndex) => (
                  <li
                    key={lineIndex}
                    className="font-body text-[15px] leading-relaxed text-aether/85"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="border-t border-glass-border px-6 py-3 text-center font-body text-[13px] italic text-aether-muted">
          Written in the same fire as the rest of the sky.
        </footer>
      </GlassPanel>
    </div>
  );
}
