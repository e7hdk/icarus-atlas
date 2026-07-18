/** The Proem builder (docs/EPHEMERIS_PLAN.md §6) — a pure function from the
 *  card payload to the staged five-beat telling. Every line traces to
 *  existing sourced data (D12): the invocation is assembled from name +
 *  kinds/epithets/domains, the thread from relation edges, the telling from
 *  the sourced summary (the overlay picks the active lens at render time),
 *  the quarrel from a documented topic's competing variants, the trace from
 *  the Legacy shelf. Thread, quarrel and trace drop out silently when their
 *  data is absent; a proem never grows a sixth beat. */

import type { EphemerisCardPayload, ProemBeat, ProemScript } from '@/types/spotlight';

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** `Of MEDUSA we sing — the Gorgon.` Built from controlled kinds first, then
 *  epithets, then thematic domains — never from invented prose. */
export function invocationLine(payload: EphemerisCardPayload): string {
  const descriptors = [
    ...(payload.kinds ?? []).map((kind) => `the ${capitalize(kind)}`),
    ...(payload.epithets ?? []),
  ];
  const flourish = (descriptors.length > 0 ? descriptors : payload.domains).slice(0, 2);
  return `Of ${payload.name.toUpperCase()} we sing — ${flourish.join(', ')}.`;
}

export function buildProemScript(payload: EphemerisCardPayload): ProemScript {
  const beats: ProemBeat[] = [{ kind: 'invocation', line: invocationLine(payload) }];

  if (payload.bonds.length > 0) {
    beats.push({ kind: 'thread', steps: payload.bonds });
  }
  beats.push({ kind: 'telling', summary: payload.summary });
  if (payload.quarrel && payload.quarrel.variants.length >= 2) {
    beats.push({ kind: 'quarrel', variants: payload.quarrel.variants });
  }
  if (payload.artwork) {
    beats.push({ kind: 'trace', artwork: payload.artwork });
  }

  return {
    characterId: payload.id,
    name: payload.name,
    beats,
    doors: {
      storyId: payload.storyId,
      storyTitle: payload.storyTitle,
      city: payload.city,
    },
  };
}

/** Relation ids that should be lit at a given progress point: the thread
 *  reveals its edges one step at a time, and they stay lit for the rest of
 *  the telling once the thread has passed. */
export function spotlightAt(script: ProemScript, beatIndex: number, step: number): string[] {
  const threadIndex = script.beats.findIndex((beat) => beat.kind === 'thread');
  if (threadIndex === -1 || beatIndex < threadIndex) return [];
  const thread = script.beats[threadIndex];
  if (thread.kind !== 'thread') return [];
  if (beatIndex === threadIndex) {
    return thread.steps.slice(0, step + 1).map((bond) => bond.relationId);
  }
  return thread.steps.map((bond) => bond.relationId);
}
