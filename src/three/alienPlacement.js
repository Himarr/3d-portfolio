// Pure maths for the hero alien (no 3D library import, so Node checks can load it).
// Canvas coordinates: 1 unit = 1 CSS px, +Y up, moon at z = 0.
import { HERO_WRAP_MIN_WIDTH_PX } from '../lib/moonConfig.js'

// Alien on-screen height as a fraction of the moon radius (tuned by eye).
export const ALIEN_HEIGHT_PER_MOON_RADIUS = 2
// Vertical float: amplitude in moon radii, period in seconds.
export const ALIEN_FLOAT_AMPLITUDE = 0.03
export const ALIEN_FLOAT_PERIOD_S = 5
// Alien centre depth in moon radii, in front of the moon's front surface.
export const ALIEN_Z_PER_MOON_RADIUS = 2.5

// Alien centre offset from the moon centre, in moon radii (no float).
const WIDE_DX = 1
const WIDE_DY = -0.1
const NARROW_DX = 0
const NARROW_DY = -0.2

export function alienOffsetInRadii(wide, out) {
  out.dx = wide ? WIDE_DX : NARROW_DX
  out.dy = wide ? WIDE_DY : NARROW_DY
  return out
}

// Alien poster: fraction of the square capture that the alien fills.
export const ALIEN_POSTER_FILL = 0.8

// Farthest the alien reaches from the moon centre, in moon radii: centre offset
// plus the corner of a square box of the alien's height, plus the float.
export const ALIEN_MAX_REACH_RADII =
  Math.max(
    Math.hypot(WIDE_DX, WIDE_DY),
    Math.hypot(NARROW_DX, NARROW_DY),
  ) +
  (ALIEN_HEIGHT_PER_MOON_RADIUS / 2) * Math.SQRT2 +
  ALIEN_FLOAT_AMPLITUDE

const off = { dx: 0, dy: 0 }

export function alienPlacement(
  { moonX, moonY, radius, introScale, viewportWidth, timeS },
  out,
) {
  const r = radius * introScale
  const wide = viewportWidth >= HERO_WRAP_MIN_WIDTH_PX
  alienOffsetInRadii(wide, off)
  const height = ALIEN_HEIGHT_PER_MOON_RADIUS * r
  const half = height / 2
  const limit = viewportWidth / 2 - half
  out.x = Math.max(-limit, Math.min(limit, moonX + off.dx * r))
  out.y =
    moonY +
    off.dy * r +
    ALIEN_FLOAT_AMPLITUDE * r * Math.sin((2 * Math.PI * timeS) / ALIEN_FLOAT_PERIOD_S)
  out.z = ALIEN_Z_PER_MOON_RADIUS * r
  out.height = height
  return out
}
