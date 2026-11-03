import test from 'node:test'
import assert from 'node:assert/strict'
import { read, exists, PORTRAIT } from './_helpers.mjs'

test('AC2: el autorretrato usa Model con toon y outline', () => {
  assert.ok(exists(PORTRAIT), `falta ${PORTRAIT}`)
  assert.match(read(PORTRAIT), /<Model[^>]*\btoon\b[^>]*\boutline\b/s)
})

test('AC2: el canvas propio monta su OutlineLayer anclado al modelo', () => {
  assert.ok(exists(PORTRAIT), `falta ${PORTRAIT}`)
  const s = read(PORTRAIT)
  assert.equal((s.match(/<OutlineLayer\b/g) ?? []).length, 1)
  assert.match(s, /<OutlineLayer[^>]*anchorRef=\{/s)
  assert.match(s, /CAMERA/, 'cámara ortográfica compartida (1 unidad = 1 px)')
})
