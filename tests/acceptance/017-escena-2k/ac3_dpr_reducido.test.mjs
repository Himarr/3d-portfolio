import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDpr, PIXEL_BUDGET_DESKTOP } from '../../../src/three/bufferLimits.js';

const base = { pixelBudget: PIXEL_BUDGET_DESKTOP };

test('AC3: 2560x1076 con maxDim 2048 da dpr < 1 que cabe en el buffer', () => {
  const dpr = computeDpr({ ...base, cssWidth: 2560, cssHeight: 1076, deviceDpr: 1, maxDim: 2048 });
  assert.ok(dpr < 1 && dpr <= 0.8, `dpr ${dpr}`);
  assert.ok(dpr > 0.7, `dpr ${dpr}`);
  assert.ok(2560 * dpr <= 2048);
  assert.equal(dpr, Math.floor(dpr * 100) / 100);
});

test('AC3: el lado alto tambien limita (1000x3000, maxDim 2048)', () => {
  const dpr = computeDpr({ ...base, cssWidth: 1000, cssHeight: 3000, deviceDpr: 2, maxDim: 2048 });
  assert.ok(dpr < 1);
  assert.ok(3000 * dpr <= 2048 && 1000 * dpr <= 2048);
});

test('AC3: con tamaños que caben no cambia (max 2, nunca < 1)', () => {
  const c = (cssWidth, cssHeight, deviceDpr, maxDim) =>
    computeDpr({ ...base, cssWidth, cssHeight, deviceDpr, maxDim });
  assert.equal(c(1920, 1080, 2, 16384), 2);
  assert.equal(c(1920, 1080, 3, 16384), 2);
  assert.equal(c(1920, 1080, 1, 16384), 1);
  assert.equal(c(1920, 1080, 0.5, 16384), 1);
  assert.equal(c(2048, 2048, 2, 2048), 1);
  const big = c(3840, 2160, 2, 16384);
  assert.ok(big >= 1 && big < 2 && 3840 * 2160 * big * big <= PIXEL_BUDGET_DESKTOP);
});
