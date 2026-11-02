import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const file = resolve(import.meta.dirname, '../../../.github/workflows/deploy.yml')

test('AC4: deploy.yml publica dist en GitHub Pages', () => {
  assert.ok(existsSync(file), 'falta .github/workflows/deploy.yml')
  const y = readFileSync(file, 'utf8')
  assert.match(y, /^on:/m)
  assert.match(y, /push:\s*\n\s+branches:\s*(\[\s*main\s*\]|\n\s+-\s*main)/)
  assert.match(y, /workflow_dispatch/)
  assert.match(y, /pages:\s*write/)
  assert.match(y, /id-token:\s*write/)
  assert.match(y, /run:\s*npm ci/)
  assert.match(y, /run:\s*npm run build/)
  assert.match(y, /uses:\s*actions\/upload-pages-artifact@/)
  assert.match(y, /path:\s*['"]?\.?\/?dist\/?['"]?\s*$/m)
  assert.match(y, /uses:\s*actions\/deploy-pages@/)
})
