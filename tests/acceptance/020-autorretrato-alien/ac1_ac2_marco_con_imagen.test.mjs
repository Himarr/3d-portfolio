import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const exists = (rel) => existsSync(path.join(root, rel))
const read = (rel) => (exists(rel) ? readFileSync(path.join(root, rel), 'utf8') : '')

const about = () => read('src/data/about.js')
const section = () => read('src/components/sections/AboutMe.jsx')

// Frame element: the div that carries the 4:5 aspect ratio and the border.
const frameClass = () => section().match(/className="([^"]*overflow-hidden border border-line[^"]*)"/)?.[1] ?? ''

test('AC1: el marco 4:5 de About Me mantiene aspect-ratio, borde y tamaño', () => {
  const s = section()
  assert.match(s, /aspectRatio:\s*ABOUT_IMAGE_ASPECT/, 'aspect-ratio 4:5 del marco')
  assert.match(frameClass(), /mx-auto w-full max-w-xs overflow-hidden border border-line/, 'clases de tamaño y borde')
  assert.match(frameClass(), /snap:h-\(--about-img-h\)/, 'altura snap del marco')
})

test('AC1: About Me renderiza la imagen dentro del marco con object-cover', () => {
  const s = section()
  assert.match(s, /<img[\s\S]*src=\{aboutImage\.src\}[\s\S]*\/>/, 'img con src de aboutImage')
  assert.match(s, /<img[\s\S]*className="h-full w-full object-cover"/, 'imagen ocupa el marco con object-cover')
  assert.doesNotMatch(s, /aria-hidden="true"\s*\n\s*className="h-full w-full bg-linear-to-br/, 'placeholder retirado')
})

test('AC1: el degradado se mantiene como fondo del marco', () => {
  assert.match(frameClass(), /bg-linear-to-br from-surface to-ink/, 'gradiente en el marco')
})

test('AC1: aboutImage está definido (no null) en src/data/about.js', () => {
  assert.doesNotMatch(about(), /export const aboutImage = null;/)
  assert.match(about(), /export const aboutImage = \{/)
})

test('AC1: existe el PNG de autorretrato', () => {
  assert.ok(exists('src/assets/img/AlienAboutMe.png'))
})

test('AC2: aboutImage usa AlienAboutMe.png con alt exacto y dimensiones 633x796', () => {
  const s = about()
  const imp = s.match(/import\s+(\w+)\s+from\s+["'][^"']*AlienAboutMe\.png["']/)
  assert.ok(imp, 'import del PNG')
  const block = s.slice(s.indexOf('export const aboutImage = {'))
  assert.match(block, new RegExp(String.raw`src:\s*${imp[1]}\b`), 'src apunta al PNG importado')
  assert.match(block, /alt:\s*"Self-portrait: 3D alien character"/, 'alt exacto')
  assert.match(block, /width:\s*633\b/, 'width 633')
  assert.match(block, /height:\s*796\b/, 'height 796')
})

test('AC2: las dimensiones declaradas coinciden con el PNG real', () => {
  const buf = readFileSync(path.join(root, 'src/assets/img/AlienAboutMe.png'))
  assert.equal(buf.toString('ascii', 12, 16), 'IHDR', 'cabecera PNG válida')
  assert.equal(buf.readUInt32BE(16), 633, 'ancho real')
  assert.equal(buf.readUInt32BE(20), 796, 'alto real')
})

test('AC2: hay comentario de procedencia "own work" antes de la entrada', () => {
  const s = about()
  const idx = s.search(/^export const aboutImage = \{/m)
  assert.ok(idx > 0, 'entrada aboutImage existe')
  const prov = s.match(/^\/\/\s*Provenance:(?![^\n]*<)[^\n]*own work[^\n]*$/im)
  assert.ok(prov, 'comentario Provenance con own work (no el ejemplo)')
  assert.ok(prov.index < idx, 'el comentario está antes de la entrada')
})

test('AC2: AboutMe.jsx pasa alt, width y height al <img>', () => {
  const s = section()
  assert.match(s, /alt=\{aboutImage\.alt\}/)
  assert.match(s, /width=\{aboutImage\.width\}/)
  assert.match(s, /height=\{aboutImage\.height\}/)
})
