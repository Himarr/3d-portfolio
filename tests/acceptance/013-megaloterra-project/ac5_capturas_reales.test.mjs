import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderRoute, loadProjects, close } from './_render.mjs'

after(close)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const dir = path.join(root, 'src/assets/img/projects')
const MAX = 400 * 1024

function checkImg(img, label) {
  assert.ok(img && typeof img === 'object', `${label} existe`)
  assert.ok(typeof img.src === 'string' && img.src.length > 0, `${label}.src`)
  assert.ok(typeof img.alt === 'string' && img.alt.trim().length > 0, `${label}.alt`)
  assert.ok(Number(img.width) > 0, `${label}.width`)
  assert.ok(Number(img.height) > 0, `${label}.height`)
  const ratio = img.width / img.height
  assert.ok(Math.abs(ratio - 1.6) < 0.02, `${label} es 16:10 (ratio ${ratio})`)
  const file = path.join(dir, path.basename(img.src.split('?')[0]))
  assert.ok(path.basename(file).startsWith('megaloterra'), `${label} se llama megaloterra*.webp`)
  assert.ok(file.endsWith('.webp'), `${label} es .webp`)
  assert.ok(fs.existsSync(file), `${label}: existe ${file}`)
  assert.ok(fs.statSync(file).size <= MAX, `${label} ≤ 400 KB`)
}

test('AC5: portada y 6 capturas 16:10 en webp ligero', async () => {
  const p = (await loadProjects()).find((x) => x.slug === 'megaloterra')
  assert.ok(p, 'existe megaloterra')
  checkImg(p.image, 'image')
  assert.ok(Array.isArray(p.images) && p.images.length === 6, 'images tiene 6 entradas')
  p.images.forEach((img, i) => checkImg(img, `images[${i}]`))
  assert.ok(p.images.some((i) => i.src === p.image.src), 'la portada está entre las capturas')
  const full = p.images.filter((i) => i.width === 1600 && i.height === 1000)
  assert.equal(full.length, 4, '4 capturas de itch.io a 1600x1000')
  for (const i of p.images.filter((x) => !full.includes(x))) {
    assert.ok(i.width <= 1351, 'las del autor no se reescalan hacia arriba')
  }
  assert.equal(new Set(p.images.map((i) => i.src)).size, 6, 'archivos distintos')
})

test('AC5: la página muestra las 6 capturas y no los placeholders', async () => {
  const p = (await loadProjects()).find((x) => x.slug === 'megaloterra')
  const html = await renderRoute('/projects/megaloterra')
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0])
  assert.ok(Array.isArray(p?.images) && p.images.length === 6, 'images tiene 6 entradas')
  for (const img of p.images) {
    const esc = img.alt.replace(/&/g, '&amp;')
    assert.ok(imgs.some((t) => t.includes(`alt="${esc}"`)), `<img> con alt "${img.alt}"`)
  }
  assert.ok(!/alt="[^"]*placeholder/i.test(html), 'sin alt placeholder')
})
