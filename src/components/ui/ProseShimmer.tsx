const WIDTHS = ['100%', '92%', '96%', '70%'];

/** Stands in for prose that is on its way. It waits a moment before showing, so a
 *  file that lands quickly never flashes it. */
export function ProseShimmer({ lines = 3 }: { lines?: number }) {
  return (
    <span aria-hidden className="block space-y-2 py-1 [animation:search-veil-in_240ms_ease_180ms_both]">
      {WIDTHS.slice(0, lines).map((width) => (
        <span
          key={width}
          className="block h-2.5 animate-pulse rounded bg-aether-faint/20"
          style={{ width }}
        />
      ))}
    </span>
  );
}
