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

test('AC3: Voronoi 3x3 con bucles de limites constantes, celda en px de pantalla x DPR', () => {
  const g = compileToon().fragmentShader
  assert.match(g, /for\s*\(\s*int\s+\w+\s*=\s*-1\s*;\s*\w+\s*<=\s*1\s*;/)
  assert.match(g, /uCelGrainCell\s*\*\s*uCelDpr|uCelDpr\s*\*\s*uCelGrainCell/)
  assert.match(g, /gl_FragCoord/)
})

function spotStatement(body) {
  const st = body.split(';').find((x) => /celBand\(\s*uCelTSpot/.test(x))
  assert.ok(st, 'sentencia con celBand( uCelTSpot ... )')
  return st
}

test('AC3: el granulado va tras la banda lit y no usa el peso lit (sin granulado en sombras ni en la banda lit)', () => {
  const body = celShadeBody(compileToon().fragmentShader)
  const iLit = body.indexOf('celBand( uCelTLit')
  assert.ok(iLit > 0)
  assert.doesNotMatch(body.slice(0, iLit), /uCelGrain|[Gg]rain/, 'sombras sin granulado')
  const litStmt = body.split(';').find((x) => /celBand\(\s*uCelTLit/.test(x))
  assert.doesNotMatch(litStmt, /[Gg]rain|dots/, 'la banda lit no lleva granulado')
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
