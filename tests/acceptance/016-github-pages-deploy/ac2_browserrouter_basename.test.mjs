import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../../..')

test('AC2: BrowserRouter recibe basename={import.meta.env.BASE_URL}', () => {
  const src = readFileSync(resolve(root, 'src/main.jsx'), 'utf8')
  assert.match(src, /<BrowserRouter\s+basename=\{import\.meta\.env\.BASE_URL\}\s*>/)
})
