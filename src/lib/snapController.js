// Snap controller core (spec 005, plan D-A/D-B): section points, moves, retarget, resync.
// Framework-free. Wheel/key input (snapInput.js, T-19) attaches in setActive(true) and
// detaches in setActive(false); idle settle (snapSettle.js, T-22) attaches and detaches the
// same way. Layout reads (getBoundingClientRect) happen only in
// refresh(), which callers invoke from observer/event callbacks. Never moves or
// removes focus.
import { SNAP_DURATION_S, SNAP_POSITION_EPSILON_PX } from './snapConfig.js';
import { attachInput } from './snapInput.js';
import { easeInOutCubic, nearestIndex } from './snapMath.js';
import { armSettle, attachSettle } from './snapSettle.js';
import { snapStore } from './snapStore.js';

const SECTION_SELECTOR = '[data-snap-section]';

// One mutable state object, returned by getState() so hot paths allocate nothing.
// Treat it as read-only outside this file.
const state = {
  lenis: null,
  active: false,
  index: 0, // section the page rests on (destination while moving)
  points: [], // snap tops in px, DOM order, first forced to 0
  elements: [], // [data-snap-section] elements, same order
  labels: [],
  limit: 0, // max scroll in px, cached by readPoints()
  moving: null, // null or { kind: 'input' | 'click' | 'settle' | 'resync', toIndex }
  moveEndAt: -Infinity,
};

let token = 0; // bumped on every new move or cancel; stale onComplete calls are ignored
let cancelling = false; // true while our own stop()/start() emits scroll events
let moves = 0;
let settles = 0;
let detachInput = null; // set while wheel/key input is attached (snapInput.js)
let detachSettle = null; // set while idle settle is attached (snapSettle.js)
let detachRefresh = null; // set while refresh triggers (observers, resize, fonts) are attached
let listenerCount = 0; // bumped by input/settle/observer code via adjustListenerCount

function clampTop(y) {
  // Limit cached by the last readPoints(); no layout read here.
  return Math.min(Math.max(y, 0), state.limit);
}

// Cancel a running move in place, leaving the page where it is.
// scrollTo(lenis.scroll, { immediate: true }) does NOT work for this: Lenis 1.3.27
// returns early at `target === this.targetScroll` (programmatic moves keep
// targetScroll equal to the animated value), before the immediate branch runs, so the
// animation keeps going. stop() runs reset() (kills the animation, clears the lock,
// syncs to the real scroll) and start() resumes it in the same call.
// Scroll events emitted by this pair are flagged via isCancelling().
function cancelInPlace() {
  token += 1; // any pending onComplete of the cancelled move is now stale
  if (!state.lenis) return;
  cancelling = true;
  state.lenis.stop();
  state.lenis.start();
  cancelling = false;
}

function finishMove(myToken) {
  if (myToken !== token || !state.moving) return;
  const { toIndex } = state.moving;
  state.moving = null;
  state.moveEndAt = performance.now();
  state.index = toIndex;
  snapStore.set({ index: toIndex });
}

// Safeguard: if Lenis stopped our animation without calling onComplete (for example a
// native touch scroll, where onVirtualScroll calls animate.stop()), the move would stay
// "moving" forever and block all input. Called at the start of each input event; a
// healthy move always has animate.isRunning true until its onComplete has fired.
function recoverStalledMove() {
  const { lenis } = state;
  if (!state.moving || !lenis || !lenis.animate || lenis.animate.isRunning) return;
  token += 1; // invalidate the lost move's onComplete
  state.moving = null;
  state.moveEndAt = performance.now();
  state.index = nearestIndex(state.points, lenis.scroll);
  snapStore.set({ index: state.index });
}

// Issue the Lenis animation to points[toIndex]. A call while another move runs
// simply replaces it (Lenis restarts from the current animated position).
function issueMove(toIndex, kind, count) {
  const top = clampTop(state.points[toIndex]);
  token += 1;
  const myToken = token;
  state.moving = { kind, toIndex };
  state.index = toIndex;
  snapStore.set({ index: toIndex });
  if (count) {
    moves += 1;
    if (kind === 'settle') settles += 1;
  }
  state.lenis.scrollTo(top, {
    duration: SNAP_DURATION_S,
    easing: easeInOutCubic,
    lock: false,
    onComplete: () => finishMove(myToken),
  });
}

function jumpTo(toIndex) {
  if (state.moving) cancelInPlace();
  state.moving = null;
  state.index = toIndex;
  snapStore.set({ index: toIndex });
  state.lenis.scrollTo(clampTop(state.points[toIndex]), { immediate: true });
}

// Re-read sections and their tops. The only function that reads layout.
function readPoints() {
  const { lenis } = state;
  if (!lenis) return;
  const nodes = document.querySelectorAll(SECTION_SELECTOR);
  const elements = [];
  const points = [];
  const labels = [];
  const scroll = lenis.scroll;
  // Lenis caches its dimensions and refreshes them on a 250 ms debounce (lenis.mjs
  // 153-166, 195-200), and scrollTo clamps to that cache (802). Refresh the cache now,
  // without lenis.resize() (it resets targetScroll and emits a scroll event), then
  // compute our own fresh limit for the points and for clampTop.
  if (lenis.dimensions && typeof lenis.dimensions.resize === 'function') {
    lenis.dimensions.resize();
  }
  const limit = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );
  state.limit = limit;
  for (let i = 0; i < nodes.length; i += 1) {
    const el = nodes[i];
    elements.push(el);
    labels.push(el.getAttribute('data-snap-label') || '');
    const top = i === 0 ? 0 : el.getBoundingClientRect().top + scroll;
    points.push(Math.min(Math.max(top, 0), limit));
  }
  state.elements = elements;
  state.points = points;
  state.labels = labels;
  if (state.index > points.length - 1) state.index = Math.max(0, points.length - 1);
  if (state.active) snapStore.set({ labels, index: state.index });
}

// Public refresh: re-read, then apply the resync rule. Call from observer/event callbacks.
function refresh() {
  readPoints();
  resync();
}

// After points changed: idle -> instant re-align if off by more than epsilon;
// moving -> reissue the animation to the updated target.
function resync() {
  const { lenis, points } = state;
  if (!state.active || !lenis || points.length === 0) return;
  if (state.moving) {
    const toIndex = Math.min(state.moving.toIndex, points.length - 1);
    issueMove(toIndex, state.moving.kind, false);
    return;
  }
  const index = Math.min(state.index, points.length - 1);
  state.index = index;
  if (Math.abs(lenis.scroll - clampTop(points[index])) > SNAP_POSITION_EPSILON_PX) {
    jumpTo(index);
  }
}

function resolveIndex(target) {
  if (typeof target === 'number') {
    if (!Number.isInteger(target) || target < 0 || target >= state.points.length) return -1;
    return target;
  }
  if (target && typeof target.closest === 'function') {
    const section = target.closest(SECTION_SELECTOR);
    return section ? state.elements.indexOf(section) : -1;
  }
  return -1;
}

// Go to a section: index, snap element, or any element inside one. Unknown target is a
// no-op. Always accepted while active (a click retargets a running move).
function goTo(target, { immediate = false, kind = 'click' } = {}) {
  if (!state.active || !state.lenis) return false;
  const index = resolveIndex(target);
  if (index < 0) return false;
  if (immediate) jumpTo(index);
  else issueMove(index, kind, true);
  return true;
}

// Index of the snap section containing an element, or -1.
function indexOfElement(el) {
  return resolveIndex(el);
}

// Settle (snapSettle.js): animate to a section with the normal snap move, kind 'settle'.
function settleTo(index) {
  if (!state.active || !state.lenis || state.moving) return false;
  if (index < 0 || index >= state.points.length) return false;
  issueMove(index, 'settle', true);
  return true;
}

// Settle (snapSettle.js): the user took over (mousedown/touchstart). Cancels a running
// settle move in place; any other move kind is left alone. Returns true if it cancelled.
function cancelSettleMove() {
  if (!state.moving || state.moving.kind !== 'settle') return false;
  cancelInPlace();
  state.moving = null;
  state.index = nearestIndex(state.points, state.lenis.scroll);
  snapStore.set({ index: state.index });
  return true;
}

// Settle (snapSettle.js): arrows follow the live scroll while idle.
function setDisplayedIndex(index) {
  state.index = index;
  snapStore.set({ index });
}

// Refresh triggers (T-23): body and section size changes, window resize, web fonts ready.
// All run in observer/event/promise callbacks, so the layout reads in refresh() are allowed.
// One ResizeObserver (body + each section) and one window listener; the fonts promise
// cannot be cancelled, so a disposed flag makes a late resolution a no-op.
const OBSERVER_LISTENER_COUNT = 2; // 1 ResizeObserver + 1 window resize listener

function attachRefreshTriggers() {
  let disposed = false;
  const onTrigger = () => {
    if (!disposed) refresh();
  };
  const observer = new ResizeObserver(onTrigger);
  observer.observe(document.body);
  for (let i = 0; i < state.elements.length; i += 1) observer.observe(state.elements[i]);
  window.addEventListener('resize', onTrigger);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onTrigger);
  listenerCount += OBSERVER_LISTENER_COUNT;
  return function detachRefreshTriggers() {
    disposed = true;
    observer.disconnect();
    window.removeEventListener('resize', onTrigger);
    listenerCount -= OBSERVER_LISTENER_COUNT;
  };
}

function setActive(next) {
  const active = Boolean(next);
  if (active === state.active) return;
  if (!active) {
    if (detachRefresh) {
      detachRefresh();
      detachRefresh = null;
    }
    if (detachSettle) {
      detachSettle();
      detachSettle = null;
    }
    if (detachInput) {
      detachInput();
      detachInput = null;
    }
    if (state.moving) cancelInPlace();
    state.moving = null;
    state.active = false;
    state.index = 0;
    snapStore.set({ active: false, index: 0, labels: [] });
    return;
  }
  if (!state.lenis) return;
  state.active = true;
  readPoints(); // not refresh(): resync would use the stale index, the nearest one is set below
  state.index = nearestIndex(state.points, state.lenis.scroll);
  snapStore.set({ active: true, index: state.index, labels: state.labels });
  // Activation re-align (FR-11): jump without animation to the section most in view.
  if (
    state.points.length > 0 &&
    Math.abs(state.lenis.scroll - clampTop(state.points[state.index])) > SNAP_POSITION_EPSILON_PX
  ) {
    jumpTo(state.index);
  }
  detachInput = attachInput(snapController);
  detachSettle = attachSettle(snapController);
  detachRefresh = attachRefreshTriggers();
  armSettle(); // settles (animated) only if the re-align left the page off a snap point
}

function attach(lenis) {
  if (lenis === state.lenis) return;
  if (state.active) setActive(false);
  state.lenis = lenis || null;
  if (!state.lenis) {
    state.points = [];
    state.elements = [];
    state.labels = [];
  }
}

function getSection(i) {
  return state.elements[i] || null;
}

function getState() {
  return state;
}

function isCancelling() {
  return cancelling;
}

// Input/settle/observer modules call this when they add (+n) or remove (-n) listeners.
function adjustListenerCount(delta) {
  listenerCount += delta;
}

export const snapController = {
  attach,
  setActive,
  refresh,
  resync,
  goTo,
  getSection,
  getState,
  cancelInPlace,
  recoverStalledMove,
  indexOfElement,
  settleTo,
  cancelSettleMove,
  setDisplayedIndex,
  isCancelling,
  adjustListenerCount,
};

if (import.meta.env.DEV) {
  window.__snapInfo = () => ({
    active: state.active,
    index: state.index,
    moving: state.moving,
    points: state.points.slice(),
    moves,
    settles,
    listeners: listenerCount,
  });
}
