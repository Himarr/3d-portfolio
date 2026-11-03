import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { loadLibrary, close } from './_render.mjs'

after(close)

test('AC6: Alien y Luna son toon; Supra MK3 no', async () => {
  const lib = await loadLibrary()
  const by = (re) => lib.models.find((m) => re.test(m.title))
  assert.equal(by(/alien/i)?.toon, true)
  assert.equal(by(/luna|moon/i)?.toon, true)
  assert.ok(by(/supra/i), 'existe Supra')
  assert.ok(!by(/supra/i).toon)
})
