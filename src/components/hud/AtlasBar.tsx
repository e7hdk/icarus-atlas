'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { IcarusBrand } from '@/components/ui/IcarusBrand';
import { useEphemerisStore } from '@/features/spotlight/store';
import { MainNav, type MainTab } from './MainNav';
import { HudActions } from './HudActions';
import { EphemerisChip } from './EphemerisChip';
import { OdysseyChip } from './OdysseyChip';

/** The one chrome of the atlas — a fixed glass masthead on every page:
 *  brand left, the three doors centered, search ⌘K + settings right.
 *  Transparent over the immersive canvases; the glass deepens once a page
 *  scrolls, and on long reads the bar steps aside on scroll-down and returns
 *  the instant the reader looks up. Codex pages add their own breadcrumb
 *  strip (CrumbBar) below, which scrolls away with the page. */

function doorFor(pathname: string): MainTab | null {
  if (pathname.startsWith('/areas') || pathname.startsWith('/city')) return 'areas';
  if (pathname.startsWith('/stories') || pathname.startsWith('/story')) return 'stories';
  if (pathname.startsWith('/festivals')) return null; // Ephemeris satellite — no world door lit
  if (pathname.startsWith('/odyssey')) return null; // Nostos voyage satellite — no world door lit
  return 'galaxy';
}

export function AtlasBar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  // While the Proem plays or the Oracle chamber is open, the stage owns the
  // screen — the bar retracts the same way it steps aside on long reads
  // (docs/EPHEMERIS_PLAN.md §5).
  const proemActive = useEphemerisStore((s) => s.proemActive);
  const oracleOpen = useEphemerisStore((s) => s.oracleOpen);
  const riddleOpen = useEphemerisStore((s) => s.riddleOpen);

  useEffect(() => {
    let raf = 0;
    const trace = () => {
      raf = 0;
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > lastY.current && y > 160);
      lastY.current = y;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(trace);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    return () => {
      window.removeEventListener('scroll', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      className={`pointer-events-none fixed inset-x-0 top-0 z-30 transition-transform duration-300 ${
        hidden || proemActive || oracleOpen || riddleOpen ? '-translate-y-full' : ''
      }`}
    >
      <div
        className={`atlas-bar relative flex h-14 items-center border-b px-3 transition-[background-color,box-shadow,border-color] duration-300 sm:px-6 ${
          scrolled
            ? 'border-white/10 bg-[rgba(10,5,30,0.72)] shadow-[0_18px_50px_rgba(5,2,15,0.45)] backdrop-blur-xl'
            : 'border-transparent'
        }`}
      >
        <Link href="/" className="pointer-events-auto" aria-label="Icarus Atlas — the galaxy">
          <IcarusBrand />
        </Link>
        {/* Mobile: the nav lives in the flex flow (auto margins centre it, and
            siblings can push — overlap is impossible). sm+: true optical
            centring via absolute positioning, as before. */}
        <div className="mx-auto sm:absolute sm:left-1/2 sm:top-1/2 sm:mx-0 sm:-translate-x-1/2 sm:-translate-y-1/2">
          <MainNav active={doorFor(pathname)} />
        </div>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          <OdysseyChip active={pathname.startsWith('/odyssey')} />
          <EphemerisChip />
          <HudActions mapLayers={pathname.startsWith('/areas')} />
        </div>
      </div>
    </header>
  );
}
