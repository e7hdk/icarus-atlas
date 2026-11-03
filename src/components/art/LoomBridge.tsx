import Link from 'next/link';

/** A way into the Loom from elsewhere in the atlas (docs/LOOM_PLAN.md §8): the cloth
 *  opened on a figure's or a story's works, with how many there are. */
export function LoomBridge({ href, count, className = '' }: { href: string; count: number; className?: string }) {
  return (
    <Link
      href={href}
      className={`flex w-fit items-baseline gap-2.5 rounded-full border border-star-olympian/40 bg-star-olympian/[0.06] px-4 pb-[7px] pt-1.5 font-display text-[10px] tracking-[0.2em] text-star-olympian transition-colors hover:bg-star-olympian/[0.14] hover:text-[#fde68a] ${className}`}
    >
      SEE ON THE LOOM
      <span className="font-body text-[14px] italic tracking-normal text-aether-muted">
        {`${count} ${count === 1 ? 'work' : 'works'}`}
      </span>
    </Link>
  );
}
