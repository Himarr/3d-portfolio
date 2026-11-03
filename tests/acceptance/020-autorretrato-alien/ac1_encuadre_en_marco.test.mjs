import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { read, exists, PORTRAIT, renderAbout, close } from './_helpers.mjs'

after(close)

test('AC1: SelfPortrait.jsx muestra AlienPosed.glb con FitToUnit en un canvas ortográfico', () => {
  assert.ok(exists(PORTRAIT), `falta ${PORTRAIT}`)
  assert.ok(exists('src/assets/3D/AlienPosed.glb'))
  const s = read(PORTRAIT)
  assert.match(s, /assets\/3D\/AlienPosed\.glb/)
  assert.match(s, /<Canvas\b[^>]*\borthographic\b/s)
  assert.match(s, /<FitToUnit\b/)
  assert.match(s, /<Model\b/)
})

test('AC1: el canvas llena el marco 4:5 existente, que conserva ratio, borde y recorte', async () => {
  assert.ok(exists(PORTRAIT), `falta ${PORTRAIT}`)
  const a = read('src/components/sections/AboutMe.jsx')
  assert.match(a, /aspectRatio:\s*ABOUT_IMAGE_ASPECT/)
  assert.match(a, /overflow-hidden[^"]*border border-line|border border-line[^"]*overflow-hidden/)
  assert.match(a, /SelfPortrait/)
  const html = await renderAbout()
  assert.match(html, /aspect-ratio:\s*4\s*\/\s*5/)
})

test('AC1: el montaje del canvas es diferido (React.lazy) para no retrasar el hero', () => {
  assert.ok(exists(PORTRAIT), `falta ${PORTRAIT}`)
  const a = read('src/components/sections/AboutMe.jsx')
  assert.match(a, /lazy\(\s*\(\)\s*=>\s*import\([^)]*SelfPortrait/)
  assert.doesNotMatch(a, /^import\s+SelfPortrait/m)
  assert.doesNotMatch(read('src/three/PageScene.jsx') + read('src/three/Alien.jsx'), /AlienPosed/)
})
