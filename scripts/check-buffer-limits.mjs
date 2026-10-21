import assert from 'node:assert/strict';
import {
  DPR_MAX,
  PIXEL_BUDGET_COARSE,
  PIXEL_BUDGET_DESKTOP,
  computeDpr,
  fitsAtDprOne,
  maxBufferDim,
} from '../src/three/bufferLimits.js';

function check(name, fn) {
  fn();
  console.log(`pass: ${name}`);
}

check('maxBufferDim is the min of the three limits', () => {
  assert.equal(maxBufferDim(16384, [8192, 4096]), 4096);
  assert.equal(maxBufferDim(2048, [8192, 4096]), 2048);
});

check('fitsAtDprOne checks both dimensions', () => {
  assert.equal(fitsAtDprOne(5000, 900, 4096), false);
  assert.equal(fitsAtDprOne(1920, 5000, 4096), false);
  assert.equal(fitsAtDprOne(4096, 4096, 4096), true);
});

const widths = [320, 375, 768, 1024, 1440, 1920, 2560, 3840, 4096];
const heights = [568, 600, 720, 812, 900, 1080, 1440, 2160];
const dprs = [1, 1.25, 1.5, 2, 2.625, 3, 4];
const maxDims = [4096, 8192, 16384];

check('DPR always within [1, DPR_MAX]', () => {
  for (const maxDim of maxDims)
    for (const pixelBudget of [PIXEL_BUDGET_DESKTOP, PIXEL_BUDGET_COARSE])
      for (const w of widths)
        for (const h of heights)
          for (const deviceDpr of dprs) {
            if (w > maxDim || h > maxDim) continue;
            const dpr = computeDpr({ cssWidth: w, cssHeight: h, deviceDpr, maxDim, pixelBudget });
            assert.ok(dpr >= 1 && dpr <= DPR_MAX, `dpr ${dpr} for ${w}x${h}@${deviceDpr}`);
          }
});

check('ceil(css * dpr) <= maxDim for sizes that fit at DPR 1', () => {
  for (const maxDim of maxDims)
    for (const w of widths)
      for (const h of heights) {
        if (w > maxDim || h > maxDim) continue;
        for (const deviceDpr of dprs) {
          const dpr = computeDpr({
            cssWidth: w,
            cssHeight: h,
            deviceDpr,
            maxDim,
            pixelBudget: PIXEL_BUDGET_DESKTOP,
          });
          assert.ok(Math.ceil(w * dpr) <= maxDim, `width ${w}*${dpr} > ${maxDim}`);
          assert.ok(Math.ceil(h * dpr) <= maxDim, `height ${h}*${dpr} > ${maxDim}`);
        }
      }
});

check('1920x1080 and 1440x900 at deviceDpr 2, desktop budget: DPR 2', () => {
  for (const [w, h] of [
    [1920, 1080],
    [1440, 900],
  ]) {
    const dpr = computeDpr({
      cssWidth: w,
      cssHeight: h,
      deviceDpr: 2,
      maxDim: 16384,
      pixelBudget: PIXEL_BUDGET_DESKTOP,
    });
    assert.equal(dpr, DPR_MAX, `${w}x${h} dpr ${dpr}`);
  }
});

check('375x812 at deviceDpr 3, coarse budget: DPR 2', () => {
  const dpr = computeDpr({
    cssWidth: 375,
    cssHeight: 812,
    deviceDpr: 3,
    maxDim: 16384,
    pixelBudget: PIXEL_BUDGET_COARSE,
  });
  assert.equal(dpr, DPR_MAX);
});

check('3840x2160 at deviceDpr 2, desktop budget: DPR below 2 and pixels within budget', () => {
  const dpr = computeDpr({
    cssWidth: 3840,
    cssHeight: 2160,
    deviceDpr: 2,
    maxDim: 16384,
    pixelBudget: PIXEL_BUDGET_DESKTOP,
  });
  assert.ok(dpr < DPR_MAX, `dpr ${dpr}`);
  assert.ok(3840 * 2160 * dpr * dpr <= PIXEL_BUDGET_DESKTOP);
});

console.log('all buffer-limit checks passed');
