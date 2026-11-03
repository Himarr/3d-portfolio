import test from 'node:test'
import assert from 'node:assert/strict'
import { read, exists } from './_src.mjs'

const page = () => read('src/pages/ViewerPage.jsx')
const canvas = () => read('src/three/ViewerCanvas.jsx')
const cap = () => read('src/three/ViewerCapture.jsx')

test('AC1: el modo captura detiene el turntable y usa preserveDrawingBuffer en el visor', () => {
  const s = canvas()
  assert.match(s, /preserveDrawingBuffer/)
  assert.match(s, /autoRotate=\{[^}]*capture[^}]*\}/, 'autoRotate depende de capture')
  assert.doesNotMatch(s, /enableRotate=\{\s*false/)
})

test('AC1: ViewerCapture ofrece los dos botones y descarga webp 0.9 con los nombres y tamaños de la spec', () => {
  assert.ok(exists('src/three/ViewerCapture.jsx'), 'src/three/ViewerCapture.jsx existe')
  const s = cap()
  assert.match(s, /Download poster/)
  assert.match(s, /Download cover/)
  assert.match(s, /-poster\.webp/)
  assert.match(s, /3d-library-cover\.webp/)
  assert.match(s, /1600/); assert.match(s, /1200/)
  assert.match(s, /2000/); assert.match(s, /1250/)
  assert.match(s, /image\/webp/)
  assert.match(s, /0\.9/)
  assert.match(s, /download/)
})

test('AC1: la captura compone fondo ink opaco + canvas de estrellas + canvas del visor en un canvas 2D, sin UI', () => {
  const s = cap()
  assert.match(s, /getContext\(['"]2d['"]\)/)
  assert.match(s, /fillRect/)
  assert.match(s, /--color-ink|\bink\b/i, 'color de fondo ink')
  assert.ok((s.match(/drawImage\(/g) ?? []).length >= 2, 'dibuja estrellas y visor')
  assert.match(s, /querySelector|querySelectorAll/, 'localiza los canvas')
})

test('AC1: ViewerPage monta ViewerCapture con ?capture, superpuesto y pasa capture al visor', () => {
  const s = page()
  assert.match(s, /import\(['"][^'"]*ViewerCapture/)
  assert.match(s, /capture/)
  assert.match(s, /<ViewerCanvas\b[^>]*\bcapture=/s)
  assert.match(s, /<ViewerCapture\b/)
})

test('AC2: el modo captura queda tras import.meta.env.DEV y sin import estático', () => {
  const s = page()
  assert.match(s, /import\.meta\.env\.DEV/)
  assert.doesNotMatch(s, /^import\s+[^\n]*ViewerCapture/m, 'sin import estático')
  const dev = s.search(/import\.meta\.env\.DEV/)
  const imp = s.search(/import\(['"][^'"]*ViewerCapture/)
  assert.ok(dev >= 0 && imp >= 0, 'ambos presentes')
  assert.match(s, /import\.meta\.env\.DEV\s*(&&|\?)[^;]*?(search|capture)|capture[^;]*?import\.meta\.env\.DEV/s)
})

test('AC2: preserveDrawingBuffer y autoRotate de captura solo se activan con capture', () => {
  const s = canvas()
  assert.match(s, /preserveDrawingBuffer:\s*(!!)?capture|preserveDrawingBuffer:\s*\w*capture\w*/i)
})
