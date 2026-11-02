import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { renderRoute, close } from './_render.mjs'

after(close)

test('AC4: un slug inexistente muestra ProjectNotFound', async () => {
  assert.doesNotMatch(await renderRoute('/projects/megaloterra'), /Project not found/, 'slug válido existe')
  const html = await renderRoute('/projects/no-existe')
  assert.match(html, /Project not found/)
})

test('AC4: los slugs antiguos project-one/two/three ya no existen', async () => {
  for (const s of ['project-one', 'project-two', 'project-three']) {
    assert.match(await renderRoute(`/projects/${s}`), /Project not found/, s)
  }
})
