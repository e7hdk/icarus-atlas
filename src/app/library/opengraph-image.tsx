import { ImageResponse } from 'next/og';
import { LIBRARY_REGISTRY } from '@/features/library/links';
import { libraryShelf } from '@/features/library/shelf';

/** The Library's social card (docs/LIBRARY_PLAN.md §9): its shelf in silhouette,
 *  each spine as tall as its work is long and gilt as far as the atlas cites it.
 *  Latin text only: satori's default font has no polytonic Greek. Pages under the
 *  Library without a card of their own share this one. */

export const dynamic = 'force-static';

export const alt = 'The Library — the seven tellers of Greek myth, read in the original and in English | Icarus Atlas';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const SPECKS: Array<[number, number, number, number]> = [
  [70, 80, 2, 0.45], [210, 160, 1.5, 0.35], [380, 60, 1.5, 0.4], [560, 120, 2, 0.3],
  [760, 70, 1.5, 0.45], [930, 140, 2, 0.35], [1110, 90, 1.5, 0.4], [1020, 260, 1.5, 0.3],
];

export default async function Image() {
  const { works } = await libraryShelf();
  const order = [...LIBRARY_REGISTRY.works].sort((a, b) => a.composed.from + a.composed.to - (b.composed.from + b.composed.to));
  const most = Math.max(...order.map((work) => works[work.id].words));
  const width = 46;
  const gap = 16;
  const left = (1200 - (order.length * width + (order.length - 1) * gap)) / 2;
  const plank = 588;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', background: 'linear-gradient(160deg, #0b0522 0%, #05020f 55%, #0b0420 100%)', color: '#e5e7eb' }}>
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', top: 0, left: 0 }}>
          {SPECKS.map(([x, y, r, o], index) => (
            <circle key={index} cx={x} cy={y} r={r} fill="#e5e7eb" opacity={o} />
          ))}
          {order.map((work, index) => {
            const h = 70 + 165 * Math.sqrt(works[work.id].words / most);
            const x = left + index * (width + gap);
            const gilt = h * works[work.id].cited;
            return (
              <g key={work.id}>
                <rect x={x} y={plank - h} width={width} height={h} rx={4} fill="#120a2e" stroke="#fcd34d" strokeOpacity={0.45} />
                <rect x={x + 1} y={plank - gilt} width={width - 2} height={gilt} rx={3} fill="#fcd34d" fillOpacity={0.2} />
                <rect x={x + 2} y={plank - gilt - 1} width={width - 4} height={2} fill="#fcd34d" />
                <rect x={x + 6} y={plank - h + 8} width={width - 12} height={1.5} fill="#fcd34d" fillOpacity={0.6} />
              </g>
            );
          })}
          <rect x={left - 40} y={plank} width={order.length * (width + gap) + 64} height={2} fill="#fcd34d" fillOpacity={0.6} />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '64px 72px', position: 'relative' }}>
          <div style={{ display: 'flex', fontSize: 22, letterSpacing: 12, color: 'rgba(252, 211, 77, 0.75)' }}>ICARUS ATLAS · THE FIFTH DOOR</div>
          <div style={{ display: 'flex', marginTop: 22, fontSize: 92, letterSpacing: 16, color: '#fdf6e3' }}>THE LIBRARY</div>
          <div style={{ display: 'flex', marginTop: 14, fontSize: 30, color: 'rgba(229, 231, 235, 0.78)' }}>Seven tellers, eleven works, read in the original and in English</div>
        </div>
      </div>
    ),
    size,
  );
}
