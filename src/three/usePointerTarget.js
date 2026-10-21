import { useEffect, useRef } from "react";

export const POINTER_INTERVAL_MS = 33;

// Returns a preallocated { x, y } ref, normalised -1..1 with y up.
// Only listens on fine-pointer devices; nothing is registered otherwise.
export function usePointerTarget() {
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return undefined;

    const state = target.current;
    let last = 0;

    const onMove = (event) => {
      const now = performance.now();
      if (now - last < POINTER_INTERVAL_MS) return;
      last = now;
      state.x = (event.clientX / window.innerWidth) * 2 - 1;
      state.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    const onBlur = () => {
      state.x = 0;
      state.y = 0;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onBlur);
      state.x = 0;
      state.y = 0;
    };
  }, []);

  return target;
}
