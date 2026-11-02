import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { renderRoute, loadProjects, close } from './_render.mjs'

after(close)

test('AC6: proyectos sin sections no renderizan h2 y el portfolio sí', async () => {
  const projects = await loadProjects()
  assert.ok(projects.some((p) => p.slug === 'portfolio'), 'existe portfolio')
  const portfolioHtml = await renderRoute('/projects/portfolio')
  assert.ok(/<h2\b/.test(portfolioHtml), 'portfolio con h2')
  for (const slug of ['super-unam-odyssey']) {
    const html = await renderRoute(`/projects/${slug}`)
    assert.ok(!/<h2\b/.test(html), `${slug} sin h2`)
    assert.match(html, /Back to projects/)
  }
})
