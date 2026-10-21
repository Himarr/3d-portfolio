// Pure carousel logic: no DOM access, imports only the config.
import {
  CAROUSEL_MIN_POOL,
  CAROUSEL_SIDE_OPACITY,
  CAROUSEL_SIDE_SCALE,
  CAROUSEL_SWIPE_MIN_PX,
  CAROUSEL_SWIPE_AXIS_RATIO,
  CAROUSEL_WHEEL_MIN_DELTA,
  CAROUSEL_WHEEL_GESTURE_GAP_MS,
} from './carouselConfig.js'

const mod = (x, m) => ((x % m) + m) % m

// Slide pool size: 0 and 1 stay as is, otherwise a multiple of n of at least CAROUSEL_MIN_POOL.
export function poolSize(n) {
  if (n <= 1) return n < 1 ? 0 : 1
  return n * Math.ceil(CAROUSEL_MIN_POOL / n)
}

// Wrap x into (-period/2, period/2]; the tie goes to +period/2.
export function wrapSigned(x, period) {
  if (!period) return 0
  const r = x - period * Math.ceil(x / period - 0.5)
  return r === 0 ? 0 : r
}

export function slotRel(slot, pos, pool) {
  return wrapSigned(slot - pos, pool)
}

// Style for a slot at signed distance rel from the centre. x is in step units.
export function slotStyle(rel) {
  const a = Math.abs(rel)
  let opacity
  if (a === 0) opacity = 1
  else if (a === 1) opacity = CAROUSEL_SIDE_OPACITY
  else if (a < 1) opacity = 1 - (1 - CAROUSEL_SIDE_OPACITY) * a
  else if (a < 2) opacity = CAROUSEL_SIDE_OPACITY * (2 - a)
  else opacity = 0
  opacity = Math.round(opacity * 1000) / 1000
  const scale = a >= 1 ? CAROUSEL_SIDE_SCALE : 1 - (1 - CAROUSEL_SIDE_SCALE) * a
  const x = a === 0 ? 0 : Math.sign(rel) * Math.min(a, 2)
  return { x, scale, opacity, visible: opacity > 0 }
}

export function activeSlot(target, pool) {
  return pool ? mod(Math.round(target), pool) : 0
}

export function activeProject(target, n) {
  return n ? mod(Math.round(target), n) : 0
}

// Signed distance in (-n/2, n/2]; an exact tie goes forward.
export function shortestDelta(from, to, n) {
  if (n <= 1) return 0
  let d = mod(to - from, n)
  if (d > n / 2) d -= n
  return d
}

// action: 'next' | 'prev' | { type: 'project', index }
export function goTarget(target, action, n) {
  if (action === 'next') return target + 1
  if (action === 'prev') return target - 1
  if (action && action.type === 'project') {
    return target + shortestDelta(activeProject(target, n), action.index, n)
  }
  return target
}

export function autoplayAllowed({ n, reducedMotion, hover, focusWithin, documentHidden, visible }) {
  return n >= 2 && !reducedMotion && !hover && !focusWithin && !documentHidden && !!visible
}

export function liveModeFor({ autoplayRunning, lastChangeManual }) {
  return autoplayRunning && !lastChangeManual ? 'off' : 'polite'
}

// Wheel classifier (plan D-C). Returns 'slide-next' | 'slide-prev' | 'consume' | 'pass'.
// The CALLER must set lastEventAt = now on every 'slide-*' and 'consume' result (not on 'pass').
export function classifyCarouselWheel({ deltaX, deltaY, ctrlKey, deltaMode, now, lastEventAt, moving, innerWidth }) {
  if (ctrlKey) return 'pass'
  const k = deltaMode === 1 ? 16 : deltaMode === 2 ? innerWidth : 1
  const dx = deltaX * k
  const dy = deltaY * k
  if (Math.abs(dx) <= Math.abs(dy)) return 'pass'
  if (moving) return 'consume'
  if (now - lastEventAt < CAROUSEL_WHEEL_GESTURE_GAP_MS) return 'consume'
  if (Math.abs(dx) >= CAROUSEL_WHEEL_MIN_DELTA) return dx > 0 ? 'slide-next' : 'slide-prev'
  return 'pass'
}

// Swipe classifier: dx < 0 (finger moves left) is next.
export function classifySwipe({ dx, dy }) {
  const ax = Math.abs(dx)
  if (ax >= CAROUSEL_SWIPE_MIN_PX && ax >= CAROUSEL_SWIPE_AXIS_RATIO * Math.abs(dy)) {
    return dx < 0 ? 'next' : 'prev'
  }
  return null
}
