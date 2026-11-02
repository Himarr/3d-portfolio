import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { loadProjects, close } from './_render.mjs'

after(close)

test('AC1: megaloterra primero, slug/título intactos, descripción corta real', async () => {
  const projects = await loadProjects()
  assert.deepEqual(
    projects.map((p) => p.slug),
    ['megaloterra', 'portfolio', '3d-library', 'super-unam-odyssey'],
  )
  const p = projects[0]
  assert.equal(p.title, 'Megaloterra')
  assert.ok(typeof p.description === 'string' && p.description.trim().length > 0)
  assert.ok(p.description.length <= 200, 'description ≤ 200 caracteres')
  assert.ok(!/placeholder/i.test(p.description), 'sin "Placeholder"')
})
