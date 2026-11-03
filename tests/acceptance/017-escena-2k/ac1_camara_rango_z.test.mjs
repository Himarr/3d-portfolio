import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CAMERA } from '../../../src/three/camera.js';
import { moonFinalRadiusPx } from '../../../src/lib/moonSize.js';
import { ALIEN_Z_PER_MOON_RADIUS } from '../../../src/three/alienPlacement.js';
import { STAR_Z } from '../../../src/three/starfield.js';

test('AC1: la camara esta en z=5000 con far=8000, near=1 y zoom=1', () => {
  assert.equal(CAMERA.position[2], 5000);
  assert.equal(CAMERA.far, 8000);
  assert.equal(CAMERA.near, 1);
  assert.equal(CAMERA.zoom, 1);
});

test('AC1: el rango visible cubre estrellas y todo el alien hasta 3840x2160', () => {
  const camZ = CAMERA.position[2];
  const inRange = (z) => {
    const depth = camZ - z;
    return depth >= CAMERA.near && depth <= CAMERA.far;
  };
  assert.ok(inRange(STAR_Z), 'plano de estrellas fuera del frustum');
  for (const [w, h] of [[1920, 1080], [2560, 1440], [3840, 2160]]) {
    const r = moonFinalRadiusPx(w, h);
    const center = ALIEN_Z_PER_MOON_RADIUS * r;
    assert.ok(inRange(center + r), `alien (cara cercana) fuera en ${w}x${h}, r=${r}`);
    assert.ok(inRange(center - r), `alien (cara lejana) fuera en ${w}x${h}`);
  }
});

test('AC1: PageCanvas usa la camara compartida', () => {
  const src = readFileSync(new URL('../../../src/three/PageCanvas.jsx', import.meta.url), 'utf8');
  assert.match(src, /from ['"]\.\/camera\.js['"]/);
  assert.doesNotMatch(src, /const CAMERA\s*=/);
});
