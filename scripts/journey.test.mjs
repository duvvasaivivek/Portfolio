import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createJourneyState, routePosition } from '../js/journey-state.js';
import { journeyOrder } from '../js/data.js';

test('filters retain chronology, retain eligible selection and skip excluded stops', () => {
  const state = createJourneyState();
  state.select(7);
  state.setFilter('internships');
  assert.deepEqual(state.snapshot().ids, [5,6,7]);
  assert.equal(state.snapshot().activeId, 7);
  state.step(-1);
  assert.equal(state.snapshot().activeId, 6);
  state.select(8);
  assert.equal(state.snapshot().activeId, 6);
  state.setFilter('hackathons');
  assert.deepEqual(state.snapshot().ids, [1,4,2,3,8]);
  assert.equal(state.snapshot().activeId, 1);
  state.select(8);
  state.setFilter('all');
  assert.equal(state.snapshot().activeId, 8);
});

test('rapid selections, boundary navigation, invalid filters and teardown', () => {
  const state = createJourneyState(), received = [];
  const unsubscribe = state.subscribe((snapshot, source) => received.push([snapshot.activeId, source]));
  state.step(-1);
  assert.equal(received.length, 0);
  state.select(8); state.select(5); state.select(7, 'scroll');
  assert.deepEqual(received, [[8,'control'],[5,'control'],[7,'scroll']]);
  state.select(8); state.step(1);
  assert.equal(state.snapshot().activeId, 8);
  state.setFilter('invalid');
  assert.equal(state.snapshot().filter, 'all');
  const snapshot = state.snapshot(); snapshot.ids.length = 0;
  assert.equal(state.snapshot().ids.length, 8);
  unsubscribe(); const count = received.length;
  state.select(1); assert.equal(received.length, count);
});

test('camera lands exactly on every visible milestone for every filter', () => {
  const state = createJourneyState();
  for (const filter of ['all','internships','hackathons']) {
    state.setFilter(filter);
    const {ids} = state.snapshot();
    ids.forEach((id,index) => assert.equal(routePosition(index / (ids.length - 1), ids), journeyOrder.indexOf(id) / 7));
    let previous = -1;
    for (let step = 0; step <= 100; step++) {
      const position = routePosition(step / 100, ids);
      assert.ok(position >= previous); previous = position;
    }
  }
});
