import test from 'node:test'
import assert from 'node:assert/strict'
import { loadPlacement, run } from './helpers.mjs'

for (const [w, h, r] of [[1920, 1080, 390], [1280, 720, 250], [1024, 700, 194]]) {
  test(`AC2: ${w}x${h} el alien queda a la derecha, solapado, delante y dentro`, async () => {
    const m = await loadPlacement()
    const o = run(m, { viewportWidth: w, viewportHeight: h, radius: r, moonY: -30 })
    const half = o.height / 2
    assert.ok(o.x > 0, 'centro a la derecha de la luna')
    assert.ok(o.x < r + half, 'silueta solapada con la luna')
    assert.ok(o.z > 0, 'delante de la luna (z=0)')
    assert.ok(o.x + half <= w / 2, 'dentro por la derecha')
    assert.ok(o.y + half <= h / 2 && o.y - half >= -h / 2, 'dentro en vertical')
  })
}
