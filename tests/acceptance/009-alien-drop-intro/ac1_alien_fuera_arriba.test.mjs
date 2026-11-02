import test from 'node:test'
import assert from 'node:assert/strict'
import { loadPlacement, run, src } from '../008-hero-alien/helpers.mjs'

test('AC1: con la caida pendiente el alien esta entero por encima del viewport y con tamano final', async () => {
  const m = await loadPlacement()
  for (const [w, h, r, wide] of [[1920, 1080, 390, true], [390, 844, 171, false]]) {
    const o = run(m, { viewportWidth: w, viewportHeight: h, radius: r, moonY: 0, drop: 1 })
    assert.ok(Math.abs(o.height - m.ALIEN_HEIGHT_PER_MOON_RADIUS * r) < 1e-9, `tamano final ${wide}`)
    assert.ok(o.y - o.height / 2 >= h / 2, `bottom ${o.y - o.height / 2} sobre el borde ${h / 2}`)
  }
})

test('AC1: PageScene no usa moonIntro.scale para el alien y pasa el progreso de la caida', () => {
  const s = src('src/three/PageScene.jsx')
  const call = s.match(/alienPlacement\(\s*\{[\s\S]*?\}\s*,/)
  assert.ok(call, 'llamada a alienPlacement')
  assert.doesNotMatch(call[0], /moonIntro\.scale/)
  assert.match(call[0], /moonIntro\.alienDrop/)
})
