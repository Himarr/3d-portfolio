import test from 'node:test'
import assert from 'node:assert/strict'
import { read } from './_render.mjs'

test('AC8: los dos enlaces "3D Viewer" de la navbar llevan a /projects/3d-library', () => {
  const src = read('src/components/Navbar.jsx')
  assert.doesNotMatch(src, /to="\/viewer"/)
  const links = src.match(/<NavLink\b[^>]*to="\/projects\/3d-library"[^>]*>\s*3D Viewer/g) ?? []
  assert.equal(links.length, 2, 'escritorio y panel móvil')
})
