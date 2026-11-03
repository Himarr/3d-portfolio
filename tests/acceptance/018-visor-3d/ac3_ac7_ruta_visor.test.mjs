import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { loadLibrary, renderRoute, close } from './_render.mjs'

after(close)

// Ancestros (etiqueta + class) de la posición `idx` del HTML estático.
function ancestorsAt(html, idx) {
  const stack = []
  for (const m of html.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g)) {
    if (m.index >= idx) break
    if (m[1]) stack.pop()
    else if (!m[4]) stack.push({ tag: m[2], cls: m[3].match(/\bclass="([^"]*)"/)?.[1] ?? '', pos: m.index })
  }
  return stack
}

const HEIGHT =
  /(?:^|\s)(?:h|min-h)-(?:svh|dvh|screen|full|\[calc\(100(?:svh|dvh|vh)[^\]]*\])(?:\s|$)|(?:^|\s)flex-1(?:\s|$)/

test('AC3: /viewer?model=<id> muestra el canvas sin título, a pantalla completa menos la navbar', async () => {
  const lib = await loadLibrary()
  for (const m of lib.models) {
    const html = await renderRoute(`/viewer?model=${m.id}`)
    assert.ok(html.includes('<canvas'), `canvas de ${m.id}`)
    assert.ok(!html.includes(m.title), `no debe mostrarse el título de ${m.id}`)
    assert.doesNotMatch(html, /<h[1-6]\b/, 'sin encabezados')
    assert.doesNotMatch(html, /not found/i)
    // Nada de texto fuera del visor salvo el enlace de vuelta.
    assert.equal(html.replace(/<[^>]*>/g, '').trim(), 'Back to library')
    // Contenedor con el alto disponible, sin caja de ancho/aspecto/padding fijos.
    const anc = ancestorsAt(html, html.indexOf('<canvas'))
    assert.ok(anc.some((a) => HEIGHT.test(a.cls)), `algún ancestro del canvas ocupa el alto disponible: ${anc.map((a) => a.cls)}`)
    assert.ok(!anc.some((a) => /\baspect-|\bmax-w-|\bmin-h-\[70vh\]|\bpy-\d/.test(a.cls)), 'sin aspect-ratio, max-w ni padding vertical')
  }
})

test('AC8: "Back to library" está superpuesto dentro del contenedor del visor, no después', async () => {
  const lib = await loadLibrary()
  for (const m of lib.models) {
    const html = await renderRoute(`/viewer?model=${m.id}`)
    const a = html.match(/<a\b[^>]*href="\/projects\/3d-library"[^>]*>[^<]*Back to library/)
    assert.ok(a, 'enlace presente')
    assert.match(a[0], /class="[^"]*\b(absolute|fixed)\b/, 'enlace posicionado encima')
    const canvasAnc = ancestorsAt(html, html.indexOf('<canvas'))
    const parent = ancestorsAt(html, a.index).at(-1)
    assert.ok(parent && canvasAnc.some((x) => x.pos === parent.pos), 'el padre del enlace contiene el canvas')
    assert.match(parent.cls, /\b(relative|absolute|fixed)\b/, 'el padre es contexto de posicionamiento')
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
