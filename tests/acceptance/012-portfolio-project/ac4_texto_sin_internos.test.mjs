import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { renderRoute, loadProjects, close } from './_render.mjs'

after(close)

const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

test('AC4: la página no menciona modelos, agentes internos, porcentajes ni URLs', async () => {
  const html = await renderRoute('/projects/portfolio')
  for (const w of ['haiku', 'sonnet', 'opus', 'planner', 'builder', 'reviewer']) {
    assert.ok(!html.toLowerCase().includes(w), `no contiene "${w}"`)
  }
  const text = strip(html)
  assert.ok(!text.includes('%'), 'sin porcentajes en el texto visible')
  assert.ok(!/http/i.test(text), 'sin URLs en el texto visible')
  const p = (await loadProjects()).find((x) => x.slug === 'portfolio')
  assert.ok(p, 'existe portfolio')
  assert.ok(!p.description.includes('%'), 'descripción sin %')
  for (const s of p.sections ?? []) {
    assert.ok(!(s.heading + s.body).includes('%'), 'secciones sin %')
  }
})
