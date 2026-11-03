import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { renderRoute, close } from './_render.mjs'

after(close)

test('AC3: /projects/3d-library muestra una rejilla 1/2/3 columnas con tarjetas de modelo', async () => {
  const html = await renderRoute('/projects/3d-library')
  assert.match(html, /grid-cols-1/)
  assert.match(html, /sm:grid-cols-2/)
  assert.match(html, /lg:grid-cols-3/)
  assert.ok(!/(?:sm|md|lg|xl|2xl):grid-cols-(?:[4-9]|1\d)/.test(html), 'máximo 3 columnas')
  const cards = html.match(/<a\b[^>]*href=\"\/viewer\?model=[^\"]*\"[^>]*>(?:(?!<\/a>).)*<img\b/gs) ?? []
  assert.ok(cards.length >= 3, `al menos 3 tarjetas de póster (hay ${cards.length})`)
  assert.match(html, /Back to projects/)
})
