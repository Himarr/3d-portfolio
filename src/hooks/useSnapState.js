import { useSyncExternalStore } from 'react'
import { snapStore } from '../lib/snapStore.js'

// Snapshot { active, index, labels } of the snap store; re-renders on change.
export function useSnapState() {
  return useSyncExternalStore(snapStore.subscribe, snapStore.getSnapshot, snapStore.getSnapshot)
}
