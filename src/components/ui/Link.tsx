import NextLink from 'next/link';
import type { ComponentProps } from 'react';

/** next/link with prefetching off. The static export ships each page's whole RSC
 *  payload but not Next's per-segment prefetch files, which would not fit the
 *  host's 20,000-file cap (docs/HOSTING.md), so a prefetch could only 404. A
 *  click fetches the page's payload instead. */
export function Link(props: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={false} {...props} />;
}
