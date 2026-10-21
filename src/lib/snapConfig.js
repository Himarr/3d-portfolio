// Scroll-snap tunables (spec 005). Pure constants, no imports.
// Edit values here; JS behaviour and CSS layout both derive from them.

// Snapping and the full-screen layout are active at or above both sizes (CSS px).
export const SNAP_MIN_WIDTH_PX = 1024;
export const SNAP_MIN_HEIGHT_PX = 700;

// Single media query built from the two thresholds above.
export const SNAP_QUERY = `(min-width: ${SNAP_MIN_WIDTH_PX}px) and (min-height: ${SNAP_MIN_HEIGHT_PX}px)`;

// Duration of one snap move, in seconds.
export const SNAP_DURATION_S = 1.0;

// Wheel events are ignored for this long after a move ends (late inertia tail).
export const SNAP_COOLDOWN_MS = 200;

// A quiet gap of at least this long between wheel events starts a new gesture.
export const SNAP_GESTURE_GAP_MS = 100;

// Within one wheel stream, a new gesture needs a delta this many times the last one...
export const SNAP_NEW_GESTURE_RATIO = 2;

// ...and at least this absolute delta (px).
export const SNAP_NEW_GESTURE_MIN_DELTA = 40;

// Wheel deltas below this are noise: never start a move.
export const SNAP_WHEEL_NOISE_DELTA = 2;

// Scrolling must be idle this long before the page settles on a snap point.
export const SNAP_SETTLE_DEBOUNCE_MS = 200;

// Distance (px) within which the page counts as being on a snap point.
export const SNAP_POSITION_EPSILON_PX = 1;

// A focusin this recent before a scroll burst makes the focused section the settle target.
export const SNAP_FOCUS_WINDOW_MS = 600;
