import type { Constellation } from '@/types/sky';

/** A constellation's own plate, drawn from the same catalogue the sky is drawn
 *  from: a gnomonic projection centred on the figure, as an atlas would engrave
 *  it, each star's disc sized by its magnitude. Shared by the sky card and the
 *  constellation's page, so the figure looks the same wherever it is met. */
export function FigureChart({
  figure,
  className = '',
  labelled = false,
}: {
  figure: Constellation;
  className?: string;
  /** Letter the brighter stars, the way a chart does. */
  labelled?: boolean;
}) {
  const RAD = Math.PI / 180;
  const points = figure.stars.map((star) => ({ ra: star.ra * RAD, dec: star.dec * RAD }));
  // Circular mean of right ascension, so a figure straddling 0h does not tear.
  const ra0 = Math.atan2(
    points.reduce((sum, p) => sum + Math.sin(p.ra), 0),
    points.reduce((sum, p) => sum + Math.cos(p.ra), 0),
  );
  const dec0 = points.reduce((sum, p) => sum + p.dec, 0) / points.length;
  const flat = points.map((p) => {
    const cosc =
      Math.sin(dec0) * Math.sin(p.dec) + Math.cos(dec0) * Math.cos(p.dec) * Math.cos(p.ra - ra0);
    return {
      x: -(Math.cos(p.dec) * Math.sin(p.ra - ra0)) / cosc,
      y:
        (Math.cos(dec0) * Math.sin(p.dec) -
          Math.sin(dec0) * Math.cos(p.dec) * Math.cos(p.ra - ra0)) /
        cosc,
    };
  });
  const xs = flat.map((p) => p.x);
  const ys = flat.map((p) => p.y);
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const reach = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  // Chart y climbs; SVG y falls. Labelled plates keep a wider margin for them.
  const spread = labelled ? 74 : 82;
  const at = (i: number) => ({
    x: 50 + ((flat[i]!.x - cx) / reach) * spread,
    y: 50 - ((flat[i]!.y - cy) / reach) * spread,
  });

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <g stroke="#fcd34d" strokeWidth={labelled ? 0.35 : 0.45} opacity="0.42">
        {figure.lines.map(([from, to], index) => {
          const a = at(from);
          const b = at(to);
          return <line key={index} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeLinecap="round" />;
        })}
      </g>
      <g fill="#e9d5ff">
        {figure.stars.map((star, index) => {
          const p = at(index);
          return (
            <circle
              key={`${star.name}-${index}`}
              cx={p.x}
              cy={p.y}
              r={Math.max(0.7, 2.5 - 0.3 * Math.min(Math.max(star.mag, 0), 6))}
              opacity={star.character ? 1 : 0.82}
            />
          );
        })}
      </g>
      {labelled && (
        <g fill="#fcd34d" opacity="0.7" fontSize="2.6" fontStyle="italic">
          {figure.stars.map((star, index) =>
            star.bayer && star.mag < 3.6 ? (
              <text key={`${star.name}-label-${index}`} x={at(index).x + 2.4} y={at(index).y - 1.8}>
                {star.bayer}
              </text>
            ) : null,
          )}
        </g>
      )}
    </svg>
  );
}
