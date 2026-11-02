import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../../..')
const dist = resolve(root, 'dist')
let build

// Un solo build compartido por AC1 y AC3.
before(() => {
  rmSync(dist, { recursive: true, force: true })
  build = spawnSync('npm run build', { cwd: root, shell: true, encoding: 'utf8' })
})

test('AC1: dist/index.html referencia assets bajo /3d-portfolio/assets/', () => {
  assert.equal(build.status, 0, `build falló:\n${build.stdout}\n${build.stderr}`)
  const html = readFileSync(resolve(dist, 'index.html'), 'utf8')
  const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1])
  const assets = urls.filter((u) => /assets\//.test(u))
  assert.ok(assets.length > 0, 'index.html no referencia assets')
  for (const u of assets) {
    assert.ok(u.startsWith('/3d-portfolio/assets/'), `ruta de asset incorrecta: ${u}`)
  }
  assert.ok(!urls.some((u) => u.startsWith('/assets/')), 'quedan rutas /assets/')
})

test('AC3: postbuild genera dist/404.html idéntico a dist/index.html', () => {
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
  assert.equal(typeof pkg.scripts.postbuild, 'string', 'falta script postbuild')
  assert.ok(!/\bcp\b/.test(pkg.scripts.postbuild), 'postbuild no debe usar cp')
  assert.ok(existsSync(resolve(dist, '404.html')), 'falta dist/404.html')
  const a = readFileSync(resolve(dist, '404.html'))
  const b = readFileSync(resolve(dist, 'index.html'))
  assert.ok(a.equals(b), '404.html difiere de index.html')
})
