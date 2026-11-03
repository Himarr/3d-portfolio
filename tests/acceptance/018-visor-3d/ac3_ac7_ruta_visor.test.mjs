import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { loadLibrary, renderRoute, close } from './_render.mjs'

after(close)

test('AC3: /viewer?model=<id> muestra el título del modelo y "Back to library"', async () => {
  const lib = await loadLibrary()
  for (const m of lib.models) {
    const html = await renderRoute(`/viewer?model=${m.id}`)
    assert.ok(html.includes(m.title), `título de ${m.id}`)
    assert.match(html, /<a\b[^>]*href="\/projects\/3d-library"[^>]*>[^<]*Back to library/)
    assert.doesNotMatch(html, /not found/i)
  }
})

test('AC7: sin model o con id desconocido: mensaje de no encontrado, enlace a la librería y sin canvas', async () => {
  for (const url of ['/viewer', '/viewer?model=no-existe']) {
    const html = await renderRoute(url)
    assert.match(html, /not found/i, url)
    assert.match(html, /<a\b[^>]*href="\/projects\/3d-library"/, url)
    assert.doesNotMatch(html, /<canvas\b/, url)
  }
})
