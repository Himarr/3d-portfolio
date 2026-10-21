import assert from 'node:assert/strict';
import * as C from '../src/three/celConstants.js';
import { computeOutlineRegion } from '../src/three/outlineRegion.js';

let passes = 0;
function check(name, fn) {
  fn();
  passes += 1;
  console.log(`pass: ${name}`);
}

const HEX = /^#[0-9a-fA-F]{6}$/;

check('thresholds strictly descending (spot > lit > shadow1)', () => {
  assert.ok(C.CEL_THRESHOLD_LIGHT_SPOT > C.CEL_THRESHOLD_LIT);
  assert.ok(C.CEL_THRESHOLD_LIT > C.CEL_THRESHOLD_SHADOW1);
});

check('multipliers in (0, 1] and ordered lit >= shadow1 >= shadow2', () => {
  for (const m of [C.CEL_LIT_MULTIPLIER, C.CEL_SHADOW1_MULTIPLIER, C.CEL_SHADOW2_MULTIPLIER]) {
    assert.ok(m > 0 && m <= 1, `multiplier ${m}`);
  }
  assert.ok(C.CEL_LIT_MULTIPLIER >= C.CEL_SHADOW1_MULTIPLIER);
  assert.ok(C.CEL_SHADOW1_MULTIPLIER >= C.CEL_SHADOW2_MULTIPLIER);
});

check('light direction has 3 finite numbers and non-zero length', () => {
  const d = C.CEL_LIGHT_DIRECTION;
  assert.ok(Array.isArray(d) && d.length === 3);
  for (const v of d) assert.ok(typeof v === 'number' && Number.isFinite(v));
  assert.ok(Math.hypot(d[0], d[1], d[2]) > 0);
});

check('OUTLINE_THICKNESS_CSS_PX > 0', () => {
  assert.ok(C.OUTLINE_THICKNESS_CSS_PX > 0);
});

check('OUTLINE_INNER_SILHOUETTE_MARGIN is a number >= 0', () => {
  assert.ok(typeof C.OUTLINE_INNER_SILHOUETTE_MARGIN === 'number');
  assert.ok(C.OUTLINE_INNER_SILHOUETTE_MARGIN >= 0);
});

check('OUTLINE_INNER_GRAZING_Z is a number in [0, 1]', () => {
  assert.ok(typeof C.OUTLINE_INNER_GRAZING_Z === 'number');
  assert.ok(C.OUTLINE_INNER_GRAZING_Z >= 0 && C.OUTLINE_INNER_GRAZING_Z <= 1);
});

check('OUTLINE_INNER_SHADOW_ONLY is boolean', () => {
  assert.equal(typeof C.OUTLINE_INNER_SHADOW_ONLY, 'boolean');
});

check('OUTLINE_INNER_SHADOW_THRESHOLD is a number in [-1, 1]', () => {
  assert.ok(typeof C.OUTLINE_INNER_SHADOW_THRESHOLD === 'number');
  assert.ok(C.OUTLINE_INNER_SHADOW_THRESHOLD >= -1 && C.OUTLINE_INNER_SHADOW_THRESHOLD <= 1);
});

check('CEL_BAND_AA_PX >= 0', () => {
  assert.ok(C.CEL_BAND_AA_PX >= 0);
});

check('colours match #RRGGBB', () => {
  assert.match(C.CEL_LIGHT_SPOT_COLOR, HEX);
  assert.match(C.OUTLINE_COLOR, HEX);
});

const canvases = [
  { w: 1440, h: 900 },
  { w: 1440, h: 6000 },
  { w: 375, h: 4500 },
];
const dprs = [1, 1.5, 2];
const radii = [60, 180, 450];
const positions = (w, h) => [
  { x: 0, y: 0 },
  { x: w * 0.23 + 0.37, y: -h * 0.11 + 0.123 },
  { x: -w * 0.31 - 0.71, y: h * 0.27 + 0.456 },
  { x: w * 0.4, y: h * 0.4 - 0.9 },
];

function region(canvas, dpr, radius, pos) {
  return computeOutlineRegion({
    x: pos.x,
    y: pos.y,
    radius,
    boundsFactor: C.OUTLINE_BOUNDS_FACTOR,
    thicknessCssPx: C.OUTLINE_THICKNESS_CSS_PX,
    padCssPx: C.OUTLINE_PAD_CSS_PX,
    dpr,
    rtScale: C.OUTLINE_RT_SCALE,
    maxTexels: C.OUTLINE_MAX_TEXELS,
    canvasWidth: canvas.w,
    canvasHeight: canvas.h,
  });
}

const EPS = 1e-6;
for (const canvas of canvases) {
  for (const dpr of dprs) {
    for (const radius of radii) {
      positions(canvas.w, canvas.h).forEach((pos, i) => {
        const name = `region ${canvas.w}x${canvas.h} dpr ${dpr} r ${radius} pos#${i}`;
        check(name, () => {
          const r = region(canvas, dpr, radius, pos);
          assert.ok(Number.isInteger(r.texels), `texels ${r.texels}`);
          assert.equal(r.texels % 2, 0, `texels ${r.texels} not even`);
          assert.ok(r.texels <= C.OUTLINE_MAX_TEXELS, `texels ${r.texels} > max`);
          const px = (r.centerX + canvas.w / 2) * r.rtDpr;
          const py = (r.centerY + canvas.h / 2) * r.rtDpr;
          assert.ok(Math.abs(px - Math.round(px)) < EPS, `centre x ${px} not integer`);
          assert.ok(Math.abs(py - Math.round(py)) < EPS, `centre y ${py} not integer`);
          assert.equal(r.thicknessDev, C.OUTLINE_THICKNESS_CSS_PX * r.rtDpr);
        });
      });
    }
  }
}

for (const dpr of dprs) {
  for (const radius of radii) {
    check(`texels independent of canvas height (900 vs 6000) dpr ${dpr} r ${radius}`, () => {
      const pos = { x: 123.4, y: -56.7 };
      const a = region({ w: 1440, h: 900 }, dpr, radius, pos);
      const b = region({ w: 1440, h: 6000 }, dpr, radius, pos);
      assert.equal(a.texels, b.texels);
    });
  }
}

const regionParams = (canvas, dpr, radius, pos) => ({
  x: pos.x,
  y: pos.y,
  radius,
  boundsFactor: C.OUTLINE_BOUNDS_FACTOR,
  thicknessCssPx: C.OUTLINE_THICKNESS_CSS_PX,
  padCssPx: C.OUTLINE_PAD_CSS_PX,
  dpr,
  rtScale: C.OUTLINE_RT_SCALE,
  maxTexels: C.OUTLINE_MAX_TEXELS,
  canvasWidth: canvas.w,
  canvasHeight: canvas.h,
});

for (const canvas of canvases) {
  for (const dpr of dprs) {
    for (const radius of radii) {
      check(`out form matches allocating form ${canvas.w}x${canvas.h} dpr ${dpr} r ${radius}`, () => {
        for (const pos of positions(canvas.w, canvas.h)) {
          const params = regionParams(canvas, dpr, radius, pos);
          const expected = computeOutlineRegion(params);
          const out = {};
          const returned = computeOutlineRegion(params, out);
          assert.equal(returned, out, 'returns the same out object');
          assert.deepEqual(out, expected);
        }
      });
    }
  }
}

for (const dpr of dprs) {
  for (const radius of radii) {
    check(`region size unchanged for different canvasHeight dpr ${dpr} r ${radius}`, () => {
      const pos = { x: 123.4, y: -56.7 };
      const out = {};
      const a = { ...computeOutlineRegion(regionParams({ w: 1440, h: 900 }, dpr, radius, pos), out) };
      const b = computeOutlineRegion(regionParams({ w: 1440, h: 1080 }, dpr, radius, pos), out);
      assert.equal(a.texels, b.texels);
      assert.equal(a.halfCss, b.halfCss);
      assert.equal(a.rtDpr, b.rtDpr);
      assert.equal(a.thicknessDev, b.thicknessDev);
    });
  }
}

console.log(`all cel checks passed (${passes} cases)`);
