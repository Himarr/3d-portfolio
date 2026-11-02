import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { loadProjects, close } from './_render.mjs'

after(close)

async function getSections() {
  const projects = await loadProjects()
  return projects.find((p) => p.slug === 'super-unam-odyssey').sections
}

const EXPECTED = [
  {
    heading: 'What it is',
    keywords: [/Super Mario Bros/i, /NES/, /2025/, 'Atlántico Medio', /\b(4|four)\b/, /lead|led|direct/i, 'Unity'],
  },
  {
    heading: 'Movement physics and collisions',
    keywords: [/physics/i, /collision/i],
  },
  {
    heading: 'Enemies, power-ups and levels',
    keywords: [/enem/i, /power/i, /state machine|states/i, /level/i],
  },
  {
    heading: 'Odyssey mode',
    keywords: [/Odyssey/, /Cappy/, /hat/i, /bounce/i],
  },
]

test('AC3: al menos las cuatro secciones pedidas, con heading exacto y texto', async () => {
  const sections = await getSections()
  assert.ok(Array.isArray(sections), 'tiene sections')
  for (const exp of EXPECTED) {
    const s = sections.find((x) => x.heading === exp.heading)
    assert.ok(s, `existe la sección "${exp.heading}"`)
    assert.ok(typeof s.body === 'string' && s.body.length >= 60, `"${exp.heading}" tiene texto`)
    assert.ok(!/placeholder/i.test(s.body), `"${exp.heading}" sin Placeholder`)
  }
})

test('AC3: cada sección contiene los conceptos pedidos', async () => {
  const sections = await getSections()
  for (const exp of EXPECTED) {
    const s = sections.find((x) => x.heading === exp.heading)
    assert.ok(s, `existe la sección "${exp.heading}"`)
    for (const kw of exp.keywords) {
      const ok = kw instanceof RegExp ? kw.test(s.body) : s.body.includes(kw)
      assert.ok(ok, `"${exp.heading}" menciona ${kw}`)
    }
  }
})

test('AC3: texto en primera persona y sin atribuir trabajo no indicado', async () => {
  const sections = await getSections()
  const all = sections.map((s) => s.body).join(' ')
  assert.match(all, /\bI\b/, 'primera persona')
  assert.ok(!/\b(we|our|us)\b/i.test(all), 'sin "we/our/us"')
  assert.ok(!/\b(art|artist|model|modeling|sculpt|level design|music|sound|retopology)\b/i.test(
    sections.find((s) => s.heading === 'Movement physics and collisions')?.body ?? '',
  ), 'la sección de físicas no atribuye arte ni música')
})
