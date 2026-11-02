import test from 'node:test'
import assert from 'node:assert/strict'
import { loadPlacement, run } from './helpers.mjs'

for (const [w, h, r, moonY] of [[390, 844, 171, -80], [320, 568, 136, -100], [1023, 800, 400, -60]]) {
  test(`AC3: ${w}x${h} el alien queda debajo, solapado con la parte baja, delante y sin salirse`, async () => {
    const m = await loadPlacement()
    const o = run(m, { viewportWidth: w, viewportHeight: h, radius: r, moonY })
    const half = o.height / 2
    assert.ok(o.y < moonY, 'centro por debajo de la luna')
    assert.ok(o.y + half > moonY - r, 'solapa con la parte baja de la luna')
    assert.ok(o.z > 0, 'delante de la luna')
    assert.ok(o.x - half >= -w / 2 && o.x + half <= w / 2, 'dentro por los lados')
  })
}
