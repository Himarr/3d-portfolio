import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { loadProjects, close } from './_render.mjs'

after(close)

async function getProject() {
  const projects = await loadProjects()
  return projects.find((p) => p.slug === 'super-unam-odyssey')
}

test('AC1: ficha de super-unam-odyssey con año, rol, herramientas y enlace reales', async () => {
  const p = await getProject()
  assert.ok(p, 'existe el proyecto super-unam-odyssey')
  assert.equal(p.year, '2025')
  assert.equal(p.role, 'Team lead & gameplay programmer')
  assert.equal(p.tools, 'Unity, C#')
  assert.deepEqual(p.link, {
    label: 'View on GitHub',
    href: 'https://github.com/Himarr/SuperMarioBrosClone',
  })
})

test('AC1: descripción real corta, sin Placeholder', async () => {
  const p = await getProject()
  assert.ok(typeof p.description === 'string' && p.description.trim().length > 0)
  assert.ok(p.description.length <= 200, 'description ≤ 200 caracteres')
  assert.ok(!/placeholder/i.test(p.description), 'sin "Placeholder"')
})

test('AC1: image de portada con src, alt descriptivo, width/height y comentario de procedencia', async () => {
  const p = await getProject()
  assert.ok(p.image, 'tiene image')
  assert.match(String(p.image.src), /super-unam-odyssey-cover\.webp$/)
  assert.ok(typeof p.image.alt === 'string' && p.image.alt.trim().length > 10, 'alt descriptivo')
  assert.ok(Number.isInteger(p.image.width) && p.image.width > 0, 'width numérico')
  assert.ok(Number.isInteger(p.image.height) && p.image.height > 0, 'height numérico')
})
