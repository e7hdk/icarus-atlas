import { ImageResponse } from 'next/og';

/** First, Chaos's social card (docs/LIBRARY_PLAN.md §8): a dark sky with its
 *  first stars alight. Latin text only: satori's default font has no polytonic
 *  Greek. */

export const dynamic = 'force-static';

export const alt = 'First, Chaos — the Theogony of Hesiod, read with the sky | Icarus Atlas';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Deterministic specks: [x, y, radius, opacity]; the first four are Chaos, Earth, Tartarus and Eros. */
const LIT: Array<[number, number, number]> = [[860, 250, 7], [960, 238, 9], [1040, 330, 6], [905, 372, 6]];
const DIM: Array<[number, number, number, number]> = [
  [700, 120, 1.5, 0.35], [760, 420, 1.5, 0.3], [820, 520, 1.2, 0.25], [1000, 470, 1.5, 0.3], [1100, 180, 1.2, 0.3],
  [1150, 420, 1.5, 0.25], [640, 300, 1.2, 0.2], [980, 560, 1.2, 0.25], [1080, 90, 1.5, 0.3], [720, 230, 1, 0.2],
];

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', padding: '0 80px', background: 'linear-gradient(160deg, #0b0522 0%, #05020f 55%, #0b0420 100%)', color: '#e5e7eb' }}>
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', top: 0, left: 0 }}>
          {DIM.map(([x, y, r, o], index) => (
            <circle key={index} cx={x} cy={y} r={r} fill="#e5e7eb" opacity={o} />
          ))}
          <line x1={960} y1={238} x2={860} y2={250} stroke="#8b9bd4" strokeOpacity={0.5} strokeWidth={1.5} />
          {LIT.map(([x, y, r], index) => (
            <g key={index}>
              <circle cx={x} cy={y} r={r * 3.2} fill="#c084fc" opacity={0.16} />
              <circle cx={x} cy={y} r={r} fill="#f5f3ff" />
            </g>
          ))}
        </svg>
        <div style={{ display: 'flex', fontSize: 22, letterSpacing: 12, color: 'rgba(252, 211, 77, 0.75)' }}>ICARUS ATLAS · THE LIBRARY</div>
        <div style={{ display: 'flex', marginTop: 26, fontSize: 92, letterSpacing: 14, color: '#fdf6e3' }}>FIRST, CHAOS</div>
        <div style={{ display: 'flex', marginTop: 14, fontSize: 30, color: 'rgba(229, 231, 235, 0.78)' }}>The Theogony of Hesiod, read with the sky</div>
      </div>
    ),
    size,
  );
}
