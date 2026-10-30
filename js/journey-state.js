import { milestonesData, journeyOrder } from './data.js';

export function createJourneyState() {
  let filter = 'all', ids = [...journeyOrder], activeId = ids[0];
  const listeners = new Set();
  const snapshot = () => ({ filter, ids: [...ids], activeId, index: ids.indexOf(activeId) });
  function emit(source) { for (const listener of listeners) listener(snapshot(), source); }
  return {
    snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    select(id, source = 'control') {
      id = Number(id);
      if (!ids.includes(id) || activeId === id) return;
      activeId = id; emit(source);
    },
    step(delta) {
      this.select(ids[Math.max(0, Math.min(ids.length - 1, ids.indexOf(activeId) + delta))]);
    },
    setFilter(value) {
      if (!['all', 'internships', 'hackathons'].includes(value) || value === filter) return;
      filter = value;
      ids = journeyOrder.filter(id => filter === 'all' || (milestonesData[id].category === 'Internship') === (filter === 'internships'));
      if (!ids.includes(activeId)) activeId = ids[0];
      emit('filter');
    }
  };
}

export const journeyState = createJourneyState();

// Equal scroll space for each visible stop, while retaining its position in the original world.
export function routePosition(progress, ids) {
  const offset = Math.max(0, Math.min(1, progress)) * (ids.length - 1);
  const index = Math.floor(offset), fraction = offset - index;
  const from = journeyOrder.indexOf(ids[index]);
  const to = journeyOrder.indexOf(ids[Math.min(ids.length - 1, index + 1)]);
  return (from + (to - from) * fraction) / (journeyOrder.length - 1);
}
