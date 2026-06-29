import type { Reign } from '@/types/geo';
import { CharacterTypeLink } from '@/components/ui/CharacterTypeLink';
import type { CharacterIndex } from '@/features/characters/load';

/** Renders reign ruler name(s) as type-colored codex links when character ids exist. */
export function ReignRulerLinks({
  reign,
  characterIndex,
  className,
}: {
  reign: Reign;
  characterIndex: CharacterIndex;
  className?: string;
}) {
  if (reign.characterIds?.length) {
    return (
      <span className={className}>
        {reign.characterIds.map((id, index) => {
          const entry = characterIndex[id];
          return (
            <span key={id}>
              {index > 0 && <span className="text-aether"> & </span>}
              {entry ? (
                <CharacterTypeLink id={id} name={entry.name} type={entry.type} />
              ) : (
                <span className="text-aether">{id}</span>
              )}
            </span>
          );
        })}
      </span>
    );
  }

  if (reign.characterId) {
    const entry = characterIndex[reign.characterId];
    if (entry) {
      return (
        <CharacterTypeLink
          id={reign.characterId}
          name={entry.name}
          type={entry.type}
          className={className}
        />
      );
    }
  }

  return <span className={className ?? 'text-aether'}>{reign.ruler}</span>;
}
