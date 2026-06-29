'use client';

import { useMemo } from 'react';
import { CharacterTypeLink } from '@/components/ui/CharacterTypeLink';
import type { CharacterIndex } from '@/features/characters/character-index';
import type { CharacterType } from '@/types/character';
import type { NameIndex } from './name-index';
import { parseLinkedProse, type ProseSegment } from './parse-prose';

export function LinkedProse({
  text,
  segments: precomputedSegments,
  characterIndex,
  nameIndex,
  sortedNames,
  scopeIds,
  className,
}: {
  text: string;
  segments?: ProseSegment[];
  characterIndex?: CharacterIndex;
  nameIndex?: NameIndex;
  sortedNames?: string[];
  scopeIds?: string[];
  className?: string;
}) {
  const characterTypes = useMemo(() => {
    if (precomputedSegments || !characterIndex) return {};
    const types: Record<string, CharacterType> = {};
    for (const [id, entry] of Object.entries(characterIndex)) {
      types[id] = entry.type;
    }
    return types;
  }, [characterIndex, precomputedSegments]);

  const segments = useMemo(() => {
    if (precomputedSegments) return precomputedSegments;
    if (!sortedNames || !nameIndex) return [{ kind: 'plain' as const, text }];
    return parseLinkedProse(text, sortedNames, nameIndex, characterTypes, scopeIds);
  }, [precomputedSegments, text, sortedNames, nameIndex, characterTypes, scopeIds]);

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.kind === 'link' ? (
          <CharacterTypeLink
            key={`${index}-${segment.id}`}
            id={segment.id}
            name={segment.text}
            type={segment.type}
          />
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </span>
  );
}
