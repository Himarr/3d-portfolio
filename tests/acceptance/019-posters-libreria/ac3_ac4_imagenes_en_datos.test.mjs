// Bloqueado hasta que el usuario guarde las imágenes (T3).
import test from 'node:test'
import assert from 'node:assert/strict'
import { read, exists } from './_src.mjs'

const data = () => read('src/data/projects.js')

test('AC3: existen los tres pósters de la librería y cada modelo los enlaza', () => {
  const s = data()
  for (const [id, title] of [['supra-mk3', 'Supra MK3'], ['alien', 'Alien'], ['luna', 'Luna']]) {
    assert.ok(exists(`src/assets/img/library/${id}-poster.webp`), `${id}-poster.webp existe`)
    assert.match(s, new RegExp(`library/${id}-poster\.webp`), `projects.js importa ${id}-poster`)
    const line = s.match(new RegExp(`\{[^\n]*id:\s*"${id}"[^\n]*\}`))?.[0] ?? ''
    assert.ok(line, `modelo ${id}`)
    assert.doesNotMatch(line, /poster:\s*null/, `${title} con póster`)
  }
})

test('AC4: la tarjeta 3D Library usa 3d-library-cover.webp con alt, width, height y procedencia', () => {
  assert.ok(exists('src/assets/img/projects/3d-library-cover.webp'))
  const s = data()
  assert.match(s, /projects\/3d-library-cover\.webp/)
  const block = s.slice(s.indexOf('slug: "3d-library"'), s.indexOf('slug: "super-unam-odyssey"'))
  assert.match(block, /\/\/\s*Provenance:/)
  assert.match(block, /image:\s*\{[^}]*src:[^}]*alt:\s*"[^"]+"[^}]*width:\s*2000[^}]*height:\s*1250/s)
})
