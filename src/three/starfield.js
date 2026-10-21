export const STAR_SEED = 0x5eed1234
export const STAR_Z = -1000

// Stars per million canvas CSS pixels. Set from the 1440x900 baseline density
// (about 554 stars per Mpx before; see specs/005-scroll-snap-hero-navbar/baseline.md).
export const STAR_DENSITY_PER_MPX = 550

// Visible star count for a canvas of w x h CSS px, never above the cap.
export function starCountFor(w, h, cap, density) {
  return Math.min(cap, Math.round((density * w * h) / 1e6))
}

export function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Normalised page-area layout: x, y in [-0.5, 0.5], scaled to the canvas size by
// the caller, so a canvas resize rescales the field without reshuffling it.
export function createStarPositions(count) {
  const rand = mulberry32(STAR_SEED)
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const u = rand()
    const v = rand()
    positions[i * 3] = u - 0.5
    positions[i * 3 + 1] = 0.5 - v
    positions[i * 3 + 2] = STAR_Z
  }
  return positions
}
