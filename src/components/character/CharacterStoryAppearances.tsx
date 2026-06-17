import Link from 'next/link';
import type { Story } from '@/types/story';
import { ClampList } from '@/components/ui/ClampList';

const KIND_LABEL: Partial<Record<Story['kind'], string>> = {
  cosmogony: 'Cosmogony',
  war: 'War',
  catastrophe: 'Catastrophe',
  saga: 'Saga',
  episode: 'Episode',
};

/** Links from the character codex to sagas where this figure appears in the cast. */
export function CharacterStoryAppearances({
  characterId,
  appearances,
  storiesById,
}: {
  characterId: string;
  appearances: Story[];
  storiesById: Map<string, Story>;
}) {
  if (appearances.length === 0) return null;

  return (
    <div className="mt-5 flex flex-col items-center gap-3">
      <div className="font-display text-[10px] tracking-[0.26em] text-aether-faint">
        APPEARS IN THE MYTHS
      </div>
      <ul className="flex max-w-2xl flex-wrap items-stretch justify-center gap-2.5">
        <ClampList max={6}>
        {appearances.map((story) => {
          const role = story.cast.find((member) => member.id === characterId)?.role;
          const parent = story.parent ? storiesById.get(story.parent) : undefined;
          return (
            <li
              key={story.id}
              className="flex min-w-[11rem] max-w-xs flex-col gap-1.5 rounded-2xl border border-glass-border bg-glass px-4 py-3 backdrop-blur-xl"
            >
              <div className="text-center">
                <span className="font-display text-[13px] tracking-[0.08em] text-aether">
                  {story.title.toUpperCase()}
                </span>
                {story.greekTitle ? (
                  <span className="mt-0.5 block font-body text-[13px] italic text-aether-muted">
                    {story.greekTitle}
                  </span>
                ) : null}
                {parent ? (
                  <span className="mt-1 block font-body text-[12px] italic text-aether-faint">
                    in {parent.title}
                  </span>
                ) : null}
                {role ? (
                  <span className="mt-1 block font-body text-[12.5px] italic text-nebula-soft/90">
                    {role}
                  </span>
                ) : null}
              </div>
              <Link
                href={`/story/${story.id}`}
                className="rounded-full border border-glass-border px-3 py-1 text-center font-display text-[10px] tracking-[0.12em] text-nebula-soft transition-colors hover:border-nebula-soft/50 hover:text-aether"
              >
                {KIND_LABEL[story.kind] ?? 'Read'} →
              </Link>
            </li>
          );
        })}
        </ClampList>
      </ul>
    </div>
  );
}
