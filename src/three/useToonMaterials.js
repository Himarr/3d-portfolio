import { useLayoutEffect } from "react";
import { createToonMaterial } from "./toonMaterial.js";

// Swaps the materials of a model instance (the clone) for toon materials while
// `enabled`. The cached glTF scene keeps its original materials: clones share
// them, so we only ever reassign `mesh.material` on the clone's own meshes.
export function useToonMaterials(root, enabled) {
  useLayoutEffect(() => {
    // Off by default: return before any material or Map is created.
    if (!enabled || !root) return;

    // One toon material per distinct source material (shared source -> shared toon).
    const toonBySource = new Map();
    const originals = [];

    const toonFor = (source) => {
      let toon = toonBySource.get(source);
      if (!toon) {
        toon = createToonMaterial(source);
        toonBySource.set(source, toon);
      }
      return toon;
    };

    root.traverse((node) => {
      if (!node.isMesh || !node.material) return;
      const original = node.material;
      originals.push([node, original]);
      node.material = Array.isArray(original)
        ? original.map(toonFor)
        : toonFor(original);
    });

    return () => {
      // Restore first, then dispose only what this effect created. Textures are
      // shared with the source materials and owned by Model's disposeObject.
      for (const [node, original] of originals) node.material = original;
      for (const toon of toonBySource.values()) toon.dispose();
    };
  }, [root, enabled]);
}
