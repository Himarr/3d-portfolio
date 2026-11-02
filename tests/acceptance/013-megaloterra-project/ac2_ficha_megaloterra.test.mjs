import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { renderRoute, close } from './_render.mjs'

after(close)

test('AC2: ficha con Year, Role y Tools de Megaloterra', async () => {
  const html = await renderRoute('/projects/megaloterra')
  assert.match(html, /<h1[^>]*>Megaloterra<\/h1>/)
  assert.match(html, /<dt[^>]*>Year<\/dt><dd[^>]*>2026<\/dd>/)
  assert.match(html, /<dt[^>]*>Role<\/dt><dd[^>]*>Gameplay programmer &amp; 3D artist<\/dd>/)
  assert.match(html, /<dt[^>]*>Tools<\/dt><dd[^>]*>Unity, C#, Blender, ZBrush<\/dd>/)
  assert.ok(!/placeholder/i.test(html), 'sin textos Placeholder')
})
