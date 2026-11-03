/** Lays the real roster out as the River of Myth and draws it flat (time left
 *  → right, lanes top → bottom) as an SVG, so the semantics and the look can be
 *  judged outside the scene (docs/MYTHS_RIVER_PLAN.md). Hover a star, a knot or
 *  a thread for its story or crossing.
 *
 *  Run with: pnpm myth-river:sketch [out.svg]   (default research/myth-river/sketch.svg) */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildChronologyYears } from '../src/features/stories/chronology';
import { loadChronology, loadStories, loadStoryCrossings } from '../src/features/stories/load';
import { buildRiverLayout, type RiverPoint, type RiverStream } from '../src/features/stories/river';
import { SAGA_ACCENT, SAGA_LABEL, SAGA_ORDER } from '../src/features/stories/sagas';

const OUT = process.argv[2] ?? path.join('research', 'myth-river', 'sketch.svg');

/** Pixels along the axis, per lane unit, and the frame around the river. */
const LENGTH = 4200;
const LANE = 7;
const LEFT = 80;
const RIGHT = 300;
const TOP = 140;
const BOTTOM = 70;

async function main() {
  const stories = await loadStories();
  const crossings = await loadStoryCrossings();
  const years = buildChronologyYears(stories, await loadChronology());
  const river = buildRiverLayout(stories, years, crossings);
  const title = new Map(stories.map((s) => [s.id, s.title]));

  const width = LEFT + LENGTH + RIGHT;
  const height = TOP + (river.yMax - river.yMin) * LANE + BOTTOM;
  const X = (t: number) => LEFT + t * LENGTH;
  const Y = (y: number) => TOP + (y - river.yMin) * LANE;
  const f = (n: number) => n.toFixed(1);
  const escape = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /** A ribbon: the centreline offset by half the width on both sides, closed. */
  function ribbon(points: RiverPoint[]): string {
    const left: string[] = [];
    const right: string[] = [];
    points.forEach((p, i) => {
      const a = points[Math.max(0, i - 1)];
      const b = points[Math.min(points.length - 1, i + 1)];
      const dx = X(b.t) - X(a.t);
      const dy = Y(b.y) - Y(a.y);
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const half = (p.width * LANE) / 2;
      left.push(`${f(X(p.t) + nx * half)},${f(Y(p.y) + ny * half)}`);
      right.push(`${f(X(p.t) - nx * half)},${f(Y(p.y) - ny * half)}`);
    });
    return `M${left.join('L')}L${right.reverse().join('L')}Z`;
  }

  /** Splits a stream into runs of water and of trickle. */
  function runs(points: RiverPoint[]): { trickle: boolean; points: RiverPoint[] }[] {
    const out: { trickle: boolean; points: RiverPoint[] }[] = [];
    for (const p of points) {
      const last = out[out.length - 1];
      if (last && last.trickle === p.trickle) last.points.push(p);
      else out.push({ trickle: p.trickle, points: last ? [last.points[last.points.length - 1], p] : [p] });
    }
    return out;
  }

  const svg: string[] = [];
  svg.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${f(height)}" viewBox="0 0 ${width} ${f(height)}">`,
    `<defs>
      <filter id="glow" x="-5%" y="-50%" width="110%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="halo" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="4"/></filter>
      <linearGradient id="source" x1="0" x2="1"><stop offset="0" stop-color="#7c4dff" stop-opacity="0.16"/><stop offset="1" stop-color="#7c4dff" stop-opacity="0"/></linearGradient>
    </defs>`,
    `<rect width="100%" height="100%" fill="#06031a"/>`,
    `<rect x="${LEFT}" y="0" width="${f(LENGTH * 0.12)}" height="${f(height)}" fill="url(#source)"/>`,
  );

  // Labels never overlap: each takes the first free spot among its candidates.
  const placed: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const textWidth = (text: string, size: number, caps = false) => text.length * size * (caps ? 0.78 : 0.47);
  function place(candidates: { x: number; y: number }[], w: number, h: number): { x: number; y: number } {
    for (const c of candidates) {
      const box = { x1: c.x - 2, y1: c.y - h, x2: c.x + w + 2, y2: c.y + 3 };
      if (placed.some((b) => box.x1 < b.x2 && b.x1 < box.x2 && box.y1 < b.y2 && b.y1 < box.y2)) continue;
      placed.push(box);
      return c;
    }
    return candidates[0];
  }

  // Age bands: faint contour lines across the plain, their names in two rows.
  for (const age of river.ages) {
    const label = age.label.toUpperCase();
    const at = place(
      [0, 16, 32].map((dy) => ({ x: X(age.t) + 6, y: TOP - 52 + dy })),
      textWidth(label, 12, true),
      12,
    );
    svg.push(
      `<line x1="${f(X(age.t))}" y1="${f(at.y + 6)}" x2="${f(X(age.t))}" y2="${f(height - BOTTOM + 20)}" stroke="#8b93c9" stroke-opacity="0.13" stroke-dasharray="2 6"/>`,
      `<text x="${f(at.x)}" y="${f(at.y)}" fill="#aab0d8" fill-opacity="0.55" font-family="Cinzel, Georgia, serif" font-size="12" letter-spacing="2">${escape(label)}</text>`,
    );
  }

  // Streams: a blurred glow under each ribbon, the ribbon, then a bright core line.
  const glow: string[] = [];
  const water: string[] = [];
  const cores: string[] = [];
  for (const stream of river.streams) {
    for (const run of runs(stream.points)) {
      if (run.points.length < 2) continue;
      const line = `M${run.points.map((p) => `${f(X(p.t))},${f(Y(p.y))}`).join('L')}`;
      if (run.trickle) {
        water.push(
          `<path d="${line}" fill="none" stroke="${stream.color}" stroke-opacity="0.45" stroke-width="1.2" stroke-dasharray="3 4"/>`,
        );
        continue;
      }
      const shape = ribbon(run.points);
      glow.push(`<path d="${shape}" fill="${stream.color}" fill-opacity="0.35"/>`);
      water.push(`<path d="${shape}" fill="${stream.color}" fill-opacity="0.55"/>`);
      const core = run.points.reduce((w, p) => w + p.width, 0) / run.points.length;
      cores.push(
        `<path d="${line}" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="${f(Math.max(0.6, core * 0.8))}" stroke-linecap="round"/>`,
      );
    }
  }
  svg.push(`<g filter="url(#glow)">${glow.join('')}</g>`, `<g>${water.join('')}</g>`, `<g>${cores.join('')}</g>`);

  // Threads of fate: myths too far apart to touch, tied by a faint arc from one
  // star to the other that bends no stream.
  for (const bridge of river.bridges) {
    const a = river.byId.get(bridge.a);
    const b = river.byId.get(bridge.b);
    if (!a || !b) continue;
    const [x1, y1, x2, y2] = [X(a.t), Y(a.y), X(b.t), Y(b.y)];
    const lift = Math.min(160, Math.abs(x2 - x1) * 0.18);
    const cx = (x1 + x2) / 2;
    const cy = Math.min(y1, y2) - lift;
    svg.push(
      `<path d="M${f(x1)},${f(y1)}Q${f(cx)},${f(cy)} ${f(x2)},${f(y2)}" fill="none" stroke="#fff4c2" stroke-opacity="0.22" stroke-width="1" stroke-dasharray="1 5" stroke-linecap="round"><title>${escape(`${title.get(bridge.a)} ~ ${title.get(bridge.b)}${bridge.place ? ` · ${bridge.place}` : ''} — ${bridge.note}`)}</title></path>`,
    );
  }

  // Confluences: a knot of light where two streams touch or a tributary joins.
  for (const c of river.confluences) {
    svg.push(
      `<circle cx="${f(X(c.t))}" cy="${f(Y(c.y))}" r="${c.kind === 'tributary' ? 7 : 9}" fill="#fff4c2" fill-opacity="0.5" filter="url(#halo)"/>`,
      `<circle cx="${f(X(c.t))}" cy="${f(Y(c.y))}" r="${c.kind === 'tributary' ? 2.4 : 3.2}" fill="#fff4c2"><title>${escape(`${title.get(c.a)} ~ ${title.get(c.b)}${c.place ? ` · ${c.place}` : ''} — ${c.note}`)}</title></circle>`,
    );
  }

  // Stars: the stories on their streams.
  for (const star of river.stars) {
    const stream = river.streams.find((s) => s.id === star.stream)!;
    const r = star.head ? 5.5 : 3;
    svg.push(
      `<circle cx="${f(X(star.t))}" cy="${f(Y(star.y))}" r="${r * 2.2}" fill="${stream.color}" fill-opacity="0.55" filter="url(#halo)"/>`,
      `<circle cx="${f(X(star.t))}" cy="${f(Y(star.y))}" r="${r}" fill="#ffffff"><title>${escape(title.get(star.id) ?? star.id)}</title></circle>`,
    );
  }

  // Labels: every stream carries its head story's title — at its source, and
  // a fork's distributaries as one column at their tips.
  const label = (stream: RiverStream, at: { x: number; y: number }, size: number) =>
    svg.push(
      `<text x="${f(at.x)}" y="${f(at.y)}" fill="${stream.color}" fill-opacity="0.9" font-family="Cormorant Garamond, Georgia, serif" font-size="${size}" font-style="${stream.kind === 'saga' ? 'normal' : 'italic'}">${escape(title.get(stream.id) ?? stream.id)}</text>`,
    );
  const tips = river.streams
    .filter((s) => s.kind === 'distributary')
    .map((s) => ({ stream: s, tip: s.points[s.points.length - 1] }))
    .sort((a, b) => a.tip.y - b.tip.y);
  let column = -Infinity;
  for (const { stream, tip } of tips) {
    const at = { x: X(tip.t) + 6, y: Math.max(Y(tip.y) + 3.5, column + 11.5) };
    column = at.y;
    placed.push({ x1: at.x - 2, y1: at.y - 10.5, x2: at.x + textWidth(title.get(stream.id) ?? '', 10.5) + 2, y2: at.y + 3 });
    label(stream, at, 10.5);
  }
  const bySize = [...river.streams]
    .filter((s) => s.kind !== 'distributary')
    .sort((a, b) => b.stars.length - a.stars.length || a.id.localeCompare(b.id));
  for (const stream of bySize) {
    const size = stream.kind === 'lone' ? 12.5 : 14;
    const w = textWidth(title.get(stream.id) ?? stream.id, size);
    const head = stream.points.find((p) => !p.trickle) ?? stream.points[0];
    const half = head.width * LANE * 0.5;
    const at = place(
      [
        { x: X(head.t) + 8, y: Y(head.y) - half - 7 },
        { x: X(head.t) + 8, y: Y(head.y) + half + size + 4 },
        { x: X(head.t) - w - 10, y: Y(head.y) + size * 0.35 },
        { x: X(head.t) + 8, y: Y(head.y) - half - 7 - size - 2 },
        { x: X(head.t) + 8, y: Y(head.y) + half + 2 * size + 6 },
        { x: X(head.t) + 8, y: Y(head.y) - half - 7 - 2 * (size + 2) },
      ],
      w,
      size,
    );
    label(stream, at, size);
  }

  // Legend.
  SAGA_ORDER.forEach((saga, i) => {
    const y = TOP + i * 22;
    svg.push(
      `<circle cx="${LEFT + LENGTH + 40}" cy="${y}" r="5" fill="${SAGA_ACCENT[saga]}"/>`,
      `<text x="${LEFT + LENGTH + 54}" y="${y + 4}" fill="#c9cbe4" font-family="Cinzel, Georgia, serif" font-size="11" letter-spacing="1.5">${escape(SAGA_LABEL[saga].toUpperCase())}</text>`,
    );
  });
  svg.push(
    `<text x="${LEFT}" y="40" fill="#e9e6ff" font-family="Cinzel, Georgia, serif" font-size="22" letter-spacing="5">THE RIVER OF MYTH</text>`,
    `<text x="${LEFT}" y="64" fill="#aab0d8" font-family="Cormorant Garamond, Georgia, serif" font-size="15" font-style="italic">${river.streams.length} streams · ${river.stars.length} stories · ${river.confluences.length} meetings · ${river.bridges.length} threads of fate · ${river.unmet.length} crossings within one stream</text>`,
    '</svg>',
  );

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, svg.join('\n'));
  console.log(
    `River sketch → ${OUT}\n  ${river.streams.length} streams (${river.streams.filter((s) => s.kind === 'distributary').length} distributaries, ${river.streams.filter((s) => s.kind === 'lone').length} lone) · ${river.stars.length} stars · ${river.confluences.length} confluences · ${river.bridges.length} bridges · ${river.unmet.length} unmet · lanes ${river.yMin.toFixed(1)} → ${river.yMax.toFixed(1)}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
