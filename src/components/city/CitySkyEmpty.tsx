import Link from 'next/link';
import { TopBar } from '@/components/hud/TopBar';
import { GlassPanel } from '@/components/ui/GlassPanel';

/** Themed empty state when a city has no linked residents yet. */
export function CitySkyEmpty({
  cityId,
  cityName,
  greekName,
}: {
  cityId: string;
  cityName: string;
  greekName?: string;
}) {
  return (
    <div className="fixed inset-0 bg-cosmos-deep">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgb(124_77_255_/_0.12),transparent_70%)]"
        aria-hidden
      />
      <TopBar
        active="areas"
        back={{ href: `/city/${cityId}`, label: `Back to the ${cityName} codex` }}
      />
      <div className="relative flex h-full items-center justify-center px-6 pb-16 pt-24">
        <GlassPanel className="max-w-md bg-glass-heavy px-8 py-10 text-center shadow-[0_24px_80px_rgba(5,2,15,0.85),0_0_48px_rgba(124,77,255,0.16)]">
          <p className="font-display text-[11px] uppercase tracking-[0.28em] text-aether-faint">
            The sky over
          </p>
          <h1 className="mt-2 font-display text-[clamp(22px,5vw,32px)] tracking-[0.18em] text-aether [text-shadow:0_0_32px_rgba(252,211,77,0.35)]">
            {cityName.toUpperCase()}
          </h1>
          {greekName && (
            <p className="mt-1 font-body text-lg italic text-aether-muted">{greekName}</p>
          )}
          <p className="mt-5 font-body text-[17px] leading-relaxed italic text-aether-muted">
            No figures are linked to this city yet. The atlas grows one residence at a time.
          </p>
          <nav className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-5">
            <Link
              href={`/city/${cityId}`}
              className="pointer-events-auto rounded-full border border-nebula-soft/40 bg-nebula-violet/15 px-5 py-2 font-display text-[11px] uppercase tracking-[0.12em] text-[#e9d5ff] transition-colors hover:border-nebula-soft/60 hover:bg-nebula-violet/25"
            >
              Return to lineage
            </Link>
            <Link
              href="/areas"
              className="pointer-events-auto font-body text-[15px] italic text-aether-muted transition-colors hover:text-aether"
            >
              Back to the lands
            </Link>
          </nav>
        </GlassPanel>
      </div>
    </div>
  );
}
