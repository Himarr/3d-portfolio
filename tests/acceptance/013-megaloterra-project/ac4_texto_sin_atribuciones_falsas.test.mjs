import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { renderRoute, close } from './_render.mjs'

after(close)

test('AC4: sin texturizado/Substance ni trabajo ajeno atribuido al autor', async () => {
  const html = await renderRoute('/projects/megaloterra')
  const text = html.replace(/<[^>]+>/g, ' ')
  assert.match(text, /Megaloterra/)
  assert.ok(!/textur|substance|placeholder/i.test(text), 'sin texture/Substance/Placeholder')
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    const firstPerson = /\b(I|my)\b/.test(sentence)
    assert.ok(
      !(firstPerson && /\b(combat|fusion|music|soundtrack)\b/i.test(sentence)),
      `no atribuye combate/fusión/música al autor: "${sentence.trim()}"`,
    )
  }
})
