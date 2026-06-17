/** Precompute the galaxy layout at build time and write it to
 *  data/generated/galaxy-positions.json, so the client never runs the multi-second
 *  `computePositions` solve on page open. The layout is deterministic, so the baked
 *  positions are exact; a content signature guards against staleness (an unchanged
 *  roster skips the bake instantly). Run via `pnpm bake-layout` (also chained into
 *  `pnpm dev` and `pnpm build`). City skies stay runtime — they are tiny. */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { computePositions } from '../src/features/galaxy/layout';
import { layoutSignature } from '../src/features/galaxy/layoutSignature';
import type { Character, Relation } from '../src/types/character';

const DATA = join(import.meta.dirname, '..', 'data');
const OUT_DIR = join(DATA, 'generated');
const OUT = join(OUT_DIR, 'galaxy-positions.json');

const characters = readdirSync(join(DATA, 'characters'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(DATA, 'characters', f), 'utf-8')) as Character)
  .sort((a, b) => a.id.localeCompare(b.id));
const relations = JSON.parse(readFileSync(join(DATA, 'relations.json'), 'utf-8')) as Relation[];

const signature = layoutSignature(characters, relations);

if (existsSync(OUT)) {
  try {
    const prev = JSON.parse(readFileSync(OUT, 'utf-8')) as { signature?: string; count?: number };
    if (prev.signature === signature) {
      console.log(`Galaxy layout already baked & current (${prev.count} stars) — skipping.`);
      process.exit(0);
    }
  } catch {
    // fall through and rebake
  }
}

const t0 = performance.now();
const positions = computePositions(characters, relations);
const ms = Math.round(performance.now() - t0);

const out = {
  signature,
  count: positions.size,
  positions: Object.fromEntries(positions),
};
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify(out));
console.log(`Baked ${positions.size} galaxy positions in ${ms}ms → data/generated/galaxy-positions.json`);
