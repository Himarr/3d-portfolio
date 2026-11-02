import test from 'node:test'
import assert from 'node:assert/strict'
import { loadPlacement, src } from '../008-hero-alien/helpers.mjs'

test('AC2: constantes de la caida con los valores iniciales', async () => {
  const m = await loadPlacement()
  assert.equal(m.ALIEN_DROP_DURATION_S, 1)
  assert.equal(m.ALIEN_DROP_EASE, 'back.out(1.4)')
})

test('AC2: el tween de caida va tras el de la luna y la etiqueta text tras la caida', () => {
  const s = src('src/components/sections/Hero.jsx')
  const moon = s.indexOf('duration: MOON_INTRO_DURATION_S')
  const drop = s.indexOf('duration: ALIEN_DROP_DURATION_S')
  const ease = s.indexOf('ease: ALIEN_DROP_EASE')
  const label = s.indexOf('tl.addLabel("text"')
  assert.ok(moon > 0 && drop > moon, 'caida despues de la luna')
  assert.ok(ease > moon, 'ease de caida usado')
  assert.ok(label > drop, 'etiqueta text despues de la caida')
  assert.match(s, /moonIntro,\s*\{\s*alienDrop:\s*1\s*\}/)
})
