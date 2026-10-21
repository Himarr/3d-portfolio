import assert from 'node:assert/strict';
import * as S from '../src/lib/snapConfig.js';
import {
  easeInOutCubic,
  nearestIndex,
  stepIndex,
  normaliseWheelDelta,
  settleTarget,
  classifyWheel,
  shouldHandleKey,
} from '../src/lib/snapMath.js';
import {
  STAR_SCROLL_PARALLAX_FACTOR,
  starOffsets,
  coversViewport,
} from '../src/three/starScroll.js';
import { starCountFor, createStarPositions } from '../src/three/starfield.js';

let passes = 0;
function check(name, fn) {
  fn();
  passes += 1;
  console.log(`pass: ${name}`);
}

check('ease endpoints are exactly 0 and 1', () => {
  assert.equal(easeInOutCubic(0), 0);
  assert.equal(easeInOutCubic(1), 1);
  assert.equal(easeInOutCubic(-0.5), 0);
  assert.equal(easeInOutCubic(1.5), 1);
  assert.equal(easeInOutCubic(0.5), 0.5);
});

check('ease is monotonic non-decreasing', () => {
  let prev = 0;
  for (let i = 0; i <= 1000; i += 1) {
    const v = easeInOutCubic(i / 1000);
    assert.ok(v >= prev, `not monotonic at ${i}`);
    prev = v;
  }
});

const points = [0, 1000, 2000, 3000];

check('nearestIndex at both ends and inside', () => {
  assert.equal(nearestIndex(points, -50), 0);
  assert.equal(nearestIndex(points, 0), 0);
  assert.equal(nearestIndex(points, 1100), 1);
  assert.equal(nearestIndex(points, 2900), 3);
  assert.equal(nearestIndex(points, 99999), 3);
});

check('nearestIndex ties go to the lower index', () => {
  assert.equal(nearestIndex(points, 500), 0);
  assert.equal(nearestIndex(points, 1500), 1);
  assert.equal(nearestIndex(points, 2500), 2);
});

check('stepIndex steps and clamps at both ends', () => {
  assert.equal(stepIndex(0, 1, 3), 1);
  assert.equal(stepIndex(2, 1, 3), 3);
  assert.equal(stepIndex(3, 1, 3), 3);
  assert.equal(stepIndex(3, -1, 3), 2);
  assert.equal(stepIndex(0, -1, 3), 0);
  assert.equal(stepIndex(0, 1, 0), 0);
});

check('normaliseWheelDelta handles pixel, line and page modes', () => {
  assert.equal(normaliseWheelDelta({ deltaY: 100, deltaMode: 0 }, 900), 100);
  assert.equal(normaliseWheelDelta({ deltaY: 3, deltaMode: 1 }, 900), 48);
  assert.equal(normaliseWheelDelta({ deltaY: 1, deltaMode: 2 }, 900), 900);
  assert.equal(normaliseWheelDelta({ deltaY: -2, deltaMode: 1 }, 900), -32);
});

check('settleTarget returns the nearest index', () => {
  assert.equal(settleTarget({ points, scroll: 1400, focusIndex: null, epsilon: 1 }), 1);
  assert.equal(settleTarget({ points, scroll: 1600, focusIndex: undefined, epsilon: 1 }), 2);
});

check('settleTarget focus index overrides nearest', () => {
  assert.equal(settleTarget({ points, scroll: 1100, focusIndex: 3, epsilon: 1 }), 3);
  assert.equal(settleTarget({ points, scroll: 1100, focusIndex: 0, epsilon: 1 }), 0);
});

check('settleTarget is a no-op within epsilon', () => {
  assert.equal(settleTarget({ points, scroll: 1000, focusIndex: null, epsilon: 1 }), null);
  assert.equal(settleTarget({ points, scroll: 1000.9, focusIndex: null, epsilon: 1 }), null);
  assert.equal(settleTarget({ points, scroll: 1001.5, focusIndex: null, epsilon: 1 }), 1);
  assert.equal(settleTarget({ points, scroll: 2000, focusIndex: 2, epsilon: 1 }), null);
});

check('SNAP_QUERY matches the two threshold constants', () => {
  assert.equal(
    S.SNAP_QUERY,
    `(min-width: ${S.SNAP_MIN_WIDTH_PX}px) and (min-height: ${S.SNAP_MIN_HEIGHT_PX}px)`,
  );
  assert.equal(S.SNAP_QUERY, '(min-width: 1024px) and (min-height: 700px)');
});

check('snap constants have the specified defaults', () => {
  assert.equal(S.SNAP_DURATION_S, 1.0);
  assert.equal(S.SNAP_COOLDOWN_MS, 200);
  assert.equal(S.SNAP_GESTURE_GAP_MS, 100);
  assert.equal(S.SNAP_NEW_GESTURE_RATIO, 2);
  assert.equal(S.SNAP_NEW_GESTURE_MIN_DELTA, 40);
  assert.equal(S.SNAP_WHEEL_NOISE_DELTA, 2);
  assert.equal(S.SNAP_SETTLE_DEBOUNCE_MS, 200);
  assert.equal(S.SNAP_POSITION_EPSILON_PX, 1);
  assert.equal(S.SNAP_FOCUS_WINDOW_MS, 600);
});

// ---- classifyWheel -------------------------------------------------------------

const baseWheel = { deltaX: 0, deltaY: 100, ctrlKey: false, moving: false };
const wheel = (o) => classifyWheel({ ...baseWheel, absDelta: Math.abs(o.deltaY ?? 100), ...o });

check('classifyWheel: a notched wheel is accepted twice, 200 ms apart', () => {
  assert.equal(wheel({ now: 1000, lastWheelAt: -Infinity, lastAbsDelta: 0 }), 'move');
  assert.equal(wheel({ now: 1200, lastWheelAt: 1000, lastAbsDelta: 100 }), 'move');
});

check('classifyWheel: 10 events at 50 ms during a move are all ignored', () => {
  let last = 1000;
  for (let i = 1; i <= 10; i += 1) {
    const now = 1000 + i * 50;
    assert.equal(wheel({ now, lastWheelAt: last, lastAbsDelta: 100, moving: true }), 'ignore');
    last = now;
  }
});

// Drives classifyWheel like the input handler: a move lasts SNAP_DURATION_S.
function runStream(events) {
  let lastWheelAt = -Infinity;
  let lastAbsDelta = 0;
  let moveEndAt = -Infinity;
  let moveStart = null;
  const moves = [];
  for (const { t, d } of events) {
    if (moveStart !== null && t >= moveStart + S.SNAP_DURATION_S * 1000) {
      moveEndAt = moveStart + S.SNAP_DURATION_S * 1000;
      moveStart = null;
    }
    const verdict = wheel({
      now: t,
      lastWheelAt,
      lastAbsDelta,
      moveEndAt,
      moving: moveStart !== null,
      deltaY: d,
    });
    if (verdict === 'move') {
      moves.push(t);
      moveStart = t;
    }
    lastWheelAt = t;
    lastAbsDelta = Math.abs(d);
  }
  return moves;
}

const trackpad = (t0) =>
  Array.from({ length: 60 }, (_, i) => ({
    t: t0 + Math.round((i * 1500) / 59),
    d: Math.max(3, Math.round(120 * Math.pow(0.93, i))),
  }));

check('classifyWheel: a 60-event decaying trackpad stream yields exactly one move', () => {
  assert.equal(runStream(trackpad(0)).length, 1);
});

check('classifyWheel: a second gesture after a 150 ms pause yields one more move', () => {
  const first = trackpad(0);
  const end = first[first.length - 1].t;
  const moves = runStream([...first, ...trackpad(end + 150)]);
  assert.equal(moves.length, 2);
});

check('classifyWheel: a rising flick on a tail (2x and above 40) moves', () => {
  assert.equal(wheel({ now: 1020, lastWheelAt: 1000, lastAbsDelta: 20, deltaY: 50 }), 'move');
  assert.equal(wheel({ now: 1020, lastWheelAt: 1000, lastAbsDelta: 20, deltaY: 39 }), 'ignore');
  assert.equal(wheel({ now: 1020, lastWheelAt: 1000, lastAbsDelta: 80, deltaY: 100 }), 'ignore');
});

check('classifyWheel: cooldown after a move end ignores a new gesture', () => {
  assert.equal(wheel({ now: 1100, lastWheelAt: 0, lastAbsDelta: 100, moveEndAt: 1000 }), 'ignore');
  assert.equal(wheel({ now: 1200, lastWheelAt: 0, lastAbsDelta: 100, moveEndAt: 1000 }), 'move');
});

check('classifyWheel: noise, Ctrl and horizontal wheel pass to the browser', () => {
  assert.equal(wheel({ now: 1000, deltaY: 1 }), 'pass');
  assert.equal(wheel({ now: 1000, ctrlKey: true }), 'pass');
  assert.equal(wheel({ now: 1000, deltaX: 80, deltaY: 20, absDelta: 80 }), 'pass');
  assert.equal(wheel({ now: 1000, moving: true, ctrlKey: true }), 'pass');
});

// ---- shouldHandleKey -----------------------------------------------------------

const keyBase = {
  key: '',
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  defaultPrevented: false,
  repeat: false,
  targetTag: 'body',
  targetRole: null,
  isContentEditable: false,
};
const key = (o) => shouldHandleKey({ ...keyBase, ...o });
const NONE = { action: null, preventOnly: false };
const handled = (action) => ({ action, preventOnly: false });

check('shouldHandleKey: key to action map', () => {
  const map = [
    [{ key: 'PageDown' }, 'next'],
    [{ key: 'ArrowDown' }, 'next'],
    [{ key: ' ' }, 'next'],
    [{ key: 'PageUp' }, 'prev'],
    [{ key: 'ArrowUp' }, 'prev'],
    [{ key: ' ', shiftKey: true }, 'prev'],
    [{ key: 'Home' }, 'first'],
    [{ key: 'End' }, 'last'],
  ];
  for (const [input, action] of map) {
    assert.deepEqual(key(input), handled(action), JSON.stringify(input));
  }
  assert.deepEqual(key({ key: 'a' }), NONE);
  assert.deepEqual(key({ key: 'Enter' }), NONE);
});

check('shouldHandleKey: Ctrl, Alt, Meta and defaultPrevented are skipped', () => {
  assert.deepEqual(key({ key: 'PageDown', ctrlKey: true }), NONE);
  assert.deepEqual(key({ key: 'ArrowDown', altKey: true }), NONE);
  assert.deepEqual(key({ key: 'Home', metaKey: true }), NONE);
  assert.deepEqual(key({ key: 'End', defaultPrevented: true }), NONE);
});

check('shouldHandleKey: text fields and contenteditable are skipped', () => {
  for (const targetTag of ['input', 'textarea', 'select', 'INPUT']) {
    assert.deepEqual(key({ key: 'ArrowDown', targetTag }), NONE, targetTag);
    assert.deepEqual(key({ key: ' ', targetTag }), NONE, targetTag);
    assert.deepEqual(key({ key: 'Home', targetTag }), NONE, targetTag);
  }
  assert.deepEqual(key({ key: 'PageDown', isContentEditable: true }), NONE);
});

check('shouldHandleKey: Space on button/summary/checkbox is skipped, arrows are not', () => {
  assert.deepEqual(key({ key: ' ', targetTag: 'button' }), NONE);
  assert.deepEqual(key({ key: ' ', shiftKey: true, targetTag: 'button' }), NONE);
  assert.deepEqual(key({ key: ' ', targetTag: 'summary' }), NONE);
  assert.deepEqual(key({ key: ' ', targetTag: 'div', targetRole: 'checkbox' }), NONE);
  assert.deepEqual(key({ key: 'ArrowDown', targetTag: 'button' }), handled('next'));
  assert.deepEqual(key({ key: 'PageDown', targetTag: 'button' }), handled('next'));
});

check('shouldHandleKey: arrows on widget roles are skipped, other keys are not', () => {
  const roles = ['slider', 'menu', 'menuitem', 'tab', 'tablist', 'listbox', 'option', 'radio', 'spinbutton', 'combobox', 'textbox'];
  for (const targetRole of roles) {
    assert.deepEqual(key({ key: 'ArrowDown', targetRole }), NONE, targetRole);
    assert.deepEqual(key({ key: 'ArrowUp', targetRole }), NONE, targetRole);
    assert.deepEqual(key({ key: 'PageDown', targetRole }), handled('next'), targetRole);
  }
  assert.deepEqual(key({ key: 'ArrowDown', targetRole: 'link' }), handled('next'));
});

check('shouldHandleKey: repeat gives preventOnly and no action', () => {
  const swallow = { action: null, preventOnly: true };
  assert.deepEqual(key({ key: 'PageDown', repeat: true }), swallow);
  assert.deepEqual(key({ key: ' ', repeat: true }), swallow);
  assert.deepEqual(key({ key: 'a', repeat: true }), NONE);
  assert.deepEqual(key({ key: 'ArrowDown', repeat: true, targetTag: 'input' }), NONE);
});

// ---- star wrap (starScroll.js, starfield.js) -----------------------------------

check('coversViewport is true on a grid of scroll, size and drift', () => {
  const out = { dx: 0, dy: 0 };
  const sizes = [[375, 812], [1440, 900], [1920, 1080]];
  for (const [W, H] of sizes) {
    for (let scroll = 0; scroll <= 20000; scroll += 137) {
      for (let k = 0; k < 1000; k += 111) {
        const drift = k / 1000;
        starOffsets(scroll, STAR_SCROLL_PARALLAX_FACTOR, W, H, drift, out);
        assert.ok(coversViewport(W, H, out.dx, out.dy), `${W}x${H} s=${scroll} d=${drift}`);
      }
      starOffsets(scroll, STAR_SCROLL_PARALLAX_FACTOR, W, H, 0.999, out);
      assert.ok(coversViewport(W, H, out.dx, out.dy));
    }
  }
  assert.equal(coversViewport(100, 100, 150, 0), false);
  assert.equal(coversViewport(100, 100, 0, -1), false);
});

check('starOffsets stays in range, reuses out and shifts at most the factor', () => {
  const out = { dx: 0, dy: 0 };
  const W = 1440;
  const H = 900;
  assert.equal(STAR_SCROLL_PARALLAX_FACTOR, 0.15);
  assert.equal(starOffsets(0, 0.15, W, H, 0.25, out), out);
  assert.equal(out.dx, 360);
  assert.equal(out.dy, 0);
  let prev = null;
  for (let scroll = -500; scroll <= 20000; scroll += 7) {
    starOffsets(scroll, STAR_SCROLL_PARALLAX_FACTOR, W, H, 0.5, out);
    assert.ok(out.dx >= 0 && out.dx < W, `dx ${out.dx}`);
    assert.ok(out.dy >= 0 && out.dy < H, `dy ${out.dy}`);
    if (prev !== null) {
      // modular distance (the wrap itself is a seamless jump of exactly H)
      let d = Math.abs(out.dy - prev);
      d = Math.min(d, H - d);
      assert.ok(d <= STAR_SCROLL_PARALLAX_FACTOR * 7 + 1e-9, `shift ${d} at ${scroll}`);
    }
    prev = out.dy;
  }
});

check('starCountFor caps at 2000 and 800 and grows with area', () => {
  assert.equal(starCountFor(1440, 900, 2000, 500), Math.round((500 * 1440 * 900) / 1e6));
  assert.equal(starCountFor(7680, 4320, 2000, 500), 2000);
  assert.equal(starCountFor(1920, 1080, 800, 500), 800);
  assert.ok(starCountFor(375, 812, 800, 500) <= 800);
  let prev = 0;
  for (let w = 200; w <= 4000; w += 100) {
    const n = starCountFor(w, w * 0.6, 2000, 500);
    assert.ok(n >= prev, `not monotonic at ${w}`);
    assert.ok(n <= 2000);
    prev = n;
  }
});

check('createStarPositions prefix is stable across counts', () => {
  const small = createStarPositions(200);
  const big = createStarPositions(2000);
  assert.equal(big.length, 6000);
  for (let i = 0; i < small.length; i += 1) assert.equal(small[i], big[i]);
});

console.log(`check-snap:${passes} checks passed`);
