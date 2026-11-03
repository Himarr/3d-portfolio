// Pure buffer-size and DPR limit maths (no 3D library import). Used by webgl.js,
// DprController.jsx and scripts/check-buffer-limits.mjs.

export const DPR_MAX = 2;
export const PIXEL_BUDGET_DESKTOP = 16_000_000;
export const PIXEL_BUDGET_COARSE = 8_000_000;

// Largest drawing-buffer dimension (px) the device supports.
export function maxBufferDim(maxRenderbuffer, maxViewportDims) {
  return Math.min(maxRenderbuffer, maxViewportDims[0], maxViewportDims[1]);
}

// Effective DPR: device DPR limited by DPR_MAX, the buffer dimension limit and
// the pixel budget; floor 1 when the size fits at DPR 1, otherwise the reduced
// DPR (< 1) that fits maxDim; rounded down to 2 decimals.
export function computeDpr({ cssWidth, cssHeight, deviceDpr, maxDim, pixelBudget }) {
  const fitDpr = (maxDim / Math.max(cssWidth, cssHeight)) * (1 - 1e-9);
  if (Math.max(cssWidth, cssHeight) > maxDim) return Math.floor(fitDpr * 100) / 100;
  const raw = Math.max(
    1,
    Math.min(deviceDpr, DPR_MAX, fitDpr, Math.sqrt(pixelBudget / (cssWidth * cssHeight))),
  );
  return Math.floor(raw * 100) / 100;
}
