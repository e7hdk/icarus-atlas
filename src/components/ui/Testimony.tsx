import { CitationText } from '@/components/ui/CitationText';
import { testimonyCitation } from '@/features/library/links';

/** A testimony as the sky keeps it, "Hyginus, Astronomica 2.29 — many say…": its
 *  opening citation opens the passage where the Library holds it (§9). */
export function Testimony({ line }: { line: string }) {
  const head = testimonyCitation(line);
  return (
    <>
      <CitationText citation={head} />
      {line.slice(head.length)}
    </>
  );
}
