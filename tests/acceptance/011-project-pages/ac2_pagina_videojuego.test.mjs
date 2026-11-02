import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { renderRoute, close } from './_render.mjs'

after(close)

for (const [slug, title] of [
  ['megaloterra', 'Megaloterra'],
  ['super-unam-odyssey', 'Super Unam Odyssey'],
]) {
  test(`AC2: /projects/${slug} muestra el layout de videojuego`, async () => {
    const html = await renderRoute(`/projects/${slug}`)
    assert.match(html, /<h1[^>]*>[^<]*/)
    assert.ok(html.includes(title), 'título')
    assert.ok((html.match(/<img\b/g) ?? []).length >= 3, 'al menos 3 imágenes en el carrusel')
    assert.match(html, /<button[^>]*aria-label="[^"]*(prev|anterior)[^"]*"/i, 'botón anterior con aria-label')
    assert.match(html, /<button[^>]*aria-label="[^"]*(next|siguiente)[^"]*"/i, 'botón siguiente con aria-label')
    assert.equal((html.match(/aria-current=/g) ?? []).length, 1, 'un único punto activo con aria-current')
    const dots = html.match(/<button\b[^>]*aria-label="[^"]*"/g) ?? []
    assert.ok(dots.length >= 5, 'prev + next + ≥3 puntos')
    assert.match(html, /role|rol/i, 'ficha: rol')
    assert.match(html, /tools|herramientas/i, 'ficha: herramientas')
    assert.match(html, /year|a(ñ|n)o/i, 'ficha: año')
    assert.match(html, /Back to projects/)
    assert.ok(!html.includes('<dialog'), 'sin dialog de librería')
  })
}
