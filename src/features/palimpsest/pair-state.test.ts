/** The store's fail-closed rules for the pair (docs/PALIMPSEST_PLAN.md §8.5).
 *  The galaxy store persists audio preferences through localStorage, which Node
 *  has no notion of, so the suite gives it a throwaway one before importing. */

import assert from 'node:assert/strict';
import { before, beforeEach, test } from 'node:test';

type Store = typeof import('@/features/galaxy/store').useGalaxyStore;
let useGalaxyStore: Store;

before(async () => {
  const memory = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => void memory.set(key, value),
    removeItem: (key: string) => void memory.delete(key),
  };
  ({ useGalaxyStore } = await import('@/features/galaxy/store'));
});

beforeEach(() => {
  useGalaxyStore.setState({ lens: 'consensus', compareWith: null, focusedTopic: null });
});

test('the atlas opens on consensus, reading after every teller at once', () => {
  const state = useGalaxyStore.getState();
  assert.equal(state.lens, 'consensus');
  assert.equal(state.compareWith, null);
});

test('setting a comparison sets both sides', () => {
  useGalaxyStore.getState().setComparison('hesiod', 'homer');
  const state = useGalaxyStore.getState();
  assert.equal(state.lens, 'hesiod');
  assert.equal(state.compareWith, 'homer');
});

test('a self-pair falls back to reading after that teller alone', () => {
  useGalaxyStore.getState().setComparison('homer', 'homer');
  assert.equal(useGalaxyStore.getState().compareWith, null);
  assert.equal(useGalaxyStore.getState().lens, 'homer');
});

test('choosing consensus ends the comparison — the union is not a side', () => {
  useGalaxyStore.getState().setComparison('hesiod', 'homer');
  useGalaxyStore.getState().setLens('consensus');
  assert.equal(useGalaxyStore.getState().compareWith, null);
});

test('promoting the secondary teller to primary ends the comparison', () => {
  useGalaxyStore.getState().setComparison('hesiod', 'homer');
  useGalaxyStore.getState().setLens('homer');
  assert.equal(useGalaxyStore.getState().compareWith, null);
  assert.equal(useGalaxyStore.getState().lens, 'homer');
});

test('choosing an unrelated primary teller keeps the comparison', () => {
  useGalaxyStore.getState().setComparison('hesiod', 'homer');
  useGalaxyStore.getState().setLens('ovid');
  assert.equal(useGalaxyStore.getState().lens, 'ovid');
  assert.equal(useGalaxyStore.getState().compareWith, 'homer');
});

test('swapping reverses the pair and keeps the focused topic', () => {
  useGalaxyStore.getState().setComparison('hesiod', 'homer');
  useGalaxyStore.getState().focusTopic('aphrodite-parentage');
  useGalaxyStore.getState().swapComparison();
  const state = useGalaxyStore.getState();
  assert.equal(state.lens, 'homer');
  assert.equal(state.compareWith, 'hesiod');
  assert.equal(state.focusedTopic, 'aphrodite-parentage');
});

test('swapping does nothing when there is no pair to swap', () => {
  useGalaxyStore.getState().setLens('homer');
  useGalaxyStore.getState().swapComparison();
  assert.equal(useGalaxyStore.getState().lens, 'homer');
  assert.equal(useGalaxyStore.getState().compareWith, null);
});

test('clearing the comparison keeps the primary teller', () => {
  useGalaxyStore.getState().setComparison('hesiod', 'homer');
  useGalaxyStore.getState().clearComparison();
  assert.equal(useGalaxyStore.getState().lens, 'hesiod');
  assert.equal(useGalaxyStore.getState().compareWith, null);
});

test('following one telling leaves the pair but keeps the question', () => {
  useGalaxyStore.getState().setComparison('apollodorus', 'hyginus');
  useGalaxyStore.getState().focusTopic('flood-landing');
  useGalaxyStore.getState().followTeller('hyginus');
  const state = useGalaxyStore.getState();
  assert.equal(state.lens, 'hyginus', 'the secondary teller can be followed too');
  assert.equal(state.compareWith, null);
  assert.equal(state.focusedTopic, 'flood-landing');
});
