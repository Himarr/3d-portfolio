// Idle settle for scroll snapping (spec 005 FR-10, D-10; plan D-C). Framework-free.
// After any scroll that a snap move did not produce (scrollbar drag, keyboard focus scroll,
// find-in-page, touch scroll and momentum, scroll restoration, a few native wheel deltas
// left over after a snap), the page animates to a snap point once scrolling has been idle
// for SNAP_SETTLE_DEBOUNCE_MS.
//
// Rules:
// - Scroll events while a snap move runs, or while our own cancel (stop/start) emits, are
//   ignored; they never start a settle.
// - No settle while a mouse button or a touch is held. Release re-arms a deferred settle.
// - Target: the section holding a focusin that happened within SNAP_FOCUS_WINDOW_MS before
//   the first scroll event of the burst, else the nearest snap point. Already within the
//   epsilon of the target means nothing happens, so a snap that ended exactly on its point
//   never triggers a second animation, while a few px of native drift is corrected.
// - A mousedown or touchstart during a settle move cancels it in place (user takes over).
// - Never moves or removes focus and never changes document.activeElement.
//
// Known gap: Firefox dispatches no mousedown for the viewport scrollbar, so a scrollbar
// drag that pauses for the debounce can start a settle there (best effort, documented in
// the plan; manual check).
//
// Scroll, timer and input callbacks do no layout reads and allocate nothing: argument
// objects are reused and one timer per burst re-checks the last scroll time.
import { SNAP_FOCUS_WINDOW_MS, SNAP_POSITION_EPSILON_PX, SNAP_SETTLE_DEBOUNCE_MS } from './snapConfig.js';
import { nearestIndex, settleTarget } from './snapMath.js';

const LISTENER_OPTIONS = { capture: true, passive: true };
const LISTENER_COUNT = 9; // 8 DOM listeners + the Lenis scroll subscription

let armImpl = null; // set while attached, so the controller can call armSettle()

// Start (or restart) a settle countdown from now, as if a scroll event had just arrived.
// Used after activation so a restored mid-page position settles with no further scrolling.
export function armSettle() {
  if (armImpl) armImpl();
}

// controllerApi is the snapController (passed in, so this file never imports it).
// Returns a detach function that removes every listener and clears the timer.
export function attachSettle(controllerApi) {
  const state = controllerApi.getState();
  const lenis = state.lenis;
  if (!lenis) return function noop() {};

  let timer = null;
  let lastScrollAt = 0;
  let lastY = lenis.scroll;
  let burstActive = false; // a scroll burst is waiting to settle
  let burstFocusEl = null; // focusin target recorded at the burst's first scroll event
  let focusEl = null;
  let focusAt = -Infinity;
  let mouseHeld = false;
  let touches = 0;
  let deferred = false; // a settle was skipped or cancelled because of a hold
  const targetArgs = { points: null, scroll: 0, focusIndex: null, epsilon: SNAP_POSITION_EPSILON_PX };

  function schedule(delay) {
    if (timer === null) timer = setTimeout(onTimer, delay);
  }

  // Note a scroll that may need a settle. Starts the burst on its first call.
  function noteScroll() {
    const now = performance.now();
    lastScrollAt = now;
    if (!burstActive) {
      burstActive = true;
      burstFocusEl = focusEl !== null && now >= focusAt && now - focusAt <= SNAP_FOCUS_WINDOW_MS ? focusEl : null;
    }
    schedule(SNAP_SETTLE_DEBOUNCE_MS);
  }

  function onScroll() {
    if (controllerApi.isCancelling()) return;
    const y = lenis.scroll;
    const moved = y !== lastY;
    lastY = y;
    if (state.moving) {
      // A healthy snap move is ignored. If Lenis stopped its animation for a native touch
      // scroll (isScrolling 'native', animate not running) the move is stalled: count the
      // scroll so the timer can recover it and settle.
      const animate = lenis.animate;
      if (animate && !animate.isRunning && lenis.isScrolling === 'native') noteScroll();
      return;
    }
    if (!moved) return; // Lenis re-emits at rest (velocity reset, start/stop): not a scroll
    const index = nearestIndex(state.points, y);
    if (index !== state.index) controllerApi.setDisplayedIndex(index);
    noteScroll();
  }

  function onTimer() {
    timer = null;
    const wait = lastScrollAt + SNAP_SETTLE_DEBOUNCE_MS - performance.now();
    if (wait > 1) {
      timer = setTimeout(onTimer, wait); // more scroll events arrived: keep waiting
      return;
    }
    controllerApi.recoverStalledMove();
    if (!state.active || state.moving || state.points.length === 0) {
      burstActive = false;
      burstFocusEl = null;
      return;
    }
    if (mouseHeld || touches > 0) {
      deferred = true; // release re-arms
      return;
    }
    let focusIndex = null;
    if (burstFocusEl !== null) {
      const found = controllerApi.indexOfElement(burstFocusEl);
      if (found >= 0) focusIndex = found;
    }
    burstActive = false;
    burstFocusEl = null;
    targetArgs.points = state.points;
    targetArgs.scroll = lenis.scroll;
    targetArgs.focusIndex = focusIndex;
    const target = settleTarget(targetArgs);
    if (target === null) return;
    controllerApi.settleTo(target);
  }

  // Re-arm a deferred settle after a hold ended.
  function release() {
    if (!deferred || mouseHeld || touches > 0) return;
    deferred = false;
    burstActive = true;
    lastScrollAt = performance.now();
    schedule(SNAP_SETTLE_DEBOUNCE_MS);
  }

  function userTakeover() {
    if (controllerApi.cancelSettleMove()) {
      deferred = true;
      burstActive = true;
    }
  }

  function onMouseDown() {
    mouseHeld = true;
    userTakeover();
  }
  function onMouseUp() {
    mouseHeld = false;
    release();
  }
  function onTouchStart(event) {
    touches = event.touches.length;
    userTakeover();
  }
  function onTouchEnd(event) {
    touches = event.touches.length;
    release();
  }
  function onReset() {
    mouseHeld = false;
    touches = 0;
    release();
  }
  function onVisibility() {
    if (document.hidden) onReset();
  }
  function onFocusIn(event) {
    focusEl = event.target;
    focusAt = performance.now();
  }

  armImpl = function arm() {
    burstActive = true;
    burstFocusEl = null;
    lastScrollAt = performance.now();
    schedule(SNAP_SETTLE_DEBOUNCE_MS);
  };

  const offScroll = lenis.on('scroll', onScroll);
  document.addEventListener('mousedown', onMouseDown, LISTENER_OPTIONS);
  document.addEventListener('mouseup', onMouseUp, LISTENER_OPTIONS);
  document.addEventListener('touchstart', onTouchStart, LISTENER_OPTIONS);
  document.addEventListener('touchend', onTouchEnd, LISTENER_OPTIONS);
  document.addEventListener('touchcancel', onTouchEnd, LISTENER_OPTIONS);
  document.addEventListener('focusin', onFocusIn, LISTENER_OPTIONS);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('blur', onReset);
  controllerApi.adjustListenerCount(LISTENER_COUNT);

  return function detachSettle() {
    offScroll();
    document.removeEventListener('mousedown', onMouseDown, LISTENER_OPTIONS);
    document.removeEventListener('mouseup', onMouseUp, LISTENER_OPTIONS);
    document.removeEventListener('touchstart', onTouchStart, LISTENER_OPTIONS);
    document.removeEventListener('touchend', onTouchEnd, LISTENER_OPTIONS);
    document.removeEventListener('touchcancel', onTouchEnd, LISTENER_OPTIONS);
    document.removeEventListener('focusin', onFocusIn, LISTENER_OPTIONS);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('blur', onReset);
    if (timer !== null) clearTimeout(timer);
    timer = null;
    armImpl = null;
    focusEl = null;
    burstFocusEl = null;
    controllerApi.adjustListenerCount(-LISTENER_COUNT);
  };
}
