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

test('AC3: el granulado solo aparece tras la banda lit y mezcla hacia el color del foco', () => {
  const body = celShadeBody(compileToon().fragmentShader)
  const iLit = body.indexOf('celBand( uCelTLit')
  assert.ok(iLit > 0)
  assert.doesNotMatch(body.slice(0, iLit), /uCelGrain|[Gg]rain/, 'sombras sin granulado')
  const after = body.slice(iLit)
  assert.match(after, /uCelGrainStrength/)
  assert.match(after, /uCelSpotColor/)
})
