'use client';

import { atticDateFor } from '@/features/spotlight/attic';
import { useEphemerisStore } from '@/features/spotlight/store';
import { ATTIC_MONTHS, type AtticMonth } from '@/types/spotlight';

export interface WheelFeast {
  id: string;
  name: string;
  month: AtticMonth;
  /** Opening day within the month; null = month-known-only (drawn mid-month). */
  day: number | null;
}

const C = 240;
const R_OUT = 190;
const R_IN = 156;
const R_STAR = (R_OUT + R_IN) / 2;
const R_LABEL = 214;

/** Point on the wheel: Hekatombaion opens at twelve o'clock, the year runs
 *  clockwise, one month = 30°. `frac` is months-from-new-year. */
function pt(radius: number, frac: number): [number, number] {
  const rad = ((frac * 30 - 90) * Math.PI) / 180;
  return [C + radius * Math.cos(rad), C + radius * Math.sin(rad)];
}

function fracOf(month: AtticMonth, day: number | null): number {
  return ATTIC_MONTHS.indexOf(month) + ((day ?? 15.5) - 0.5) / 30;
}

/** The wheel — the Heortologion's instrument, not its decoration. Twelve
 *  Attic months as a ring, every feast a gold star on its opening day, today
 *  a violet needle. Selecting a star (or a month name) swings the alidade —
 *  the astrolabe's sighting rule — onto it and the plaque below retells it.
 *  Pure SVG; client-only for the needle and the selection. */
export function FestivalWheel({
  feasts,
  selectedId,
  onSelect,
}: {
  feasts: WheelFeast[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const data = useEphemerisStore((s) => s.data);
  const pick = useEphemerisStore((s) => s.pick);

  const atticToday = data && pick ? atticDateFor(data.attic, pick.isoDate) : null;
  // The intercalary month shares Poseideon's seat on the wheel.
  const todayMonth: AtticMonth | null = atticToday
    ? atticToday.month === 'poseideon-ii'
      ? 'poseideon'
      : atticToday.month
    : null;
  const todayFrac = atticToday && todayMonth ? fracOf(todayMonth, atticToday.day) : null;

  const selected = feasts.find((feast) => feast.id === selectedId) ?? null;
  const monthsWithFeasts = new Set(feasts.map((feast) => feast.month));

  return (
    <svg
      viewBox="0 0 480 480"
      role="img"
      aria-label="The Attic festival year as a wheel"
      className="mx-auto block w-full max-w-[28rem]"
    >
      {/* Ring */}
      <circle cx={C} cy={C} r={R_OUT} fill="none" stroke="var(--color-glass-border)" />
      <circle cx={C} cy={C} r={R_IN} fill="none" stroke="var(--color-glass-border)" />
      {ATTIC_MONTHS.map((month, index) => {
        const [x1, y1] = pt(R_IN, index);
        const [x2, y2] = pt(R_OUT, index);
        return (
          <line
            key={`tick-${month}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--color-glass-border)"
          />
        );
      })}

      {/* Month names — feastless months sit dim and silent */}
      {ATTIC_MONTHS.map((month, index) => {
        const [x, y] = pt(R_LABEL, index + 0.5);
        const held = monthsWithFeasts.has(month);
        const first = held ? feasts.find((feast) => feast.month === month) : undefined;
        return (
          <text
            key={`label-${month}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            onClick={first ? () => onSelect(first.id) : undefined}
            className={
              held
                ? 'cursor-pointer fill-aether-muted font-display transition-colors hover:fill-aether'
                : 'fill-aether-faint/60 font-display'
            }
            style={{ fontSize: 8.5, letterSpacing: '0.14em' }}
          >
            {month.toUpperCase()}
          </text>
        );
      })}

      {/* The alidade — the sighting rule, swinging onto the chosen feast */}
      {selected && (
        <g
          aria-hidden
          style={{
            transformBox: 'view-box',
            transformOrigin: '50% 50%',
            transform: `rotate(${fracOf(selected.month, selected.day) * 30}deg)`,
            transition: 'transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          <line
            x1={C}
            y1={C - 30}
            x2={C}
            y2={C - (R_STAR - 14)}
            stroke="var(--color-star-olympian)"
            strokeWidth={1}
            opacity={0.75}
          />
          <rect
            x={C - 2.6}
            y={C - (R_STAR - 14) - 2.6}
            width={5.2}
            height={5.2}
            fill="var(--color-star-olympian)"
            opacity={0.9}
            style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: 'rotate(45deg)' }}
          />
        </g>
      )}

      {/* Today — a quiet violet needle across the ring */}
      {todayFrac !== null && (
        <g aria-hidden style={{ color: 'var(--color-nebula-soft)' }}>
          {(() => {
            const [x1, y1] = pt(R_IN - 9, todayFrac);
            const [x2, y2] = pt(R_OUT + 7, todayFrac);
            const [dx, dy] = pt(R_OUT + 12, todayFrac);
            return (
              <>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth={1} />
                <circle cx={dx} cy={dy} r={2.2} fill="currentColor" />
              </>
            );
          })()}
        </g>
      )}

      {/* Feasts — gold stars on their opening days */}
      {feasts.map((feast) => {
        const isSelected = feast.id === selectedId;
        const [x, y] = pt(R_STAR, fracOf(feast.month, feast.day));
        return (
          <g key={feast.id}>
            {isSelected && (
              <circle
                cx={x}
                cy={y}
                r={10}
                fill="none"
                stroke="var(--color-star-olympian)"
                strokeWidth={0.8}
                opacity={0.6}
                className="motion-safe:animate-ping"
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              />
            )}
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              onClick={() => onSelect(feast.id)}
              className="cursor-pointer transition-opacity hover:opacity-75"
              style={{
                fontSize: isSelected ? 17 : 12,
                fill: 'var(--color-star-olympian)',
                opacity: selectedId && !isSelected ? 0.62 : 1,
                filter: isSelected
                  ? 'drop-shadow(0 0 7px rgba(252, 211, 77, 0.85))'
                  : 'drop-shadow(0 0 4px rgba(252, 211, 77, 0.45))',
                transition: 'font-size 300ms ease, opacity 300ms ease, filter 300ms ease',
              }}
            >
              <title>{feast.name}</title>★
            </text>
          </g>
        );
      })}

      {/* Center — today's reconstructed date */}
      <text
        x={C}
        y={C - 7}
        textAnchor="middle"
        className="fill-aether font-display"
        style={{ fontSize: 15, letterSpacing: '0.12em' }}
      >
        {atticToday ? atticToday.label.toUpperCase() : 'THE ATTIC YEAR'}
      </text>
      <text
        x={C}
        y={C + 14}
        textAnchor="middle"
        className="fill-aether-faint font-display"
        style={{ fontSize: 7.5, letterSpacing: '0.26em' }}
      >
        RECONSTRUCTED
      </text>
    </svg>
  );
}
