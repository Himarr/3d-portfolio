import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { read, exists, PORTRAIT, renderAbout, close } from './_helpers.mjs'

after(close)

test('AC4: sin canvas montado (SSR / sin WebGL) el marco muestra el degradado', async () => {
  const html = await renderAbout()
  assert.match(html, /role="img"[^>]*>.*from-surface to-ink/s)
  assert.doesNotMatch(html, /<canvas\b/)
  assert.ok(exists(PORTRAIT), `falta ${PORTRAIT}`)
})

test('AC4: el canvas solo se monta con WebGL2 y un fallo del modelo/contexto no rompe la página', () => {
  assert.ok(exists(PORTRAIT), `falta ${PORTRAIT}`)
  const a = read('src/components/sections/AboutMe.jsx')
  assert.match(a, /probeWebGL2/)
  assert.match(a, /<CanvasErrorBoundary\b/)
  assert.match(a, /<Suspense\b[^>]*fallback=/s)
  assert.match(read(PORTRAIT), /<Suspense\b/)
})

test('AC5: el marco expone role="img" y aria-label, sin aria-hidden, sin WebGL', async () => {
  const html = await renderAbout()
  const frame = html.match(/<div[^>]*role="img"[^>]*>/)?.[0] ?? ''
  assert.ok(frame, 'hay un elemento role="img"')
  assert.match(frame, /aria-label="Self-portrait: 3D alien character"/)
  assert.doesNotMatch(frame, /aria-hidden/)
})

test('AC5: el contenido interior (degradado/canvas) queda oculto a tecnologías de apoyo', async () => {
  const html = await renderAbout()
  const inner = html.match(/<div[^>]*role="img"[^>]*>(.*?)<\/div><\/div>/s)?.[1] ?? ''
  assert.match(inner, /aria-hidden="true"/)
})
