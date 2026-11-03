'use client';

import { fold } from '@/features/search/match';

/** Narrows the server-rendered list in place, so the page stays one static document. */
export function WorkListFilter() {
  const narrow = (query: string) => {
    const terms = fold(query).split(/\s+/).filter(Boolean);
    for (const item of document.querySelectorAll<HTMLElement>('[data-work]')) {
      const text = fold(item.textContent ?? '');
      item.hidden = !terms.every((term) => text.includes(term));
    }
  };
  return (
    <input
      type="search"
      aria-label="Filter the works"
      placeholder="Filter by title, painter or year…"
      spellCheck={false}
      onChange={(event) => narrow(event.target.value)}
      className="mt-8 w-full rounded-xl border border-glass-border bg-glass px-4 py-2.5 font-body text-lg text-aether placeholder:text-aether-faint focus:outline-none focus-visible:border-aether-muted"
    />
  );
}
