import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { renderRoute, close } from './_render.mjs'

after(close)

test('AC2: /projects/portfolio usa el layout de videojuego con ficha real', async () => {
  const html = await renderRoute('/projects/portfolio')
  assert.match(html, /<h1[^>]*>3D Portfolio<\/h1>/)
  assert.ok((html.match(/<img\b/g) ?? []).length >= 3, 'hero carrusel con ≥3 imágenes')
  assert.match(html, /<button[^>]*aria-label="Previous image"/)
  assert.match(html, /<button[^>]*aria-label="Next image"/)
  assert.ok(!html.includes('<dialog'), 'sin dialog de librería')
  assert.match(html, /<dt[^>]*>Year<\/dt><dd[^>]*>2026<\/dd>/)
  assert.match(html, /<dt[^>]*>Role<\/dt><dd[^>]*>Design &amp; development<\/dd>/)
  const tools = html.match(/<dt[^>]*>Tools<\/dt><dd[^>]*>(.*?)<\/dd>/)?.[1] ?? ''
  for (const t of ['React', 'Three.js', 'GSAP', 'Lenis', 'Tailwind CSS', 'Vite', 'Claude Code']) {
    assert.ok(tools.includes(t), `Tools incluye ${t}`)
  }
  assert.ok(!/placeholder/i.test(html.replace(/placeholder \d/gi, '')), 'sin textos Placeholder')
})
