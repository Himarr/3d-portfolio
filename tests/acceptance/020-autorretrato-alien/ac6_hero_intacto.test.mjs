import test from 'node:test'
import assert from 'node:assert/strict'
import { read, exists, PORTRAIT } from './_helpers.mjs'

test('AC6: el hero sigue con Alien.glb, toon y outline, y una sola capa de contorno en la página', () => {
  assert.ok(exists(PORTRAIT), `falta ${PORTRAIT}`)
  const alien = read('src/three/Alien.jsx')
  assert.match(alien, /assets\/3D\/Alien\.glb/)
  assert.match(alien, /<Model[^>]*\btoon\b[^>]*\boutline\b/)
  const scene = read('src/three/PageScene.jsx')
  assert.equal((scene.match(/<OutlineLayer/g) ?? []).length, 1)
  assert.doesNotMatch(scene, /SelfPortrait|AlienPosed/)
})

test('AC6: el visor y usePointerTarget no se han tocado para el autorretrato', () => {
  assert.ok(exists(PORTRAIT), `falta ${PORTRAIT}`)
  assert.doesNotMatch(read('src/three/ViewerCanvas.jsx'), /SelfPortrait|AlienPosed/)
  assert.doesNotMatch(read('src/three/usePointerTarget.js'), /SelfPortrait/)
})
