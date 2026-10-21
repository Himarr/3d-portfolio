import { useSyncExternalStore } from "react";

function subscribe(onChange) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function getSnapshot() {
  return !document.hidden;
}

function getServerSnapshot() {
  return true;
}

export function useDocumentVisible() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
