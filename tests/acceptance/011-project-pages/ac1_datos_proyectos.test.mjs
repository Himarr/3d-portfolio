import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { loadProjects, close } from './_render.mjs'

after(close)

test('AC1: la portada lista Megaloterra, 3D Library y Super Unam Odyssey en orden con slug y type', async () => {
  const projects = await loadProjects()
  const feature011 = ['megaloterra', '3d-library', 'super-unam-odyssey']
  assert.deepEqual(
    projects
      .filter((p) => feature011.includes(p.slug))
      .map((p) => [p.title, p.slug, p.type]),
    [
      ['Megaloterra', 'megaloterra', 'game'],
      ['3D Library', '3d-library', 'library'],
      ['Super Unam Odyssey', 'super-unam-odyssey', 'game'],
    ],
  )
})

test('AC1: los placeholders project-one/two/three desaparecen', async () => {
  const slugs = (await loadProjects()).map((p) => p.slug)
  for (const old of ['project-one', 'project-two', 'project-three']) {
    assert.ok(!slugs.includes(old), old)
  }
})
