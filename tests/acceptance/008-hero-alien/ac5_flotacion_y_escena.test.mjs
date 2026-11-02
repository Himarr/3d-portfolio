import test from 'node:test'
import assert from 'node:assert/strict'
import { loadPlacement, run, src } from './helpers.mjs'

test('AC5: oscila en Y con una senoide de amplitud relativa al radio y el periodo dado', async () => {
  const m = await loadPlacement()
  const { ALIEN_FLOAT_AMPLITUDE: A, ALIEN_FLOAT_PERIOD_S: T } = m
  assert.ok(A > 0 && A <= 0.2 && T >= 1 && T <= 20)
  const r = 390
  const y0 = run(m, { radius: r, timeS: 0 }).y
  for (const f of [0.125, 0.25, 0.5, 0.75]) {
    const y = run(m, { radius: r, timeS: f * T }).y
    assert.ok(Math.abs(y - y0 - A * r * Math.sin(2 * Math.PI * f)) < 1e-6, `fase ${f}`)
  }
  assert.ok(Math.abs(run(m, { radius: r, timeS: 3 * T }).y - y0) < 1e-6, 'periodico')
})

test('AC5: la oscilacion no mueve x ni z', async () => {
  const m = await loadPlacement()
  const a = run(m, { timeS: 0 })
  const b = run(m, { timeS: 1.3 })
  assert.equal(a.x, b.x)
  assert.equal(a.z, b.z)
})

test('AC5: PageScene coloca el alien por frame, sin girarlo; inclinacion por rigRef', () => {
  const s = src('src/three/PageScene.jsx')
  assert.match(s, /alienPlacement\(/)
  assert.equal((s.match(/SPIN_RAD_PER_SEC/g) ?? []).length, 2, 'el spin es solo de la luna')
  assert.match(s, /alien\w*Ref/i)
  assert.match(src('src/three/Alien.jsx'), /rigRef/)
  assert.doesNotMatch(src('src/three/Alien.jsx'), /spinRef/)
})
