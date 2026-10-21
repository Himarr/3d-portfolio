// Pure snap maths (spec 005). No DOM access; node-testable via scripts/check-snap.mjs.
import {
  SNAP_COOLDOWN_MS,
  SNAP_GESTURE_GAP_MS,
  SNAP_NEW_GESTURE_MIN_DELTA,
  SNAP_NEW_GESTURE_RATIO,
  SNAP_POSITION_EPSILON_PX,
  SNAP_WHEEL_NOISE_DELTA,
} from './snapConfig.js';

// Ease in/out cubic: exact endpoints 0 and 1, monotonic.
export function easeInOutCubic(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Index of the snap point nearest to y. Ties go to the lower index.
export function nearestIndex(points, y) {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < points.length; i += 1) {
    const d = Math.abs(points[i] - y);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

// Next or previous index (dir > 0 next, otherwise previous), clamped to [0, last].
export function stepIndex(index, dir, last) {
  const next = index + (dir > 0 ? 1 : -1);
  return Math.min(Math.max(next, 0), last);
}

// Wheel delta in px: line mode x 16, page mode x innerHeight.
export function normaliseWheelDelta(event, innerHeight) {
  const { deltaY, deltaMode } = event;
  if (deltaMode === 1) return deltaY * 16;
  if (deltaMode === 2) return deltaY * innerHeight;
  return deltaY;
}

// Where an idle page should settle: the focus section if given, else the nearest point.
// Returns null when the scroll is already within epsilon of that target.
export function settleTarget({ points, scroll, focusIndex, epsilon = SNAP_POSITION_EPSILON_PX }) {
  const target = focusIndex == null ? nearestIndex(points, scroll) : focusIndex;
  if (Math.abs(points[target] - scroll) <= epsilon) return null;
  return target;
}

// Classifies one wheel event: 'move' (start a snap move), 'ignore' (prevent, do nothing)
// or 'pass' (leave to the browser). Rules run in order (plan D-B). The caller updates
// lastWheelAt and lastAbsDelta after every wheel event, accepted or not.
export function classifyWheel({
  now,
  lastWheelAt = -Infinity,
  lastAbsDelta = 0,
  absDelta,
  moveEndAt = -Infinity,
  moving,
  ctrlKey,
  deltaX,
  deltaY,
}) {
  if (ctrlKey || Math.abs(deltaX) > Math.abs(deltaY) || absDelta < SNAP_WHEEL_NOISE_DELTA) {
    return 'pass';
  }
  if (moving) return 'ignore';
  if (now - moveEndAt < SNAP_COOLDOWN_MS) return 'ignore';
  if (now - lastWheelAt >= SNAP_GESTURE_GAP_MS) return 'move';
  // Same stream: only a fresh flick riding on a tail counts.
  if (absDelta >= SNAP_NEW_GESTURE_MIN_DELTA && absDelta >= lastAbsDelta * SNAP_NEW_GESTURE_RATIO) {
    return 'move';
  }
  return 'ignore';
}

// Roles whose widgets use the arrow keys themselves.
const ARROW_ROLES = new Set([
  'slider',
  'menu',
  'menuitem',
  'tab',
  'tablist',
  'listbox',
  'option',
  'radio',
  'spinbutton',
  'combobox',
  'textbox',
]);

const NONE = { action: null, preventOnly: false };

// Decides what a keydown does while snapping is active.
// Returns { action: 'next' | 'prev' | 'first' | 'last' | null, preventOnly }.
// preventOnly: swallow the native scroll but start no move (held key repeat).
export function shouldHandleKey({
  key,
  shiftKey,
  ctrlKey,
  altKey,
  metaKey,
  defaultPrevented,
  repeat,
  targetTag,
  targetRole,
  isContentEditable,
}) {
  if (ctrlKey || altKey || metaKey || defaultPrevented) return NONE;

  let action = null;
  let isArrow = false;
  let isSpace = false;
  switch (key) {
    case 'PageDown':
      action = 'next';
      break;
    case 'PageUp':
      action = 'prev';
      break;
    case 'ArrowDown':
      action = 'next';
      isArrow = true;
      break;
    case 'ArrowUp':
      action = 'prev';
      isArrow = true;
      break;
    case ' ':
      action = shiftKey ? 'prev' : 'next';
      isSpace = true;
      break;
    case 'Home':
      action = 'first';
      break;
    case 'End':
      action = 'last';
      break;
    default:
      return NONE;
  }

  const tag = targetTag ? String(targetTag).toLowerCase() : '';
  const role = targetRole ? String(targetRole).toLowerCase() : '';
  if (isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select') return NONE;
  if (isSpace && (tag === 'button' || tag === 'summary' || role === 'checkbox')) return NONE;
  if (isArrow && ARROW_ROLES.has(role)) return NONE;

  if (repeat) return { action: null, preventOnly: true };
  return { action, preventOnly: false };
}
