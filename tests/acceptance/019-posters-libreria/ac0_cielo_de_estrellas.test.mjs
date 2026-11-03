import test from 'node:test'
import assert from 'node:assert/strict'
import { read } from './_src.mjs'

test('AC0: ViewerPage monta PageCanvas starsOnly lazy, con error boundary, Suspense y sin reduced motion', () => {
  const s = read('src/pages/ViewerPage.jsx')
  assert.match(s, /<PageCanvas\b[^>]*\bstarsOnly\b/s)
  assert.match(s, /lazy\(\s*\(\)\s*=>\s*import\(['"][^'"]*PageCanvas/)
  assert.match(s, /<CanvasErrorBoundary\b/)
  assert.match(s, /<Suspense\b/)
  assert.match(s, /usePrefersReducedMotion\(\)/)
  assert.match(s, /!\s*\w*[rR]educed\w*\s*&&/, 'montaje condicionado a !reduced')
  assert.match(s, /\bpageRef\b/)
})

test('AC0: el canvas del visor es transparente (gl alpha, sin color de fondo)', () => {
  const s = read('src/three/ViewerCanvas.jsx')
  assert.match(s, /alpha:\s*true/, 'gl alpha explícito')
  assert.doesNotMatch(s, /<color\b[^>]*attach=["']background/)
  assert.doesNotMatch(s, /\bscene\.background\s*=/)
})
