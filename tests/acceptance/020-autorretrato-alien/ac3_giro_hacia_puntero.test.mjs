import test from 'node:test'
import assert from 'node:assert/strict'
import { read, exists, PORTRAIT } from './_helpers.mjs'

const load = () => import('../../../src/three/selfPortraitTilt.js')

test('AC3: portraitTilt es 0 en reposo, acotado y proporcional al puntero', async () => {
  const { portraitTilt, SELF_PORTRAIT_MAX_TILT } = await load()
  assert.ok(SELF_PORTRAIT_MAX_TILT > 0 && SELF_PORTRAIT_MAX_TILT <= 0.5, 'ángulo pequeño (rad)')
  const out = { x: 9, y: 9 }
  assert.equal(portraitTilt(0, 0, out), out, 'escribe en el objeto dado y lo devuelve')
  assert.equal(out.x === 0 && out.y === 0, true)
  portraitTilt(1, 0, out)
  assert.ok(out.y > 0 && out.y <= SELF_PORTRAIT_MAX_TILT + 1e-9)
  const half = portraitTilt(0.5, 0, { x: 0, y: 0 }).y
  assert.ok(half > 0 && half < out.y, 'crece con el puntero')
  portraitTilt(-1, 0, out)
  assert.ok(out.y < 0)
  portraitTilt(0, 1, out)
  assert.ok(Math.abs(out.x) > 0 && Math.abs(out.x) <= SELF_PORTRAIT_MAX_TILT + 1e-9)
})

test('AC3: valores fuera de [-1, 1] no superan el límite', async () => {
  const { portraitTilt, SELF_PORTRAIT_MAX_TILT } = await load()
  const out = portraitTilt(50, -50, { x: 0, y: 0 })
  assert.ok(Math.abs(out.x) <= SELF_PORTRAIT_MAX_TILT + 1e-9)
  assert.ok(Math.abs(out.y) <= SELF_PORTRAIT_MAX_TILT + 1e-9)
})

test('AC3: la escena usa usePointerTarget suavizado y fija la pose con movimiento reducido', () => {
  assert.ok(exists(PORTRAIT), `falta ${PORTRAIT}`)
  const s = read(PORTRAIT)
  assert.match(s, /usePointerTarget\(/)
  assert.match(s, /portraitTilt\(/)
  assert.match(s, /useFrame\(/)
  assert.match(s, /usePrefersReducedMotion|prefers-reduced-motion/)
  assert.doesNotMatch(s, /OrbitControls|autoRotate/)
})
