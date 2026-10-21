// Pure star wrap maths for the viewport-fixed canvas (no three import).

// Stars shift vertically by at most this fraction of the scroll distance. Small, so
// the layer reads as distant. Tunable by hand.
export const STAR_SCROLL_PARALLAX_FACTOR = 0.15

// Writes the wrap offsets of the star layer into `out` and returns it (no allocation).
//   dx = drift * W                      (drift in [0, 1), so dx in [0, W))
//   dy = (scroll * factor) mod H        (always in [0, H), also for negative scroll)
export function starOffsets(scroll, factor, W, H, drift, out) {
  const dy = (scroll * factor) % H
  out.dx = drift * W
  out.dy = dy < 0 ? dy + H : dy
  return out
}

// True when the four copies at (dx,dy), (dx-W,dy), (dx,dy-H), (dx-W,dy-H), each W x H,
// cover the viewport [0,W] x [0,H]. The copies tile a contiguous
// [dx-W, dx+W] x [dy-H, dy+H] block, so each axis only needs to contain [0, size].
export function coversViewport(W, H, dx, dy) {
  return dx - W <= 0 && dx + W >= W && dy - H <= 0 && dy + H >= H
}
