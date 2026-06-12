import Link from 'next/link';
import type { Character } from '@/types/character';
import { TypeBadge } from '@/components/ui/TypeBadge';
import { IcarusBrand } from '@/components/ui/IcarusBrand';
import { BackArrow } from '@/components/ui/BackArrow';
import { MainNav } from '@/components/hud/MainNav';

const TABS = [
  { key: 'poets', label: 'The poets', path: '' },
  { key: 'info', label: 'Information', path: '/info' },
  { key: 'legacy', label: 'Legacy', path: '/legacy' },
] as const;

export type CharacterTab = (typeof TABS)[number]['key'];

/** Shared chrome of all character routes: top bar, hero identity, tab navigation. */
export function CharacterShell({
  character,
  active,
  children,
}: {
  character: Character;
  active: CharacterTab;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 pb-24 pt-6">
      <div className="mb-4 flex justify-center sm:hidden">
        <MainNav active="galaxy" />
      </div>
      <div className="flex flex-col items-start gap-2.5">
        <IcarusBrand compact />
        <BackArrow href="/" label="Back to the galaxy" />
      </div>

      <header className="mt-8 text-center">
        <h1 className="font-display text-[clamp(26px,7vw,60px)] tracking-[0.22em] text-aether [text-shadow:0_0_46px_rgba(252,211,77,.45)]">
          {character.name.toUpperCase()}
        </h1>
        <p className="mt-2 font-body text-xl italic text-aether-muted">
          {character.greekName}
          {character.romanName ? ` · Roman ${character.romanName}` : ''}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <TypeBadge type={character.type} />
          <span className="font-body text-base italic text-aether-muted">
            {character.domains.join(' · ')}
          </span>
        </div>
      </header>

      <nav className="mt-7 flex justify-center">
        <div className="flex gap-1 rounded-full border border-glass-border bg-glass p-1 backdrop-blur-xl">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={`/character/${character.id}${tab.path}`}
              className={`rounded-full px-3.5 py-2 font-display text-[11px] tracking-[0.1em] transition-colors sm:px-5 sm:text-[12px] ${
                active === tab.key
                  ? 'border border-nebula-soft/50 bg-nebula-violet/20 text-[#e9d5ff]'
                  : 'border border-transparent text-aether-muted hover:text-aether'
              }`}
            >
              {tab.label.toUpperCase()}
            </Link>
          ))}
        </div>
      </nav>

      {children}
    </main>
  );
}
