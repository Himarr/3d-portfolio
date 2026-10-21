// Framework-free snap store (spec 005): { active, index, labels }.
// Read with getSnapshot, observe with subscribe (works with useSyncExternalStore).
// set() replaces the snapshot object only when a field actually changed, so
// subscribers are not woken (and React does not re-render) for no-op writes.

let snapshot = { active: false, index: 0, labels: [] };
const listeners = new Set();

function sameLabels(a, b) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function getSnapshot() {
  return snapshot;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Merge a partial update. Returns true when the snapshot changed.
export function set(partial) {
  const next = {
    active: partial.active ?? snapshot.active,
    index: partial.index ?? snapshot.index,
    labels: partial.labels ?? snapshot.labels,
  };
  if (
    next.active === snapshot.active &&
    next.index === snapshot.index &&
    sameLabels(next.labels, snapshot.labels)
  ) {
    return false;
  }
  // Keep the old labels array when the content is equal (stable reference).
  if (sameLabels(next.labels, snapshot.labels)) next.labels = snapshot.labels;
  snapshot = next;
  listeners.forEach((listener) => listener());
  return true;
}

export const snapStore = { getSnapshot, subscribe, set };
