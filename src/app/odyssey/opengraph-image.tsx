import { ImageResponse } from 'next/og';

/** The voyage's social card (docs/NOSTOS_PLAN.md §6, M13.5): the star-sea, the
 *  Wain to steer by, and the invitation. Generated at build time — no binary
 *  asset to keep in sync. Latin text only: satori's default font has no
 *  polytonic Greek, and tofu would be worse than restraint. */

export const alt = 'The Odyssey — a voyage home, told by the stars | Icarus Atlas';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Deterministic star specks: [x, y, radius, opacity]. */
const STARS: Array<[number, number, number, number]> = [
  [80, 90, 2, 0.5], [200, 480, 1.5, 0.35], [280, 150, 2, 0.4], [370, 520, 1.5, 0.3],
  [430, 80, 1.5, 0.45], [520, 560, 2, 0.35], [640, 60, 1.5, 0.4], [720, 540, 1.5, 0.3],
  [830, 110, 2, 0.5], [910, 490, 1.5, 0.35], [1000, 70, 1.5, 0.4], [1080, 420, 2, 0.45],
  [1140, 180, 1.5, 0.35], [150, 300, 1.5, 0.3], [1050, 300, 1.5, 0.3], [600, 300, 1, 0.2],
];

/** The Wain — the seven stars Calypso told him to keep on his left hand. */
const WAIN: Array<[number, number]> = [
  [120, 120], [176, 141], [225, 162], [267, 183], [344, 169], [351, 239], [278, 242],
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: 'linear-gradient(160deg, #0b0522 0%, #05020f 55%, #0b0420 100%)',
          color: '#e5e7eb',
        }}
      >
        <svg
          width="1200"
          height="630"
          viewBox="0 0 1200 630"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {STARS.map(([x, y, r, o], index) => (
            <circle key={index} cx={x} cy={y} r={r} fill="#e5e7eb" opacity={o} />
          ))}
          <polyline
            points={`${WAIN.slice(0, 5)
              .map(([x, y]) => `${x},${y}`)
              .join(' ')} ${WAIN[5][0]},${WAIN[5][1]} ${WAIN[6][0]},${WAIN[6][1]} ${WAIN[3][0]},${WAIN[3][1]}`}
            fill="none"
            stroke="#fcd34d"
            strokeOpacity={0.45}
            strokeWidth={1.5}
          />
          {WAIN.map(([x, y], index) => (
            <circle key={`wain-${index}`} cx={x} cy={y} r={4.5} fill="#fcd34d" opacity={0.9} />
          ))}
        </svg>

        <div
          style={{
            display: 'flex',
            fontSize: 24,
            letterSpacing: 14,
            color: 'rgba(252, 211, 77, 0.75)',
          }}
        >
          ICARUS ATLAS · PRESENTS
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 28,
            fontSize: 104,
            fontWeight: 700,
            letterSpacing: 20,
            color: '#f4f1ff',
          }}
        >
          THE ODYSSEY
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 26,
            fontSize: 30,
            letterSpacing: 6,
            color: 'rgba(229, 231, 235, 0.72)',
          }}
        >
          A VOYAGE HOME, TOLD BY THE STARS
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 40,
            fontSize: 20,
            letterSpacing: 4,
            color: 'rgba(192, 132, 252, 0.8)',
          }}
        >
          THREE MOVEMENTS · TWENTY STATIONS · THE POEM&apos;S OWN WORDS
        </div>
      </div>
    ),
    { ...size },
  );
}
