import type { MouseEvent } from 'react';
import { Link } from '@/components/ui/Link';
import { citationParts } from '@/features/library/links';
import type { SourceId } from '@/types/character';

/** A citation as the atlas writes it, each stretch the Library holds a quiet link
 *  to its passage (docs/LIBRARY_PLAN.md §9): "— Theogony 188–206" opens the
 *  Theogony at those lines. `onFollow` lets a stage that claims every click (the
 *  Proem) step aside first. */
export function CitationText({
  citation,
  sources,
  work,
  onFollow,
}: {
  citation: string;
  sources?: readonly SourceId[];
  /** The work a bare locus belongs to (a story's attestation). */
  work?: string;
  onFollow?: (event: MouseEvent) => void;
}) {
  return (
    <>
      {citationParts(citation, { sources, work }).map((part, index) =>
        part.href ? (
          <Link
            key={index}
            href={part.href}
            onClick={onFollow}
            className="underline decoration-current/35 decoration-dotted underline-offset-[3px] transition-colors hover:text-star-olympian hover:decoration-star-olympian"
          >
            {part.text}
          </Link>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}
