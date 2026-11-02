import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { renderRoute, close } from './_render.mjs'

after(close)

const URL = 'https://d3nuwu.itch.io/megaloterra'

test('AC6: enlace visible a itch.io en pestaña nueva con rel seguro', async () => {
  const html = await renderRoute('/projects/megaloterra')
  const a = [...html.matchAll(/<a\b[^>]*>(.*?)<\/a>/gs)].find((m) => m[0].includes(`href="${URL}"`))
  assert.ok(a, 'existe <a href="https://d3nuwu.itch.io/megaloterra">')
  assert.match(a[0], /target="_blank"/)
  assert.match(a[0], /rel="(?=[^"]*\bnoopener\b)(?=[^"]*\bnoreferrer\b)[^"]*"/)
  assert.ok(a[1].replace(/<[^>]+>/g, '').trim().length > 0, 'texto visible')
})

test('AC6: los otros proyectos no muestran ningún enlace externo nuevo', async () => {
  for (const slug of ['portfolio', '3d-library', 'super-unam-odyssey']) {
    const html = await renderRoute(`/projects/${slug}`)
    assert.ok(!/itch\.io/i.test(html), `${slug}: sin itch.io`)
    assert.ok(!html.includes('target="_blank"'), `${slug}: sin enlaces a pestaña nueva`)
  }
})
