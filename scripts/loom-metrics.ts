/** Reports the Loom's catalogue (docs/LOOM_PLAN.md).
 *  Usage: pnpm loom:metrics            the summary
 *         pnpm loom:metrics --review   also list the works whose medium needs an eye
 *         pnpm loom:metrics --json     the numbers, for tooling */

import { readFileSync } from 'node:fs';
import { SAGA_ORDER } from '../src/features/stories/sagas';
import type { ArtCatalogue } from '../src/types/art';
import { ART_CATALOGUE_PATH } from './lib/art-sources';
import { measureCatalogue } from './lib/loom-metrics';

const { works } = JSON.parse(readFileSync(ART_CATALOGUE_PATH, 'utf-8')) as ArtCatalogue;
const metrics = measureCatalogue(works);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(metrics, null, 2));
  process.exit(0);
}

const line = (label: string, value: unknown) =>
  console.log(`${label.padEnd(26)}${typeof value === 'object' ? JSON.stringify(value) : value}`);

line('Works', metrics.works);
line('Media', metrics.media);
line('Medium settled by', metrics.mediumVia);
line('Licenses', metrics.licenses);
line('Sagas', metrics.sagas);
line('Saga settled by', metrics.sagaVia);
line('Other tales', `${metrics.catchAllPercent}%`);
line('Figure links by', metrics.figureVia);
line('Figures per work', `median ${metrics.figuresPerWork}, ${metrics.worksWithoutFigure} works with none`);
line('Threads', `${metrics.threads}, ${metrics.stitches} stitches`);
line('Largest connected set', `${metrics.largestSet} works (${metrics.largestSetPercent}%), ${metrics.connectedSets} sets`);
line('Longest threads', metrics.longestThreads.map((thread) => `${thread.id} ${thread.works}`).join(', '));
line('Figures across the tear', metrics.figuresCrossingTear);

console.log('\nShare of each age, percent:');
const shown = SAGA_ORDER;
console.log(`${''.padEnd(16)}${'works'.padStart(6)}${shown.map((saga) => saga.slice(0, 6).padStart(7)).join('')}`);
for (const band of metrics.shares) {
  console.log(
    `${band.label.padEnd(16)}${String(band.works).padStart(6)}${shown.map((saga) => band.percent[saga].toFixed(1).padStart(7)).join('')}`,
  );
}

if (process.argv.includes('--review')) {
  for (const via of ['disputed', 'default'] as const) {
    const list = works.filter((work) => work.mediumVia === via);
    console.log(`\nMedium ${via}: ${list.length}`);
    for (const work of list) {
      console.log(`  ${work.medium.padEnd(9)}${String(work.sortYear).padStart(6)}  ${work.title} / ${work.artist}`);
    }
  }
}
