import test from 'node:test'
import assert from 'node:assert/strict'
import { viewerSource } from './_render.mjs'

const src = () => viewerSource()
const prop = (s, name) => s.match(new RegExp(`${name}(?:=\{([^}]*)\}|(?=[\s/>]))`))

test('AC3: el visor usa Canvas, Model y FitToUnit', () => {
  const s = src()
  assert.match(s, /<Canvas\b/)
  assert.match(s, /<FitToUnit\b/)
  assert.match(s, /<Model\b/)
})

test('AC4: OrbitControls con autoRotate que se desactiva con prefers-reduced-motion', () => {
  const s = src()
  assert.match(s, /<OrbitControls\b/)
  assert.match(s, /usePrefersReducedMotion/)
  const ar = prop(s, 'autoRotate')
  assert.ok(ar, 'autoRotate presente')
  assert.match(ar[1] ?? '', /!\s*\w*[rR]educed\w*|\w*[rR]educed\w*\s*\?\s*false|!\s*prefers/, 'autoRotate depende de reduced motion')
})

test('AC5: orbitar y zoom activos con límites de distancia', () => {
  const s = src()
  assert.doesNotMatch(s, /enableRotate=\{\s*false/)
  assert.doesNotMatch(s, /enableZoom=\{\s*false/)
  assert.match(s, /minDistance=/)
  assert.match(s, /maxDistance=/)
})

test('AC6: toon según el modelo y sin outline en el visor', () => {
  const s = src()
  assert.match(s, /<Model\b[^>]*\btoon=\{[^}]+\}/s, 'toon dinámico')
  assert.doesNotMatch(s, /<Model\b[^>]*\boutline\b/s)
})
