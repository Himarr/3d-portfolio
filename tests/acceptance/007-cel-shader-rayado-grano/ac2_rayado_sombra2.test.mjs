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

test('AC2: el rayado solo afecta a sombra 2 (se aplica antes de mezclar sombra 1)', () => {
  const body = celShadeBody(compileToon().fragmentShader)
  const iHatch = body.indexOf('uCelHatchMult')
  assert.ok(iHatch >= 0, 'uCelHatchMult usado en celShade')
  assert.ok(iHatch < body.indexOf('celBand( uCelTShadow1'), 'rayado antes de la banda sombra 1')
  assert.match(body, /mix\(\s*1\.0\s*,\s*uCelHatchMult/)
})

test('AC2: setCelDpr actualiza uCelDpr y OutlineLayer lo llama', () => {
  const shader = compileToon()
  setCelDpr(2)
  assert.equal(shader.uniforms.uCelDpr.value, 2)
  const src = readFileSync(new URL('../../../src/three/OutlineLayer.jsx', import.meta.url), 'utf8')
  assert.match(src, /setCelDpr\s*\(/)
})
