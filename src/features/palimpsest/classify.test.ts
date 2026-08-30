/** `pnpm test:palimpsest` — the pure classifier, and the two pilot topics read
 *  from the real data files, so the spike proves the model on actual records
 *  rather than on fixtures alone (docs/PALIMPSEST_PLAN.md §13). */

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import type { SourceId } from '@/types/character';
import { canAnnounceSharedTelling, classifyPair, stancesOf } from './classify';
import type { StanceRecord } from './types';

const FLOOD: StanceRecord[] = [
  { sources: ['apollodorus'], stance: 'parnassus' },
  { sources: ['ovid'], stance: 'parnassus' },
  { sources: ['hyginus'], stance: 'etna' },
];

test('a teller absent from the topic is silent, never contradicting', () => {
  const result = classifyPair(FLOOD, 'hesiod', 'apollodorus');
  assert.equal(result.presence, 'secondary-only');
  assert.equal(result.agreement, 'unknown');
  assert.deepEqual(result.primaryStances, []);
});

test('neither teller present is its own state', () => {
  assert.equal(classifyPair(FLOOD, 'hesiod', 'homer').presence, 'neither');
});

test('two tellers on different stances split', () => {
  const result = classifyPair(FLOOD, 'apollodorus', 'hyginus');
  assert.equal(result.presence, 'shared');
  assert.equal(result.agreement, 'split-stance');
  assert.deepEqual(result.outsidePair, [], 'ovid shares the primary stance, so it is not outside');
});

test('agreement inside the pair does not hide a third teller', () => {
  const result = classifyPair(FLOOD, 'apollodorus', 'ovid');
  assert.equal(result.agreement, 'same-stance');
  assert.deepEqual(result.outsidePair, [{ source: 'hyginus', stance: 'etna' }]);
  assert.equal(canAnnounceSharedTelling(result), false, 'must use the qualified form');
});

test('a genuinely uncontested agreement may be announced', () => {
  const uncontested: StanceRecord[] = [
    { sources: ['apollodorus'], stance: 'parnassus' },
    { sources: ['ovid'], stance: 'parnassus' },
  ];
  assert.equal(canAnnounceSharedTelling(classifyPair(uncontested, 'apollodorus', 'ovid')), true);
});

test('one teller may hold several stances at once', () => {
  const fall: StanceRecord[] = [
    { sources: ['homer'], stance: 'cast-by-hera' },
    { sources: ['homer', 'apollodorus'], stance: 'cast-by-zeus' },
  ];
  const result = classifyPair(fall, 'homer', 'apollodorus');
  assert.equal(result.agreement, 'internal-split');
  assert.deepEqual(result.primaryStances, ['cast-by-hera', 'cast-by-zeus']);
  assert.deepEqual(result.secondaryStances, ['cast-by-zeus']);
});

test('three stances are not forced into a binary', () => {
  const three: StanceRecord[] = [
    { sources: ['hesiod'], stance: 'chaos-first' },
    { sources: ['ovid'], stance: 'unformed-mass' },
    { sources: ['hyginus'], stance: 'caligo-first' },
  ];
  const result = classifyPair(three, 'hesiod', 'ovid');
  assert.equal(result.agreement, 'split-stance');
  assert.deepEqual(result.outsidePair, [{ source: 'hyginus', stance: 'caligo-first' }]);
});

test('a legacy topic without stances is present but not comparable', () => {
  const legacy: StanceRecord[] = [{ sources: ['homer'] }, { sources: ['hesiod'] }];
  const result = classifyPair(legacy, 'homer', 'hesiod');
  assert.equal(result.presence, 'shared');
  assert.equal(result.agreement, 'unknown');
});

test('the same teller cannot be both sides of a pair', () => {
  assert.throws(() => classifyPair(FLOOD, 'homer', 'homer'), /two different tellers/);
});

test('stancesOf de-duplicates and keeps first-seen order', () => {
  const records: StanceRecord[] = [
    { sources: ['homer'], stance: 'cast-by-zeus' },
    { sources: ['homer'], stance: 'cast-by-hera' },
    { sources: ['homer'], stance: 'cast-by-zeus' },
  ];
  assert.deepEqual(stancesOf(records, 'homer'), ['cast-by-zeus', 'cast-by-hera']);
});

// --- the pilot topics, read from the data layer itself ----------------------

function recordsForTopic(topic: string): StanceRecord[] {
  const records: StanceRecord[] = [];
  const collect = (entry: { sources: SourceId[]; topic?: string; stance?: string }) => {
    if (entry.topic === topic) records.push({ sources: entry.sources, stance: entry.stance });
  };
  for (const file of readdirSync('data/characters')) {
    const character = JSON.parse(readFileSync(`data/characters/${file}`, 'utf-8'));
    [...character.summary, ...character.story].forEach(collect);
  }
  const relations = JSON.parse(readFileSync('data/relations.json', 'utf-8'));
  (Array.isArray(relations) ? relations : relations.relations).forEach(collect);
  for (const file of readdirSync('data/stories')) {
    JSON.parse(readFileSync(`data/stories/${file}`, 'utf-8')).chapters.forEach(collect);
  }
  return records;
}

test('data: every flood-landing record carries a stance', () => {
  const records = recordsForTopic('flood-landing');
  assert.equal(records.length, 7, 'five character facts and two chapters after the split');
  assert.ok(records.every((record) => record.stance));
});

test('data: flood-landing is agreement for Apollodorus and Ovid, and Hyginus still differs', () => {
  const result = classifyPair(recordsForTopic('flood-landing'), 'apollodorus', 'ovid');
  assert.equal(result.agreement, 'same-stance');
  assert.deepEqual(result.outsidePair, [{ source: 'hyginus', stance: 'etna' }]);
  assert.equal(canAnnounceSharedTelling(result), false);
});

test('data: Homer contradicts himself on the fall of Hephaestus', () => {
  const records = recordsForTopic('hephaestus-fall-from-olympus');
  const result = classifyPair(records, 'homer', 'apollodorus');
  assert.equal(result.agreement, 'internal-split');
  assert.deepEqual(result.primaryStances.sort(), ['cast-by-hera', 'cast-by-zeus']);
  assert.deepEqual(result.secondaryStances, ['cast-by-zeus']);
});

test('data: Hesiod is silent on both pilot topics, and silence is not a stance', () => {
  for (const topic of ['flood-landing', 'hephaestus-fall-from-olympus']) {
    const result = classifyPair(recordsForTopic(topic), 'hesiod', 'apollodorus');
    assert.equal(result.presence, 'secondary-only', topic);
    assert.equal(result.agreement, 'unknown', topic);
  }
});
