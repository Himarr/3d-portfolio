import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CAMERA } from '../../../src/three/camera.js';
import { moonFinalRadiusPx } from '../../../src/lib/moonSize.js';
import { ALIEN_Z_PER_MOON_RADIUS } from '../../../src/three/alienPlacement.js';
import { OUTLINE_Z_FACTOR, OUTLINE_Z_MAX } from '../../../src/three/celConstants.js';

const src = readFileSync(new URL('../../../src/three/OutlineLayer.jsx', import.meta.url), 'utf8');

test('AC2: la camara de la mascara toma near/far y z de la camara principal', () => {
  assert.match(src, /cam\.near\s*=\s*camera\.near/);
  assert.match(src, /cam\.far\s*=\s*camera\.far/);
  assert.match(src, /cam\.position\.set\([^)]*camera\.position\.z\)/);
  assert.match(src, /uDepthRef\.value\s*=\s*camera\.position\.z\s*-\s*z/);
});

test('AC2: el quad del anillo queda dentro del frustum de la mascara', () => {
  const camZ = CAMERA.position[2];
  for (const [w, h] of [[1920, 1080], [3840, 2160]]) {
    const r = moonFinalRadiusPx(w, h);
    const alienZ = ALIEN_Z_PER_MOON_RADIUS * r;
    const ringZ = alienZ - Math.min(OUTLINE_Z_FACTOR * r, OUTLINE_Z_MAX);
    const depth = camZ - ringZ;
    assert.ok(depth >= CAMERA.near && depth <= CAMERA.far, `anillo fuera en ${w}x${h}`);
  }
});
