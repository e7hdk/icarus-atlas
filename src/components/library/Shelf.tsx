'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent as ReactMouseEvent } from 'react';
import type { WorkStats } from '@/features/library/shelf';
import type { SagaId } from '@/features/stories/sagas';
import type { SourceId } from '@/types/character';

/** The Shelf (docs/LIBRARY_PLAN.md §5): time runs left to right, each spine one
 *  work, as tall as the work is long, gilt as high as the atlas cites it; the
 *  sagas run beneath as threads, knotted at the works that tell them. Between
 *  Hesiod and Apollonius the shelf is empty, and says so. Drawn the same on the
 *  server and the client; hovering lights a work, a teller or a saga. */

export interface ShelfWork {
  id: string;
  title: string;
  spine: string;
  greekTitle?: string;
  teller: SourceId;
  tellerName: string;
  from: number;
  to: number;
  label: string;
  credit: string;
  href: string;
  stats: WorkStats;
}

export interface ShelfSaga {
  id: SagaId;
  label: string;
  color: string;
}

const W = 1320;
const H = 600;
const X0 = 210;
const X1 = 1300;
const PLANK = 300;
const AXIS = 350;
const LANE0 = 404;
const LANEH = 14.2;
const GAP = 46;
const SW = 36;
const X = (year: number) => X0 + ((year + 800) / 1000) * (X1 - X0);

interface Placed extends ShelfWork {
  x: number;
  h: number;
}

/** Each spine as near its date as the others allow: neighbours that would touch
 *  close up into a row centred on their dates. */
function place(works: ShelfWork[]): Placed[] {
  const most = Math.max(1, ...works.map((work) => work.stats.words));
  const items = works.map((work, index) => ({ ...work, index, want: X((work.from + work.to) / 2), x: 0, h: 70 + 200 * Math.sqrt(work.stats.words / most) }));
  const clusters = items.map((item) => ({ members: [item], centre: item.want }));
  for (let merged = true; merged; ) {
    merged = false;
    clusters.sort((a, b) => a.centre - b.centre);
    for (let k = 0; k < clusters.length - 1; k++) {
      const a = clusters[k];
      const b = clusters[k + 1];
      if (a.centre + (a.members.length * GAP) / 2 <= b.centre - (b.members.length * GAP) / 2) continue;
      const members = a.members.concat(b.members);
      clusters.splice(k, 2, { members, centre: members.reduce((sum, member) => sum + member.want, 0) / members.length });
      merged = true;
      break;
    }
  }
  for (const cluster of clusters) {
    const width = cluster.members.length * GAP;
    const start = Math.min(cluster.centre - width / 2, X1 - width);
    cluster.members.sort((a, b) => a.want - b.want || a.index - b.index).forEach((member, j) => {
      member.x = start + GAP / 2 + j * GAP;
    });
  }
  return items;
}

/** The spines rise once a session, when the Shelf mounts in the browser — entering
 *  by the door. Hydrating a page loaded whole, they already stand, and stay so. */
const RISEN = 'library-shelf-risen';
const noSubscription = () => () => {};
const notRisenYet = () => {
  try {
    return !window.sessionStorage.getItem(RISEN);
  } catch {
    return false;
  }
};

type Focus = { kind: 'work'; id: string } | { kind: 'teller'; id: SourceId } | { kind: 'saga'; id: SagaId } | null;

const fmt = (n: number) => n.toLocaleString('en-US');
const lengthLabel = (stats: WorkStats) => (stats.lines ? `${fmt(stats.lines)} lines` : `≈ ${fmt(Math.round(stats.words / 100) * 100)} words`);

export function Shelf({ works, sagas, tellerHref }: { works: ShelfWork[]; sagas: ShelfSaga[]; tellerHref: Record<string, string> }) {
  const [focus, setFocus] = useState<Focus>(null);
  const fresh = useSyncExternalStore(noSubscription, notRisenYet, () => false);
  const [rise] = useState(fresh);
  useEffect(() => {
    try {
      window.sessionStorage.setItem(RISEN, '1');
    } catch {
      // no storage: the spines simply rise again next time
    }
  }, []);
  const [tip, setTip] = useState<{ x: number; y: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const items = place(works);
  const byId = new Map(items.map((item) => [item.id, item]));

  // the empty shelf: between the last early spine and the first later one
  const early = items.filter((item) => item.to < -500);
  const later = items.filter((item) => item.from > -500);
  const emptyLeft = Math.max(...early.map((item) => item.x)) + SW / 2 + 34;
  const emptyRight = Math.min(...later.map((item) => item.x)) - SW / 2 - 34;
  const ghostHeights = [118, 152, 96, 170, 132, 104, 160, 122, 140, 92, 148];
  const ghosts = Math.floor((emptyRight - emptyLeft) / 40);
  const side = (x: number) => (x < emptyLeft ? 0 : x > emptyRight ? 2 : 1);

  const lit = (id: string) => {
    if (!focus) return true;
    if (focus.kind === 'work') return focus.id === id;
    if (focus.kind === 'teller') return byId.get(id)?.teller === focus.id;
    return Boolean(byId.get(id)?.stats.sagas[focus.id]);
  };
  const laneLit = (saga: SagaId) => {
    if (!focus) return true;
    if (focus.kind === 'saga') return focus.id === saga;
    if (focus.kind === 'work') return Boolean(byId.get(focus.id)?.stats.sagas[saga]);
    return items.some((item) => item.teller === focus.id && item.stats.sagas[saga]);
  };
  const follow = (event: ReactMouseEvent) => {
    const box = wrapRef.current?.getBoundingClientRect();
    if (box) setTip({ x: event.clientX - box.left, y: event.clientY - box.top, width: box.width });
  };
  const clear = () => {
    setFocus(null);
    setTip(null);
  };

  // teller names above their spines; a name that would touch its neighbour climbs a row
  const names: { teller: SourceId; name: string; x: number; y: number; top: number }[] = [];
  for (const teller of [...new Set(items.map((item) => item.teller))]) {
    const mine = items.filter((item) => item.teller === teller);
    const x = mine.reduce((sum, item) => sum + item.x, 0) / mine.length;
    const top = Math.min(...mine.map((item) => PLANK - item.h));
    const name = mine[0].tellerName;
    const half = (name.length * 11.4) / 2 + 6;
    let y = top - 14;
    while (names.some((other) => Math.abs(other.y - y) < 16 && Math.abs(other.x - x) < half + (other.name.length * 11.4) / 2 + 6)) y -= 18;
    names.push({ teller, name, x, y, top });
  }

  const card = focus?.kind === 'work' ? byId.get(focus.id) : undefined;
  const cardRight = card && card.x + SW / 2 + 16 + 340 > W;
  const saga = focus?.kind === 'saga' ? sagas.find((candidate) => candidate.id === focus.id) : undefined;
  const sagaWorks = saga ? items.filter((item) => item.stats.sagas[saga.id]).sort((a, b) => a.x - b.x) : [];

  return (
    <div ref={wrapRef} className={`relative ${rise ? 'shelf-rising' : ''}`} onMouseLeave={clear}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img" aria-label={`The ${works.length} works of the Library on a time line, with the sagas they tell`}>
        <defs>
          <linearGradient id="shelf-spine" x1="0" x2="1">
            <stop offset="0" stopColor="#1d1245" />
            <stop offset=".5" stopColor="#2a1a5e" />
            <stop offset="1" stopColor="#170e3a" />
          </linearGradient>
          <linearGradient id="shelf-gilt" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="rgba(252,211,77,.02)" />
            <stop offset=".85" stopColor="rgba(252,211,77,.09)" />
            <stop offset="1" stopColor="rgba(252,211,77,.16)" />
          </linearGradient>
          <linearGradient id="shelf-plank" x1="0" x2="1">
            <stop offset="0" stopColor="rgba(252,211,77,0)" />
            <stop offset=".06" stopColor="rgba(252,211,77,.55)" />
            <stop offset=".94" stopColor="rgba(252,211,77,.55)" />
            <stop offset="1" stopColor="rgba(252,211,77,0)" />
          </linearGradient>
          <filter id="shelf-soft" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* the empty shelf */}
        <g opacity={0.9}>
          {Array.from({ length: ghosts }, (_, k) => {
            const x = emptyLeft + 20 + k * ((emptyRight - emptyLeft - 40) / Math.max(1, ghosts - 1));
            const h = ghostHeights[k % ghostHeights.length];
            return <rect key={k} x={x - 15} y={PLANK - h} width={30} height={h} rx={3} fill="none" stroke="rgba(255,255,255,.10)" strokeDasharray="3 5" />;
          })}
        </g>

        {/* the plank and the time rule */}
        <rect x={X0 - 40} y={PLANK} width={X1 - X0 + 60} height={1.6} fill="url(#shelf-plank)" />
        <rect x={X0 - 40} y={PLANK + 1.6} width={X1 - X0 + 60} height={18} fill="rgba(20,12,48,.55)" />
        <line x1={X0} x2={X1} y1={AXIS} y2={AXIS} stroke="rgba(255,255,255,.16)" />
        {Array.from({ length: 11 }, (_, k) => -800 + k * 100).map((year) => (
          <g key={year}>
            <line x1={X(year)} x2={X(year)} y1={AXIS - 4} y2={AXIS + 4} stroke="rgba(255,255,255,.25)" />
            <text x={X(year)} y={AXIS + 18} textAnchor="middle" fill="rgba(170,180,200,.6)" fontSize={9} letterSpacing={1.6} style={{ fontFamily: 'var(--font-display)' }}>
              {year < 0 ? `${-year} BC` : year === 0 ? 'BC · AD' : `AD ${year}`}
            </text>
          </g>
        ))}

        {/* the sagas as threads */}
        {sagas.map((entry, k) => {
          const y = LANE0 + k * LANEH;
          const knots = items.filter((item) => item.stats.sagas[entry.id]).sort((a, b) => a.x - b.x);
          return (
            <g
              key={entry.id}
              className="shelf-fade"
              opacity={laneLit(entry.id) ? 1 : 0.22}
              onMouseEnter={(event) => {
                setFocus({ kind: 'saga', id: entry.id });
                follow(event);
              }}
              onMouseMove={follow}
            >
              <rect x={X0 - 190} y={y - LANEH / 2} width={X1 - X0 + 200} height={LANEH} fill="transparent" />
              <text x={X0 - 22} y={y + 4} textAnchor="end" fill={entry.color} fillOpacity={0.85} fontSize={13.5} fontStyle="italic" style={{ fontFamily: 'var(--font-body)' }}>
                {entry.label}
              </text>
              {knots.slice(1).map((item, j) => {
                const before = knots[j];
                const across = side(before.x) !== side(item.x);
                return (
                  <line
                    key={item.id}
                    x1={before.x}
                    x2={item.x}
                    y1={y}
                    y2={y}
                    stroke={entry.color}
                    strokeOpacity={across ? 0.22 : 0.55}
                    strokeWidth={across ? 1 : 1.4}
                    strokeDasharray={across ? '2 5' : undefined}
                  />
                );
              })}
              {knots.map((item) => (
                <circle key={item.id} cx={item.x} cy={y} r={2.3 + 0.95 * Math.sqrt(item.stats.sagas[entry.id] ?? 0)} fill={entry.color} fillOpacity={0.92} filter="url(#shelf-soft)" />
              ))}
            </g>
          );
        })}
        {items.map((item) => (
          <line key={item.id} x1={item.x} x2={item.x} y1={AXIS + 26} y2={LANE0 + (sagas.length - 1) * LANEH + 6} stroke="rgba(255,255,255,.045)" pointerEvents="none" />
        ))}

        {/* leaders down to each work's dates */}
        {items.map((item) => {
          const mid = X((item.from + item.to) / 2);
          return (
            <g key={item.id} className="shelf-fade" opacity={lit(item.id) ? 1 : 0.22} pointerEvents="none">
              <path d={`M${item.x} ${PLANK + 22} C ${item.x} ${PLANK + 36}, ${mid} ${AXIS - 22}, ${mid} ${AXIS - 5}`} fill="none" stroke="rgba(255,255,255,.2)" />
              <line x1={X(item.from)} x2={X(item.to)} y1={AXIS} y2={AXIS} stroke="rgba(252,211,77,.75)" strokeWidth={2.2} strokeLinecap="round" />
              <circle cx={mid} cy={AXIS} r={2.4} fill="#fcd34d" />
            </g>
          );
        })}

        {/* the spines */}
        {[...items]
          .sort((a, b) => a.from + a.to - (b.from + b.to))
          .map((item, order) => {
            const left = item.x - SW / 2;
            const top = PLANK - item.h;
            const gilt = item.h * item.stats.cited;
            const small = item.h < 120;
            const hot = focus?.kind === 'work' && focus.id === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                aria-label={`${item.title}, ${item.tellerName}`}
                className="shelf-spine shelf-fade"
                style={{ animationDelay: `${order * 70}ms`, opacity: lit(item.id) ? 1 : 0.22 }}
                onMouseEnter={() => setFocus({ kind: 'work', id: item.id })}
                onFocus={() => setFocus({ kind: 'work', id: item.id })}
                onBlur={clear}
              >
                <rect x={left} y={top} width={SW} height={item.h} rx={3} fill="url(#shelf-spine)" stroke={hot ? 'rgba(252,211,77,.9)' : 'rgba(252,211,77,.38)'} strokeWidth={1} />
                <rect x={left + 1} y={PLANK - gilt} width={SW - 2} height={gilt} rx={2} fill="url(#shelf-gilt)" />
                <line x1={left + 1.5} x2={left + SW - 1.5} y1={PLANK - gilt} y2={PLANK - gilt} stroke="#fcd34d" strokeWidth={1.6} filter="url(#shelf-soft)" />
                <rect x={left + 4} y={top + 6} width={SW - 8} height={1.2} fill="rgba(252,211,77,.55)" />
                <rect x={left + 4} y={top + 9} width={SW - 8} height={0.8} fill="rgba(252,211,77,.35)" />
                <text
                  transform={`translate(${item.x + 3.8} ${PLANK - 12}) rotate(-90)`}
                  fill="rgba(241,245,249,.92)"
                  fontSize={small ? 9.6 : 10.6}
                  letterSpacing={small ? 1.2 : 2.1}
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {item.spine}
                </text>
              </a>
            );
          })}
        {items.map((item) => (
          <text key={item.id} className="shelf-fade" opacity={lit(item.id) ? 0.9 : 0.22} x={item.x} y={PLANK + 14} textAnchor="middle" fill="#c084fc" fontSize={12} pointerEvents="none" style={{ fontFamily: 'var(--font-body)' }}>
            ⚖ {item.stats.quarrels}
          </text>
        ))}

        {/* the tellers */}
        {names.map((entry) => (
          <a key={entry.teller} href={tellerHref[entry.teller]} onMouseEnter={() => setFocus({ kind: 'teller', id: entry.teller })} onFocus={() => setFocus({ kind: 'teller', id: entry.teller })} onBlur={clear}>
            {entry.y < entry.top - 20 && <line x1={entry.x} x2={entry.x} y1={entry.y + 5} y2={entry.top - 6} stroke="rgba(252,211,77,.28)" />}
            <text x={entry.x} y={entry.y} textAnchor="middle" fill="#fde68a" fillOpacity={0.88} fontSize={11.5} letterSpacing={2.6} style={{ fontFamily: 'var(--font-display)' }}>
              {entry.name.toUpperCase()}
            </text>
          </a>
        ))}
      </svg>

      <div className="pointer-events-none absolute text-center" style={{ left: `${(((emptyLeft + emptyRight) / 2) / W) * 100}%`, width: `${((emptyRight - emptyLeft - 40) / W) * 100}%`, top: `calc(${(36 / H) * 100}% + 38px)`, transform: 'translateX(-50%)' }}>
        <h4 className="font-display text-[10.5px] tracking-[0.34em] text-star-olympian/60">THE EMPTY SHELF</h4>
        <p className="mt-2 font-body text-[14.5px] italic leading-relaxed text-aether-faint">
          No teller of ours between Hesiod and Apollonius. The lyric poets and the tragedians reach the atlas only inside the later handbooks: Apollodorus gives Euripides&apos; versions by name <span className="not-italic text-aether-muted">(Bibl. 2.1.4, 3.6.8, 3.7.7, 3.9.2)</span>.
        </p>
      </div>

      {card && (
        <div
          className="absolute z-10 w-[330px] rounded border border-star-olympian/30 bg-[rgba(14,8,38,0.94)] px-5 pb-4 pt-[18px] shadow-[0_24px_60px_rgba(5,2,15,0.6)] backdrop-blur-xl"
          style={{
            left: cardRight ? undefined : `${((card.x + SW / 2 + 16) / W) * 100}%`,
            right: cardRight ? `${((W - (card.x - SW / 2 - 16)) / W) * 100}%` : undefined,
            top: `${(Math.max(20, PLANK - card.h - 30) / H) * 100}%`,
          }}
        >
          <p className="font-display text-[9.5px] uppercase tracking-[0.28em] text-aether-faint">
            {card.tellerName} · {card.label}
          </p>
          <h3 className="mt-1.5 font-display text-[21px] tracking-[0.08em] text-aether">
            {card.title}
            {card.greekTitle && <span className="ml-2 font-greek text-[16px] italic tracking-normal text-star-olympian/70">{card.greekTitle}</span>}
          </h3>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <i className="block h-full bg-gradient-to-r from-star-olympian/35 to-star-olympian shadow-[0_0_10px_rgba(252,211,77,0.5)]" style={{ width: `${(card.stats.cited * 100).toFixed(0)}%` }} />
          </div>
          <p className="mt-1.5 font-body text-[13.5px] italic text-aether-muted">
            {(card.stats.cited * 100).toFixed(0)}% of it cited by some fact of the atlas · {lengthLabel(card.stats)}
          </p>
          <dl className="mt-3.5 grid grid-cols-3 gap-x-2 gap-y-2.5">
            {(
              [
                ['CITATIONS', fmt(card.stats.citations)],
                ['FIGURES', fmt(card.stats.figures)],
                ['STORIES', fmt(card.stats.stories)],
                ['QUARRELS', `⚖ ${card.stats.quarrels}`],
                ['SAGAS', String(Object.keys(card.stats.sagas).length)],
                [card.stats.lines ? 'LINES' : 'WORDS', card.stats.lines ? fmt(card.stats.lines) : `≈ ${fmt(Math.round(card.stats.words / 1000))}k`],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="font-display text-[8.5px] tracking-[0.2em] text-aether-faint">{label}</dt>
                <dd className="font-body text-[19px] font-medium text-aether">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 font-body text-[13.5px] italic leading-snug text-aether-faint">{card.credit}</p>
          <a href={card.href} className="mt-3 inline-block font-display text-[10px] tracking-[0.22em] text-star-olympian hover:underline">
            OPEN THE {card.title.toUpperCase()} →
          </a>
        </div>
      )}

      {saga && tip && (
        <div className="pointer-events-none absolute z-10 max-w-[380px] rounded-md border border-glass-border bg-[rgba(14,8,38,0.94)] px-3.5 py-2.5 font-body text-[14.5px] text-aether-muted" style={{ left: tip.x + 396 > tip.width ? tip.x - 396 : tip.x + 16, top: tip.y - 70 }}>
          <b className="font-display text-[10px] font-normal tracking-[0.2em]" style={{ color: saga.color }}>
            {saga.label.toUpperCase()}
          </b>
          <br />
          {sagaWorks.map((item, index) => (
            <span key={item.id}>
              {index > 0 && ' · '}
              <span className="text-aether">{item.title}</span> {item.stats.sagas[saga.id]}
            </span>
          ))}
          <br />
          <i className="text-[13px] text-aether-faint">stories told in each work</i>
        </div>
      )}
    </div>
  );
}
