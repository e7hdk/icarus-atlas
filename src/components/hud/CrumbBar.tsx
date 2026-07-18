import Link from 'next/link';
import { DayLaurel } from './DayLaurel';

/** The codex breadcrumb strip under the AtlasBar: a back circle, the trail
 *  of doors that led here, and the current page in gold. Static — it scrolls
 *  away with the page while the bar above stays. Character codices pass
 *  `laurelCharacterId` so the strip can wear the Ephemeris day laurel. */
export function CrumbBar({
  back,
  trail = [],
  current,
  laurelCharacterId,
}: {
  back: { href: string; label: string };
  trail?: { href: string; label: string }[];
  current: string;
  laurelCharacterId?: string;
}) {
  return (
    <div className="flex items-center gap-3 font-display text-[10px] uppercase tracking-[0.22em] text-aether-faint">
      <Link
        href={back.href}
        aria-label={back.label}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-glass-border text-[15px] text-aether-muted transition-colors hover:border-nebula-soft/50 hover:text-aether"
      >
        ←
      </Link>
      {trail.map((stop) => (
        <span key={stop.href} className="flex items-center gap-3">
          <Link href={stop.href} className="text-aether-muted transition-colors hover:text-aether">
            {stop.label}
          </Link>
          <span className="text-aether/25">/</span>
        </span>
      ))}
      <span className="min-w-0 truncate text-star-olympian">{current}</span>
      {laurelCharacterId && <DayLaurel characterId={laurelCharacterId} />}
    </div>
  );
}
