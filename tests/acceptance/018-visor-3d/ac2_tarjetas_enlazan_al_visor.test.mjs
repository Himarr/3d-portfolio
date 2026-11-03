import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { loadLibrary, renderRoute, read, close } from './_render.mjs'

after(close)

test('AC2: cada tarjeta es un enlace a /viewer?model=<id>, sin dialog, con degradado', async () => {
  const lib = await loadLibrary()
  const html = await renderRoute('/projects/3d-library')
  assert.doesNotMatch(html, /<dialog\b/)
  for (const m of lib.models) {
    assert.match(html, new RegExp(String.raw`<a\b[^>]*href="/viewer\?model=${encodeURIComponent(m.id)}"`), m.id)
  }
  assert.ok((html.match(/bg-gradient-to-/g) ?? []).length >= lib.models.length, 'degradados como miniatura')
})

test('AC2: LibraryProjectPage no usa showModal ni href absoluto (compatible con basename de Pages)', () => {
  const src = read('src/components/projects/LibraryProjectPage.jsx')
  assert.doesNotMatch(src, /showModal/)
  assert.doesNotMatch(src, /href=["'{`]+\/viewer/)
})
