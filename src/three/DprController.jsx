import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { computeDpr } from "./bufferLimits.js";

// Renders nothing. On every canvas size change it reports the effective DPR
// computed by the pure buffer-limit maths.
export default function DprController({ maxDim, pixelBudget, onDpr }) {
  const size = useThree((s) => s.size);

  useLayoutEffect(() => {
    onDpr(
      computeDpr({
        cssWidth: size.width,
        cssHeight: size.height,
        deviceDpr: window.devicePixelRatio,
        maxDim,
        pixelBudget,
      }),
    );
  }, [size.width, size.height, maxDim, pixelBudget, onDpr]);

  return null;
}
