import test from 'node:test'
import assert from 'node:assert/strict'
import { validateTechStack } from '../../../src/lib/dataValidation.js'
import { loadTechStackSource, parseTechStack } from './_parse.mjs'

const { categories } = parseTechStack(loadTechStackSource())

test('AC1: cuatro categorías y herramientas literales, en este orden', () => {
  assert.deepEqual(
    categories.map((c) => [c.title, c.tools.map((t) => t.name)]),
    [
      ['Modeling', ['Blender', 'ZBrush', 'Maya', 'Substance 3D Painter']],
      ['Game Dev', ['Unity', 'Godot', 'Unreal Engine 5']],
      ['Programming', ['C#', 'Python', 'Java', 'GDScript']],
      ['Web', ['React', 'Three.js']],
    ],
  )
})

test('AC1: textos use literales', () => {
  const uses = Object.fromEntries(
    categories.flatMap((c) => c.tools).map((t) => [t.id, t.use]),
  )
  assert.deepEqual(uses, {
    blender: 'Modeling and texturing',
    zbrush: 'Sculpting',
    maya: 'Modeling and rigging',
    'substance-3d-painter': 'PBR texturing',
    unity: 'Game engine',
    godot: 'Game engine',
    'unreal-engine': 'Game engine',
    csharp: 'Unity scripting',
    python: 'Tools and scripting',
    java: 'Programming',
    gdscript: 'Godot scripting',
    react: 'Interface and tooling',
    threejs: '3D on the web',
  })
})

test('AC1: validateTechStack devuelve []', () => {
  assert.deepEqual(validateTechStack(categories), [])
})

test('AC1: ningún id ni nombre placeholder en los datos', () => {
  for (const t of categories.flatMap((c) => c.tools)) {
    assert.ok(!/placeholder/i.test(t.id), `id placeholder: ${t.id}`)
    assert.ok(!/placeholder/i.test(t.name), `nombre placeholder: ${t.name}`)
  }
})
