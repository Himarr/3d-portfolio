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

test('AC3: el contenido cubre el flujo de desarrollo con IA', async () => {
  const html = await renderRoute('/projects/portfolio')
  const text = strip(html.slice(html.indexOf('<h2')))
  for (const k of ['Claude Code', 'spec', 'test', 'Haiku', 'Sonnet', 'Opus', 'Three.js']) {
    assert.ok(text.includes(k), `menciona ${k}`)
  }
  for (const k of ['planner', 'builder', 'reviewer', 'browser']) {
    assert.ok(new RegExp(k, 'i').test(text), `menciona ${k}`)
  }
  assert.ok(/subagent/i.test(text), 'menciona subagent')
  assert.ok(/October 2026/.test(text), 'inicio en octubre de 2026')
  assert.ok(/\b(1[1-9]|[2-9]\d)\b/.test(text), 'cifra de features (≥ 11)')
  assert.ok(!/\d+\s?%/.test(text), 'sin porcentajes inventados')
  assert.ok(!/https?:\/\//.test(html.slice(html.indexOf('<h2'))), 'sin enlaces externos')
})
