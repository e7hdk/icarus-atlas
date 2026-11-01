import type { ImageCredit } from '@/types/art';

const LINK =
  'underline decoration-aether-faint/40 underline-offset-2 transition-colors hover:text-aether-muted';

/** The line every culture image owes its source (docs/LOOM_PLAN.md §4.5). The text
 *  comes only from Commons, and the file page always carries the full attribution. */
export function WorkCredit({ credit, className = '' }: { credit?: ImageCredit; className?: string }) {
  if (!credit) return null;
  return (
    <p className={`font-body text-[12.5px] leading-snug text-aether-faint ${className}`}>
      {credit.author && <>Image: {credit.author} · </>}
      {credit.licenseUrl ? (
        <a href={credit.licenseUrl} target="_blank" rel="noreferrer" className={LINK}>
          {credit.license}
        </a>
      ) : (
        credit.license
      )}
      {' · '}
      <a href={credit.pageUrl} target="_blank" rel="noreferrer" className={LINK}>
        Commons ↗
      </a>
    </p>
  );
}
