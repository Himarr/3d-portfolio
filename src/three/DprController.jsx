import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { computeDpr, fitsAtDprOne } from "./bufferLimits.js";

// Renders nothing. On every canvas size change it either reports an unfit
// size or the effective DPR computed by the pure buffer-limit maths.
export default function DprController({ maxDim, pixelBudget, onDpr, onUnfit }) {
  const size = useThree((s) => s.size);

  useLayoutEffect(() => {
    if (!fitsAtDprOne(size.width, size.height, maxDim)) {
      onUnfit();
      return;
    }
    onDpr(
      computeDpr({
        cssWidth: size.width,
        cssHeight: size.height,
        deviceDpr: window.devicePixelRatio,
        maxDim,
        pixelBudget,
      }),
    );
  }, [size.width, size.height, maxDim, pixelBudget, onDpr, onUnfit]);

  return null;
}
