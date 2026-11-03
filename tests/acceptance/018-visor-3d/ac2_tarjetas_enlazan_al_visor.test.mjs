import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { loadLibrary, renderRoute, read, close } from './_render.mjs'

after(close)

test('AC2: cada tarjeta es un enlace a /viewer?model=<id>, sin dialog, con póster o degradado', async () => {
  const lib = await loadLibrary()
  const html = await renderRoute('/projects/3d-library')
  assert.doesNotMatch(html, /<dialog\b/)
  for (const m of lib.models) {
    assert.match(html, new RegExp(String.raw`<a\b[^>]*href="/viewer\?model=${encodeURIComponent(m.id)}"`), m.id)
  }
  // Superado por 019 AC3: póster (img con alt = título) o, como reserva, degradado.
  for (const m of lib.models) {
    const a = html.match(new RegExp(String.raw`<a\b[^>]*href="/viewer\?model=${encodeURIComponent(m.id)}"[^]*?</a>`))?.[0] ?? ''
    const poster = new RegExp(String.raw`<img\b[^>]*alt="${m.title}"`).test(a)
    assert.ok(poster || /bg-gradient-to-/.test(a), `${m.id}: póster o degradado de reserva`)
  }
})

test('AC2: LibraryProjectPage no usa showModal ni href absoluto (compatible con basename de Pages)', () => {
  const src = read('src/components/projects/LibraryProjectPage.jsx')
  assert.doesNotMatch(src, /showModal/)
  assert.doesNotMatch(src, /href=["'{`]+\/viewer/)
})
