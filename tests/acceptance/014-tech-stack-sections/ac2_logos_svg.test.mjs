import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { loadTechStackSource, parseTechStack, readRepoFile } from './_parse.mjs'

const src = loadTechStackSource()
const { categories, imports } = parseTechStack(src)
const tools = categories.flatMap((c) => c.tools)
const svgOf = (t) => readRepoFile(`src/assets/tech/${t.id}.svg`)

// Excepción explícita (decisión del usuario): no existe logo para estas dos herramientas.
const SIN_LOGO = ['zbrush', 'substance-3d-painter']
const conLogo = tools.filter((t) => !SIN_LOGO.includes(t.id))

test('AC2: solo ZBrush y Substance 3D Painter no tienen icon (excepción explícita)', () => {
  assert.deepEqual(
    tools.filter((t) => t.icon === undefined).map((t) => t.id).sort(),
    [...SIN_LOGO].sort(),
  )
})

test('AC2: las demás herramientas tienen icon que apunta a src/assets/tech/<id>.svg existente', () => {
  for (const t of conLogo) {
    assert.equal(t.icon, `${t.id}.svg`, `${t.id}: icon debe ser ${t.id}.svg`)
    assert.ok(existsSync(new URL(`../../../src/assets/tech/${t.id}.svg`, import.meta.url)), `falta ${t.id}.svg`)
  }
})

test('AC2: SVG sin width/height en la raíz, sin script ni referencias externas', () => {
  for (const t of conLogo) {
    const svg = svgOf(t)
    const root = /<svg\b[^>]*>/i.exec(svg)
    assert.ok(root, `${t.id}: sin <svg> raíz`)
    assert.ok(!/\s(width|height)\s*=/.test(root[0]), `${t.id}: width/height en <svg> raíz`)
    assert.ok(!/<script\b/i.test(svg), `${t.id}: contiene <script>`)
    assert.ok(!/<(image|foreignObject)\b/i.test(svg), `${t.id}: elemento externo`)
    const refs = [...svg.matchAll(/\b(?:xlink:)?href\s*=\s*"([^"]*)"/gi)]
      .map((m) => m[1])
      .filter((v) => !v.startsWith('#'))
    assert.deepEqual(refs, [], `${t.id}: href externo`)
    assert.ok(!/url\(\s*['"]?(?!#)/i.test(svg), `${t.id}: url() externo`)
  }
})

test('AC2: comentario // Provenance: en techStack.js por cada icono importado', () => {
  const provenance = (src.match(/\/\/ Provenance:/g) || []).length
  assert.ok(
    provenance >= Object.keys(imports).length,
    `Provenance: ${provenance}, imports: ${Object.keys(imports).length}`,
  )
})
