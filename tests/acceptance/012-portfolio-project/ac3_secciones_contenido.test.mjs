import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { renderRoute, loadProjects, close } from './_render.mjs'

after(close)

const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

test('AC3: ≥4 secciones con h2 y texto, debajo de la descripción', async () => {
  const p = (await loadProjects()).find((x) => x.slug === 'portfolio')
  assert.ok(Array.isArray(p?.sections) && p.sections.length >= 4, '≥4 secciones')
  for (const s of p.sections) {
    assert.ok(s.heading?.trim() && s.body?.trim(), 'heading y body no vacíos')
  }
  const html = await renderRoute('/projects/portfolio')
  const h2 = html.match(/<h2\b[^>]*>.*?<\/h2>/g) ?? []
  assert.ok(h2.length >= 4, '≥4 h2 renderizados')
  for (const s of p.sections) {
    assert.ok(html.includes(s.heading.replace(/&/g, '&amp;')), `renderiza "${s.heading}"`)
  }
  const descIdx = html.indexOf('<p class="text-lg')
  assert.ok(descIdx >= 0 && html.indexOf('<h2') > descIdx, 'h2 tras la descripción')
})

test('AC3: el contenido cubre la web 3D, el flujo con specs/tests, la calidad y los resultados', async () => {
  const html = await renderRoute('/projects/portfolio')
  const text = strip(html.slice(html.indexOf('<h2')))
  assert.ok(text.includes('Three.js'), 'menciona Three.js')
  assert.ok(/spec/i.test(text), 'menciona spec')
  assert.ok(/acceptance test/i.test(text), 'menciona acceptance test')
  assert.ok(/review/i.test(text), 'menciona review')
  assert.ok(/quality/i.test(text), 'menciona quality')
  assert.ok(/October 2026/.test(text), 'inicio en octubre de 2026')
})
