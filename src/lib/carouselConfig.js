// Carousel constants (spec 006). One module so retiming or restyling needs no other edit.

// Autoplay interval, measured from the start of each advance (FR-5).
export const CAROUSEL_AUTOPLAY_MS = 5000
// Slide transition length in seconds (FR-4, FR-7).
export const CAROUSEL_TRANSITION_S = 0.6
// Decelerating ease for the slide tween (FR-7).
export const CAROUSEL_EASE = 'power3.out'
// Opacity of the cards beside the centre card (FR-3).
export const CAROUSEL_SIDE_OPACITY = 0.4
// Scale of the cards beside the centre card, so the centre reads as primary (FR-3).
export const CAROUSEL_SIDE_SCALE = 0.88
// Card image width / height (FR-2).
export const CAROUSEL_IMAGE_ASPECT = 16 / 10
// Share of the carousel that must be in the viewport for autoplay (FR-6).
export const CAROUSEL_VISIBLE_RATIO = 0.5
// Minimum horizontal travel for a swipe to count (FR-9).
export const CAROUSEL_SWIPE_MIN_PX = 40
// Horizontal travel must exceed vertical travel by this ratio, so vertical scrolls are not swipes (FR-9).
export const CAROUSEL_SWIPE_AXIS_RATIO = 1.5
// Clicks right after a swipe are ignored for this long, so a swipe never activates a link (FR-9).
export const CAROUSEL_SWIPE_CLICK_SUPPRESS_MS = 400
// Smallest horizontal wheel delta that counts as a slide request (FR-11).
export const CAROUSEL_WHEEL_MIN_DELTA = 20
// Quiet time that ends one wheel gesture so one gesture moves one slide (FR-11).
export const CAROUSEL_WHEEL_GESTURE_GAP_MS = 120
// Above this many projects dots become a text counter (FR-8).
export const CAROUSEL_MAX_DOTS = 10
// Smallest slide pool so a left and right neighbour always exist with room to travel (pool / 2 >= 2).
export const CAROUSEL_MIN_POOL = 4
// Share of a side card that peeks beyond the centre card at snap sizes (D-22).
export const CAROUSEL_PEEK_FRACTION = 0.4
// Bounds of the gap between centre and side cards (D-22).
export const CAROUSEL_GAP_MIN_PX = 24
export const CAROUSEL_GAP_MAX_PX = 64
// Fixed chrome heights in rem used by the height-aware fit (FR-3, FR-33).
export const CAROUSEL_CHROME_REM = { head: 4.75, headGap: 1, controls: 3.25, text: 9, safety: 0.5 }

// Below-snap layout (screens without snapping)
// Viewport width at or below which the narrow layout applies.
export const CAROUSEL_NARROW_MAX_PX = 640
// Visible sliver of the next card on narrow screens.
export const CAROUSEL_NARROW_PEEK_PX = 24
// Gap between cards on narrow screens.
export const CAROUSEL_NARROW_GAP_PX = 12
// Side card peek share on wider below-snap screens.
export const CAROUSEL_WIDE_PEEK_FRACTION = 0.25
// Largest centre card width below snap, so cards stay readable on wide short screens.
export const CAROUSEL_BELOW_SNAP_MAX_CARD_PX = 640
