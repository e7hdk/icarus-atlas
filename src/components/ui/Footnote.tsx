import { Link } from '@/components/ui/Link';
import type { PassageLink } from '@/features/library/links';

/** The codex footnote: a superscript that shows its tellers and passage on hover,
 *  and now on focus too, so a tap opens it on a phone. Where the Library holds the
 *  passage, the note offers it (docs/LIBRARY_PLAN.md §6, deep links). The note sits
 *  on an invisible bridge of padding, so the pointer can travel into it. */
export function Footnote({ label = '1', text, passages = [] }: { label?: string; text: string; passages?: PassageLink[] }) {
  return (
    <span
      tabIndex={0}
      className="group/fn relative ml-0.5 cursor-default align-super font-body text-[13px] not-italic text-aether-faint outline-none focus-visible:text-star-olympian"
    >
      {label}
      <span className="pointer-events-none absolute bottom-full right-0 z-10 hidden pb-1.5 group-focus-within/fn:block group-hover/fn:block">
        <span className="pointer-events-auto block max-w-[80vw] rounded-lg border border-star-olympian/40 bg-cosmos-raised px-2.5 py-1 font-body text-sm not-italic text-aether sm:max-w-none">
          <span className="block whitespace-nowrap">{text}</span>
          {passages.length > 0 && (
            <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2 border-t border-white/10 pb-0.5 pt-1">
              <span className="font-display text-[8.5px] uppercase tracking-[0.2em] text-aether-faint">Read</span>
              {passages.map((passage) => (
                <Link key={passage.href} href={passage.href} className="whitespace-nowrap text-star-olympian/90 transition-colors hover:text-star-olympian">
                  {passage.label} →
                </Link>
              ))}
            </span>
          )}
        </span>
      </span>
    </span>
  );
}
