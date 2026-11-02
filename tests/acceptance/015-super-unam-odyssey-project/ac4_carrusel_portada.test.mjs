import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { renderRoute, loadProjects, close } from './_render.mjs'

after(close)

test('AC4: images tiene solo la portada', async () => {
  const p = (await loadProjects()).find((x) => x.slug === 'super-unam-odyssey')
  assert.ok(p?.image?.src, 'existe image.src')
  assert.ok(Array.isArray(p.images) && p.images.length === 1, 'images tiene exactamente 1 entrada')
  assert.equal(p.images[0].src, p.image.src, 'la entrada es la portada')
})

test('AC4: el carrusel muestra la portada, sin placeholders, flechas ni puntos', async () => {
  const p = (await loadProjects()).find((x) => x.slug === 'super-unam-odyssey')
  const html = await renderRoute('/projects/super-unam-odyssey')
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0])
  assert.ok(imgs.some((t) => t.includes(`src="${p.image.src}"`)), '<img> con la portada')
  assert.ok(!/alt="[^"]*placeholder/i.test(html), 'sin alt placeholder')
  assert.ok(!/aria-label="(Previous|Next) image"/i.test(html), 'sin flechas')
  assert.ok(!/aria-current=/.test(html), 'sin puntos')
})

test('AC4: megaloterra mantiene sus slides reales, flechas y puntos', async () => {
  const html = await renderRoute('/projects/megaloterra')
  assert.match(html, /aria-label="Previous image"/)
  assert.match(html, /aria-label="Next image"/)
  assert.equal((html.match(/aria-current=/g) ?? []).length, 1)
})
