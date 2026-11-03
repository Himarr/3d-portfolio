import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../../../src/three/${p}`, import.meta.url), 'utf8');

test('AC4: DprController no llama a onUnfit ni descarta por fitsAtDprOne', () => {
  const src = read('DprController.jsx');
  assert.doesNotMatch(src, /onUnfit/);
  assert.doesNotMatch(src, /fitsAtDprOne/);
});

test('AC4: DprController aplica computeDpr vía onDpr', () => {
  const src = read('DprController.jsx');
  assert.match(src, /computeDpr\(/);
  assert.match(src, /onDpr\(/);
});

test('AC4: PageCanvas ya no usa onUnfit (sin fallback a posters por tamaño)', () => {
  assert.doesNotMatch(read('PageCanvas.jsx'), /onUnfit/);
});
