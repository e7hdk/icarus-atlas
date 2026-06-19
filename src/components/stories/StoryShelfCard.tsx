import Link from 'next/link';
import { GlassPanel } from '@/components/ui/GlassPanel';
import type { Story, StoryKind } from '@/types/story';

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
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
      />
      {kind}
    </span>
  );
}

function EpisodeTree({
  parentId,
  getChildren,
  depth = 0,
}: {
  parentId: string;
  getChildren: (id: string) => Story[];
  depth?: number;
}) {
  const children = getChildren(parentId);
  if (children.length === 0) return null;

  return (
    <ul
      className={
        depth === 0
          ? 'mt-4 flex flex-col gap-2 border-t border-glass-border pt-3'
          : 'mt-1.5 flex flex-col gap-1.5 border-l border-glass-border/80 pl-3'
      }
    >
      {children.map((child) => (
        <li key={child.id}>
          <Link
            href={`/story/${child.id}`}
            className="group flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg px-1 py-0.5 transition-colors hover:bg-white/[0.04]"
          >
            <span className="font-display text-[13px] tracking-[0.06em] text-aether group-hover:text-nebula-soft">
              {child.title}
            </span>
            {child.greekTitle && (
              <span className="font-body text-[12px] italic text-aether-faint">{child.greekTitle}</span>
            )}
            <KindBadge kind={child.kind} />
          </Link>
          <EpisodeTree parentId={child.id} getChildren={getChildren} depth={depth + 1} />
        </li>
      ))}
    </ul>
  );
}

function EpisodeChips({ parentId, getChildren }: { parentId: string; getChildren: (id: string) => Story[] }) {
  const children = getChildren(parentId);
  if (children.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-glass-border pt-3">
      <span className="font-display text-[10px] uppercase tracking-[0.2em] text-aether-faint">Episodes</span>
      {children.map((sub) => (
        <Link
          key={sub.id}
          href={`/story/${sub.id}`}
          className="rounded-full border border-glass-border bg-glass px-3 py-1 font-body text-[14px] text-aether/85 transition-colors hover:border-nebula-soft/50 hover:text-aether"
        >
          {sub.title}
        </Link>
      ))}
    </div>
  );
}

export function StoryShelfCard({
  story,
  getChildren,
  nestedEpisodes = false,
  accent,
}: {
  story: Story;
  getChildren: (id: string) => Story[];
  /** Recursive episode tree (cosmic shelf). */
  nestedEpisodes?: boolean;
  accent?: string;
}) {
  return (
    <GlassPanel
      className="bg-glass-heavy px-6 py-5 transition-colors hover:border-nebula-soft/40"
      style={
        accent
          ? { boxShadow: `inset 3px 0 0 ${accent}88`, borderColor: `${accent}33` }
          : undefined
      }
    >
      <Link href={`/story/${story.id}`} className="block">
        <div className="flex flex-wrap items-center gap-3">
          <KindBadge kind={story.kind} />
          <h2 className="font-display text-2xl tracking-[0.1em] text-aether">{story.title}</h2>
          {story.greekTitle && (
            <span className="font-body text-base italic text-aether-muted">{story.greekTitle}</span>
          )}
        </div>
        <p className="mt-2.5 font-body text-[16px] leading-relaxed text-aether/90">{story.summary.text}</p>
      </Link>
      {nestedEpisodes ? (
        <EpisodeTree parentId={story.id} getChildren={getChildren} />
      ) : (
        <EpisodeChips parentId={story.id} getChildren={getChildren} />
      )}
    </GlassPanel>
  );
}
