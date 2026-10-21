import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { disposeObject } from "./disposeObject.js";
import { useToonMaterials } from "./useToonMaterials.js";
import { useOutlineTag } from "./outlineLayers.js";

// Live consumers per model URL. The cached glTF is freed when the last one unmounts.
const refCounts = new Map();

export default function Model({ url, toon = false, outline = false, ...props }) {
  // Draco and meshopt off (D-8): no decoder is created, so no CDN request.
  const { scene } = useGLTF(url, false, false);
  const clone = useMemo(() => scene.clone(true), [scene]);
  useToonMaterials(clone, toon);
  useOutlineTag(clone, outline);

  useEffect(() => {
    refCounts.set(url, (refCounts.get(url) ?? 0) + 1);
    return () => {
      refCounts.set(url, (refCounts.get(url) ?? 1) - 1);
      // Deferred so a StrictMode remount can re-claim the model first.
      setTimeout(() => {
        if ((refCounts.get(url) ?? 0) > 0) return;
        disposeObject(scene);
        useGLTF.clear(url);
        refCounts.delete(url);
      }, 0);
    };
  }, [url, scene]);

  return <primitive object={clone} {...props} />;
}
