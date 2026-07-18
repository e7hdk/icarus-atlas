import Link from 'next/link';

const TABS = [
  { key: 'poets', label: 'The poets', path: '' },
  { key: 'info', label: 'Information', path: '/info' },
  { key: 'legacy', label: 'Legacy', path: '/legacy' },
] as const;

export type CharacterTab = (typeof TABS)[number]['key'];

/** The codex tab pills (Poets · Information · Legacy), shared by every
 *  character tab's marquee layout. */
export function CharacterTabs({
  characterId,
  active,
}: {
  characterId: string;
  active: CharacterTab;
}) {
  return (
    <div className="flex gap-1 rounded-full border border-glass-border bg-glass p-1 backdrop-blur-xl">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={`/character/${characterId}${tab.path}`}
          className={`whitespace-nowrap rounded-full px-2.5 py-2 font-display text-[10px] tracking-[0.06em] transition-colors sm:px-5 sm:text-[12px] sm:tracking-[0.1em] ${
            active === tab.key
              ? 'border border-nebula-soft/50 bg-nebula-violet/20 text-[#e9d5ff]'
              : 'border border-transparent text-aether-muted hover:text-aether'
          }`}
        >
          {tab.label.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
