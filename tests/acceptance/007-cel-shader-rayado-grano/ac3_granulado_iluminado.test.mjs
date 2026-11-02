import test from 'node:test'
import assert from 'node:assert/strict'
import * as C from '../../../src/three/celConstants.js'
import { compileToon, celShadeBody } from './helpers.mjs'

test('AC3: uniforms de granulado se rellenan desde celConstants', () => {
  const { uniforms } = compileToon()
  assert.equal(uniforms.uCelGrainCell.value, C.CEL_GRAIN_CELL_CSS_PX)
  assert.equal(uniforms.uCelGrainRadius.value, C.CEL_GRAIN_DOT_RADIUS)
  assert.equal(uniforms.uCelGrainStrength.value, C.CEL_GRAIN_STRENGTH)
})

test('AC3: cuadricula regular a pantalla (celda x DPR, fract), sin hash ni Voronoi ni bucles', () => {
  const g = compileToon().fragmentShader
  assert.match(g, /uCelGrainCell\s*\*\s*uCelDpr|uCelDpr\s*\*\s*uCelGrainCell/)
  assert.match(g, /gl_FragCoord/)
  assert.match(celShadeBody(g), /fract\s*\(/)
  assert.doesNotMatch(g, /celHash|[Hh]ash/, 'sin hash')
  assert.doesNotMatch(g, /\bfor\s*\(/, 'sin bucles (Voronoi 3x3 eliminado)')
  assert.doesNotMatch(g, /vec2\s+g\s*=|dmin/, 'sin vecindario Voronoi')
})

test('AC3: el radio del punto sigue al brillo: clamp((ndl - uCelTSpot)/(1 - uCelTSpot)) * uCelGrainRadius', () => {
  const body = celShadeBody(compileToon().fragmentShader)
  const st = body.split(';').find((x) => /uCelGrainRadius/.test(x))
  assert.ok(st, 'sentencia que usa uCelGrainRadius en celShade')
  assert.match(st, /clamp\s*\(/)
  assert.match(st, /ndl/)
  assert.match(st, /uCelTSpot/)
  assert.match(st, /1\.0\s*-\s*uCelTSpot/, 'normalizado al rango [uCelTSpot, 1]')
})

function spotStatement(body) {
  const st = body.split(';').find((x) => /celBand\(\s*uCelTSpot/.test(x))
  assert.ok(st, 'sentencia con celBand( uCelTSpot ... )')
  return st
}

test('AC3: ni las sombras ni la banda lit llevan granulado', () => {
  const body = celShadeBody(compileToon().fragmentShader)
  for (const re of [/base\s*\*\s*uCelShadow2/, /base\s*\*\s*uCelShadow1/, /base\s*\*\s*uCelLit/]) {
    const st = body.split(';').find((x) => re.test(x))
    assert.ok(st, String(re))
    assert.doesNotMatch(st, /[Gg]rain|dots/)
  }
  for (const st of body.split(';')) {
    if (/uCelGrainStrength/.test(st)) assert.doesNotMatch(st, /litW|uCelTLit/, 'el granulado no pondera con el peso lit')
  }
})

test('AC3: el peso de la banda del foco se multiplica por la mascara mix( 1.0, puntos, uCelGrainStrength )', () => {
  const body = celShadeBody(compileToon().fragmentShader)
  const st = spotStatement(body)
  assert.match(st, /mix\(\s*1\.0\s*,\s*[\w.]+\s*,\s*uCelGrainStrength\s*\)/)
  assert.match(st, /\*/, 'el peso del foco se multiplica por la mascara')
})

test('AC3: la mezcla hacia uCelSpotColor usa el peso del foco enmascarado, no un segundo paso de granulado', () => {
  const body = celShadeBody(compileToon().fragmentShader)
  const iSpot = body.indexOf('celBand( uCelTSpot')
  const stmts = body.slice(body.lastIndexOf('\n', iSpot)).split(';').filter((x) => /uCelSpotColor/.test(x))
  assert.equal(stmts.length, 1, 'una sola mezcla hacia uCelSpotColor')
  assert.match(body.slice(0, iSpot) + stmts[0], /uCelGrainStrength/)
})
