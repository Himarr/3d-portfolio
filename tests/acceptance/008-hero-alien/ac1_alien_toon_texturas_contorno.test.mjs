import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { src, root } from './helpers.mjs'
import { createToonMaterial } from '../../../src/three/toonMaterial.js'

function glbJson(file) {
  const b = readFileSync(file)
  const len = b.readUInt32LE(12)
  return JSON.parse(b.subarray(20, 20 + len).toString('utf8'))
}

test('AC1: Alien.jsx usa Model con toon y outline sobre Alien.glb', () => {
  const s = src('src/three/Alien.jsx')
  assert.match(s, /assets\/3D\/Alien\.glb/)
  assert.match(s, /<Model[^>]*\btoon\b[^>]*\boutline\b/)
  assert.match(s, /FitToUnit/)
})

test('AC1: el glb conserva sus 3 materiales con textura propia y el toon conserva el map', () => {
  assert.ok(src('src/three/Alien.jsx')) // the component must exist
  const j = glbJson(root('src/assets/3D/Alien.glb'))
  const names = j.materials.map((m) => m.name)
  for (const n of ['AlienBaseColor', 'Comic Shader.001', 'Comic Shader.004']) {
    const m = j.materials.find((x) => x.name === n)
    assert.ok(m, `falta ${n} ${names}`)
    assert.ok(m.pbrMetallicRoughness?.baseColorTexture, `${n} sin baseColorTexture`)
  }
  const imgs = j.images.map((i) => i.name)
  assert.ok(imgs.includes('BaseColor') && imgs.includes('Clothes'))
  const sentinel = { isTexture: true }
  assert.equal(createToonMaterial({ name: 'x', map: sentinel }).map, sentinel)
})

test('AC1: una sola pasada de contorno cubre los dos modelos', () => {
  const s = src('src/three/PageScene.jsx')
  assert.equal((s.match(/<OutlineLayer/g) ?? []).length, 1)
  assert.match(s, /<Alien\b/)
})
