import test from 'node:test'
import assert from 'node:assert/strict'
import { viewerSource } from './_render.mjs'

const src = () => viewerSource()
const prop = (s, name) => s.match(new RegExp(String.raw`${name}(?:=\{([^}]*)\}|(?=[\s/>]))`))

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

test('AC9: entorno suave generado en código, sin descargas, solo cuando !toon; luz directa moderada', () => {
  const s = src()
  assert.match(s, /<Environment\b|RoomEnvironment|PMREMGenerator/, 'entorno de luz')
  if (/<Environment\b/.test(s)) {
    const env = s.match(/<Environment\b[^>]*>/s)[0]
    assert.doesNotMatch(env, /\bpreset=|\bfiles=|\bpath=/, 'sin descargas externas')
    assert.match(s, /<Lightformer\b/, 'formas de luz generadas en código')
  }
  assert.doesNotMatch(s, /https?:\/\//, 'sin URLs externas')
  const idx = s.search(/<Environment\b|RoomEnvironment/)
  const before = s.slice(Math.max(0, idx - 200), idx)
  assert.match(before, /!\s*toon\s*&&|toon\s*\?\s*null|toon\s*\|\|/, 'el entorno está tras la condición !toon')
  for (const m of s.matchAll(/<directionalLight\b[^>]*?intensity=\{([\d.]+)\}/gs)) {
    assert.ok(Number(m[1]) <= 1.5, `directionalLight intensity ${m[1]} <= 1.5`)
  }
})
