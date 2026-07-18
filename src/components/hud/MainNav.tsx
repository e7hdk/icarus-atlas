import Link from 'next/link';
import type { ReactNode } from 'react';

/** Door glyphs for the mobile bar — hand-drawn minis in the Wain-glyph idiom
 *  (thin currentColor strokes, no emoji): a star cluster for the Galaxy, a
 *  mountain over the sea for the Lands, an open scroll for the Myths. On sm+
 *  the doors keep their classical lettered form. */
function GalaxyGlyph() {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 3.2 L10.2 7.8 L14.8 9 L10.2 10.2 L9 14.8 L7.8 10.2 L3.2 9 L7.8 7.8 Z" fill="currentColor" fillOpacity="0.9" />
      <circle cx="14.6" cy="3.6" r="1.1" fill="currentColor" fillOpacity="0.7" />
      <circle cx="3.4" cy="14.2" r="0.9" fill="currentColor" fillOpacity="0.55" />
    </svg>
  );
}

function LandsGlyph() {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 12.5 L6.5 5.5 L9.2 10 L11 7.2 L15.5 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.8 15 Q4.5 13.8 6.2 15 Q7.9 16.2 9.6 15 Q11.3 13.8 13 15 Q14.4 16 15.4 15.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.65" />
    </svg>
  );
}

function MythsGlyph() {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 4.5 H13 M5 13.5 H13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5 4.5 A1.7 1.7 0 1 0 5 7.9 M13 4.5 A1.7 1.7 0 1 1 13 7.9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5 7.9 V13.5 M13 7.9 V13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M7.3 8.6 H10.7 M7.3 11 H10.7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.7" />
    </svg>
  );
}

const TABS = [
  { key: 'galaxy', label: 'Galaxy', href: '/', glyph: <GalaxyGlyph /> },
  { key: 'areas', label: 'Lands', href: '/areas', glyph: <LandsGlyph /> },
  { key: 'stories', label: 'Myths', href: '/stories', glyph: <MythsGlyph /> },
] as const satisfies readonly { key: string; label: string; href: string; glyph: ReactNode }[];

export type MainTab = (typeof TABS)[number]['key'];

/** The three doors of the atlas — shared by the galaxy HUD and the 2D pages.
 *  `active: null` keeps every door dim (satellite pages like the
 *  Heortologion, which belongs to the Ephemeris layer, not a world).
 *  Mobile shows the door GLYPHS (the lettered pills crowded the bar);
 *  sm+ keeps the classical lettering. */
export function MainNav({ active }: { active: MainTab | null }) {
  return (
    <nav className="pointer-events-auto flex gap-0.5 rounded-full border border-glass-border bg-glass p-0.5 backdrop-blur-xl sm:gap-1 sm:p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-label={tab.label}
          title={tab.label}
          className={`rounded-full p-2.5 font-display text-[10px] tracking-[0.08em] transition-colors sm:px-4 sm:py-1.5 sm:text-[11px] sm:tracking-[0.16em] ${
            active === tab.key
              ? 'nav-active border border-nebula-soft/50 bg-nebula-violet/20 text-[#e9d5ff]'
              : 'border border-transparent text-aether-muted hover:text-aether'
          }`}
        >
          <span className="sm:hidden">{tab.glyph}</span>
          <span className="hidden sm:inline">{tab.label.toUpperCase()}</span>
        </Link>
      ))}
    </nav>
  );
}
