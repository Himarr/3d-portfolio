import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as C from '../../../src/three/celConstants.js'
import { setCelDpr } from '../../../src/three/toonMaterial.js'
import { compileToon, celShadeBody } from './helpers.mjs'

test('AC2: uniforms de rayado se rellenan desde celConstants', () => {
  const { uniforms } = compileToon()
  assert.ok(
    Math.abs(uniforms.uCelHatchAngle.value - (C.CEL_HATCH_ANGLE_DEG * Math.PI) / 180) < 1e-9,
    'uCelHatchAngle en radianes',
  )
  assert.equal(uniforms.uCelHatchPeriod.value, C.CEL_HATCH_PERIOD_CSS_PX)
  assert.equal(uniforms.uCelHatchWidth.value, C.CEL_HATCH_WIDTH)
  assert.equal(uniforms.uCelHatchMult.value, C.CEL_HATCH_MULTIPLIER)
})

test('AC2: el rayado usa gl_FragCoord y el DPR efectivo, no la malla', () => {
  const g = compileToon().fragmentShader
  assert.match(g, /gl_FragCoord/)
  assert.match(g, /uniform\s+float\s+uCelDpr\s*;/)
  assert.match(g, /uCelHatchPeriod\s*\*\s*uCelDpr|uCelDpr\s*\*\s*uCelHatchPeriod/)
  assert.doesNotMatch(celShadeBody(g), /vUv|vViewPosition|vWorldPosition/)
})

test('AC2: sombra 2 lleva rayas y sombra 1 solo en su mitad oscura (corte celBand en el punto medio)', () => {
  const body = celShadeBody(compileToon().fragmentShader)
  const stmts = body.split(';')
  const s2 = stmts.find((x) => /base\s*\*\s*uCelShadow2/.test(x))
  assert.match(s2, /mix\(\s*1\.0\s*,\s*uCelHatchMult/, 'sombra 2 con rayas')
  assert.match(body, /0\.5\s*\*\s*\(\s*uCelTShadow1\s*\+\s*uCelTLit\s*\)|\(\s*uCelTShadow1\s*\+\s*uCelTLit\s*\)\s*\*\s*0\.5/, 'punto medio entre umbrales')
  const iLit = body.indexOf('celBand( uCelTLit')
  const before = body.slice(0, iLit)
  assert.ok((before.match(/celBand\(/g) || []).length >= 2, 'segundo celBand (punto medio) antes de la banda lit')
  const s1 = stmts.find((x) => /base\s*\*\s*uCelShadow1/.test(x))
  assert.match(s1, /uCelHatchMult/, 'sombra 1 usa el multiplicador de raya')
  assert.match(s1, /stripe|uCelHatch/, 'sombra 1 usa la mascara de raya')
  const lit = stmts.find((x) => /base\s*\*\s*uCelLit/.test(x))
  assert.doesNotMatch(lit, /uCelHatch|stripe/, 'la banda lit no lleva rayas')
  const spot = stmts.find((x) => /uCelSpotColor/.test(x))
  assert.doesNotMatch(spot, /uCelHatch|stripe/, 'el foco no lleva rayas')
})

test('AC2: setCelDpr actualiza uCelDpr y OutlineLayer lo llama', () => {
  const shader = compileToon()
  setCelDpr(2)
  assert.equal(shader.uniforms.uCelDpr.value, 2)
  const src = readFileSync(new URL('../../../src/three/OutlineLayer.jsx', import.meta.url), 'utf8')
  assert.match(src, /setCelDpr\s*\(/)
})
