import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { loadLibrary, root, close } from './_render.mjs'

after(close)

test('AC1: 3d-library tiene exactamente tres modelos (Supra MK3, Alien, Luna) con id único, título y .glb', async () => {
  const lib = await loadLibrary()
  assert.equal(lib.models.length, 3)
  const ids = lib.models.map((m) => m.id)
  assert.equal(new Set(ids).size, 3, 'ids únicos')
  for (const m of lib.models) {
    assert.ok(m.id && m.title, 'id y title')
    assert.doesNotMatch(m.title, /placeholder/i)
    assert.match(String(m.url), /\.glb(\?|$)/, `url .glb en ${m.id}`)
  }
  const find = (re) => lib.models.find((m) => re.test(m.title))
  assert.match(String(find(/supra/i)?.url), /SupraMK3/)
  assert.match(String(find(/alien/i)?.url), /Alien/)
  assert.match(String(find(/luna|moon/i)?.url), /moon/)
  assert.ok(existsSync(path.join(root, 'src/assets/3D/SupraMK3.glb')))
})
