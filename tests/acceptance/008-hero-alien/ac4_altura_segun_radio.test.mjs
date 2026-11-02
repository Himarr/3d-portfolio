import test from 'node:test'
import assert from 'node:assert/strict'
import { loadPlacement, run } from './helpers.mjs'

test('AC4: altura = ALIEN_HEIGHT_PER_MOON_RADIUS x radio y sigue el resize', async () => {
  const m = await loadPlacement()
  assert.equal(m.ALIEN_HEIGHT_PER_MOON_RADIUS, 0.9)
  for (const r of [136, 250, 390]) {
    assert.ok(Math.abs(run(m, { radius: r }).height - m.ALIEN_HEIGHT_PER_MOON_RADIUS * r) < 1e-9)
  }
})

test('AC4: la altura sigue la escala de la intro', async () => {
  const m = await loadPlacement()
  const full = run(m, { introScale: 1 }).height
  assert.ok(Math.abs(run(m, { introScale: 0.48 }).height - 0.48 * full) < 1e-9)
})
