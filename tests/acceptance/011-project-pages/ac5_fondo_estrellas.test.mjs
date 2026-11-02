import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { renderRoute, close } from './_render.mjs'

after(close)

const read = (p) => readFileSync(new URL(`../../../${p}`, import.meta.url), 'utf8')

for (const url of ['/projects/megaloterra', '/projects/3d-library', '/projects/no-existe']) {
  test(`AC5: ${url} se renderiza dentro de un contenedor relative isolate`, async () => {
    const html = await renderRoute(url)
    assert.match(html, /class="relative isolate"/)
  })
}

test('AC5: ProjectPage monta PageCanvas en lazy con starsOnly, sin canvas con reduced motion', () => {
  const src = read('src/pages/ProjectPage.jsx')
  assert.match(src, /lazy\(\s*\(\)\s*=>\s*import\(["']\.\.\/three\/PageCanvas\.jsx["']\)\s*\)/)
  assert.match(src, /<PageCanvas[^>]*\bstarsOnly\b/)
  assert.match(src, /usePrefersReducedMotion/)
  assert.match(src, /CanvasErrorBoundary/)
})

test('AC5: PageCanvas pasa starsOnly a PageScene', () => {
  assert.match(read('src/three/PageCanvas.jsx'), /<PageScene[^>]*\bstarsOnly\b/s)
})

test('AC5: PageScene no renderiza Moon, Alien ni OutlineLayer con starsOnly', () => {
  const src = read('src/three/PageScene.jsx')
  assert.match(src, /starsOnly/)
  const jsx = src.slice(src.lastIndexOf('return ('))
  assert.match(jsx, /starsOnly\s*(\?|&&|\|\|)|!starsOnly/)
  assert.match(jsx, /<StarLayer/)
})

test('AC5: la portada no usa starsOnly', () => {
  assert.doesNotMatch(read('src/pages/HomePage.jsx'), /starsOnly/)
})
