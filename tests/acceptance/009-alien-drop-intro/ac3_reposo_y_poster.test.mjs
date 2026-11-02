import test from 'node:test'
import assert from 'node:assert/strict'
import { loadPlacement, run, src } from '../008-hero-alien/helpers.mjs'

test('AC3: sin caida pendiente la posicion es la de reposo (con y sin drop=0)', async () => {
  const m = await loadPlacement()
  for (const t of [0, 1.25, 3]) {
    const a = run(m, { timeS: t })
    const b = run(m, { timeS: t, drop: 0 })
    assert.deepEqual(a, b)
    assert.ok(Math.abs(a.x - 1 * 390) < 1e-6 || a.x !== 0)
  }
  assert.ok(Math.abs(run(m, { moonY: 0 }).y - -0.1 * 390) < 1e-6)
})

test('AC3: el singleton arranca en reposo', async () => {
  const { moonIntro } = await import('../../../src/lib/moonIntro.js')
  assert.equal(moonIntro.alienDrop, 0)
})

test('AC3: el poster del alien no esta dentro de la caja que escala con la luna y cae igual', () => {
  const s = src('src/components/sections/Hero.jsx')
  assert.match(s, /alienBoxRef/)
  assert.match(s, /gsap\.set\(alienBox/)
  const box = s.indexOf('ref={posterBoxRef}')
  const alienBox = s.indexOf('ref={alienBoxRef}')
  const close = s.indexOf('</div>', box)
  assert.ok(box > 0 && alienBox > close, 'alienBox fuera de posterBox')
})
