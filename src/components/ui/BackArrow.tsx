import Link from 'next/link';

const ARROW_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="h-4 w-4"
    aria-hidden
  >
    <path d="M19 12H5" strokeLinecap="round" />
    <path d="m12 19-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Icon-only back control, shown under the top-left brand mark. The label
 *  survives for screen readers and as a hover tooltip. */
export function BackArrow({
  href,
  onClick,
  label,
  className = '',
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  className?: string;
}) {
  const classes = `pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-glass-border bg-glass text-aether-muted backdrop-blur-xl transition-colors hover:border-nebula-soft/50 hover:text-aether ${className}`;
  if (href) {
    return (
      <Link href={href} aria-label={label} title={label} className={classes}>
        {ARROW_ICON}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={classes}>
      {ARROW_ICON}
    </button>
  );
}
