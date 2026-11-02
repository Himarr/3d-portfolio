import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadProjects, close } from './_render.mjs'

after(close)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const COVER = path.join(root, 'src/assets/img/projects/super-unam-odyssey-cover.webp')

// Lee el ancho y alto de un WebP (cabeceras VP8, VP8L o VP8X).
function webpSize(buf) {
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF', 'cabecera RIFF')
  assert.equal(buf.toString('ascii', 8, 12), 'WEBP', 'cabecera WEBP')
  const chunk = buf.toString('ascii', 12, 16)
  if (chunk === 'VP8 ') {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff }
  }
  if (chunk === 'VP8L') {
    const b = buf.readUInt32LE(21)
    return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 }
  }
  if (chunk === 'VP8X') {
    return {
      width: buf.readUIntLE(24, 3) + 1,
      height: buf.readUIntLE(27, 3) + 1,
    }
  }
  throw new Error(`chunk WebP desconocido: ${chunk}`)
}

test('AC2: el archivo de portada existe y es WebP', () => {
  assert.ok(existsSync(COVER), 'existe src/assets/img/projects/super-unam-odyssey-cover.webp')
  const buf = readFileSync(COVER)
  assert.ok(buf.length > 0)
  webpSize(buf)
})

test('AC2: la portada se importa como src y sus dimensiones coinciden con width/height', async () => {
  const projects = await loadProjects()
  const p = projects.find((x) => x.slug === 'super-unam-odyssey')
  assert.match(String(p.image.src), /super-unam-odyssey-cover\.webp$/, 'src apunta a la portada')
  const size = webpSize(readFileSync(COVER))
  assert.equal(size.width, p.image.width, 'width coincide con el archivo')
  assert.equal(size.height, p.image.height, 'height coincide con el archivo')
  assert.ok(size.width <= 1600, 'ancho ≤ 1600')
  assert.ok(Math.abs(size.width / size.height - 2000 / 1125) < 0.01, 'proporción original 16:9')
})
