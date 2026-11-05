import { Link } from '@/components/ui/Link';
import type { ReactNode } from 'react';
import { ATLAS_FILES } from '@/features/atlas/files';
import { loadAtlasFile } from '@/features/atlas/useAtlasFile';

/** Door glyphs for the mobile bar — hand-drawn minis in the Wain-glyph idiom
 *  (thin currentColor strokes, no emoji): a star cluster for the Galaxy, a
 *  mountain over the sea for the Lands, an open scroll for the Myths, a loom
 *  for Art, three spines on a shelf for the Library. On sm+ the doors keep
 *  their classical lettered form. */
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

function ArtGlyph() {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 3.5 H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 3.5 V12.2 M9 3.5 V13.4 M13 3.5 V12.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M3.6 7.2 H14.4 M3.6 9.6 H14.4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.65" />
      <path d="M4.2 12.4 H5.8 L6.2 14.6 H3.8 Z M8.2 13.6 H9.8 L10.2 15.8 H7.8 Z M12.2 12.4 H13.8 L14.2 14.6 H11.8 Z" fill="currentColor" fillOpacity="0.8" />
    </svg>
  );
}

/** Three spines of unequal height on a shelf, the middle one banded: the door's own shelf in miniature (L12). */
function LibraryGlyph() {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 15.6 H16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="3.3" y="6" width="2.7" height="9.6" rx="0.5" stroke="currentColor" strokeWidth="1.1" />
      <rect x="7.6" y="3" width="2.7" height="12.6" rx="0.5" stroke="currentColor" strokeWidth="1.1" />
      <rect x="11.9" y="7.4" width="2.7" height="8.2" rx="0.5" stroke="currentColor" strokeWidth="1.1" />
      <path d="M7.6 6.1 H10.3 M7.6 7.3 H10.3" stroke="currentColor" strokeWidth="0.9" strokeOpacity="0.75" />
    </svg>
  );
}

const TABS = [
  { key: 'galaxy', label: 'Galaxy', href: '/', glyph: <GalaxyGlyph />, data: ATLAS_FILES.galaxy },
  { key: 'areas', label: 'Lands', href: '/areas', glyph: <LandsGlyph />, data: ATLAS_FILES.lands },
  { key: 'stories', label: 'Myths', href: '/stories', glyph: <MythsGlyph />, data: ATLAS_FILES.myths },
  { key: 'art', label: 'Art', href: '/art', glyph: <ArtGlyph />, data: ATLAS_FILES.loom },
  // the Library's pages are text in the HTML: nothing to warm
  { key: 'library', label: 'Library', href: '/library', glyph: <LibraryGlyph />, data: null },
] as const satisfies readonly { key: string; label: string; href: string; glyph: ReactNode; data: string | null }[];

export type MainTab = (typeof TABS)[number]['key'];

/** A door's data starts when the pointer reaches its tab, so the door opens ready. */
function warmDoor(url: string | null) {
  if (url) loadAtlasFile(url).catch(() => {});
}

/** The five doors of the atlas — shared by the galaxy HUD and the 2D pages.
 *  `active: null` keeps every door dim (satellite pages like the
 *  Heortologion, which belongs to the Ephemeris layer, not a world).
 *  Below lg the doors are GLYPHS: five lettered pills need some 430 px,
 *  which the bar only spares from 1024 px; lg+ keeps the classical lettering. */
export function MainNav({ active }: { active: MainTab | null }) {
  return (
    <nav className="pointer-events-auto flex rounded-full border border-glass-border bg-glass p-0.5 backdrop-blur-xl lg:gap-1 lg:p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-label={tab.label}
          title={tab.label}
          onPointerEnter={() => warmDoor(tab.data)}
          onFocus={() => warmDoor(tab.data)}
          className={`rounded-full p-[7px] font-display text-[10px] tracking-[0.08em] transition-colors lg:px-4 lg:py-1.5 lg:text-[11px] lg:tracking-[0.16em] ${
            active === tab.key
              ? 'nav-active border border-nebula-soft/50 bg-nebula-violet/20 text-[#e9d5ff]'
              : 'border border-transparent text-aether-muted hover:text-aether'
          }`}
        >
          <span className="lg:hidden">{tab.glyph}</span>
          <span className="hidden lg:inline">{tab.label.toUpperCase()}</span>
        </Link>
      ))}
    </nav>
  );
}
