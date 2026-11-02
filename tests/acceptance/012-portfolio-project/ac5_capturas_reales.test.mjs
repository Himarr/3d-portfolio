import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderRoute, loadProjects, close } from './_render.mjs'

after(close)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const dir = path.join(root, 'src/assets/img/projects')
const MAX = 450 * 1024

function checkImg(img, label) {
  assert.ok(img && typeof img === 'object', `${label} existe`)
  assert.ok(typeof img.src === 'string' && img.src.length > 0, `${label}.src`)
  assert.ok(typeof img.alt === 'string' && img.alt.trim().length > 0, `${label}.alt`)
  assert.ok(Number(img.width) > 0, `${label}.width`)
  assert.ok(Number(img.height) > 0, `${label}.height`)
  const file = path.join(dir, path.basename(img.src.split('?')[0]))
  assert.ok(file.endsWith('.webp'), `${label} es .webp`)
  assert.ok(fs.existsSync(file), `${label}: existe ${file}`)
  assert.ok(fs.statSync(file).size <= MAX, `${label} ≤ 450 KB`)
}

test('AC5: portada y 3 capturas reales con archivos webp ligeros', async () => {
  const p = (await loadProjects()).find((x) => x.slug === 'portfolio')
  assert.ok(p, 'existe portfolio')
  checkImg(p.image, 'image')
  assert.ok(Array.isArray(p.images) && p.images.length === 3, 'images tiene 3 entradas')
  p.images.forEach((img, i) => checkImg(img, `images[${i}]`))
})

test('AC5: la página muestra las 3 capturas y no los placeholders', async () => {
  const p = (await loadProjects()).find((x) => x.slug === 'portfolio')
  const html = await renderRoute('/projects/portfolio')
  const alts = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0])
  assert.ok(Array.isArray(p?.images) && p.images.length === 3, 'images tiene 3 entradas')
  for (const img of p.images) {
    const esc = img.alt.replace(/&/g, '&amp;')
    assert.ok(alts.some((t) => t.includes(`alt="${esc}"`)), `<img> con alt "${img.alt}"`)
  }
  assert.ok(!/alt="placeholder \d/i.test(html), 'sin alt "placeholder N"')
})
