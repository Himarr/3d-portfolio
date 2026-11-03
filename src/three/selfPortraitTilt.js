// Maximum turn of the self-portrait toward the pointer, in radians (~9 degrees).
export const SELF_PORTRAIT_MAX_TILT = 0.15

const clamp1 = (v) => Math.max(-1, Math.min(1, v))

// Pointer (-1..1, y up) -> bounded rotation. Writes out.x (rot X) and out.y (rot Y).
export function portraitTilt(px, py, out) {
  out.x = -clamp1(py) * SELF_PORTRAIT_MAX_TILT
  out.y = clamp1(px) * SELF_PORTRAIT_MAX_TILT
  return out
}
