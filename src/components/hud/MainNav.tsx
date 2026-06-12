import Link from 'next/link';

const TABS = [
  { key: 'galaxy', label: 'Galaxy', href: '/' },
  { key: 'areas', label: 'Areas', href: '/areas' },
  { key: 'stories', label: 'Stories', href: '/stories' },
] as const;

export type MainTab = (typeof TABS)[number]['key'];

/** The three doors of the atlas — shared by the galaxy HUD and the 2D pages. */
export function MainNav({ active }: { active: MainTab }) {
  return (
    <nav className="pointer-events-auto flex gap-1 rounded-full border border-glass-border bg-glass p-1 backdrop-blur-xl">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`rounded-full px-4 py-1.5 font-display text-[11px] tracking-[0.16em] transition-colors ${
            active === tab.key
              ? 'border border-nebula-soft/50 bg-nebula-violet/20 text-[#e9d5ff]'
              : 'border border-transparent text-aether-muted hover:text-aether'
          }`}
        >
          {tab.label.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
