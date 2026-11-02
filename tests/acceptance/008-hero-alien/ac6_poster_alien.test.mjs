import test from 'node:test'
import assert from 'node:assert/strict'
import { loadPlacement, run, src } from './helpers.mjs'

test('AC6: el offset del poster coincide con el colocado en vivo en las dos disposiciones', async () => {
  const m = await loadPlacement()
  for (const [w, h, r, wide] of [[1920, 1080, 390, true], [390, 844, 171, false]]) {
    const o = run(m, { viewportWidth: w, viewportHeight: h, radius: r, moonX: 0, moonY: 0 })
    const d = m.alienOffsetInRadii(wide, { dx: 0, dy: 0 })
    assert.ok(Math.abs(o.x - d.dx * r) < 1e-6)
    assert.ok(Math.abs(o.y - d.dy * r) < 1e-6)
  }
})

test('AC6: Hero muestra el poster del alien aparte y deja el de la luna', () => {
  const s = src('src/components/sections/Hero.jsx')
  assert.match(s, /assets\/hero-alien-poster\.png/)
  assert.match(s, /assets\/hero-planet-poster\.png/)
  assert.match(s, /alienOffsetInRadii/)
  assert.match(s, /alien[\s\S]{0,400}capture-poster|capture-poster[\s\S]{0,400}alien/i, 'procedencia documentada')
})

test('AC6: PosterCapture sabe capturar el alien', () => {
  const s = src('src/three/PosterCapture.jsx')
  assert.match(s, /Alien/)
  assert.match(s, /hero-alien-poster\.png/)
})
