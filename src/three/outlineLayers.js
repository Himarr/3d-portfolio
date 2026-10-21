import { useLayoutEffect } from "react";

// Layer that marks meshes which the OutlineLayer mask pass should draw. Meshes
// keep layer 0 too, so the main camera still renders them. Stars never get it.
export const OUTLINE_LAYER = 1;

// Enables OUTLINE_LAYER on every mesh under `root` while `enabled`. Off by
// default: return before touching anything. Tracks the meshes it changed so the
// cleanup undoes exactly that, even if the hierarchy changes later.
export function useOutlineTag(root, enabled) {
  useLayoutEffect(() => {
    if (!enabled || !root) return;

    const tagged = [];
    root.traverse((node) => {
      if (!node.isMesh) return;
      node.layers.enable(OUTLINE_LAYER);
      tagged.push(node);
    });

    return () => {
      for (const node of tagged) node.layers.disable(OUTLINE_LAYER);
    };
  }, [root, enabled]);
}
