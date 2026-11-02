import test from 'node:test'
import assert from 'node:assert/strict'
import { compileToon, celShadeBody } from './helpers.mjs'

test('AC4: con mult=1 y strength=0 las mezclas se anulan (factores neutros en el GLSL)', () => {
  const body = celShadeBody(compileToon().fragmentShader)
  assert.match(body, /mix\(\s*1\.0\s*,\s*uCelHatchMult/)
  assert.match(body, /mix\(\s*1\.0\s*,\s*[\w.]+\s*,\s*uCelGrainStrength\s*\)/, 'mascara neutra con strength=0')
})

test('AC5: sin uniform de tiempo; los bordes reutilizan los pesos celBand', () => {
  const { fragmentShader: g, uniforms } = compileToon()
  assert.doesNotMatch(g, /uniform\s+\w+\s+\w*[Tt]ime\w*\s*;/)
  assert.ok(!Object.keys(uniforms).some((k) => /time|clock|elapsed/i.test(k)))
  const body = celShadeBody(g)
  assert.match(body, /uCelHatchMult/, 'el patron existe')
  assert.match(body, /celBand\(\s*uCelTShadow1/)
  assert.match(body, /celBand\(\s*uCelTLit/)
})

test('AC6: uniforms nuevos declarados en GLSL y registrados en shader.uniforms', () => {
  const { fragmentShader: g, uniforms } = compileToon()
  for (const n of [
    'uCelHatchAngle', 'uCelHatchPeriod', 'uCelHatchWidth', 'uCelHatchMult',
    'uCelGrainCell', 'uCelGrainRadius', 'uCelGrainStrength', 'uCelDpr',
  ]) {
    assert.ok(n in uniforms, `${n} en shader.uniforms`)
    assert.match(g, new RegExp(`uniform\\s+float\\s+${n}\\s*;`), `${n} declarado`)
  }
})
