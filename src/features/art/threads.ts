import { SAGA_ORDER, type SagaId } from '@/features/stories/sagas';
import { TEAR_FROM, TEAR_TO } from './loom';

/** One figure through the cloth (docs/LOOM_PLAN.md §3): its works in the order they
 *  were made, so each step is a stitch between neighbours in time. A thread says the
 *  figure appears in both works, nothing more. */
export interface LoomThread {
  index: number;
  /** Index into the door's figure list. */
  figure: number;
  name: string;
  /** Work indices, oldest first. */
  works: number[];
  /** The saga most of its works belong to; ties go to the earlier saga. */
  saga: SagaId;
  /** Seen on both sides of the tear. */
  crosses: boolean;
}

interface ThreadedWork {
  index: number;
  sortYear: number;
  saga: SagaId;
  figures: number[];
}

/** Every figure seen in two works or more, as a chain in time order. */
export function buildThreads(works: ThreadedWork[], names: string[]): { threads: LoomThread[]; threadsOf: number[][] } {
  const byFigure = new Map<number, number[]>();
  for (const work of works) {
    for (const figure of work.figures) byFigure.set(figure, [...(byFigure.get(figure) ?? []), work.index]);
  }
  const threads: LoomThread[] = [];
  for (const [figure, members] of [...byFigure].sort((a, b) => a[0] - b[0])) {
    if (members.length < 2) continue;
    members.sort((a, b) => works[a].sortYear - works[b].sortYear || a - b);
    const tally = new Map<SagaId, number>();
    for (const member of members) tally.set(works[member].saga, (tally.get(works[member].saga) ?? 0) + 1);
    const [saga] = [...tally].sort((a, b) => b[1] - a[1] || SAGA_ORDER.indexOf(a[0]) - SAGA_ORDER.indexOf(b[0]))[0];
    threads.push({
      index: threads.length,
      figure,
      name: names[figure],
      works: members,
      saga,
      crosses:
        members.some((member) => works[member].sortYear < TEAR_FROM) &&
        members.some((member) => works[member].sortYear >= TEAR_TO),
    });
  }
  const threadsOf = works.map((): number[] => []);
  for (const thread of threads) for (const member of thread.works) threadsOf[member].push(thread.index);
  return { threads, threadsOf };
}
