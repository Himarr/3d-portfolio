import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as C from '../../../src/three/celConstants.js'

test('AC1: constantes de rayado y granulado exportadas con rangos validos', () => {
  assert.ok(Number.isFinite(C.CEL_HATCH_ANGLE_DEG))
  assert.ok(C.CEL_HATCH_PERIOD_CSS_PX > 0)
  assert.ok(C.CEL_HATCH_WIDTH > 0 && C.CEL_HATCH_WIDTH < 1)
  assert.ok(C.CEL_HATCH_MULTIPLIER >= 0 && C.CEL_HATCH_MULTIPLIER <= 1)
  assert.ok(C.CEL_GRAIN_CELL_CSS_PX > 0)
  assert.ok(C.CEL_GRAIN_DOT_RADIUS > 0 && C.CEL_GRAIN_DOT_RADIUS < 1)
  assert.ok(C.CEL_GRAIN_STRENGTH >= 0 && C.CEL_GRAIN_STRENGTH <= 1)
})

test('AC1: la cabecera de celConstants documenta que tocar para las constantes nuevas', () => {
  const src = readFileSync(new URL('../../../src/three/celConstants.js', import.meta.url), 'utf8')
  const header = src.split('// --- Cel ramp ---')[0]
  for (const name of [
    'CEL_HATCH_ANGLE_DEG', 'CEL_HATCH_PERIOD_CSS_PX', 'CEL_HATCH_WIDTH',
    'CEL_HATCH_MULTIPLIER', 'CEL_GRAIN_CELL_CSS_PX', 'CEL_GRAIN_DOT_RADIUS', 'CEL_GRAIN_STRENGTH',
  ]) {
    assert.ok(header.includes(name), `${name} falta en la cabecera "What to change to"`)
  }
})

test('AC3b: valores por defecto revisados (celda grande, puntos grandes, rayas oscuras, mascara total)', () => {
  assert.ok(C.CEL_GRAIN_CELL_CSS_PX >= 8)
  assert.ok(C.CEL_HATCH_MULTIPLIER <= 0.3)
  assert.equal(C.CEL_GRAIN_STRENGTH, 1)
  assert.ok(C.CEL_GRAIN_DOT_RADIUS >= 0.5 && C.CEL_GRAIN_DOT_RADIUS < 1)
})

test('AC1: la cabecera describe el granulado como mascara del foco, no como granulado en zonas iluminadas', () => {
  const src = readFileSync(new URL('../../../src/three/celConstants.js', import.meta.url), 'utf8')
  const header = src.split('// --- Cel ramp ---')[0]
  assert.doesNotMatch(header, /grain on lit areas/i)
  const m = src.match(/(\/\/[^\n]*\n)+(?=export const CEL_GRAIN_STRENGTH)/)
  assert.ok(m, 'comentario de CEL_GRAIN_STRENGTH')
  assert.match(m[0], /mask/i, 'el comentario de CEL_GRAIN_STRENGTH habla de mascara')
})
