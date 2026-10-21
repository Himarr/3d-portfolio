// Wheel and key input for scroll snapping (spec 005, plan D-B). Framework-free; the
// decisions live in snapMath (classifyWheel, shouldHandleKey). No layout reads and no
// per-event allocation: argument objects below are reused. Never calls focus()/blur().
// No touch listeners: touch scrolling stays native.
import { classifyWheel, nearestIndex, normaliseWheelDelta, shouldHandleKey } from './snapMath.js';

// Wheel over these is left to the browser (nested scrollers, opt-out areas).
const SNAP_QUERY_IGNORE_SELECTOR = '[data-lenis-prevent], [data-snap-ignore]';

const WHEEL_OPTIONS = { capture: true, passive: false };
const MOVE_OPTIONS = { kind: 'input' }; // reused goTo options

// Reused argument objects (filled in place on every event).
const wheelArgs = {
  now: 0,
  lastWheelAt: -Infinity,
  lastAbsDelta: 0,
  absDelta: 0,
  moveEndAt: -Infinity,
  moving: false,
  ctrlKey: false,
  deltaX: 0,
  deltaY: 0,
};
const wheelDeltaSource = { deltaY: 0, deltaMode: 0 };
const keyArgs = {
  key: '',
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  defaultPrevented: false,
  repeat: false,
  targetTag: '',
  targetRole: '',
  isContentEditable: false,
};

// controllerApi is the snapController (passed in, so this file never imports it).
// Returns a detach function that removes both listeners.
export function attachInput(controllerApi) {
  const state = controllerApi.getState();
  let lastWheelAt = -Infinity;
  let lastAbsDelta = 0;

  // Start a move to the neighbour (dir +1/-1) of the section nearest the current scroll.
  // At the ends nothing happens.
  function stepFromNearest(dir) {
    const { points, lenis } = state;
    if (!lenis || points.length === 0) return;
    const from = nearestIndex(points, lenis.scroll);
    const to = from + dir;
    if (to < 0 || to > points.length - 1) return;
    controllerApi.goTo(to, MOVE_OPTIONS);
  }

  function jumpToEnd(toIndex) {
    const { points, lenis } = state;
    if (!lenis || points.length === 0) return;
    if (nearestIndex(points, lenis.scroll) === toIndex && !state.moving) return;
    controllerApi.goTo(toIndex, MOVE_OPTIONS);
  }

  function onWheel(event) {
    if (!state.active || !state.lenis) return;
    if (event.ctrlKey) return;
    const target = event.target;
    if (target && typeof target.closest === 'function' && target.closest(SNAP_QUERY_IGNORE_SELECTOR)) {
      return;
    }

    controllerApi.recoverStalledMove();
    wheelDeltaSource.deltaY = event.deltaY;
    wheelDeltaSource.deltaMode = event.deltaMode;
    const absDelta = Math.abs(normaliseWheelDelta(wheelDeltaSource, window.innerHeight));

    wheelArgs.now = performance.now();
    wheelArgs.lastWheelAt = lastWheelAt;
    wheelArgs.lastAbsDelta = lastAbsDelta;
    wheelArgs.absDelta = absDelta;
    wheelArgs.moveEndAt = state.moveEndAt;
    wheelArgs.moving = state.moving !== null;
    wheelArgs.ctrlKey = event.ctrlKey;
    wheelArgs.deltaX = event.deltaX;
    wheelArgs.deltaY = event.deltaY;
    const verdict = classifyWheel(wheelArgs);

    // Every classified wheel event feeds the gesture tracker, accepted or not.
    lastWheelAt = wheelArgs.now;
    lastAbsDelta = absDelta;

    if (verdict === 'pass') {
      // While a move runs, even noise-level vertical wheel events must not reach Lenis:
      // its onVirtualScroll would call scrollTo({ programmatic: false }) and replace the
      // snap animation, so the move would never complete. ctrl and horizontal stay native.
      if (!wheelArgs.moving || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        return;
      }
    }
    event.preventDefault();
    event.stopPropagation();
    if (verdict === 'move') stepFromNearest(event.deltaY > 0 ? 1 : -1);
  }

  function onKeyDown(event) {
    if (!state.active || !state.lenis) return;
    const target = event.target;
    const hasAttr = target && typeof target.getAttribute === 'function';
    keyArgs.key = event.key;
    keyArgs.shiftKey = event.shiftKey;
    keyArgs.ctrlKey = event.ctrlKey;
    keyArgs.altKey = event.altKey;
    keyArgs.metaKey = event.metaKey;
    keyArgs.defaultPrevented = event.defaultPrevented;
    keyArgs.repeat = event.repeat;
    keyArgs.targetTag = target && target.tagName ? target.tagName : '';
    keyArgs.targetRole = hasAttr ? target.getAttribute('role') || '' : '';
    keyArgs.isContentEditable = Boolean(target && target.isContentEditable);

    const { action, preventOnly } = shouldHandleKey(keyArgs);
    if (!action && !preventOnly) return;
    event.preventDefault();
    if (!action) return;
    controllerApi.recoverStalledMove();
    if (state.moving) return; // input during a move is dropped, never queued

    if (action === 'next') stepFromNearest(1);
    else if (action === 'prev') stepFromNearest(-1);
    else if (action === 'first') jumpToEnd(0);
    else if (action === 'last') jumpToEnd(state.points.length - 1);
  }

  window.addEventListener('wheel', onWheel, WHEEL_OPTIONS);
  window.addEventListener('keydown', onKeyDown);
  controllerApi.adjustListenerCount(2);

  return function detachInput() {
    window.removeEventListener('wheel', onWheel, WHEEL_OPTIONS);
    window.removeEventListener('keydown', onKeyDown);
    controllerApi.adjustListenerCount(-2);
  };
}
