// Pure carousel geometry (spec 006, plan D-E and D-22). No DOM access: callers pass measured inputs.
import {
  CAROUSEL_SIDE_SCALE,
  CAROUSEL_IMAGE_ASPECT,
  CAROUSEL_PEEK_FRACTION,
  CAROUSEL_GAP_MIN_PX,
  CAROUSEL_GAP_MAX_PX,
  CAROUSEL_CHROME_REM,
  CAROUSEL_NARROW_MAX_PX,
  CAROUSEL_NARROW_PEEK_PX,
  CAROUSEL_NARROW_GAP_PX,
  CAROUSEL_WIDE_PEEK_FRACTION,
  CAROUSEL_BELOW_SNAP_MAX_CARD_PX,
} from './carouselConfig.js'

// Default safe band above and below a snapped section; a check in 005's config asserts it matches.
const DEFAULT_BAND_PX = 72

const CHROME_REM_TOTAL = Object.values(CAROUSEL_CHROME_REM).reduce((a, b) => a + b, 0)

// D-22 peek rule: standard peek grows only when it would leave a gap above the maximum, up to the whole side card.
function peekAndGap(regionWidth, cardW, peekFraction) {
  const sideW = CAROUSEL_SIDE_SCALE * cardW
  const halfFree = regionWidth / 2 - cardW / 2
  const peek = Math.min(sideW, Math.max(peekFraction * cardW, halfFree - CAROUSEL_GAP_MAX_PX))
  return { peek, gap: halfFree - peek }
}

export function computeCarouselGeometry({ regionWidth, viewportHeight, snapOn, rootPx, bandPx = DEFAULT_BAND_PX }) {
  let cardW
  let peek
  let gap
  if (snapOn) {
    const imgH = viewportHeight - 2 * bandPx - CHROME_REM_TOTAL * rootPx
    const heightBound = imgH * CAROUSEL_IMAGE_ASPECT
    const widthBound = (regionWidth - 2 * CAROUSEL_GAP_MIN_PX) / (1 + 2 * CAROUSEL_PEEK_FRACTION)
    cardW = Math.floor(Math.min(heightBound, widthBound))
    ;({ peek, gap } = peekAndGap(regionWidth, cardW, CAROUSEL_PEEK_FRACTION))
  } else if (regionWidth < CAROUSEL_NARROW_MAX_PX) {
    peek = CAROUSEL_NARROW_PEEK_PX
    gap = CAROUSEL_NARROW_GAP_PX
    cardW = regionWidth - 2 * (peek + gap)
  } else {
    cardW = Math.min(CAROUSEL_BELOW_SNAP_MAX_CARD_PX, Math.floor((regionWidth - 48) / 1.5))
    ;({ peek, gap } = peekAndGap(regionWidth, cardW, CAROUSEL_WIDE_PEEK_FRACTION))
  }
  // Centre-to-centre distance so the edge gap is exactly `gap`.
  const step = ((1 + CAROUSEL_SIDE_SCALE) / 2) * cardW + gap
  return { cardW, gap, step, peek }
}
