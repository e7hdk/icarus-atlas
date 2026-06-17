import Link from 'next/link';

function labelForStoryId(id: string): string {
  return id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Footer links from a map panel to one or more sagas. */
export function StoryLinks({ storyIds }: { storyIds: string[] }) {
  if (storyIds.length === 0) return null;

  return (
    <div className="border-t border-glass-border px-5 py-2.5">
      {storyIds.length === 1 ? (
        <Link
          href={`/story/${storyIds[0]}`}
          className="block text-center font-display text-[11px] uppercase tracking-[0.2em] text-nebula-soft transition-colors hover:text-aether"
        >
          Read {labelForStoryId(storyIds[0])} →
        </Link>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="text-center font-display text-[10px] uppercase tracking-[0.22em] text-aether-faint">
            Sagas here
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {storyIds.map((id) => (
              <Link
                key={id}
                href={`/story/${id}`}
                className="rounded-full border border-glass-border px-3 py-1 font-display text-[10px] tracking-[0.1em] text-nebula-soft transition-colors hover:border-nebula-soft/50 hover:text-aether"
              >
                {labelForStoryId(id)} →
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
