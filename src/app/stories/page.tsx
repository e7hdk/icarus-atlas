import Link from 'next/link';
import { loadStories } from '@/features/stories/load';
import { MainNav } from '@/components/hud/MainNav';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { IcarusBrand } from '@/components/ui/IcarusBrand';
import type { Story, StoryKind } from '@/types/story';

export const metadata = {
  title: 'Myths — Icarus Atlas',
  description: 'The great myths: cosmogony, floods, wars and their episodes.',
};

const KIND_COLOR: Record<StoryKind, string> = {
  cosmogony: '#c084fc',
  catastrophe: '#00e5ff',
  war: '#fb7185',
  saga: '#fcd34d',
  episode: '#aab4c8',
};

function KindBadge({ kind }: { kind: StoryKind }) {
  const color = KIND_COLOR[kind];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-0.5 font-display text-[10px] uppercase tracking-[0.18em]"
      style={{ color, borderColor: `${color}66`, backgroundColor: `${color}1a` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
      {kind}
    </span>
  );
}

export default async function StoriesPage() {
  const stories = await loadStories();
  const topLevel = stories.filter((story) => story.parent === null);
  const childrenOf = (id: string): Story[] => stories.filter((story) => story.parent === id);

  return (
    <main className="min-h-screen w-full pb-24">
      <div className="pointer-events-none relative flex min-h-[68px] items-center px-6 py-4">
        <IcarusBrand />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <MainNav active="stories" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6">
        <header className="mt-10 text-center">
          <h1 className="font-display text-4xl tracking-[0.3em] text-aether [text-shadow:0_0_46px_rgba(192,132,252,.4)]">
            MYTHS
          </h1>
          <p className="mt-3 font-body text-lg italic text-aether-muted">
            The myths as the poets told them — from the first yawning of Chaos to the fall of Troy.
          </p>
        </header>

        <div className="mt-10 flex flex-col gap-5">
          {topLevel.map((story) => {
            const subStories = childrenOf(story.id);
            return (
              <GlassPanel key={story.id} className="bg-glass-heavy px-6 py-5 transition-colors hover:border-nebula-soft/40">
                <Link href={`/story/${story.id}`} className="block">
                  <div className="flex flex-wrap items-center gap-3">
                    <KindBadge kind={story.kind} />
                    <h2 className="font-display text-2xl tracking-[0.1em] text-aether">
                      {story.title}
                    </h2>
                    {story.greekTitle && (
                      <span className="font-body text-base italic text-aether-muted">
                        {story.greekTitle}
                      </span>
                    )}
                  </div>
                  <p className="mt-2.5 font-body text-[16px] leading-relaxed text-aether/90">
                    {story.summary.text}
                  </p>
                </Link>
                {subStories.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-glass-border pt-3">
                    <span className="font-display text-[10px] uppercase tracking-[0.2em] text-aether-faint">
                      Episodes
                    </span>
                    {subStories.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/story/${sub.id}`}
                        className="rounded-full border border-glass-border bg-glass px-3 py-1 font-body text-[14px] text-aether/85 transition-colors hover:border-nebula-soft/50 hover:text-aether"
                      >
                        {sub.title}
                      </Link>
                    ))}
                  </div>
                )}
              </GlassPanel>
            );
          })}
        </div>
      </div>
    </main>
  );
}
