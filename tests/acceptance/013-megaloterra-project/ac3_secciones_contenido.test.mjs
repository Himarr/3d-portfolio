import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { renderRoute, close } from './_render.mjs'

after(close)

const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()

async function getSections() {
  const html = await renderRoute('/projects/megaloterra')
  return [...html.matchAll(/<section\b[^>]*>\s*<h2[^>]*>(.*?)<\/h2>(.*?)<\/section>/gs)].map((m) => ({
    heading: strip(m[1]),
    body: strip(m[2]),
  }))
}

const EXPECTED = [
  ['roguelike', 'turn-based', 'procedural', /fusion|fuse/i, 'Unity', 'itch.io', /\b(4|four)\b/, 'Project Management', 'Atlántico Medio'],
  ['Slay the Spire', '3D', /cross/i, /combat/i, /event/i, /treasure/i, /shop/i, /heal/i, /boss/i, /decorat/i],
  ['ZBrush', 'Blender', /retopolog/i, /sculpt/i],
  [/save/i, /inventory/i, /consumable/i, /nursery/i, /stat/i],
  ['HUD', /menu/i, 'inventory', /options/i],
]

test('AC3: 5 secciones con h2 y texto, con el contenido de cada una', async () => {
  const sections = await getSections()
  assert.equal(sections.length, 5, '5 secciones con h2')
  sections.forEach((s, i) => {
    assert.ok(s.heading.length > 0, `sección ${i + 1}: h2 no vacío`)
    assert.ok(s.body.length >= 60, `sección ${i + 1}: tiene texto`)
    for (const kw of EXPECTED[i]) {
      const ok = kw instanceof RegExp ? kw.test(s.body) : s.body.toLowerCase().includes(kw.toLowerCase())
      assert.ok(ok, `sección ${i + 1} ("${s.heading}") menciona ${kw}`)
    }
  })
})
