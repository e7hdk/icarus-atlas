/** Lays the catalogue out as the Loom and draws it flat as an SVG, saga colours
 *  and no images, so the bands, the anchors and the tear can be judged outside the
 *  scene (docs/LOOM_PLAN.md §5). Hover a tile for its work.
 *
 *  Run with: pnpm loom:sketch   (writes research/loom/sketch-<width>.svg) */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildLoomLayout, LOOM_WIDTH } from '../src/features/art/loom';
import { SAGA_ACCENT, SAGA_LABEL, SAGA_ORDER } from '../src/features/stories/sagas';
import type { ArtCatalogue } from '../src/types/art';
import { ART_CATALOGUE_PATH } from './lib/art-sources';

const OUT_DIR = join('research', 'loom');
const CELL = 14;
const LEFT = 120;
const TOP = 56;
const RIGHT = 150;

const { works } = JSON.parse(readFileSync(ART_CATALOGUE_PATH, 'utf-8')) as ArtCatalogue;
const byId = new Map(works.map((work) => [work.id, work]));
const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

mkdirSync(OUT_DIR, { recursive: true });
for (const width of Object.values(LOOM_WIDTH)) {
  const layout = buildLoomLayout(works, width);
  const totalWidth = LEFT + width * CELL + RIGHT;
  const totalHeight = TOP + layout.height * CELL + 40;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" font-family="Georgia, serif">`,
    `<rect width="100%" height="100%" fill="#08041d"/>`,
    `<text x="${LEFT}" y="30" font-size="16" fill="#f1f5f9">The Loom: ${works.length} works, ${width} wide, ${layout.height} rows</text>`,
    `<rect x="${LEFT}" y="${TOP + layout.tearTop * CELL}" width="${width * CELL}" height="${layout.tearRows * CELL}" fill="#fcd34d" fill-opacity=".12"/>`,
  ];
  for (const tile of layout.tiles) {
    const work = byId.get(tile.id)!;
    const anchor = tile.w > 1;
    parts.push(
      `<rect x="${LEFT + tile.x * CELL + 0.5}" y="${TOP + tile.row * CELL + 0.5}" width="${tile.w * CELL - 1}" height="${tile.h * CELL - 1}" fill="${SAGA_ACCENT[work.saga]}" fill-opacity="${anchor ? 1 : 0.72}"${anchor ? ' stroke="#fff" stroke-width="1.5"' : ''}><title>${escape(`${work.title} / ${work.artist}, ${work.year}`)}</title></rect>`,
    );
  }
  for (const era of layout.eras) {
    const y = TOP + era.row * CELL;
    parts.push(
      `<line x1="${LEFT - 8}" x2="${LEFT + width * CELL}" y1="${y}" y2="${y}" stroke="#fff" stroke-opacity=".25"/>`,
      `<text x="${LEFT - 14}" y="${y + 4}" font-size="11" fill="#aab4c8" text-anchor="end">${escape(era.label)}</text>`,
    );
  }
  SAGA_ORDER.forEach((saga, index) => {
    const x = LEFT + width * CELL + 18;
    const y = TOP + 8 + index * 18;
    parts.push(
      `<rect x="${x}" y="${y - 9}" width="10" height="10" fill="${SAGA_ACCENT[saga]}"/>`,
      `<text x="${x + 16}" y="${y}" font-size="11" fill="#aab4c8">${escape(SAGA_LABEL[saga])}</text>`,
    );
  });
  parts.push('</svg>');
  const out = join(OUT_DIR, `sketch-${width}.svg`);
  writeFileSync(out, parts.join('\n'));
  console.log(`Wrote ${out}`);
}
