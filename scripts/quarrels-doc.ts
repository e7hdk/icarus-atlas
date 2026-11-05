/** Writes docs/CONTRADICTIONS.md from data/quarrels.json (docs/LIBRARY_PLAN.md
 *  §4.7). Run with: pnpm quarrels:doc — after any edit to the quarrels. */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { quarrelsFileSchema } from '../src/lib/schemas';
import { QUARRELS_DOC_PATH, QUARRELS_PATH, renderQuarrelsDoc } from './lib/quarrels-doc';

const ROOT = join(import.meta.dirname, '..');
const parsed = quarrelsFileSchema.safeParse(JSON.parse(readFileSync(join(ROOT, QUARRELS_PATH), 'utf8')));
if (!parsed.success) {
  console.error(`${QUARRELS_PATH} does not parse:`);
  for (const issue of parsed.error.issues) console.error(`  ✗ ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}
writeFileSync(join(ROOT, QUARRELS_DOC_PATH), renderQuarrelsDoc(parsed.data));
console.log(`Wrote ${QUARRELS_DOC_PATH} from ${parsed.data.quarrels.length} quarrels.`);
