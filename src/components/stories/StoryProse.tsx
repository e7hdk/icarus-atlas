'use client';

import { LinkedProse } from '@/features/linking/LinkedProse';
import type { LinkingContext } from '@/features/linking/name-index';
import type { ProseSegment } from '@/features/linking/parse-prose';

/** Client wrapper for linked narrative text on story pages. */
export function StoryProse({
  text,
  segments,
  linkingContext,
  scopeIds,
  className,
}: {
  text: string;
  segments?: ProseSegment[];
  linkingContext?: LinkingContext;
  scopeIds?: string[];
  className?: string;
}) {
  return (
    <LinkedProse
      text={text}
      segments={segments}
      characterIndex={linkingContext?.characterIndex}
      nameIndex={linkingContext?.nameIndex}
      sortedNames={linkingContext?.sortedNames}
      scopeIds={scopeIds}
      className={className}
    />
  );
}
