import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { loadProjects, close } from './_render.mjs'

after(close)

test('AC1: el segundo proyecto es portfolio con descripción corta real', async () => {
  const projects = await loadProjects()
  const p = projects[1]
  assert.equal(p?.slug, 'portfolio')
  assert.equal(p.title, '3D Portfolio')
  assert.ok(typeof p.description === 'string' && p.description.length > 0)
  assert.ok(p.description.length <= 200, 'description ≤ 200 caracteres')
  assert.ok(!/placeholder/i.test(p.description), 'sin "Placeholder"')
})

test('AC1: el orden relativo de los proyectos existentes no cambia', async () => {
  const projects = await loadProjects()
  assert.equal(projects.length, 4)
  const rest = projects.filter((p) => p.slug !== 'portfolio').map((p) => p.slug)
  assert.deepEqual(rest, ['megaloterra', '3d-library', 'super-unam-odyssey'])
})
