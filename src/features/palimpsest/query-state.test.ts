/** URL round-trips for the compare pair (docs/PALIMPSEST_PLAN.md §8.5). */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCompareQuery, serializeCompareQuery } from './query-state';

test('a shared link reproduces the pair and the focused topic', () => {
  assert.deepEqual(parseCompareQuery('?lens=hesiod&compare=homer&topic=aphrodite-parentage'), {
    lens: 'hesiod',
    compareWith: 'homer',
    focusedTopic: 'aphrodite-parentage',
  });
});

test('a second teller without a first one is meaningless and is dropped', () => {
  assert.equal(parseCompareQuery('?compare=homer').compareWith, null);
});

test('consensus is never a side of a comparison', () => {
  assert.equal(parseCompareQuery('?lens=consensus&compare=homer').compareWith, null);
  assert.equal(parseCompareQuery('?lens=homer&compare=consensus').compareWith, null);
});

test('a teller is not compared with itself', () => {
  assert.equal(parseCompareQuery('?lens=homer&compare=homer').compareWith, null);
});

test('unknown tellers and malformed topics fail closed', () => {
  const result = parseCompareQuery('?lens=euripides&compare=pindar&topic=Not%20Kebab');
  assert.deepEqual(result, { lens: null, compareWith: null, focusedTopic: null });
});

test('ordinary consensus browsing writes no query at all', () => {
  assert.equal(
    serializeCompareQuery({ lens: 'consensus', compareWith: null, focusedTopic: null }),
    '',
  );
});

test('a single lens is shareable on its own', () => {
  assert.equal(
    serializeCompareQuery({ lens: 'homer', compareWith: null, focusedTopic: null }),
    'lens=homer',
  );
});

test('unrelated params survive serialization', () => {
  const query = serializeCompareQuery(
    { lens: 'hesiod', compareWith: 'homer', focusedTopic: null },
    '?fly=aphrodite',
  );
  const params = new URLSearchParams(query);
  assert.equal(params.get('fly'), 'aphrodite');
  assert.equal(params.get('compare'), 'homer');
});

test('leaving compare mode strips the param instead of leaving a stale one', () => {
  const query = serializeCompareQuery(
    { lens: 'hesiod', compareWith: null, focusedTopic: null },
    '?lens=hesiod&compare=homer&topic=flood-landing',
  );
  const params = new URLSearchParams(query);
  assert.equal(params.get('compare'), null);
  assert.equal(params.get('topic'), null);
  assert.equal(params.get('lens'), 'hesiod');
});

test('parse and serialize round-trip', () => {
  const query = 'lens=apollodorus&compare=ovid&topic=flood-landing';
  const parsed = parseCompareQuery(`?${query}`);
  assert.equal(
    serializeCompareQuery({
      lens: parsed.lens ?? 'consensus',
      compareWith: parsed.compareWith,
      focusedTopic: parsed.focusedTopic,
    }),
    query,
  );
});
